import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sendPush } from './webpush'

type Bindings = {
  DB: D1Database
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_SUBJECT: string
}

type ReminderInput = { taskId: string; dueAt: number; text?: string }

// A sync code is a private, shareable identifier the user keeps secret.
// Anyone with the code can read/write that snapshot, so it acts as both
// the account id and the password — keep it long and random.
const CODE_RE = /^[A-Za-z0-9-]{8,64}$/
const MAX_BYTES = 1_000_000 // 1 MB snapshot cap

const app = new Hono<{ Bindings: Bindings }>()

// Allow the PWA (served from GitHub Pages or anywhere) to call the API.
app.use(
  '*',
  cors({ origin: '*', allowMethods: ['GET', 'PUT', 'POST', 'OPTIONS'] }),
)

// Return errors as JSON *with* the CORS header, so the browser can read the
// real message instead of reporting a generic "Failed to fetch / Load failed".
app.onError((err, c) =>
  c.json({ error: err.message || String(err) }, 500, {
    'Access-Control-Allow-Origin': '*',
  }),
)

app.get('/health', (c) =>
  c.json({ ok: true, service: 'assistant-api', db: !!c.env.DB }),
)

// Pull the latest snapshot for a code.
app.get('/state/:code', async (c) => {
  const code = c.req.param('code')
  if (!CODE_RE.test(code)) return c.json({ error: 'invalid code' }, 400)

  const row = await c.env.DB.prepare(
    'SELECT data, updated_at FROM states WHERE code = ?',
  )
    .bind(code)
    .first<{ data: string; updated_at: number }>()

  if (!row) return c.json({ error: 'not found' }, 404)
  return c.json({ data: JSON.parse(row.data), updatedAt: row.updated_at })
})

// Push (overwrite) the snapshot for a code.
app.put('/state/:code', async (c) => {
  const code = c.req.param('code')
  if (!CODE_RE.test(code)) return c.json({ error: 'invalid code' }, 400)

  const body = await c.req.text()
  if (body.length > MAX_BYTES) return c.json({ error: 'snapshot too large' }, 413)
  try {
    JSON.parse(body) // reject anything that is not valid JSON
  } catch {
    return c.json({ error: 'body must be JSON' }, 400)
  }

  const now = Date.now()
  await c.env.DB.prepare(
    `INSERT INTO states (code, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  )
    .bind(code, body, now)
    .run()

  return c.json({ ok: true, updatedAt: now })
})

// ---- Web Push: subscriptions + scheduled reminders ----

// Register/refresh a device's push subscription and its upcoming reminders.
app.post('/push/register', async (c) => {
  const body = await c.req.json<{
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    reminders?: ReminderInput[]
  }>()
  const sub = body.subscription
  if (!sub?.endpoint) return c.json({ error: 'missing subscription' }, 400)

  const reminders = (body.reminders ?? []).filter((r) => r?.taskId && r?.dueAt)
  const stmts = [
    c.env.DB.prepare(
      `INSERT INTO push_subs (endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`,
    ).bind(sub.endpoint, sub.keys?.p256dh ?? '', sub.keys?.auth ?? '', Date.now()),
    c.env.DB.prepare('DELETE FROM reminders WHERE endpoint = ?').bind(sub.endpoint),
    ...reminders.map((r) =>
      c.env.DB.prepare(
        'INSERT INTO reminders (endpoint, task_id, due_at, text, notified) VALUES (?, ?, ?, ?, 0)',
      ).bind(sub.endpoint, r.taskId, r.dueAt, r.text ?? ''),
    ),
  ]
  await c.env.DB.batch(stmts)
  return c.json({ ok: true, count: reminders.length })
})

// The service worker reads which reminders have fired, to show their text.
app.get('/push/pending', async (c) => {
  const endpoint = c.req.query('endpoint')
  if (!endpoint) return c.json({ reminders: [] })
  const { results } = await c.env.DB.prepare(
    'SELECT task_id as taskId, text, due_at as dueAt FROM reminders WHERE endpoint = ? AND notified = 1',
  )
    .bind(endpoint)
    .all()
  return c.json({ reminders: results ?? [] })
})

// The service worker clears fired reminders once shown.
app.post('/push/ack', async (c) => {
  const { endpoint } = await c.req.json<{ endpoint?: string }>()
  if (endpoint) {
    await c.env.DB.prepare(
      'DELETE FROM reminders WHERE endpoint = ? AND notified = 1',
    )
      .bind(endpoint)
      .run()
  }
  return c.json({ ok: true })
})

// Remove a subscription and its reminders.
app.post('/push/unregister', async (c) => {
  const { endpoint } = await c.req.json<{ endpoint?: string }>()
  if (endpoint) {
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM reminders WHERE endpoint = ?').bind(endpoint),
      c.env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(endpoint),
    ])
  }
  return c.json({ ok: true })
})

// Send an immediate test push to one endpoint (handy for debugging).
app.post('/push/test', async (c) => {
  const { endpoint } = await c.req.json<{ endpoint?: string }>()
  if (!endpoint) return c.json({ error: 'missing endpoint' }, 400)
  const status = await sendPush(
    endpoint,
    c.env.VAPID_PUBLIC_KEY,
    c.env.VAPID_PRIVATE_KEY,
    c.env.VAPID_SUBJECT,
  )
  return c.json({ ok: status >= 200 && status < 300, status })
})

// Cron: find due reminders, push one notification per device, mark them fired.
async function runReminders(env: Bindings): Promise<void> {
  const now = Date.now()
  const { results } = await env.DB.prepare(
    'SELECT DISTINCT endpoint FROM reminders WHERE due_at <= ? AND notified = 0',
  )
    .bind(now)
    .all<{ endpoint: string }>()

  for (const { endpoint } of results ?? []) {
    let status = 0
    try {
      status = await sendPush(
        endpoint,
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY,
        env.VAPID_SUBJECT,
      )
    } catch {
      continue // transient error — try again next minute
    }
    if (status === 404 || status === 410) {
      // Subscription is gone; clean it up.
      await env.DB.batch([
        env.DB.prepare('DELETE FROM reminders WHERE endpoint = ?').bind(endpoint),
        env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(endpoint),
      ])
    } else if (status >= 200 && status < 300) {
      await env.DB.prepare(
        'UPDATE reminders SET notified = 1 WHERE endpoint = ? AND due_at <= ? AND notified = 0',
      )
        .bind(endpoint, now)
        .run()
    }
  }
}

export default {
  fetch: (request: Request, env: Bindings, ctx: ExecutionContext) =>
    app.fetch(request, env, ctx),
  scheduled: (_event: ScheduledController, env: Bindings, ctx: ExecutionContext) => {
    ctx.waitUntil(runReminders(env))
  },
}
