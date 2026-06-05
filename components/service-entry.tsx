'use client'

import { useState, useEffect } from 'react'
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
import { 
  TrendingUp, 
  TrendingDown, 
  X, 
  Banknote, 
  Smartphone, 
  Car, 
  CreditCard, 
  Building, 
  Wallet,
  Calculator,
  Info
} from 'lucide-react'
import type { Account, ServiceType, RidePlatform } from '@/lib/types'

interface ServiceEntryProps {
  isOpen: boolean
  type: 'sale' | 'expense' | null
  onClose: () => void
  onSubmit: (
    type: 'sale' | 'expense', 
    amount: number, 
    title: string, 
    accountId?: string,
    serviceType?: ServiceType,
    platform?: RidePlatform,
    grossAmount?: number,
    commissionPercent?: number,
    companyName?: string
  ) => void
  currencySymbol: string
  accounts: Account[]
}

const expenseSuggestions = ['Cafe', 'Almuerzo', 'Transporte', 'Snack', 'Gasolina']

// Platform commission defaults
const platformCommissions: Record<RidePlatform, number> = {
  uber: 25,
  indriver: 15,
  cabify: 20,
  taxi: 0,
  otro: 10,
}

const platformNames: Record<RidePlatform, string> = {
  uber: 'Uber',
  indriver: 'InDriver',
  cabify: 'Cabify',
  taxi: 'Taxi',
  otro: 'Otro',
}

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

