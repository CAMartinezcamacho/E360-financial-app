'use client'

import { useEffect } from 'react'

const MESSAGES = [
  '¿Cuántos viajes llevas? ¡Apúntalos ahora!',
  'Cada viaje registrado es dinero que controlas',
  '¿Ya apuntaste el último servicio?',
  'Tu meta del día te lo agradece — registra el viaje',
  'Unos segundos de registro, un mes de control real',
  'No dejes que los viajes se te olviden — apunta ahora',
]

export function useNotifications({
  isShiftActive,
  enabled,
  intervalMinutes,
}: {
  isShiftActive: boolean
  enabled: boolean
  intervalMinutes: number
}) {
  // Register service worker once
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  // Schedule periodic reminders while shift is active
  useEffect(() => {
    if (!isShiftActive || !enabled) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const show = () => {
      const body = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
      navigator.serviceWorker.ready
        .then((reg) =>
          reg.showNotification('E360 — Recordatorio de viaje', {
            body,
            icon: '/icon-192.jpg',
            tag: 'trip-reminder',
          } as NotificationOptions)
        )
        .catch(() => {})
    }

    const ms = Math.max(1, intervalMinutes) * 60 * 1000
    const id = setInterval(show, ms)
    return () => clearInterval(id)
  }, [isShiftActive, enabled, intervalMinutes])
}
