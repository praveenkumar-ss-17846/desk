/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

// This is the custom service worker (vite-plugin-pwa injectManifest strategy).
// It keeps Workbox precaching for offline support and adds Web Push handling.

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: unknown[] }

precacheAndRoute(self.__WB_MANIFEST)

const API = 'https://desk-assistant-api.praveen-desk.workers.dev'

// A reminder push arrives with no payload; fetch the due task text to show it.
self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      const scope = self.registration.scope
      let body = 'You have a task due.'
      try {
        const sub = await self.registration.pushManager.getSubscription()
        if (sub) {
          const res = await fetch(
            `${API}/push/pending?endpoint=${encodeURIComponent(sub.endpoint)}`,
          )
          if (res.ok) {
            const data = (await res.json()) as { reminders?: { text?: string }[] }
            const texts = (data.reminders ?? [])
              .map((r) => r.text)
              .filter((t): t is string => !!t)
            if (texts.length === 1) body = texts[0]
            else if (texts.length > 1)
              body = `${texts.length} tasks due: ${texts.slice(0, 3).join(', ')}`
            if (texts.length) {
              await fetch(`${API}/push/ack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: sub.endpoint }),
              })
            }
          }
        }
      } catch {
        // keep the default body
      }
      await self.registration.showNotification('⏰ Task reminder', {
        body,
        icon: new URL('icon-192.png', scope).href,
        badge: new URL('icon-192.png', scope).href,
        tag: 'desk-reminder',
        data: { url: scope },
      })
    })(),
  )
})

// Focus an open tab or open the app when the notification is tapped.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const data = event.notification.data as { url?: string } | undefined
      const url = data?.url ?? self.registration.scope
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      for (const client of clients) {
        if ('focus' in client) {
          await client.focus()
          return
        }
      }
      await self.clients.openWindow(url)
    })(),
  )
})
