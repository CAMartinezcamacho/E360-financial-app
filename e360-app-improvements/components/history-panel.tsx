'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Banknote,
  Smartphone,
  Car,
  CreditCard,
  Building,
  Wallet,
  Edit2,
  Check,
  X
} from 'lucide-react'
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
import type { Transaction, Account } from '@/lib/types'

interface HistoryPanelProps {
  transactions: Transaction[]
  onDelete: (id: string) => void
  onEdit?: (id: string, amount: number, title: string, accountId?: string, newDate?: Date) => void
  formatCurrency: (amount: number) => string
  accounts?: Account[]
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

export function HistoryPanel({ transactions, onDelete, onEdit, formatCurrency, accounts = [] }: HistoryPanelProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editAccountId, setEditAccountId] = useState<string>('none')
  const [editDate, setEditDate] = useState<string>('')

  const startEditing = (transaction: Transaction) => {
    setEditingId(transaction.id)
    setEditAmount(transaction.amount.toString())
    setEditTitle(transaction.title)
    setEditAccountId(transaction.accountId || 'none')
    const date = new Date(transaction.timestamp)
    setEditDate(date.toISOString().split('T')[0])
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditAmount('')
    setEditTitle('')
    setEditAccountId('none')
    setEditDate('')
  }

  const saveEdit = (transaction: Transaction) => {
    if (!onEdit) return
    
    const parsedAmount = parseFloat(editAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Por favor ingresa un monto valido')
      return
    }
    
    if (!editTitle.trim()) {
      toast.error('Por favor ingresa un titulo')
      return
    }

    const accountId = editAccountId !== 'none' ? editAccountId : undefined
    
    // Parse the new date and preserve the original time
    const originalTime = new Date(transaction.timestamp)
    const newDate = new Date(editDate + 'T12:00:00')
    newDate.setHours(originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds())
    
    onEdit(transaction.id, parsedAmount, editTitle.trim(), accountId, newDate)
    toast.success('Transaccion actualizada')
    cancelEditing()
  }

