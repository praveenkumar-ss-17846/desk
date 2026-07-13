import type { Note, Task } from '../types'

// The backend base URL. Defaults to the deployed Cloudflare Worker; can be
// overridden at build time with VITE_API_URL (e.g. for a staging backend).
const DEFAULT_API = 'https://desk-assistant-api.praveen-desk.workers.dev'
const API = (import.meta.env.VITE_API_URL || DEFAULT_API).replace(/\/$/, '')

export const syncEnabled = API.length > 0

export type Snapshot = { tasks: Task[]; notes: Note[] }

/** Generate a fresh, hard-to-guess sync code. */
export function newSyncCode(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20)
}

/** Upload the current snapshot to the cloud under the given code. */
export async function pushSnapshot(code: string, snapshot: Snapshot) {
  const res = await fetch(`${API}/state/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  })
  if (!res.ok) throw new Error(`Backup failed (${res.status})`)
  return (await res.json()) as { ok: true; updatedAt: number }
}

/** Download the snapshot stored under the given code, or null if none. */
export async function pullSnapshot(code: string): Promise<Snapshot | null> {
  const res = await fetch(`${API}/state/${encodeURIComponent(code)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Restore failed (${res.status})`)
  const body = (await res.json()) as { data: Snapshot }
  return body.data
}
