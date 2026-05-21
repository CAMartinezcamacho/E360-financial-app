'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Calculator,
  Repeat,
  Wallet
} from 'lucide-react'
import type { RecurringDebt, PaymentFrequency } from '@/lib/types'

interface RecurringDebtsProps {
  debts: RecurringDebt[]
  dailyDebtPortion: number
  totalMonthlyDebts: number
  onAdd: (name: string, amount: number, frequency: PaymentFrequency, dueDay?: number, description?: string) => void
  onUpdate: (id: string, name: string, amount: number, frequency: PaymentFrequency, dueDay?: number, description?: string) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string) => void
  formatCurrency: (amount: number) => string
}

const frequencyLabels: Record<PaymentFrequency, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
}

const frequencyColors: Record<PaymentFrequency, string> = {
  daily: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  weekly: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  biweekly: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  monthly: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export function RecurringDebts({
  debts,
  dailyDebtPortion,
  totalMonthlyDebts,
  onAdd,
  onUpdate,
  onDelete,
  onToggleActive,
  formatCurrency,
}: RecurringDebtsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RecurringDebt | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly')
  const [dueDay, setDueDay] = useState('')
  const [description, setDescription] = useState('')

  const activeDebts = debts.filter((d) => d.isActive)
  const inactiveDebts = debts.filter((d) => !d.isActive)

  const resetForm = () => {
    setName('')
    setAmount('')
    setFrequency('monthly')
    setDueDay('')
    setDescription('')
  }

  const handleAdd = () => {
    if (name.trim() && parseFloat(amount) > 0) {
      onAdd(
        name.trim(),
        parseFloat(amount),
        frequency,
        dueDay ? parseInt(dueDay) : undefined,
        description.trim() || undefined
      )
      resetForm()
      setIsAdding(false)
    }
  }

  const handleStartEdit = (debt: RecurringDebt) => {
    setEditingId(debt.id)
    setName(debt.name)
    setAmount(String(debt.amount))
    setFrequency(debt.frequency)
    setDueDay(debt.dueDay ? String(debt.dueDay) : '')
    setDescription(debt.description || '')
  }

  const handleSaveEdit = () => {
    if (editingId && name.trim() && parseFloat(amount) > 0) {
      onUpdate(
        editingId,
        name.trim(),
        parseFloat(amount),
        frequency,
        dueDay ? parseInt(dueDay) : undefined,
        description.trim() || undefined
      )
      resetForm()
      setEditingId(null)
    }
  }

  const handleCancelEdit = () => {
    resetForm()
    setEditingId(null)
    setIsAdding(false)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  // Calculate daily equivalent for a single debt
  const getDailyEquivalent = (debt: RecurringDebt): number => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    switch (debt.frequency) {
      case 'daily':
        return debt.amount
      case 'weekly':
        return debt.amount / 7
      case 'biweekly':
        return debt.amount / 14
      case 'monthly':
        return debt.amount / daysInMonth
    }
  }

  const renderDebtForm = (isEdit: boolean = false) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Nombre de la deuda</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Credito banco, Datafono..."
          className="h-12"
          autoFocus={!isEdit}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Monto</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Frecuencia</label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as PaymentFrequency)}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diario</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="biweekly">Quincenal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(frequency === 'weekly') && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Dia de pago</label>
          <Select value={dueDay} onValueChange={setDueDay}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Seleccionar dia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Domingo</SelectItem>
              <SelectItem value="1">Lunes</SelectItem>
              <SelectItem value="2">Martes</SelectItem>
              <SelectItem value="3">Miercoles</SelectItem>
              <SelectItem value="4">Jueves</SelectItem>
              <SelectItem value="5">Viernes</SelectItem>
              <SelectItem value="6">Sabado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {(frequency === 'monthly' || frequency === 'biweekly') && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Dia del mes</label>
          <Input
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            placeholder="1-31"
            className="h-12"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Descripcion (opcional)</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notas adicionales..."
          className="h-12"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={handleCancelEdit}>
          <X className="w-4 h-4 mr-1" />
          Cancelar
        </Button>
        <Button className="flex-1" onClick={isEdit ? handleSaveEdit : handleAdd}>
          <Check className="w-4 h-4 mr-1" />
          {isEdit ? 'Guardar' : 'Agregar'}
        </Button>
      </div>
    </div>
  )

  const renderDebtItem = (debt: RecurringDebt) => {
    const dailyEquiv = getDailyEquivalent(debt)
    const isEditing = editingId === debt.id

    if (isEditing) {
      return (
        <div key={debt.id} className="p-4 rounded-xl bg-secondary/50 border border-border">
          {renderDebtForm(true)}
        </div>
      )
    }

    return (
      <div
        key={debt.id}
        className={`p-3 rounded-xl border transition-all ${
          debt.isActive 
            ? 'bg-card border-border' 
            : 'bg-muted/50 border-border/50 opacity-60'
        }`}
      >
        {/* Header row with name and actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`font-semibold text-sm text-foreground truncate ${!debt.isActive && 'line-through'}`}>
                {debt.name}
              </span>
              <Badge className={`text-[10px] px-1.5 py-0 h-5 ${frequencyColors[debt.frequency]}`}>
                {frequencyLabels[debt.frequency]}
              </Badge>
            </div>
            {debt.description && (
              <p className="text-xs text-muted-foreground truncate">{debt.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Switch
              checked={debt.isActive}
              onCheckedChange={() => onToggleActive(debt.id)}
              className="scale-90"
            />
          </div>
        </div>

        {/* Amount row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-foreground">
              {formatCurrency(debt.amount)}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calculator className="w-3 h-3" />
              {formatCurrency(Math.ceil(dailyEquiv))}/dia
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleStartEdit(debt)}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(debt)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <button
          className="flex items-center justify-between w-full active:scale-[0.99] transition-transform"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Repeat className="w-4 h-4 text-accent" />
            </div>
            <CardTitle className="text-base font-semibold">Deudas Recurrentes</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {activeDebts.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeDebts.length} activa{activeDebts.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarClock className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span className="text-[10px] text-muted-foreground leading-tight">Meta Diaria Extra</span>
              </div>
              <span className="text-base font-bold text-accent block truncate">
                +{formatCurrency(dailyDebtPortion)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                <span className="text-[10px] text-muted-foreground leading-tight">Total Mensual</span>
              </div>
              <span className="text-base font-bold text-destructive block truncate">
                {formatCurrency(totalMonthlyDebts)}
              </span>
            </div>
          </div>

          {/* Info Message */}
          <div className="p-3 rounded-xl bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Las deudas recurrentes se prorratean diariamente y se suman automaticamente a tu meta diaria. 
              Por ejemplo, una deuda mensual de $30,000 agrega aproximadamente $1,000 a tu meta de cada dia.
            </p>
          </div>

          {/* Active Debts */}
          {activeDebts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Deudas Activas
              </h4>
              <div className="space-y-2">
                {activeDebts.map(renderDebtItem)}
              </div>
            </div>
          )}

          {/* Inactive Debts */}
          {inactiveDebts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Deudas Inactivas
              </h4>
              <div className="space-y-2">
                {inactiveDebts.map(renderDebtItem)}
              </div>
            </div>
          )}

          {/* Empty State */}
          {debts.length === 0 && !isAdding && (
            <div className="text-center py-6">
              <Repeat className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                No tienes deudas recurrentes registradas
              </p>
            </div>
          )}

          {/* Add Form */}
          {isAdding ? (
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <h4 className="font-medium text-foreground mb-3">Nueva Deuda Recurrente</h4>
              {renderDebtForm(false)}
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-12 active:scale-95"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Deuda Recurrente
            </Button>
          )}
        </CardContent>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Deuda Recurrente</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que deseas eliminar <span className="font-semibold">{deleteTarget?.name}</span>?
              Esto reducira tu meta diaria en aproximadamente {deleteTarget && formatCurrency(Math.ceil(getDailyEquivalent(deleteTarget)))}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
