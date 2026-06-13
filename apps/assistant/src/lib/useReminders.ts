import { useCallback, useEffect, useState } from 'react'
import type { Task } from '../types'
import { useLocalStorage } from './useLocalStorage'

const supported = typeof Notification !== 'undefined'

type Permission = NotificationPermission | 'unsupported'

async function showNotification(title: string, body: string) {
  if (!supported || Notification.permission !== 'granted') return
  try {
    // On installed iOS PWAs notifications must go through the service worker.
    const reg = await navigator.serviceWorker?.ready
    if (reg?.showNotification) {
      await reg.showNotification(title, { body, tag: title + body })
      return
    }
  } catch {
    // fall through to the constructor below
  }
  try {
    new Notification(title, { body })
  } catch {
    // notifications unavailable in this context — ignore
  }
}

// Fires a local notification when a task's due time passes while the app is
// open. Without a push server we can't deliver reminders while the app is
// fully closed, but this covers the common "app on screen / backgrounded" case.
export function useReminders(tasks: Task[]) {
  const [permission, setPermission] = useState<Permission>(
    supported ? Notification.permission : 'unsupported',
  )
  const [reminded, setReminded] = useLocalStorage<string[]>(
    'desk.assistant.reminded',
    [],
  )

  const requestPermission = useCallback(async () => {
    if (!supported) return
    const result = await Notification.requestPermission()
    setPermission(result)
  }, [])

  useEffect(() => {
    if (permission !== 'granted') return

    const check = () => {
      const now = Date.now()
      const due = tasks.filter(
        (t) => !t.done && t.dueAt && t.dueAt <= now && !reminded.includes(t.id),
      )
      if (due.length === 0) return
      due.forEach((t) => void showNotification('Task due', t.text))
      setReminded((prev) => [...prev, ...due.map((t) => t.id)])
    }

    check()
    const id = window.setInterval(check, 30_000)
    return () => window.clearInterval(id)
  }, [permission, tasks, reminded, setReminded])

  return { permission, requestPermission }
}
