'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// Haversine formula — returns distance in km between two GPS coordinates
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export type GpsStatus = 'idle' | 'requesting' | 'tracking' | 'paused' | 'denied' | 'unavailable'

export function useGpsTracking({ isShiftActive }: { isShiftActive: boolean }) {
  const [totalKm, setTotalKm] = useState(0)
  const [status, setStatus] = useState<GpsStatus>('idle')
  const lastCoords = useRef<{ lat: number; lon: number } | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const wakeLock = useRef<WakeLockSentinel | null>(null)

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (wakeLock.current) {
      wakeLock.current.release().catch(() => {})
      wakeLock.current = null
    }
    setStatus((s) => (s === 'tracking' ? 'paused' : s))
  }, [])

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLock.current = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request('screen')
      } catch {
        // Wake lock not granted — GPS still works, screen may turn off
      }
    }
  }, [])

  useEffect(() => {
    if (!isShiftActive) {
      stopTracking()
      return
    }

    // New shift started — reset km
    setTotalKm(0)
    lastCoords.current = null

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unavailable')
      return
    }

    setStatus('requesting')

    navigator.geolocation.getCurrentPosition(
      async () => {
        // Permission granted — start watching
        await requestWakeLock()
        setStatus('tracking')

        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude: lat, longitude: lon, accuracy } = pos.coords
            // Skip noisy readings (accuracy worse than 50m)
            if (accuracy > 50) return
            if (lastCoords.current) {
              const dist = haversine(lastCoords.current.lat, lastCoords.current.lon, lat, lon)
              // Ignore micro-movements (< 20m) to avoid parked accumulation
              if (dist >= 0.02) {
                setTotalKm((prev) => Math.round((prev + dist) * 10) / 10)
              }
            }
            lastCoords.current = { lat, lon }
          },
          () => {
            setStatus('paused')
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        )
      },
      (err) => {
        if (err.code === 1) {
          setStatus('denied')
        } else {
          setStatus('unavailable')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )

    return () => stopTracking()
  }, [isShiftActive, stopTracking, requestWakeLock])

  // Re-acquire wake lock if it gets released (screen turned on again)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && status === 'tracking' && !wakeLock.current) {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [status, requestWakeLock])

  return { totalKm, status }
}
