'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

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
  const nativeWatchId = useRef<string | null>(null)
  const webWatchId = useRef<number | null>(null)
  const wakeLock = useRef<WakeLockSentinel | null>(null)

  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform()

  const stopTracking = useCallback(() => {
    if (nativeWatchId.current !== null) {
      Geolocation.clearWatch({ id: nativeWatchId.current }).catch(() => {})
      nativeWatchId.current = null
    }
    if (webWatchId.current !== null) {
      navigator.geolocation.clearWatch(webWatchId.current)
      webWatchId.current = null
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

  const registerPoint = useCallback((lat: number, lon: number, accuracy: number) => {
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
  }, [])

  useEffect(() => {
    if (!isShiftActive) {
      stopTracking()
      return
    }

    // New shift started — reset km
    setTotalKm(0)
    lastCoords.current = null
    let cancelled = false

    const startNative = async () => {
      try {
        const current = await Geolocation.checkPermissions()
        let granted = current.location === 'granted' || current.coarseLocation === 'granted'
        if (!granted) {
          const requested = await Geolocation.requestPermissions()
          granted = requested.location === 'granted' || requested.coarseLocation === 'granted'
        }
        if (cancelled) return
        if (!granted) {
          setStatus('denied')
          return
        }

        await requestWakeLock()
        if (cancelled) return
        setStatus('tracking')

        const id = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 15000, minimumUpdateInterval: 5000 },
          (position, err) => {
            if (err || !position) {
              setStatus('paused')
              return
            }
            registerPoint(position.coords.latitude, position.coords.longitude, position.coords.accuracy)
          }
        )
        if (cancelled) {
          Geolocation.clearWatch({ id }).catch(() => {})
          return
        }
        nativeWatchId.current = id
      } catch {
        if (!cancelled) setStatus('unavailable')
      }
    }

    const startWeb = () => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        setStatus('unavailable')
        return
      }

      navigator.geolocation.getCurrentPosition(
        async () => {
          // Permission granted — start watching
          await requestWakeLock()
          if (cancelled) return
          setStatus('tracking')

          webWatchId.current = navigator.geolocation.watchPosition(
            (pos) => {
              registerPoint(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy)
            },
            () => {
              setStatus('paused')
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
          )
        },
        (err) => {
          setStatus(err.code === 1 ? 'denied' : 'unavailable')
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }

    setStatus('requesting')
    if (isNative) {
      startNative()
    } else {
      startWeb()
    }

    return () => {
      cancelled = true
      stopTracking()
    }
  }, [isShiftActive, isNative, stopTracking, requestWakeLock, registerPoint])

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
