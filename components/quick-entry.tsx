'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrendingUp, TrendingDown, X, Banknote, Smartphone, Car, CreditCard, Building, Wallet } from 'lucide-react'
import type { Account } from '@/lib/types'

interface QuickEntryProps {
  isOpen: boolean
  type: 'sale' | 'expense' | null
  onClose: () => void
  onSubmit: (type: 'sale' | 'expense', amount: number, title: string, accountId?: string) => void
  currencySymbol: string
  accounts: Account[]
}

const quickAmounts = [50, 100, 200, 500, 1000]

const expenseSuggestions = ['Cafe', 'Almuerzo', 'Transporte', 'Snack', 'Uber']
const saleSuggestions = ['Venta', 'Servicio', 'Delivery', 'Propina', 'Comision']

function getIconComponent(iconName: string) {
  const icons: Record<string, typeof Wallet> = {
    'banknote': Banknote,
    'smartphone': Smartphone,
    'car': Car,
    'credit-card': CreditCard,
    'building': Building,
    'wallet': Wallet,
  }
  return icons[iconName] || Wallet
}

function getColorClass(color: string) {
  const colors: Record<string, string> = {
    'emerald': 'bg-emerald-500',
    'purple': 'bg-purple-500',
    'orange': 'bg-orange-500',
    'zinc': 'bg-zinc-500',
    'blue': 'bg-blue-500',
    'pink': 'bg-pink-500',
  }
  return colors[color] || 'bg-zinc-500'
}

export function QuickEntry({ isOpen, type, onClose, onSubmit, currencySymbol, accounts }: QuickEntryProps) {
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [accountId, setAccountId] = useState<string>('none')

  const handleSubmit = () => {
    if (type && parseFloat(amount) > 0 && title.trim()) {
      onSubmit(type, parseFloat(amount), title.trim(), accountId === 'none' ? undefined : accountId)
      setAmount('')
      setTitle('')
      setAccountId('none')
      onClose()
    }
  }

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString())
  }

  const handleSuggestion = (suggestion: string) => {
    setTitle(suggestion)
  }

  const suggestions = type === 'expense' ? expenseSuggestions : saleSuggestions

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[90vh] rounded-t-3xl px-4 pb-8 pt-4"
      >
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4" />
        
        <SheetHeader className="text-left mb-6">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              type === 'sale' 
                ? 'bg-accent/10 text-accent' 
                : 'bg-destructive/10 text-destructive'
            }`}>
              {type === 'sale' ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
            <div>
              <SheetTitle className="text-xl">
                {type === 'sale' ? 'Registrar Venta' : 'Registrar Gasto Hormiga'}
              </SheetTitle>
              <SheetDescription>
                {type === 'sale' 
                  ? 'Registra ingresos por ventas o servicios' 
                  : 'Registra tus gastos del dia'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Monto</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground pointer-events-none">
                {currencySymbol}
              </span>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="h-14 pl-16 text-2xl font-semibold"
                autoFocus
              />
              {amount && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8"
                  onClick={() => setAmount('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="flex gap-2 flex-wrap">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 min-w-[60px] active:scale-95"
                  onClick={() => handleQuickAmount(quickAmount)}
                >
                  {currencySymbol}{quickAmount}
                </Button>
              ))}
            </div>
          </div>

          {/* Account Selection */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {type === 'sale' ? 'A donde ingreso el dinero?' : 'De donde salio el dinero?'}
              </Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Seleccionar cuenta (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cuenta especifica</SelectItem>
                  {accounts.map((account) => {
                    const Icon = getIconComponent(account.icon)
                    return (
                      <SelectItem key={account.id} value={account.id}>
                        <span className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center ${getColorClass(account.color)}`}>
                            <Icon className="w-3 h-3 text-white" />
                          </span>
                          {account.name}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Descripcion</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'sale' ? 'Que vendiste?' : 'En que gastaste?'}
              className="h-12"
            />
            
            {/* Quick Suggestions */}
            <div className="flex gap-2 flex-wrap">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs active:scale-95"
                  onClick={() => handleSuggestion(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            className={`w-full h-14 text-lg font-semibold active:scale-95 ${
              type === 'sale' 
                ? 'bg-accent hover:bg-accent/90 text-accent-foreground' 
                : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
            }`}
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0 || !title.trim()}
          >
            {type === 'sale' ? (
              <>
                <TrendingUp className="w-5 h-5 mr-2" />
                Registrar Venta
              </>
            ) : (
              <>
                <TrendingDown className="w-5 h-5 mr-2" />
                Registrar Gasto
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
