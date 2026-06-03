'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Check, Zap } from 'lucide-react'
import type { Account, RidePlatform, ServiceType } from '@/lib/types'

interface QuickEntryProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (
    type: 'sale' | 'expense',
    amount: number,
    title: string,
    accountId?: string,
    serviceType?: ServiceType,
    platform?: RidePlatform,
    grossAmount?: number,
    commissionPercent?: number
  ) => void
  currencySymbol: string
  accounts: Account[]
}

const PLATFORMS: { id: RidePlatform; label: string; bg: string; fg: string; commission: number }[] = [
  { id: 'uber', label: 'Uber', bg: '#000000', fg: '#ffffff', commission: 25 },
  { id: 'indriver', label: 'InDriver', bg: '#16a34a', fg: '#ffffff', commission: 15 },
  { id: 'cabify', label: 'Cabify', bg: '#7c3aed', fg: '#ffffff', commission: 20 },
  { id: 'taxi', label: 'Taxi', bg: '#facc15', fg: '#000000', commission: 0 },
  { id: 'otro', label: 'Otro', bg: '#6b7280', fg: '#ffffff', commission: 10 },
]

const QUICK_AMOUNTS = [100, 200, 300, 500, 800, 1000]

export function QuickEntry({ isOpen, onClose, onSubmit, currencySymbol, accounts }: QuickEntryProps) {
  const [platform, setPlatform] = useState<RidePlatform>('uber')
  const [rawAmount, setRawAmount] = useState('')
  const [useCommission, setUseCommission] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setRawAmount('')
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen])

  const selectedPlatform = PLATFORMS.find((p) => p.id === platform)!
  const grossAmount = parseFloat(rawAmount) || 0
  const commission = selectedPlatform.commission
  const netAmount = useCommission && commission > 0 ? grossAmount * (1 - commission / 100) : grossAmount

  const handleSubmit = () => {
    if (grossAmount <= 0) return
    const defaultAccount = accounts[0]?.id
    onSubmit(
      'sale',
      netAmount,
      platform === 'taxi' ? 'Taxi' : `Viaje ${selectedPlatform.label}`,
      defaultAccount,
      'platform_trip',
      platform,
      grossAmount,
      useCommission ? commission : 0
    )
    setRawAmount('')
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto px-4 pb-8 pt-4">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            Viaje Rapido
          </SheetTitle>
          <SheetDescription className="sr-only">Registro rapido de viaje</SheetDescription>
        </SheetHeader>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              style={platform === p.id ? { backgroundColor: p.bg, color: p.fg } : undefined}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                platform === p.id
                  ? 'ring-2 ring-primary ring-offset-1 scale-105 border-transparent'
                  : 'bg-muted text-muted-foreground border-transparent opacity-60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="bg-muted rounded-xl px-4 py-3 mb-3 text-center">
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {currencySymbol}{rawAmount || '0'}
          </p>
          {useCommission && commission > 0 && grossAmount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Neto: {currencySymbol}{netAmount.toFixed(0)} (menos {commission}% comision)
            </p>
          )}
        </div>

        {commission > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setUseCommission((v) => !v)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                useCommission ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'
              }`}
            >
              {useCommission ? `Descontar ${commission}% comision` : `+ Descontar ${commission}% comision`}
            </button>
          </div>
        )}

        <div className="flex gap-2 flex-wrap mb-3">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => setRawAmount(String(amt))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                parseFloat(rawAmount) === amt
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border text-foreground'
              }`}
            >
              {currencySymbol}{amt}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            placeholder="Ingresar monto..."
            value={rawAmount}
            onChange={(e) => setRawAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button
          className="w-full h-14 text-base font-bold rounded-xl"
          disabled={grossAmount <= 0}
          onClick={handleSubmit}
        >
          <Check className="mr-2 h-5 w-5" />
          Registrar {grossAmount > 0 ? `${currencySymbol}${netAmount.toFixed(0)}` : ''}
        </Button>
      </SheetContent>
    </Sheet>
  )
}
