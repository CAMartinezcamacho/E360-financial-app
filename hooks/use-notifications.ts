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

  useEffect(() => {
    const canNotify =
      isShiftActive &&
      enabled &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'

    const ms = Math.max(1, intervalMinutes) * 60 * 1000

    if (!canNotify) {
      // Tell SW to stop if it was running
      navigator.serviceWorker?.ready
        .then((reg) => reg.active?.postMessage({ type: 'STOP_REMINDERS' }))
        .catch(() => {})
      return
    }

    // Layer 1: main-thread interval (works while app is visible/active)
    const showNotification = () => {
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
    const timerId = setInterval(showNotification, ms)

    // Layer 2: SW-side interval (backup for when main thread is suspended)
    navigator.serviceWorker.ready
      .then((reg) =>
        reg.active?.postMessage({ type: 'START_REMINDERS', intervalMs: ms })
      )
      .catch(() => {})

    return () => {
      clearInterval(timerId)
      navigator.serviceWorker?.ready
        .then((reg) => reg.active?.postMessage({ type: 'STOP_REMINDERS' }))
        .catch(() => {})
    }
  }, [isShiftActive, enabled, intervalMinutes])
}
