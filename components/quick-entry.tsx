'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Check, MapPin } from 'lucide-react'
import type { Account } from '@/lib/types'

interface QuickEntryProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (type: 'sale', amount: number, title: string, accountId?: string, km?: number) => void
  currencySymbol: string
  accounts: Account[]
}

export function QuickEntry({ isOpen, onClose, onSubmit, currencySymbol, accounts }: QuickEntryProps) {
  const [amount, setAmount] = useState('')
  const [km, setKm] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setKm('')
      setSelectedAccountId(accounts[0]?.id)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen, accounts])

  const numAmount = parseFloat(amount) || 0
  const numKm = parseFloat(km) > 0 ? parseFloat(km) : undefined

  const handleSubmit = () => {
    if (numAmount <= 0) return
    onSubmit('sale', numAmount, 'Viaje', selectedAccountId, numKm)
    setAmount('')
    setKm('')
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto px-4 pb-8 pt-4">
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4" />
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>Registrar viaje</SheetTitle>
          <SheetDescription className="sr-only">Valor del viaje y método de pago</SheetDescription>
        </SheetHeader>

        <div className="bg-muted rounded-xl px-4 py-4 mb-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-semibold text-muted-foreground">{currencySymbol}</span>
            <input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-transparent text-4xl font-bold text-center focus:outline-none tabular-nums"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Valor del viaje</p>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Kilómetros (opcional)
          </p>
          <div className="relative">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={km}
              onChange={(e) => setKm(e.target.value.replace(/[^0-9.]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="h-11 pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">km</span>
          </div>
        </div>

        {accounts.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">Método de pago</p>
            <div className="flex gap-2 flex-wrap">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    selectedAccountId === account.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-transparent'
                  }`}
                >
                  {account.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          className="w-full h-14 text-base font-bold rounded-xl"
          disabled={numAmount <= 0}
          onClick={handleSubmit}
        >
          <Check className="mr-2 h-5 w-5" />
          Registrar {numAmount > 0 ? `${currencySymbol}${numAmount.toLocaleString('es')}` : ''}
        </Button>
      </SheetContent>
    </Sheet>
  )
}
