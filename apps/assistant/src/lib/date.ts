// Helpers for working with task due dates and the <input type="datetime-local">
// value format (which is local-time "YYYY-MM-DDTHH:mm").

const pad = (n: number) => String(n).padStart(2, '0')

export function toInputValue(ts?: number): string {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

export function fromInputValue(value: string): number | undefined {
  if (!value) return undefined
  const t = new Date(value).getTime()
  return Number.isNaN(t) ? undefined : t
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'normal'

// A short, friendly label for a due date plus a tone used for colour.
export function formatDue(dueAt: number): { label: string; tone: DueTone } {
  const now = new Date()
  const due = new Date(dueAt)
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()
  const startOfDue = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate(),
  ).getTime()
  const dayDiff = Math.round((startOfDue - startOfToday) / 86_400_000)
  const time = due.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (dueAt < now.getTime()) return { label: 'Overdue', tone: 'overdue' }
  if (dayDiff === 0) return { label: `Today ${time}`, tone: 'today' }
  if (dayDiff === 1) return { label: `Tomorrow ${time}`, tone: 'soon' }
  return {
    label: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    tone: 'normal',
  }
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