export function ServiceEntry({ isOpen, type, onClose, onSubmit, currencySymbol, accounts }: ServiceEntryProps) {
  const [serviceType, setServiceType] = useState<ServiceType>('sale')
  const [platform, setPlatform] = useState<RidePlatform>('uber')
  const [grossAmount, setGrossAmount] = useState('')
  const [commissionPercent, setCommissionPercent] = useState('25')
  const [companyName, setCompanyName] = useState('')
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [accountId, setAccountId] = useState<string>('none')

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      if (type === 'expense') {
        setServiceType('expense')
      } else {
        setServiceType('sale')
      }
      setGrossAmount('')
      setCommissionPercent('25')
      setCompanyName('')
      setAmount('')
      setTitle('')
      setAccountId('none')
    }
  }, [isOpen, type])

  // Auto-calculate net amount for platform trips
  useEffect(() => {
    if (serviceType === 'platform_trip' && grossAmount) {
      const gross = parseFloat(grossAmount) || 0
      const commission = parseFloat(commissionPercent) || 0
      const net = gross * (1 - commission / 100)
      setAmount(Math.round(net).toString())
    }
  }, [grossAmount, commissionPercent, serviceType])

  // Update commission when platform changes
  useEffect(() => {
    if (serviceType === 'platform_trip') {
      setCommissionPercent(platformCommissions[platform].toString())
    }
  }, [platform, serviceType])

  const handleSubmit = () => {
    if (type === 'expense') {
      // Regular expense
      if (parseFloat(amount) > 0 && title.trim()) {
        onSubmit('expense', parseFloat(amount), title.trim(), accountId === 'none' ? undefined : accountId, 'expense')
        onClose()
      }
    } else {
      // Sale/Income
      let finalAmount = parseFloat(amount)
      let finalTitle = title.trim()
      
      if (serviceType === 'platform_trip') {
        finalAmount = parseFloat(amount) || 0
        finalTitle = `${platformNames[platform]}: ${currencySymbol}${grossAmount} bruto`
        if (finalAmount > 0) {
          onSubmit(
            'sale', 
            finalAmount, 
            finalTitle, 
            accountId === 'none' ? undefined : accountId,
            'platform_trip',
            platform,
            parseFloat(grossAmount),
            parseFloat(commissionPercent)
          )
          onClose()
        }
      } else if (serviceType === 'corporate') {
        if (finalAmount > 0 && companyName.trim()) {
          finalTitle = `Corporativo: ${companyName.trim()}`
          onSubmit(
            'sale',
            finalAmount,
            finalTitle,
            accountId === 'none' ? undefined : accountId,
            'corporate',
            undefined,
            undefined,
            undefined,
            companyName.trim()
          )
          onClose()
        }
      } else {
        // Regular sale or other
        if (finalAmount > 0 && finalTitle) {
          onSubmit(
            'sale',
            finalAmount,
            finalTitle,
            accountId === 'none' ? undefined : accountId,
            serviceType === 'other' ? 'other' : 'sale'
          )
          onClose()
        }
      }
    }
  }

  const isExpense = type === 'expense'

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[90vh] rounded-t-3xl px-4 pb-8 pt-4 overflow-y-auto"
      >
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4" />
        
        <SheetHeader className="text-left mb-4">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              isExpense 
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-accent/10 text-accent'
            }`}>
              {isExpense ? (
                <TrendingDown className="w-5 h-5" />
              ) : (
                <TrendingUp className="w-5 h-5" />
              )}
            </div>
            <div>
              <SheetTitle className="text-xl">
                {isExpense ? 'Registrar Gasto' : 'Registrar Ingreso'}
              </SheetTitle>
              <SheetDescription>
                {isExpense 
                  ? 'Registra tus gastos del dia' 
                  : 'Registra servicios, viajes o ventas'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          {/* Service Type Selection - Only for sales */}
          {!isExpense && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Tipo de Ingreso</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={serviceType === 'platform_trip' ? 'default' : 'outline'}
                  className={`h-12 ${serviceType === 'platform_trip' ? 'bg-accent hover:bg-accent/90' : ''}`}
                  onClick={() => setServiceType('platform_trip')}
                >
                  <Car className="w-4 h-4 mr-2" />
                  Viaje App
                </Button>
                <Button
                  variant={serviceType === 'corporate' ? 'default' : 'outline'}
                  className={`h-12 ${serviceType === 'corporate' ? 'bg-accent hover:bg-accent/90' : ''}`}
                  onClick={() => setServiceType('corporate')}
                >
                  <Building className="w-4 h-4 mr-2" />
                  Corporativo
                </Button>
                <Button
                  variant={serviceType === 'sale' ? 'default' : 'outline'}
                  className={`h-12 ${serviceType === 'sale' ? 'bg-accent hover:bg-accent/90' : ''}`}
                  onClick={() => setServiceType('sale')}
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  Venta
                </Button>
                <Button
                  variant={serviceType === 'other' ? 'default' : 'outline'}
                  className={`h-12 ${serviceType === 'other' ? 'bg-accent hover:bg-accent/90' : ''}`}
                  onClick={() => setServiceType('other')}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Otro
                </Button>
              </div>
            </div>
          )}

          {/* Platform Trip Form */}
          {!isExpense && serviceType === 'platform_trip' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Plataforma</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['uber', 'indriver', 'cabify', 'taxi', 'otro'] as RidePlatform[]).map((p) => (
                    <Button
                      key={p}
                      variant={platform === p ? 'default' : 'outline'}
                      className={`h-10 text-xs ${platform === p ? 'bg-accent hover:bg-accent/90' : ''}`}
                      onClick={() => setPlatform(p)}
                    >
                      {platformNames[p]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Valor Cobrado</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {currencySymbol}
                    </span>
                    <Input
                      type="number"
                      value={grossAmount}
                      onChange={(e) => setGrossAmount(e.target.value)}
                      placeholder="0"
                      className="h-12 pl-8 text-lg font-semibold"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Comision %</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={commissionPercent}
                      onChange={(e) => setCommissionPercent(e.target.value)}
                      placeholder="25"
                      className="h-12 pr-8 text-lg font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Amount Display */}
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-accent" />
                    <span className="text-sm text-muted-foreground">Valor Neto (Recibes)</span>
                  </div>
                  <span className="text-xl font-bold text-accent">
                    {currencySymbol}{amount || '0'}
                  </span>
                </div>
              </div>

            </>
          )}

          {/* Corporate Service Form */}
          {!isExpense && serviceType === 'corporate' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Empresa</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nombre de la empresa"
                  className="h-12"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Valor del Servicio</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="h-14 pl-12 text-2xl font-semibold"
                  />
                </div>
              </div>

              {/* Corporate Info */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Los servicios corporativos generalmente se pagan al final de la semana o quincena. 
                    El monto se registra como ingreso inmediato.
                  </p>
                </div>
              </div>

            </>
          )}

          {/* Regular Sale/Other Form */}
          {!isExpense && (serviceType === 'sale' || serviceType === 'other') && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Monto</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="h-14 pl-12 text-2xl font-semibold"
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
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Descripcion</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Que vendiste o recibiste?"
                  className="h-12"
                />
                <div className="flex gap-2 flex-wrap">
                  {['Venta', 'Servicio', 'Propina', 'Delivery', 'Comision'].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => setTitle(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Expense Form */}
          {isExpense && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Monto</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="h-14 pl-12 text-2xl font-semibold"
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
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Descripcion</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="En que gastaste?"
                  className="h-12"
                />
                <div className="flex gap-2 flex-wrap">
                  {expenseSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => setTitle(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Account Selection */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {isExpense ? 'De donde salio?' : 'A donde va?'}
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

          {/* Submit Button */}
          <Button
            className={`w-full h-14 text-lg font-semibold active:scale-95 ${
              isExpense 
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                : 'bg-accent hover:bg-accent/90 text-accent-foreground'
            }`}
            onClick={handleSubmit}
            disabled={
              isExpense 
                ? (!amount || parseFloat(amount) <= 0 || !title.trim())
                : serviceType === 'platform_trip' 
                  ? (!grossAmount || parseFloat(grossAmount) <= 0)
                  : serviceType === 'corporate'
                    ? (!amount || parseFloat(amount) <= 0 || !companyName.trim())
                    : (!amount || parseFloat(amount) <= 0 || !title.trim())
            }
          >
            {isExpense ? (
              <>
                <TrendingDown className="w-5 h-5 mr-2" />
                Registrar Gasto
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 mr-2" />
                Registrar Ingreso
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
