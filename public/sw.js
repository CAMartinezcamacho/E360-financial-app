let reminderTimer = null

const MESSAGES = [
  '¿Cuántos viajes llevas? ¡Apúntalos ahora!',
  'Cada viaje registrado es dinero que controlas',
  '¿Ya apuntaste el último servicio?',
  'Tu meta del día te lo agradece — registra el viaje',
  'Unos segundos de registro, un mes de control real',
  'No dejes que los viajes se te olviden — apunta ahora',
]

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ('focus' in client) return client.focus()
        }
        return self.clients.openWindow('/')
      })
  )
})

// Main thread sends START_REMINDERS when shift is active + notifications enabled.
// SW schedules its own interval as backup for when the main thread is suspended.
self.addEventListener('message', (e) => {
  const { type, intervalMs } = e.data || {}

  if (type === 'START_REMINDERS') {
    if (reminderTimer) clearInterval(reminderTimer)
    reminderTimer = setInterval(() => {
      const body = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
      self.registration.showNotification('E360 — Recordatorio de viaje', {
        body,
        icon: '/icon-192.jpg',
        tag: 'trip-reminder',
      })
    }, intervalMs)
  }

  if (type === 'STOP_REMINDERS') {
    if (reminderTimer) clearInterval(reminderTimer)
    reminderTimer = null
  }
})