  const handleDeleteClick = (transaction: Transaction) => {
    setDeleteTarget(transaction)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const getAccountInfo = (accountId?: string) => {
    if (!accountId) return null
    return accounts.find((a) => a.id === accountId)
  }

  const filteredTransactions = useMemo(() => {
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    
    return transactions.filter((t) => {
      const transactionDate = new Date(t.timestamp)
      transactionDate.setHours(0, 0, 0, 0)
      return transactionDate.getTime() === selected.getTime()
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [transactions, selectedDate])

  // Identify internal/adjustment transactions that should NOT count toward totals
  // Fixed: Now detects ANY transfer (↗/↙ prefix) regardless of custom description
  const isInternalTransaction = (title: string) => {
    return title.startsWith('↗ ') ||  // Any outgoing transfer
           title.startsWith('↙ ') ||  // Any incoming transfer
           title.startsWith('Reinicio de saldo') ||
           title.startsWith('Ajuste:')
  }

  const daySales = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'sale' && !isInternalTransaction(t.title))
      .reduce((sum, t) => sum + t.amount, 0)
  }, [filteredTransactions])

  const dayExpenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense' && !isInternalTransaction(t.title))
      .reduce((sum, t) => sum + t.amount, 0)
  }, [filteredTransactions])

  const dayBalance = daySales - dayExpenses

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date))
  }

  const formatDateLong = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    // No permitir fechas futuras
    if (newDate <= new Date()) {
      setSelectedDate(newDate)
    }
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const isToday = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    return today.getTime() === selected.getTime()
  }, [selectedDate])

  const isFuture = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    return selected.getTime() > today.getTime()
  }, [selectedDate])

  // Get min date (3 months ago)
  const minDate = useMemo(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 3)
    return date
  }, [])

  const isPastLimit = useMemo(() => {
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    const min = new Date(minDate)
    min.setHours(0, 0, 0, 0)
    return selected.getTime() <= min.getTime()
  }, [selectedDate, minDate])

  return (
    <div className="space-y-4">
      {/* Date Navigator */}
      <Card className="border-0 shadow-sm bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 active:scale-95"
              onClick={goToPreviousDay}
              disabled={isPastLimit}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <div className="flex-1 text-center">
              <p className="text-lg font-semibold text-foreground capitalize">
                {formatDateLong(selectedDate)}
              </p>
              {!isToday && (
                <Button
                  variant="link"
                  className="text-accent text-sm h-auto p-0 mt-1"
                  onClick={goToToday}
                >
                  Ir a hoy
                </Button>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 active:scale-95"
              onClick={goToNextDay}
              disabled={isToday || isFuture}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Date Picker */}
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                min={minDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(new Date(e.target.value + 'T12:00:00'))
                  }
                }}
                className="bg-transparent text-sm text-foreground outline-none cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Summary */}
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Resumen del Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-accent/10">
              <p className="text-xs text-muted-foreground mb-1">Ventas</p>
              <p className="text-lg font-bold text-accent">{formatCurrency(daySales)}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-destructive/10">
              <p className="text-xs text-muted-foreground mb-1">Gastos</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(dayExpenses)}</p>
            </div>
            <div className={`text-center p-3 rounded-xl ${dayBalance >= 0 ? 'bg-accent/10' : 'bg-destructive/10'}`}>
              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              <p className={`text-lg font-bold ${dayBalance >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {dayBalance >= 0 ? '+' : ''}{formatCurrency(dayBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Movimientos ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Calendar className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Sin movimientos este dia</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {formatDateShort(selectedDate)}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[350px]">
              <div className="divide-y divide-border">
                {filteredTransactions.map((transaction) => {
                  const account = getAccountInfo(transaction.accountId)
                  const AccountIcon = account ? getIconComponent(account.icon) : null
                  const isEditing = editingId === transaction.id

                  if (isEditing) {
                    return (
                      <div
                        key={transaction.id}
                        className="flex flex-col gap-2 px-4 py-3 bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${
                            transaction.type === 'sale' 
                              ? 'bg-accent/10 text-accent' 
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {transaction.type === 'sale' ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                          </div>
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Titulo"
                            className="flex-1 h-8 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2 pl-11">
                          <Input
                            type="number"
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            placeholder="Monto"
                            className="w-24 h-8 text-sm"
                          />
                          <Select value={editAccountId} onValueChange={setEditAccountId}>
                            <SelectTrigger className="flex-1 h-8 text-sm">
                              <SelectValue placeholder="Cuenta" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin cuenta</SelectItem>
                              {accounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 pl-11">
                          <div className="flex items-center gap-2 flex-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <input
                              type="date"
                              value={editDate}
                              max={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="bg-secondary/50 rounded px-2 py-1 text-sm text-foreground outline-none cursor-pointer flex-1"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-accent hover:text-accent hover:bg-accent/10"
                            onClick={() => saveEdit(transaction)}
                          >
                            <Check className="w-4 h-4" />
                            <span className="sr-only">Guardar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-foreground"
                            onClick={cancelEditing}
                          >
                            <X className="w-4 h-4" />
                            <span className="sr-only">Cancelar</span>
                          </Button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/50 transition-colors"
                    >
                      <div className={`flex items-center justify-center w-9 h-9 rounded-full ${
                        transaction.type === 'sale' 
                          ? 'bg-accent/10 text-accent' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {transaction.type === 'sale' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {transaction.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatTime(transaction.timestamp)}</span>
                          {account && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span className={`w-3 h-3 rounded-full flex items-center justify-center ${getColorClass(account.color)}`}>
                                  {AccountIcon && <AccountIcon className="w-2 h-2 text-white" />}
                                </span>
                                {account.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-semibold ${
                          transaction.type === 'sale' ? 'text-accent' : 'text-destructive'
                        }`}>
                          {transaction.type === 'sale' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                        
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-foreground active:scale-95"
                            onClick={() => startEditing(transaction)}
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="sr-only">Editar transaccion</span>
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95"
                          onClick={() => handleDeleteClick(transaction)}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Eliminar transaccion</span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Eliminar {deleteTarget?.type === 'sale' ? 'Venta' : 'Gasto'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que quieres eliminar {deleteTarget?.type === 'sale' ? 'esta venta' : 'este gasto'} de{' '}
              <span className="font-semibold">{deleteTarget && formatCurrency(deleteTarget.amount)}</span>
              {deleteTarget?.title && <> ({deleteTarget.title})</>}? Esta accion no se puede deshacer.
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
    </div>
  )
}
