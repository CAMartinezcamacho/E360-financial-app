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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ChevronDown,
  ChevronUp,
  Calendar,
  Coins,
  Target,
  Clock
} from 'lucide-react'
import type { DailyQuotaDebt, QuotaFrequency } from '@/lib/types'

interface DailyQuotaDebtsProps {
  debts: DailyQuotaDebt[]
  dailyQuotaPortion: number
  onAdd: (name: string, totalAmount: number, totalDays: number, startDate: Date, description?: string, frequency?: QuotaFrequency) => void
  onUpdate: (id: string, name: string, totalAmount: number, totalDays: number, startDate: Date, description?: string, frequency?: QuotaFrequency) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string) => void
  getDetails: (debt: DailyQuotaDebt) => {
    daysPassed: number
    daysRemaining: number
    dailyQuota: number
    amountPaid: number
    amountRemaining: number
    progressPercent: number
    isCompleted: boolean
  }
  formatCurrency: (amount: number) => string
}

export function DailyQuotaDebts({
  debts,
  dailyQuotaPortion,
  onAdd,
  onUpdate,
  onDelete,
  onToggleActive,
  getDetails,
  formatCurrency,
}: DailyQuotaDebtsProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DailyQuotaDebt | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [totalDays, setTotalDays] = useState('')
  const [startDate, setStartDate] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<QuotaFrequency>('daily')

  const activeDebts = debts.filter((d) => d.isActive)
  const inactiveDebts = debts.filter((d) => !d.isActive)

  const resetForm = () => {
    setName('')
    setTotalAmount('')
    setTotalDays('')
    setStartDate('')
    setDescription('')
    setFrequency('daily')
  }

  const handleAdd = () => {
    if (name.trim() && parseFloat(totalAmount) > 0 && parseInt(totalDays) > 0) {
      const date = startDate ? new Date(startDate) : new Date()
      onAdd(
        name.trim(),
        parseFloat(totalAmount),
        parseInt(totalDays),
        date,
        description.trim() || undefined,
        frequency
      )
      resetForm()
      setIsAdding(false)
    }
  }

  const handleStartEdit = (debt: DailyQuotaDebt) => {
    setEditingId(debt.id)
    setName(debt.name)
    setTotalAmount(String(debt.totalAmount))
    setTotalDays(String(debt.totalDays))
    const dateStr = new Date(debt.startDate).toISOString().split('T')[0]
    setStartDate(dateStr)
    setDescription(debt.description || '')
    setFrequency(debt.frequency ?? 'daily')
  }

  const handleSaveEdit = () => {
    if (editingId && name.trim() && parseFloat(totalAmount) > 0 && parseInt(totalDays) > 0) {
      const date = startDate ? new Date(startDate) : new Date()
      onUpdate(
        editingId,
        name.trim(),
        parseFloat(totalAmount),
        parseInt(totalDays),
        date,
        description.trim() || undefined,
        frequency
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

  const renderDebtForm = (isEdit: boolean = false) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Nombre / Acreedor</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Prestamo Juan, Gota a gota..."
          className="h-12"
          autoFocus={!isEdit}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Valor Total Prestado</label>
          <Input
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="0"
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Dias para Pagar</label>
          <Input
            type="number"
            value={totalDays}
            onChange={(e) => setTotalDays(e.target.value)}
            placeholder="30"
            className="h-12"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Fecha de Inicio</label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-12"
        />
      </div>

      {/* Frequency toggle */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Tipo de cuota</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFrequency('daily')}
            className={`h-10 rounded-lg border text-sm font-medium transition-colors ${frequency === 'daily' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground'}`}
          >
            Diaria
          </button>
          <button
            type="button"
            onClick={() => setFrequency('weekly')}
            className={`h-10 rounded-lg border text-sm font-medium transition-colors ${frequency === 'weekly' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground'}`}
          >
            Semanal
          </button>
        </div>
      </div>

      {/* Preview calculated quota */}
      {totalAmount && totalDays && parseInt(totalDays) > 0 && (
        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{frequency === 'weekly' ? 'Cuota Semanal' : 'Cuota Diaria'}</span>
            <span className="text-lg font-bold text-accent">
              {formatCurrency(Math.ceil(parseFloat(totalAmount) / parseInt(totalDays)))}
            </span>
          </div>
          {frequency === 'weekly' && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">Equivalente diario</span>
              <span className="text-sm font-medium text-muted-foreground">
                {formatCurrency(Math.ceil(parseFloat(totalAmount) / parseInt(totalDays) / 7))} /día
              </span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Notas (opcional)</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalles adicionales..."
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

  const renderDebtItem = (debt: DailyQuotaDebt) => {
    const details = getDetails(debt)
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
            ? details.isCompleted 
              ? 'bg-accent/10 border-accent/30' 
              : 'bg-card border-border'
            : 'bg-muted/50 border-border/50 opacity-60'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`font-semibold text-sm text-foreground truncate ${!debt.isActive && 'line-through'}`}>
                {debt.name}
              </span>
              {details.isCompleted && (
                <Badge className="text-[10px] px-1.5 py-0 h-5 bg-accent/20 text-accent">
                  Completada
                </Badge>
              )}
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

        {/* Progress bar */}
        <div className="mb-2">
          <Progress 
            value={details.progressPercent} 
            className={`h-2 ${
              details.isCompleted 
                ? '[&>[data-slot=progress-indicator]]:bg-accent' 
                : '[&>[data-slot=progress-indicator]]:bg-warning'
            }`}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center mb-2">
          <div className="p-1.5 rounded-lg bg-secondary/50">
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
              <Coins className="w-3 h-3" />
              <span>Cuota/dia</span>
            </div>
            <span className="text-xs font-bold text-accent">{formatCurrency(details.dailyQuota)}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-secondary/50">
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
              <Calendar className="w-3 h-3" />
              <span>Dias</span>
            </div>
            <span className="text-xs font-bold text-foreground">
              {details.daysPassed}/{debt.totalDays}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-secondary/50">
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
              <Clock className="w-3 h-3" />
              <span>Restan</span>
            </div>
            <span className="text-xs font-bold text-destructive">
              {formatCurrency(details.amountRemaining)}
            </span>
          </div>
        </div>

        {/* Amount row */}
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-medium text-foreground">{formatCurrency(debt.totalAmount)}</span>
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
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-warning" />
            </div>
            <CardTitle className="text-base font-semibold">Cuotas Diarias</CardTitle>
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
          {/* Summary Card */}
          <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-warning" />
              <span className="text-sm text-muted-foreground">Total Cuota Diaria</span>
            </div>
            <span className="text-xl font-bold text-warning">
              +{formatCurrency(dailyQuotaPortion)}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Este monto se suma automaticamente a tu meta diaria
            </p>
          </div>

          {/* Info Message */}
          <div className="p-3 rounded-xl bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Las cuotas diarias son prestamos que se pagan en cuotas fijas cada dia. 
              Registra el monto total y los dias de pago, y la app calculara automaticamente 
              cuanto debes apartar cada dia.
            </p>
          </div>

          {/* Active Debts */}
          {activeDebts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Cuotas Activas
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
                Cuotas Inactivas
              </h4>
              <div className="space-y-2">
                {inactiveDebts.map(renderDebtItem)}
              </div>
            </div>
          )}

          {/* Empty State */}
          {debts.length === 0 && !isAdding && (
            <div className="text-center py-6">
              <Target className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                No tienes cuotas diarias registradas
              </p>
            </div>
          )}

          {/* Add Button */}
          <Button
            variant="outline"
            className="w-full h-12 active:scale-95"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Cuota Diaria
          </Button>
        </CardContent>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAdding} onOpenChange={(open) => {
        if (!open) {
          resetForm()
          setIsAdding(false)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-warning" />
              Nueva Cuota Diaria
            </DialogTitle>
            <DialogDescription>
              Registra un prestamo que se paga en cuotas fijas diarias. La app calculara automaticamente cuanto debes apartar cada dia.
            </DialogDescription>
          </DialogHeader>
          {renderDebtForm(false)}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Cuota Diaria</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que deseas eliminar <span className="font-semibold">{deleteTarget?.name}</span>?
              Esto reducira tu meta diaria.
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
