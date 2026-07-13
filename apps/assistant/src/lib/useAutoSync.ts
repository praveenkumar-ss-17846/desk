import { useCallback, useEffect, useRef, useState } from 'react'
import type { Note, Task } from '../types'
import { mergeById, pullSnapshot, pushSnapshot, syncEnabled } from './sync'

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error'

type Args = {
  code: string
  tasks: Task[]
  notes: Note[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>
}

const PUSH_DEBOUNCE = 1500
const POLL_INTERVAL = 60_000

/**
 * Keeps local tasks/notes in sync with the cloud when a sync code is set:
 * - pulls + merges on load, on window focus, and every minute
 * - pushes (debounced) whenever the data changes
 * Merging is last-write-wins per item, so no device clobbers another.
 */
export function useAutoSync({ code, tasks, notes, setTasks, setNotes }: Args) {
  const on = syncEnabled && code.length > 0
  const [status, setStatus] = useState<SyncStatus>('off')
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)

  // Serialized snapshot we last sent, to avoid redundant/looping pushes.
  const lastSentRef = useRef<string>('')
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const pull = useCallback(async () => {
    if (!on) return
    setStatus('syncing')
    try {
      const remote = await pullSnapshot(code)
      if (remote) {
        setTasks((prev) => mergeById(prev, remote.tasks ?? []))
        setNotes((prev) => mergeById(prev, remote.notes ?? []))
      }
      setStatus('synced')
      setLastSyncedAt(Date.now())
    } catch {
      setStatus('error')
    }
  }, [on, code, setTasks, setNotes])

  // Pull on code change / mount, then on focus + interval. The initial pull
  // is deferred to a timer so it doesn't set state synchronously in the effect.
  useEffect(() => {
    if (!on) return
    const kick = window.setTimeout(() => void pull(), 0)
    const onFocus = () => void pull()
    window.addEventListener('focus', onFocus)
    const id = window.setInterval(() => void pull(), POLL_INTERVAL)
    return () => {
      window.clearTimeout(kick)
      window.removeEventListener('focus', onFocus)
      window.clearInterval(id)
    }
  }, [on, pull])

  // Debounced push whenever the data changes.
  useEffect(() => {
    if (!on) return
    const snapshot = JSON.stringify({ tasks, notes })
    if (snapshot === lastSentRef.current) return

    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(async () => {
      setStatus('syncing')
      try {
        await pushSnapshot(code, { tasks, notes })
        lastSentRef.current = snapshot
        setStatus('synced')
        setLastSyncedAt(Date.now())
      } catch {
        setStatus('error')
      }
    }, PUSH_DEBOUNCE)

    return () => clearTimeout(pushTimer.current)
  }, [on, code, tasks, notes])

  return {
    status: on ? status : ('off' as SyncStatus),
    lastSyncedAt,
    syncNow: pull,
    enabled: on,
  }
}
