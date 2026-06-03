'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import type { RecurringDebt, PaymentFrequency } from '@/lib/types'

interface RecurringDebtsProps {
  debts: RecurringDebt[]
  dailyDebtPortion: number
  onAdd: (name: string, amount: number, frequency: PaymentFrequency, dueDay?: number, description?: string) => void
  onUpdate: (id: string, name: string, amount: number, frequency: PaymentFrequency, dueDay?: number, description?: string) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string) => void
  formatCurrency: (amount: number) => string
}

const FREQ_LABELS: Record<PaymentFrequency, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
}

const FREQ_DAILY_DIVISOR: Record<PaymentFrequency, (daysInMonth: number) => number> = {
  daily: () => 1,
  weekly: () => 7,
  biweekly: () => 14,
  monthly: (d) => d,
}

export function RecurringDebts({
  debts,
  dailyDebtPortion,
  onAdd,
  onUpdate,
  onDelete,
  onToggleActive,
  formatCurrency,
}: RecurringDebtsProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RecurringDebt | null>(null)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly')
  const [description, setDescription] = useState('')

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()

  const resetForm = () => {
    setName('')
    setAmount('')
    setFrequency('monthly')
    setDescription('')
  }

  const dailyEquivalent = (amt: number, freq: PaymentFrequency) =>
    Math.ceil(amt / FREQ_DAILY_DIVISOR[freq](daysInMonth))

  const handleAdd = () => {
    if (name.trim() && parseFloat(amount) > 0) {
      onAdd(name.trim(), parseFloat(amount), frequency, undefined, description.trim() || undefined)
      resetForm()
      setIsAdding(false)
    }
  }

  const handleStartEdit = (debt: RecurringDebt) => {
    setEditingId(debt.id)
    setName(debt.name)
    setAmount(String(debt.amount))
    setFrequency(debt.frequency)
    setDescription(debt.description || '')
  }

  const handleSaveEdit = () => {
    if (editingId && name.trim() && parseFloat(amount) > 0) {
      onUpdate(editingId, name.trim(), parseFloat(amount), frequency, undefined, description.trim() || undefined)
      resetForm()
      setEditingId(null)
    }
  }

  const handleCancel = () => {
    resetForm()
    setEditingId(null)
    setIsAdding(false)
  }

  const renderForm = (isEdit = false) => (
    <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Mamá, Préstamo banco..."
        className="h-11"
        autoFocus={!isEdit}
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Monto</p>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="h-11"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Frecuencia</p>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as PaymentFrequency)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="monthly">Mensual</option>
            <option value="weekly">Semanal</option>
            <option value="biweekly">Quincenal</option>
            <option value="daily">Diario</option>
          </select>
        </div>
      </div>
      {amount && parseFloat(amount) > 0 && (
        <div className="flex justify-between items-center bg-green-500/10 rounded-lg px-3 py-2">
          <span className="text-xs text-muted-foreground">Suma a tu meta diaria</span>
          <span className="text-sm font-bold text-green-600">
            +{formatCurrency(dailyEquivalent(parseFloat(amount), frequency))}/día
          </span>
        </div>
      )}
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Notas (opcional)"
        className="h-10"
      />
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={handleCancel}>
          <X className="w-4 h-4 mr-1" /> Cancelar
        </Button>
        <Button className="flex-1" onClick={isEdit ? handleSaveEdit : handleAdd}>
          <Check className="w-4 h-4 mr-1" /> {isEdit ? 'Guardar' : 'Agregar'}
        </Button>
      </div>
    </div>
  )

  const activeDebts = debts.filter((d) => d.isActive)
  const inactiveDebts = debts.filter((d) => !d.isActive)

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              Pagos recurrentes
            </CardTitle>
            {dailyDebtPortion > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Suma <span className="font-medium text-foreground">{formatCurrency(dailyDebtPortion)}/día</span> a tu meta
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => { setIsAdding(true); setIsOpen(true) }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsOpen((o) => !o)}
            >
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-2 pt-0">
          {isAdding && renderForm(false)}

          {debts.length === 0 && !isAdding && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Agregá pagos recurrentes (abonos, cuotas mensuales) para que sumen a tu meta diaria.
            </p>
          )}

          {activeDebts.map((debt) => {
            if (editingId === debt.id) return <div key={debt.id}>{renderForm(true)}</div>
            const daily = dailyEquivalent(debt.amount, debt.frequency)
            return (
              <div key={debt.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <Switch
                  checked={debt.isActive}
                  onCheckedChange={() => onToggleActive(debt.id)}
                  className="scale-90 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{debt.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(debt.amount)} / {FREQ_LABELS[debt.frequency]}
                    {' · '}
                    <span className="text-green-600 font-medium">+{formatCurrency(daily)}/día</span>
                  </p>
                  {debt.description && (
                    <p className="text-xs text-muted-foreground truncate">{debt.description}</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleStartEdit(debt)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(debt)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}

          {inactiveDebts.length > 0 && (
            <div className="space-y-2 opacity-50">
              <p className="text-xs text-muted-foreground px-1">Pausados</p>
              {inactiveDebts.map((debt) => {
                if (editingId === debt.id) return <div key={debt.id}>{renderForm(true)}</div>
                return (
                  <div key={debt.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                    <Switch
                      checked={false}
                      onCheckedChange={() => onToggleActive(debt.id)}
                      className="scale-90 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-through truncate">{debt.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(debt.amount)} / {FREQ_LABELS[debt.frequency]}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => setDeleteTarget(debt)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{deleteTarget?.name}" y dejará de contar en tu meta diaria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { if (deleteTarget) { onDelete(deleteTarget.id); setDeleteTarget(null) } }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
