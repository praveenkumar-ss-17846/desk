import type { Task } from '../types'

const DEFAULT_API = 'https://desk-assistant-api.praveen-desk.workers.dev'
const API = (import.meta.env.VITE_API_URL || DEFAULT_API).replace(/\/$/, '')

// Public VAPID key (safe to embed). Must match the Worker's VAPID_PUBLIC_KEY.
const VAPID_PUBLIC_KEY =
  'BB78jWR4e14GZvqD9kN9TxjDgZ32h5aKClpFy9VfVIpEJ4iRbXCnTKjUfZpgSxYtrYlEicKaNNF0b5OquvcfFXY'

export const pushSupported =
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  typeof window !== 'undefined' &&
  'PushManager' in window &&
  'Notification' in window

export type ReminderInput = { taskId: string; dueAt: number; text: string }

/** Upcoming (future, not done) task reminders to schedule on the server. */
export function upcomingReminders(tasks: Task[]): ReminderInput[] {
  const now = Date.now()
  return tasks
    .filter((t) => !t.done && !t.deleted && t.dueAt && t.dueAt > now)
    .map((t) => ({ taskId: t.id, dueAt: t.dueAt as number, text: t.text }))
}

function urlB64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

async function getSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported) return null
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
  })
}

/** Subscribe (if needed) and send the current reminder list to the backend. */
export async function registerReminders(reminders: ReminderInput[]) {
  const sub = await getSubscription()
  if (!sub) return
  await fetch(`${API}/push/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub.toJSON(), reminders }),
  })
}
