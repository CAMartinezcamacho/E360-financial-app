'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp, HandCoins, CheckCircle2 } from 'lucide-react'
import type { DebtPlan, PaymentFrequency } from '@/lib/types'

interface DebtPlansProps {
  plans: DebtPlan[]
  dailyPortion: number
  onAdd: (name: string, totalAmount: number, paymentAmount: number, frequency: PaymentFrequency, dueDay?: number, description?: string) => void
  onUpdate: (id: string, name: string, totalAmount: number, paymentAmount: number, frequency: PaymentFrequency, dueDay?: number, description?: string) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string) => void
  onPay: (id: string, addAsExpense?: boolean) => void
  formatCurrency: (amount: number) => string
}

const FREQ: Record<PaymentFrequency, string> = {
  daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual',
}

const FREQ_DAYS: Record<PaymentFrequency, number> = {
  daily: 1, weekly: 7, biweekly: 14, monthly: 30,
}

export function DebtPlans({ plans, dailyPortion, onAdd, onUpdate, onDelete, onToggleActive, onPay, formatCurrency }: DebtPlansProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DebtPlan | null>(null)
  const [payTarget, setPayTarget] = useState<DebtPlan | null>(null)

  const [name, setName] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly')
  const [dueDay, setDueDay] = useState('')
  const [description, setDescription] = useState('')

  const resetForm = () => {
    setName(''); setTotalAmount(''); setPaymentAmount('')
    setFrequency('monthly'); setDueDay(''); setDescription('')
  }

  const handleAdd = () => {
    if (!name.trim() || parseFloat(totalAmount) <= 0 || parseFloat(paymentAmount) <= 0) return
    onAdd(name.trim(), parseFloat(totalAmount), parseFloat(paymentAmount), frequency,
      dueDay ? parseInt(dueDay) : undefined, description.trim() || undefined)
    resetForm(); setIsAdding(false)
  }

  const handleStartEdit = (p: DebtPlan) => {
    setEditingId(p.id); setName(p.name); setTotalAmount(String(p.totalAmount))
    setPaymentAmount(String(p.paymentAmount)); setFrequency(p.frequency)
    setDueDay(p.dueDay ? String(p.dueDay) : ''); setDescription(p.description || '')
  }

  const handleSaveEdit = () => {
    if (!editingId || !name.trim() || parseFloat(paymentAmount) <= 0) return
    onUpdate(editingId, name.trim(), parseFloat(totalAmount), parseFloat(paymentAmount), frequency,
      dueDay ? parseInt(dueDay) : undefined, description.trim() || undefined)
    resetForm(); setEditingId(null)
  }

  const handleCancel = () => { resetForm(); setEditingId(null); setIsAdding(false) }

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const renderForm = (isEdit = false) => (
    <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Mamá, Banco, Prestamista..." className="h-11" autoFocus={!isEdit} />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Deuda total</p>
          <Input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0" className="h-11" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Abono</p>
          <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0" className="h-11" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Frecuencia</p>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as PaymentFrequency)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="monthly">Mensual</option>
            <option value="biweekly">Quincenal</option>
            <option value="weekly">Semanal</option>
            <option value="daily">Diario</option>
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Día de pago</p>
          <Input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Ej: 5" min="1" max="31" className="h-11" />
        </div>
      </div>
      {paymentAmount && parseFloat(paymentAmount) > 0 && (
        <div className="flex justify-between items-center bg-primary/10 rounded-lg px-3 py-2">
          <span className="text-xs text-muted-foreground">Suma a tu meta diaria</span>
          <span className="text-sm font-bold text-primary">
            +{formatCurrency(Math.ceil(parseFloat(paymentAmount) / FREQ_DAYS[frequency]))}/día
          </span>
        </div>
      )}
      <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notas (opcional)" className="h-10" />
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={handleCancel}><X className="w-4 h-4 mr-1" />Cancelar</Button>
        <Button className="flex-1" onClick={isEdit ? handleSaveEdit : handleAdd}><Check className="w-4 h-4 mr-1" />{isEdit ? 'Guardar' : 'Agregar'}</Button>
      </div>
    </div>
  )

  const activePlans = plans.filter((p) => p.isActive)
  const pausedPlans = plans.filter((p) => !p.isActive)

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HandCoins className="h-4 w-4 text-primary" />
              Deudas
            </CardTitle>
            {dailyPortion > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Suma <span className="font-medium text-foreground">{formatCurrency(dailyPortion)}/día</span> a tu meta
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setIsAdding(true); setIsOpen(true) }}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen((o) => !o)}>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-3 pt-0">
          {isAdding && renderForm(false)}

          {plans.length === 0 && !isAdding && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Agregá una deuda para ver el progreso y que el abono sume a tu meta diaria.
            </p>
          )}

          {activePlans.map((plan) => {
            if (editingId === plan.id) return <div key={plan.id}>{renderForm(true)}</div>
            const paidPct = plan.totalAmount > 0 ? Math.min(100, ((plan.totalAmount - plan.remainingAmount) / plan.totalAmount) * 100) : 100
            const alreadyPaidThisMonth = plan.paidMonth === currentMonth
            const isCompleted = plan.remainingAmount <= 0
            const paymentsLeft = plan.paymentAmount > 0 ? Math.ceil(plan.remainingAmount / plan.paymentAmount) : 0

            return (
              <div key={plan.id} className={`p-3 rounded-xl border transition-all ${isCompleted ? 'bg-green-500/10 border-green-500/30' : 'bg-card border-border'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Switch checked={plan.isActive} onCheckedChange={() => onToggleActive(plan.id)} className="scale-75 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold truncate">{plan.name}</span>
                        {isCompleted && <Badge className="text-[10px] px-1.5 py-0 h-5 bg-green-500/20 text-green-700">¡Pagada!</Badge>}
                        {!isCompleted && alreadyPaidThisMonth && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">Abono hecho ✓</Badge>}
                        {!isCompleted && plan.dueDay && !alreadyPaidThisMonth && (() => {
                          const today = new Date().getDate()
                          const diff = plan.dueDay - today
                          if (diff >= 0 && diff <= 5) return <Badge className="text-[10px] px-1.5 py-0 h-5 bg-orange-500/20 text-orange-700">Vence día {plan.dueDay}</Badge>
                          if (diff < 0) return <Badge className="text-[10px] px-1.5 py-0 h-5 bg-red-500/20 text-red-700">Vencido día {plan.dueDay}</Badge>
                          return null
                        })()}
                      </div>
                      {plan.description && <p className="text-xs text-muted-foreground truncate">{plan.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleStartEdit(plan)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(plan)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <Progress value={paidPct} className={`h-2 ${isCompleted ? '[&>[data-slot=progress-indicator]]:bg-green-500' : '[&>[data-slot=progress-indicator]]:bg-primary'}`} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center mb-2">
                  <div className="bg-muted rounded-lg p-1.5">
                    <p className="text-[10px] text-muted-foreground">Restante</p>
                    <p className="text-xs font-bold text-destructive">{formatCurrency(plan.remainingAmount)}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-1.5">
                    <p className="text-[10px] text-muted-foreground">Abono</p>
                    <p className="text-xs font-bold">{formatCurrency(plan.paymentAmount)}/{FREQ[plan.frequency].toLowerCase().slice(0,3)}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-1.5">
                    <p className="text-[10px] text-muted-foreground">Pagos left</p>
                    <p className="text-xs font-bold">{isCompleted ? '🎉' : paymentsLeft}</p>
                  </div>
                </div>

                {/* Pay button */}
                {!isCompleted && (
                  <Button
                    size="sm"
                    className={`w-full h-9 gap-1.5 text-xs ${alreadyPaidThisMonth ? 'bg-muted text-muted-foreground' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                    onClick={() => setPayTarget(plan)}
                    disabled={alreadyPaidThisMonth}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {alreadyPaidThisMonth ? 'Abono registrado este mes' : `Registrar abono de ${formatCurrency(plan.paymentAmount)}`}
                  </Button>
                )}
              </div>
            )
          })}

          {pausedPlans.length > 0 && (
            <div className="space-y-2 opacity-50">
              <p className="text-xs text-muted-foreground px-1">Pausadas</p>
              {pausedPlans.map((plan) => (
                <div key={plan.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                  <Switch checked={false} onCheckedChange={() => onToggleActive(plan.id)} className="scale-75 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-through truncate">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(plan.remainingAmount)} restante</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteTarget(plan)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar deuda?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará "{deleteTarget?.name}" y dejará de contar en tu meta.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { if (deleteTarget) { onDelete(deleteTarget.id); setDeleteTarget(null) } }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay confirmation */}
      <AlertDialog open={!!payTarget} onOpenChange={() => setPayTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar abono</AlertDialogTitle>
            <AlertDialogDescription>
              Se registrará un abono de {payTarget && formatCurrency(payTarget.paymentAmount)} a "{payTarget?.name}" y se descontará del saldo pendiente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-green-500 text-white hover:bg-green-600" onClick={() => { if (payTarget) { onPay(payTarget.id, true); setPayTarget(null) } }}>
              Confirmar abono
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
