import { useCallback, useEffect, useRef, useState } from 'react'
import type { Task } from '../types'
import { pushSupported, registerReminders, upcomingReminders } from './push'
import { useLocalStorage } from './useLocalStorage'

const notifSupported = typeof Notification !== 'undefined'
type Permission = NotificationPermission | 'unsupported'

async function showLocalNotification(title: string, body: string) {
  if (!notifSupported || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.ready
    if (reg?.showNotification) {
      await reg.showNotification(title, { body })
      return
    }
  } catch {
    // fall through
  }
  try {
    new Notification(title, { body })
  } catch {
    // ignore
  }
}

const PUSH_DEBOUNCE = 2000

/**
 * Task reminders. When the browser supports Web Push (installed iOS PWA,
 * Chrome, etc.) we register the upcoming reminders with the backend, which
 * pushes a notification at the due time even if the app is closed. Otherwise
 * we fall back to firing a notification while the app is open.
 */
export function useReminders(tasks: Task[]) {
  const [permission, setPermission] = useState<Permission>(
    notifSupported ? Notification.permission : 'unsupported',
  )
  const [reminded, setReminded] = useLocalStorage<string[]>(
    'desk.assistant.reminded',
    [],
  )
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const requestPermission = useCallback(async () => {
    if (!notifSupported) return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted' && pushSupported) {
      try {
        await registerReminders(upcomingReminders(tasks))
      } catch {
        // will retry on next change
      }
    }
  }, [tasks])

  // Push path: keep the server's reminder list in sync with our tasks.
  useEffect(() => {
    if (permission !== 'granted' || !pushSupported) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      registerReminders(upcomingReminders(tasks)).catch(() => {})
    }, PUSH_DEBOUNCE)
    return () => clearTimeout(pushTimer.current)
  }, [permission, tasks])

  // Fallback path (no push support): notify for tasks that come due while open.
  useEffect(() => {
    if (permission !== 'granted' || pushSupported) return

    const check = () => {
      const now = Date.now()
      const due = tasks.filter(
        (t) => !t.done && t.dueAt && t.dueAt <= now && !reminded.includes(t.id),
      )
      if (due.length === 0) return
      due.forEach((t) => void showLocalNotification('Task due', t.text))
      setReminded((prev) => [...prev, ...due.map((t) => t.id)])
    }

    const id = window.setInterval(check, 30_000)
    return () => window.clearInterval(id)
  }, [permission, tasks, reminded, setReminded])

  return { permission, requestPermission }
}
