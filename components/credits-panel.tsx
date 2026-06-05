'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  ArrowDownToLine,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Credit, Liability, Account } from '@/lib/types'

interface CreditsPanelProps {
  credits: Credit[]
  liabilities: Liability[]
  accounts: Account[]
  totalCredits: number
  totalLiabilities: number
  formatCurrency: (amount: number) => string
  onAddCredit: (name: string, amount: number, description?: string) => void
  onUpdateCredit: (id: string, name: string, amount: number, description?: string) => void
  onDeleteCredit: (id: string) => void
  onCollectCredit: (id: string, amount: number, addAsSale: boolean, accountId?: string) => void
  onAddLiability: (name: string, amount: number, dueDay?: number, description?: string) => void
  onUpdateLiability: (id: string, name: string, amount: number, dueDay?: number, description?: string) => void
  onDeleteLiability: (id: string) => void
  onPayLiability: (id: string, amount: number, addAsExpense: boolean, accountId?: string) => void
}

type DialogMode = 'add' | 'edit' | 'collect' | null
type DeleteTarget = { id: string; name: string } | null

export function CreditsPanel({
  credits,
  accounts,
  totalCredits,
  formatCurrency,
  onAddCredit,
  onUpdateCredit,
  onDeleteCredit,
  onCollectCredit,
}: CreditsPanelProps) {
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [editingItem, setEditingItem] = useState<Credit | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [addAsTransaction, setAddAsTransaction] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<string>('none')

  const resetForm = () => {
    setName('')
    setAmount('')
    setDescription('')
    setPaymentAmount('')
    setAddAsTransaction(true)
    setSelectedAccount('none')
    setEditingItem(null)
  }

  const openAddDialog = () => {
    resetForm()
    setDialogMode('add')
  }

  const openEditDialog = (item: Credit) => {
    setEditingItem(item)
    setName(item.name)
    setAmount(item.amount.toString())
    setDescription(item.description || '')
    setDialogMode('edit')
  }

  const openCollectDialog = (credit: Credit) => {
    setEditingItem(credit)
    setPaymentAmount(credit.amount.toString())
    setSelectedAccount('none')
    setAddAsTransaction(true)
    setDialogMode('collect')
  }

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount)
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Por favor ingresa un nombre y monto validos')
      return
    }
    if (dialogMode === 'add') {
      onAddCredit(name, parsedAmount, description || undefined)
      toast.success('Credito agregado correctamente')
    } else if (dialogMode === 'edit' && editingItem) {
      onUpdateCredit(editingItem.id, name, parsedAmount, description || undefined)
      toast.success('Credito actualizado')
    }
    setDialogMode(null)
    resetForm()
  }

  const handleCollect = () => {
    if (!editingItem) return
    const parsed = parseFloat(paymentAmount)
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Por favor ingresa un monto valido')
      return
    }
    const accountId = selectedAccount !== 'none' ? selectedAccount : undefined
    onCollectCredit(editingItem.id, parsed, addAsTransaction, accountId)
    if (parsed >= editingItem.amount) {
      toast.success('Credito cobrado completamente')
    } else {
      toast.success('Abono registrado correctamente')
    }
    setDialogMode(null)
    resetForm()
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    onDeleteCredit(deleteTarget.id)
    toast.success('Credito eliminado')
    setDeleteTarget(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'collected':
        return (
          <span className="flex items-center gap-1 text-xs text-accent">
            <CheckCircle2 className="w-3 h-3" /> Cobrado
          </span>
        )
      case 'partial':
        return (
          <span className="flex items-center gap-1 text-xs text-amber-500">
            <Clock className="w-3 h-3" /> Parcial
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Me Deben
              {totalCredits > 0 && (
                <span className="text-accent font-bold">{formatCurrency(totalCredits)}</span>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 pb-2">
          {credits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <TrendingUp className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Sin creditos pendientes</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Registra cuando alguien te deba dinero
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="divide-y divide-border">
                {credits.map((credit) => (
                  <div key={credit.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent/10 text-accent flex-shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{credit.name}</p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(credit.status)}
                        {credit.description && (
                          <span className="text-xs text-muted-foreground truncate">{credit.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-accent">{formatCurrency(credit.amount)}</span>
                      {credit.status !== 'collected' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-accent hover:text-accent hover:bg-accent/10"
                          onClick={() => openCollectDialog(credit)}
                        >
                          <ArrowDownToLine className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(credit)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget({ id: credit.id, name: credit.name })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogMode === 'add' || dialogMode === 'edit'} onOpenChange={() => { setDialogMode(null); resetForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === 'add' ? 'Nuevo Credito' : 'Editar Credito'}</DialogTitle>
            <DialogDescription>Registra dinero que te deben</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Quien te debe</Label>
              <Input id="name" placeholder="Ej: Juan Garcia" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input id="amount" type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripcion (opcional)</Label>
              <Input id="description" placeholder="Nota o detalle..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogMode(null); resetForm() }}>Cancelar</Button>
            <Button onClick={handleSubmit}>{dialogMode === 'add' ? 'Agregar' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collect Dialog */}
      <Dialog open={dialogMode === 'collect'} onOpenChange={() => { setDialogMode(null); resetForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cobrar Credito</DialogTitle>
            <DialogDescription>
              Cobrar a {editingItem?.name} — Pendiente: {editingItem && formatCurrency(editingItem.amount)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Monto a cobrar</Label>
              <Input id="paymentAmount" type="number" step="0.01" placeholder="0.00" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account">Cuenta destino (opcional)</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cuenta" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cuenta</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="addAsSale" checked={addAsTransaction} onChange={(e) => setAddAsTransaction(e.target.checked)} className="rounded" />
              <Label htmlFor="addAsSale" className="text-sm cursor-pointer">Registrar como venta</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogMode(null); resetForm() }}>Cancelar</Button>
            <Button onClick={handleCollect} className="bg-accent hover:bg-accent/90">Cobrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Credito</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que quieres eliminar el credito de{' '}
              <span className="font-semibold">{deleteTarget?.name}</span>? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
