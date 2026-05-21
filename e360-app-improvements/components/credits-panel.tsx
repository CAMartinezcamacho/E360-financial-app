'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  ArrowUpFromLine,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
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

type DialogMode = 'add' | 'edit' | 'collect' | 'pay' | null
type DeleteTarget = { type: 'credit' | 'liability'; id: string; name: string } | null

export function CreditsPanel({
  credits,
  liabilities,
  accounts,
  totalCredits,
  totalLiabilities,
  formatCurrency,
  onAddCredit,
  onUpdateCredit,
  onDeleteCredit,
  onCollectCredit,
  onAddLiability,
  onUpdateLiability,
  onDeleteLiability,
  onPayLiability,
}: CreditsPanelProps) {
  const [activeTab, setActiveTab] = useState<'credits' | 'liabilities'>('credits')
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [dialogType, setDialogType] = useState<'credit' | 'liability'>('credit')
  const [editingItem, setEditingItem] = useState<Credit | Liability | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)

  // Form state
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [addAsTransaction, setAddAsTransaction] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<string>('none')

  const resetForm = () => {
    setName('')
    setAmount('')
    setDescription('')
    setDueDay('')
    setPaymentAmount('')
    setAddAsTransaction(true)
    setSelectedAccount('none')
    setEditingItem(null)
  }

  const openAddDialog = (type: 'credit' | 'liability') => {
    resetForm()
    setDialogType(type)
    setDialogMode('add')
  }

  const openEditDialog = (item: Credit | Liability, type: 'credit' | 'liability') => {
    setEditingItem(item)
    setName(item.name)
    setAmount(item.amount.toString())
    setDescription(item.description || '')
    if (type === 'liability' && 'dueDay' in item && item.dueDay) {
      setDueDay(item.dueDay.toString())
    }
    setDialogType(type)
    setDialogMode('edit')
  }

  const openCollectDialog = (credit: Credit) => {
    setEditingItem(credit)
    setPaymentAmount(credit.amount.toString())
    setSelectedAccount('none')
    setAddAsTransaction(true)
    setDialogMode('collect')
  }

  const openPayDialog = (liability: Liability) => {
    setEditingItem(liability)
    setPaymentAmount(liability.amount.toString())
    setSelectedAccount('none')
    setAddAsTransaction(true)
    setDialogMode('pay')
  }

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount)
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Por favor ingresa un nombre y monto validos')
      return
    }

    if (dialogMode === 'add') {
      if (dialogType === 'credit') {
        onAddCredit(name, parsedAmount, description || undefined)
        toast.success('Credito agregado correctamente')
      } else {
        const parsedDueDay = dueDay ? parseInt(dueDay) : undefined
        onAddLiability(name, parsedAmount, parsedDueDay, description || undefined)
        toast.success('Deuda agregada correctamente')
      }
    } else if (dialogMode === 'edit' && editingItem) {
      if (dialogType === 'credit') {
        onUpdateCredit(editingItem.id, name, parsedAmount, description || undefined)
        toast.success('Credito actualizado')
      } else {
        const parsedDueDay = dueDay ? parseInt(dueDay) : undefined
        onUpdateLiability(editingItem.id, name, parsedAmount, parsedDueDay, description || undefined)
        toast.success('Deuda actualizada')
      }
    }

    setDialogMode(null)
    resetForm()
  }

  const handleCollect = () => {
    if (!editingItem) return
    const parsedAmount = parseFloat(paymentAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Por favor ingresa un monto valido')
      return
    }

    const accountId = selectedAccount !== 'none' ? selectedAccount : undefined
    onCollectCredit(editingItem.id, parsedAmount, addAsTransaction, accountId)
    
    if (parsedAmount >= (editingItem as Credit).amount) {
      toast.success('Credito cobrado completamente')
    } else {
      toast.success('Abono registrado correctamente')
    }

    setDialogMode(null)
    resetForm()
  }

  const handlePay = () => {
    if (!editingItem) return
    const parsedAmount = parseFloat(paymentAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Por favor ingresa un monto valido')
      return
    }

    const accountId = selectedAccount !== 'none' ? selectedAccount : undefined
    onPayLiability(editingItem.id, parsedAmount, addAsTransaction, accountId)
    
    if (parsedAmount >= (editingItem as Liability).amount) {
      toast.success('Meta Mensual Reducida!', {
        description: 'Deuda pagada completamente. Tu meta diaria se recalculara automaticamente.',
        duration: 4000,
      })
    } else {
      toast.success('Abono registrado correctamente', {
        description: 'La deuda restante sigue contando hacia tu meta mensual.',
      })
    }

    setDialogMode(null)
    resetForm()
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    if (deleteTarget.type === 'credit') {
      onDeleteCredit(deleteTarget.id)
      toast.success('Credito eliminado')
    } else {
      onDeleteLiability(deleteTarget.id)
      toast.success('Deuda eliminada')
    }

    setDeleteTarget(null)
  }

  const getStatusBadge = (status: string, type: 'credit' | 'liability') => {
    if (type === 'credit') {
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
    } else {
      switch (status) {
        case 'paid':
          return (
            <span className="flex items-center gap-1 text-xs text-accent">
              <CheckCircle2 className="w-3 h-3" /> Pagado
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
            <span className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="w-3 h-3" /> Pendiente
            </span>
          )
      }
    }
  }

  const netBalance = totalCredits - totalLiabilities

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="border-0 shadow-sm bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Me Deben</p>
              <p className="text-lg font-bold text-accent">{formatCurrency(totalCredits)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Debo</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(totalLiabilities)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              <p className={`text-lg font-bold ${netBalance >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card className="border-0 shadow-sm bg-card">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'credits' | 'liabilities')}>
          <CardHeader className="pb-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credits" className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4" />
                Me Deben
              </TabsTrigger>
              <TabsTrigger value="liabilities" className="flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4" />
                Debo
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="p-0">
            <TabsContent value="credits" className="m-0">
              <div className="px-4 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openAddDialog('credit')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Credito
                </Button>
              </div>

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
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent/10 text-accent">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {credit.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(credit.status, 'credit')}
                            {credit.description && (
                              <span className="text-xs text-muted-foreground truncate">
                                {credit.description}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-accent">
                            {formatCurrency(credit.amount)}
                          </span>
                          
                          {credit.status !== 'collected' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-accent hover:text-accent hover:bg-accent/10"
                              onClick={() => openCollectDialog(credit)}
                            >
                              <ArrowDownToLine className="w-4 h-4" />
                              <span className="sr-only">Cobrar</span>
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(credit, 'credit')}
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget({ type: 'credit', id: credit.id, name: credit.name })}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="liabilities" className="m-0">
              <div className="px-4 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openAddDialog('liability')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Deuda
                </Button>
              </div>

              {liabilities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <TrendingDown className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Sin deudas pendientes</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Registra tus deudas para no olvidarlas
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[300px]">
                  <div className="divide-y divide-border">
                    {liabilities.map((liability) => (
                      <div key={liability.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-destructive/10 text-destructive">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {liability.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(liability.status, 'liability')}
                            {liability.dueDay && (
                              <span className="text-xs text-muted-foreground">
                                Vence dia {liability.dueDay}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-destructive">
                            {formatCurrency(liability.amount)}
                          </span>
                          
                          {liability.status !== 'paid' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => openPayDialog(liability)}
                            >
                              <ArrowUpFromLine className="w-4 h-4" />
                              <span className="sr-only">Pagar</span>
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(liability, 'liability')}
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget({ type: 'liability', id: liability.id, name: liability.name })}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogMode === 'add' || dialogMode === 'edit'} onOpenChange={() => { setDialogMode(null); resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' 
                ? (dialogType === 'credit' ? 'Nuevo Credito' : 'Nueva Deuda')
                : (dialogType === 'credit' ? 'Editar Credito' : 'Editar Deuda')
              }
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'credit' 
                ? 'Registra dinero que te deben' 
                : 'Registra dinero que debes'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {dialogType === 'credit' ? 'Quien te debe' : 'A quien le debes'}
              </Label>
              <Input
                id="name"
                placeholder={dialogType === 'credit' ? 'Ej: Juan Garcia' : 'Ej: Banco XYZ'}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {dialogType === 'liability' && (
              <div className="space-y-2">
                <Label htmlFor="dueDay">Dia de vencimiento (opcional)</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="1-31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion (opcional)</Label>
              <Input
                id="description"
                placeholder="Nota o detalle..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogMode(null); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {dialogMode === 'add' ? 'Agregar' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collect Credit Dialog */}
      <Dialog open={dialogMode === 'collect'} onOpenChange={() => { setDialogMode(null); resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cobrar Credito</DialogTitle>
            <DialogDescription>
              Cobrar a {editingItem?.name} - Pendiente: {editingItem && formatCurrency(editingItem.amount)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Monto a cobrar</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Cuenta destino (opcional)</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cuenta</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="addAsSale"
                checked={addAsTransaction}
                onChange={(e) => setAddAsTransaction(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="addAsSale" className="text-sm cursor-pointer">
                Registrar como venta
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogMode(null); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleCollect} className="bg-accent hover:bg-accent/90">
              Cobrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Liability Dialog */}
      <Dialog open={dialogMode === 'pay'} onOpenChange={() => { setDialogMode(null); resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar Deuda</DialogTitle>
            <DialogDescription>
              Pagar a {editingItem?.name} - Pendiente: {editingItem && formatCurrency(editingItem.amount)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payAmount">Monto a pagar</Label>
              <Input
                id="payAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payAccount">Cuenta origen (opcional)</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cuenta</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="addAsExpense"
                checked={addAsTransaction}
                onChange={(e) => setAddAsTransaction(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="addAsExpense" className="text-sm cursor-pointer">
                Registrar como gasto
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogMode(null); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handlePay} variant="destructive">
              Pagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Eliminar {deleteTarget?.type === 'credit' ? 'Credito' : 'Deuda'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que quieres eliminar {deleteTarget?.type === 'credit' ? 'el credito de' : 'la deuda con'}{' '}
              <span className="font-semibold">{deleteTarget?.name}</span>? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
