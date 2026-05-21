'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Plus, Trash2, Edit2, Check, X, Receipt, Calendar, AlertCircle } from 'lucide-react'
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
import type { FixedExpense } from '@/lib/types'
import { toast } from 'sonner'

interface FixedExpensesProps {
  expenses: FixedExpense[]
  totalExpenses: number
  unpaidTotal: number
  onAdd: (name: string, amount: number, dueDay?: number) => void
  onUpdate: (id: string, name: string, amount: number, dueDay?: number) => void
  onDelete: (id: string) => void
  onTogglePaid: (id: string) => void
  formatCurrency: (amount: number) => string
}

function getPaymentStatus(expense: FixedExpense): { status: 'paid' | 'overdue' | 'urgent' | 'upcoming' | 'pending'; daysUntil: number } {
  if (expense.isPaid) return { status: 'paid', daysUntil: 0 }
  
  if (!expense.dueDay) return { status: 'pending', daysUntil: 999 }
  
  const today = new Date()
  const currentDay = today.getDate()
  const daysUntil = expense.dueDay - currentDay
  
  if (daysUntil < 0) return { status: 'overdue', daysUntil }
  if (daysUntil === 0) return { status: 'urgent', daysUntil: 0 }
  if (daysUntil <= 3) return { status: 'urgent', daysUntil }
  if (daysUntil <= 7) return { status: 'upcoming', daysUntil }
  return { status: 'pending', daysUntil }
}

export function FixedExpenses({
  expenses,
  totalExpenses,
  unpaidTotal,
  onAdd,
  onUpdate,
  onDelete,
  onTogglePaid,
  formatCurrency,
}: FixedExpensesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FixedExpense | null>(null)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newDueDay, setNewDueDay] = useState<string>('none')
  const [editName, setEditName] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editDueDay, setEditDueDay] = useState<string>('none')

  const handleAdd = () => {
    if (newName.trim() && parseFloat(newAmount) > 0) {
      onAdd(newName.trim(), parseFloat(newAmount), newDueDay !== 'none' ? parseInt(newDueDay) : undefined)
      setNewName('')
      setNewAmount('')
      setNewDueDay('none')
      setIsAdding(false)
    }
  }

  const handleEdit = (expense: FixedExpense) => {
    setEditingId(expense.id)
    setEditName(expense.name)
    setEditAmount(expense.amount.toString())
    setEditDueDay(expense.dueDay?.toString() || 'none')
  }

  const handleSaveEdit = () => {
    if (editingId && editName.trim() && parseFloat(editAmount) > 0) {
      onUpdate(editingId, editName.trim(), parseFloat(editAmount), editDueDay !== 'none' ? parseInt(editDueDay) : undefined)
      setEditingId(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditAmount('')
    setEditDueDay('none')
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
      toast.success('Gasto eliminado')
    }
  }

  const handleTogglePaid = (expense: FixedExpense) => {
    onTogglePaid(expense.id)
    
    // Show celebration toast when marking as PAID (not when unchecking)
    if (!expense.isPaid) {
      toast.success('Meta Mensual Reducida!', {
        description: `${expense.name} (${formatCurrency(expense.amount)}) marcado como pagado. Tu meta diaria se recalculara automaticamente.`,
        duration: 4000,
      })
    }
  }

  const paidCount = expenses.filter((e) => e.isPaid).length

  return (
    <Card className="border-0 shadow-sm bg-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-xl active:scale-[0.99]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Gastos Fijos Mensuales
                </CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {paidCount}/{expenses.length}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(unpaidTotal)}/mes
                  </span>
                  {unpaidTotal < totalExpenses && (
                    <span className="text-xs text-accent">
                      de {formatCurrency(totalExpenses)} total
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-3">
              Define tu punto de equilibrio mensual. Marca como pagado cuando cubras cada gasto.
            </p>
            
            <div className="divide-y divide-border">
              {expenses.map((expense) => {
                const { status, daysUntil } = getPaymentStatus(expense)
                
                return (
                  <div 
                    key={expense.id} 
                    className={`py-3 flex items-center gap-3 transition-colors ${
                      status === 'overdue' ? 'bg-destructive/10 -mx-4 px-4 rounded-lg' : ''
                    }`}
                  >
                    {editingId === expense.id ? (
                      <>
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Nombre"
                              className="h-10 text-sm"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              placeholder="Monto"
                              className="h-10 text-sm w-24"
                            />
                          </div>
                          <Select value={editDueDay} onValueChange={setEditDueDay}>
                            <SelectTrigger className="h-10 text-sm">
                              <SelectValue placeholder="Dia de vencimiento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin fecha</SelectItem>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  Dia {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 text-accent active:scale-95"
                          onClick={handleSaveEdit}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 text-muted-foreground active:scale-95"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Checkbox
                          checked={expense.isPaid}
                          onCheckedChange={() => handleTogglePaid(expense)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${expense.isPaid ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {expense.name}
                          </p>
                          {expense.dueDay && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Calendar className={`w-3 h-3 ${
                                status === 'overdue' ? 'text-destructive' : 
                                status === 'urgent' ? 'text-warning' : 
                                'text-muted-foreground'
                              }`} />
                              <span className={`text-xs ${
                                status === 'overdue' ? 'text-destructive font-medium' : 
                                status === 'urgent' ? 'text-warning font-medium' : 
                                status === 'paid' ? 'text-accent' :
                                'text-muted-foreground'
                              }`}>
                                {status === 'paid' ? 'Pagado' :
                                 status === 'overdue' ? `Vencido hace ${Math.abs(daysUntil)} dias` :
                                 daysUntil === 0 ? 'Vence hoy!' :
                                 `Vence el dia ${expense.dueDay}`}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className={`text-sm font-medium ${expense.isPaid ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {formatCurrency(expense.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 text-muted-foreground hover:text-foreground active:scale-95"
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 text-muted-foreground hover:text-destructive active:scale-95"
                          onClick={() => setDeleteTarget(expense)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {isAdding ? (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="space-y-2 mb-2">
                  <div className="flex gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nombre del gasto"
                      className="h-12 text-sm"
                      autoFocus
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="Monto"
                      className="h-12 text-sm w-28"
                    />
                  </div>
                  <Select value={newDueDay} onValueChange={setNewDueDay}>
                    <SelectTrigger className="h-12 text-sm">
                      <SelectValue placeholder="Dia de vencimiento (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin fecha</SelectItem>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          Dia {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-12 active:scale-95"
                    onClick={handleAdd}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-12 active:scale-95"
                    onClick={() => {
                      setIsAdding(false)
                      setNewName('')
                      setNewAmount('')
                      setNewDueDay('none')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full mt-3 h-12 active:scale-95"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Gasto Fijo
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Gasto Fijo</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que quieres eliminar{' '}
              <span className="font-semibold">{deleteTarget?.name}</span> (
              {deleteTarget && formatCurrency(deleteTarget.amount)}/mes)? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="active:scale-95">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95"
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
