'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setSyncKey, loadFromCloud } from '@/lib/cloud-sync'
import { CalendarDays, Zap, TrendingUp, Settings, ChevronRight, RefreshCw } from 'lucide-react'

interface OnboardingProps {
  onComplete: (name: string, currency: string, syncKey: string, restoredState?: object | null) => void
}

const CURRENCIES = [
  { symbol: '$', label: 'Peso / Dólar ($)' },
  { symbol: 'COP', label: 'Peso colombiano' },
  { symbol: '€', label: 'Euro (€)' },
  { symbol: 'S/', label: 'Sol peruano' },
  { symbol: 'Bs', label: 'Bolívar / Boliviano' },
]

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [syncKey, setSyncKeyState] = useState('')
  const [currency, setCurrency] = useState('$')
  const [customCurrency, setCustomCurrency] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'found' | 'notfound' | 'error'>('idle')

  const finalCurrency = currency === 'custom' ? customCurrency : currency

  const handleSyncKeyCheck = async () => {
    if (!syncKey.trim()) return
    setLoading(true)
    setSyncStatus('idle')
    try {
      const clean = syncKey.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)
      const data = await loadFromCloud(clean)
      setSyncStatus(data ? 'found' : 'notfound')
    } catch {
      setSyncStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    const clean = syncKey.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || name.trim().toLowerCase().replace(/\s+/g, '_') || 'default'
    setSyncKey(clean)

    let restored: object | null = null
    if (syncStatus === 'found') {
      restored = await loadFromCloud(clean)
    }
    setLoading(false)
    onComplete(name.trim(), finalCurrency || '$', clean, restored)
  }

  const steps = [
    // Step 0 — Welcome + name
    <div key="welcome" className="space-y-6">
      <div className="text-center space-y-2 pt-4">
        <div className="text-5xl">⚡</div>
        <h1 className="text-2xl font-semibold">Bienvenido a E360</h1>
        <p className="text-sm text-muted-foreground">Tu asistente financiero para conductores. Configuremos todo en 3 pasos.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">¿Cómo te llamás?</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="h-12 text-base"
          autoFocus
        />
      </div>

      <Button
        className="w-full h-12 text-base gap-2"
        disabled={!name.trim()}
        onClick={() => setStep(1)}
      >
        Continuar <ChevronRight className="w-4 h-4" />
      </Button>
    </div>,

    // Step 1 — Currency
    <div key="currency" className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Moneda</h2>
        <p className="text-sm text-muted-foreground mt-1">¿Con qué moneda trabajás?</p>
      </div>

      <div className="space-y-2">
        {CURRENCIES.map((c) => (
          <button
            key={c.symbol}
            onClick={() => setCurrency(c.symbol)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors ${
              currency === c.symbol
                ? 'border-primary bg-primary/5 text-primary font-medium'
                : 'border-border bg-card text-foreground'
            }`}
          >
            <span>{c.label}</span>
            <span className="font-mono font-bold">{c.symbol}</span>
          </button>
        ))}
        <button
          onClick={() => setCurrency('custom')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors ${
            currency === 'custom'
              ? 'border-primary bg-primary/5 text-primary font-medium'
              : 'border-border bg-card text-foreground'
          }`}
        >
          <span>Otra moneda</span>
          {currency === 'custom' && (
            <Input
              value={customCurrency}
              onChange={(e) => { e.stopPropagation(); setCustomCurrency(e.target.value) }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Ej: Q"
              className="w-16 h-7 text-center text-xs"
            />
          )}
        </button>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(0)}>Atrás</Button>
        <Button
          className="flex-1 h-11 gap-2"
          disabled={currency === 'custom' && !customCurrency.trim()}
          onClick={() => setStep(2)}
        >
          Continuar <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>,

    // Step 2 — Sync key
    <div key="setup" className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Sincronización</h2>
        <p className="text-sm text-muted-foreground mt-1">Conecta tus datos con la nube.</p>
      </div>

      <div className="space-y-2 pt-2">
        <label className="text-sm font-medium">Clave de sincronización</label>
        <p className="text-xs text-muted-foreground">
          Una clave única para sincronizar tus datos entre dispositivos. Si ya tenés una, ingresála para recuperar tus datos.
        </p>
        <div className="flex gap-2">
          <Input
            value={syncKey}
            onChange={(e) => { setSyncKeyState(e.target.value); setSyncStatus('idle') }}
            placeholder={`Ej: ${name.toLowerCase().replace(/\s+/g, '_') || 'mi_clave'}`}
            className="h-11 flex-1"
          />
          <Button
            variant="outline"
            className="h-11 px-3"
            onClick={handleSyncKeyCheck}
            disabled={!syncKey.trim() || loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {syncStatus === 'found' && (
          <p className="text-xs text-green-600 font-medium">✅ ¡Datos encontrados! Se restaurarán al terminar.</p>
        )}
        {syncStatus === 'notfound' && (
          <p className="text-xs text-muted-foreground">Nueva clave — se creará un perfil nuevo.</p>
        )}
        {syncStatus === 'error' && (
          <p className="text-xs text-red-500">Error al verificar. Podés continuar igual.</p>
        )}
        <p className="text-xs text-muted-foreground">Si la dejás vacía, se usará tu nombre como clave.</p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>Atrás</Button>
        <Button
          className="flex-1 h-11 gap-2 bg-green-500 hover:bg-green-600 text-white"
          onClick={handleFinish}
          disabled={loading}
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>
            Empezar <Zap className="w-4 h-4" />
          </>}
        </Button>
      </div>
    </div>,
  ]

  return (
    <div className="min-h-screen bg-background flex items-start justify-center">
      <div className="w-full max-w-sm px-6 pt-12 pb-8">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-primary' : i < step ? 'w-3 bg-primary/40' : 'w-3 bg-muted'
              }`}
            />
          ))}
        </div>

        {steps[step]}

        {/* Feature preview at bottom of step 0 */}
        {step === 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { icon: <Zap className="w-4 h-4" />, text: 'Registrá viajes en segundos' },
              { icon: <CalendarDays className="w-4 h-4" />, text: 'Meta diaria personalizada' },
              { icon: <TrendingUp className="w-4 h-4" />, text: 'Tendencias diarias y mensuales' },
              { icon: <Settings className="w-4 h-4" />, text: 'Sync multi-dispositivo' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                {f.icon}
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
