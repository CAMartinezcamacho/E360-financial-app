'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowUpRight, ArrowDownRight, Trash2, Clock, Banknote, Smartphone, Car, CreditCard, Building, Wallet, Edit2, Check, X, CalendarMinus, Percent } from 'lucide-react'
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

interface TransactionFeedProps {
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

export function TransactionFeed({ transactions, onDelete, onEdit, formatCurrency, accounts = [] }: TransactionFeedProps) {
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editAccountId, setEditAccountId] = useState<string>('none')

  const startEditing = (transaction: Transaction) => {
    setEditingId(transaction.id)
    setEditAmount(transaction.amount.toString())
    setEditTitle(transaction.title)
    setEditAccountId(transaction.accountId || 'none')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditAmount('')
    setEditTitle('')
    setEditAccountId('none')
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
    onEdit(transaction.id, parsedAmount, editTitle.trim(), accountId)
    toast.success('Transaccion actualizada')
    cancelEditing()
  }

  const handleDeleteClick = (transaction: Transaction) => {
    setDeleteTarget(transaction)
  }

  const moveToYesterday = (transaction: Transaction) => {
    if (!onEdit) return
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    // Preserve the original time from the transaction
    const originalTime = new Date(transaction.timestamp)
    yesterday.setHours(originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds())
    
    onEdit(transaction.id, transaction.amount, transaction.title, transaction.accountId, yesterday)
    toast.success('Movido a ayer')
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date))
  }

  const getAccountInfo = (accountId?: string) => {
    if (!accountId) return null
    return accounts.find((a) => a.id === accountId)
  }

  if (transactions.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Actividad de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Sin transacciones hoy</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Toca + Venta o - Gasto para comenzar
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Hoy
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[220px]">
          <div className="divide-y divide-border">
            {transactions.map((transaction) => {
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
                  className="flex items-center gap-2 px-3 py-2 group hover:bg-muted/50 transition-colors"
                >
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 ${
                    transaction.type === 'sale' 
                      ? 'bg-accent/10 text-accent' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {transaction.type === 'sale' ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {transaction.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span>{formatTime(transaction.timestamp)}</span>
                      {account && (
                        <>
                          <span>•</span>
                          <span className="truncate">{account.name}</span>
                        </>
                      )}
                      {transaction.serviceType === 'platform_trip' && transaction.grossAmount && (
                        <>
                          <span>•</span>
                          <span className="text-accent truncate">
                            Bruto: {formatCurrency(transaction.grossAmount)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <span className={`text-xs font-semibold ${
                      transaction.type === 'sale' ? 'text-accent' : 'text-destructive'
                    }`}>
                      {transaction.type === 'sale' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                    
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 active:scale-95"
                        onClick={() => moveToYesterday(transaction)}
                        title="Mover a ayer"
                      >
                        <CalendarMinus className="w-3 h-3" />
                        <span className="sr-only">Mover a ayer</span>
                      </Button>
                    )}
                    
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-muted-foreground hover:text-foreground active:scale-95"
                        onClick={() => startEditing(transaction)}
                      >
                        <Edit2 className="w-3 h-3" />
                        <span className="sr-only">Editar transaccion</span>
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95"
                      onClick={() => handleDeleteClick(transaction)}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="sr-only">Eliminar transaccion</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>

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
    </Card>
  )
}
