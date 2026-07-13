import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

// A sync code is a private, shareable identifier the user keeps secret.
// Anyone with the code can read/write that snapshot, so it acts as both
// the account id and the password — keep it long and random.
const CODE_RE = /^[A-Za-z0-9-]{8,64}$/
const MAX_BYTES = 1_000_000 // 1 MB snapshot cap

const app = new Hono<{ Bindings: Bindings }>()

// Allow the PWA (served from GitHub Pages or anywhere) to call the API.
app.use('*', cors({ origin: '*', allowMethods: ['GET', 'PUT', 'OPTIONS'] }))

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

export default app
