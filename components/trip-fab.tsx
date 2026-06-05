'use client'

import { useState, useEffect, useRef } from 'react'
import { Car } from 'lucide-react'

interface TripFABProps {
  isShiftActive: boolean
  tripCount: number
  onPress: () => void
}

const reminders = [
  'Cada viaje apuntado es dinero que controlas',
  'Tu meta te lo agradece — registra el viaje',
  'Sin registros no hay control real de tu dinero',
  'Eres tu propio jefe, lleva bien las cuentas',
  'Un viaje sin registrar es plata que se pierde de vista',
]

export function TripFAB({ isShiftActive, tripCount, onPress }: TripFABProps) {
  const [hint, setHint] = useState<string | null>(null)
  const [justLogged, setJustLogged] = useState(false)
  const prevShiftRef = useRef(isShiftActive)
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showHint = (msg: string, duration = 4000) => {
    if (hintTimer.current) clearTimeout(hintTimer.current)
    setHint(msg)
    hintTimer.current = setTimeout(() => setHint(null), duration)
  }

  // Show a random reminder on mount
  useEffect(() => {
    const msg = reminders[Math.floor(Math.random() * reminders.length)]
    showHint(msg, 5000)
    return () => { if (hintTimer.current) clearTimeout(hintTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show reminder when shift starts
  useEffect(() => {
    if (isShiftActive && !prevShiftRef.current) {
      showHint('¡Turno iniciado! Recuerda apuntar cada viaje', 5000)
    }
    prevShiftRef.current = isShiftActive
  }, [isShiftActive])

  const handlePress = () => {
    onPress()
    if (hintTimer.current) clearTimeout(hintTimer.current)
    setHint(null)
    setJustLogged(true)
    setTimeout(() => setJustLogged(false), 2000)
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
      {/* Tooltip */}
      {(hint || justLogged) && (
        <div className="bg-zinc-900/90 text-white text-xs px-3 py-2 rounded-2xl shadow-lg max-w-[200px] text-right leading-snug">
          {justLogged ? '¡Viaje registrado!' : hint}
        </div>
      )}

      {/* Button */}
      <div className="relative">
        {/* Pulse ring — only when shift is active */}
        {isShiftActive && (
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        )}

        <button
          onClick={handlePress}
          className={`relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform select-none ${
            isShiftActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
          aria-label="Registrar viaje"
        >
          <Car className="w-6 h-6" />
        </button>

        {/* Trip count badge */}
        {tripCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {tripCount > 99 ? '99+' : tripCount}
          </span>
        )}
      </div>
    </div>
  )
}
