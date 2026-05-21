'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  ChevronDown, 
  Plus, 
  Trash2, 
  Wallet, 
  Banknote, 
  Smartphone, 
  Car, 
  CreditCard, 
  Building, 
  Check, 
  X,
  Edit2,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ArrowRightLeft,
  RotateCcw,
  Pencil
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Account, Transaction } from '@/lib/types'

interface AccountBalancesProps {
  accounts: Account[]
  balances: Record<string, number>
  breakdown: Record<string, { income: number; expenses: number }>
  transactions: Transaction[]
  onAdd: (name: string, icon: string, color: string) => void
  onUpdate: (id: string, name: string, icon: string, color: string) => void
  onDelete: (id: string) => void
  onAdjustBalance: (accountId: string, newBalance: number, reason?: string) => void
  onTransfer: (fromAccountId: string, toAccountId: string, amount: number, description?: string) => void
  onResetBalance: (accountId: string) => void
  formatCurrency: (amount: number) => string
}

const iconOptions = [
  { value: 'banknote', label: 'Efectivo', Icon: Banknote },
  { value: 'smartphone', label: 'App Movil', Icon: Smartphone },
  { value: 'car', label: 'Vehiculo', Icon: Car },
  { value: 'credit-card', label: 'Tarjeta', Icon: CreditCard },
  { value: 'building', label: 'Banco', Icon: Building },
  { value: 'wallet', label: 'Billetera', Icon: Wallet },
]

const colorOptions = [
  { value: 'emerald', label: 'Verde', class: 'bg-emerald-500' },
  { value: 'purple', label: 'Morado', class: 'bg-purple-500' },
  { value: 'orange', label: 'Naranja', class: 'bg-orange-500' },
  { value: 'zinc', label: 'Gris', class: 'bg-zinc-500' },
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'pink', label: 'Rosa', class: 'bg-pink-500' },
  { value: 'red', label: 'Rojo', class: 'bg-red-500' },
  { value: 'yellow', label: 'Amarillo', class: 'bg-yellow-500' },
]

function getIconComponent(iconName: string) {
  const iconOption = iconOptions.find((o) => o.value === iconName)
  return iconOption?.Icon || Wallet
}

function getColorClass(color: string) {
  const colorOption = colorOptions.find((c) => c.value === color)
  return colorOption?.class || 'bg-zinc-500'
}

export function AccountBalances({
  accounts,
  balances,
  breakdown,
  transactions,
  onAdd,
  onUpdate,
  onDelete,
  onAdjustBalance,
  onTransfer,
  onResetBalance,
  formatCurrency,
}: AccountBalancesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null)
  const [selectedAccountForDetails, setSelectedAccountForDetails] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('wallet')
  const [newColor, setNewColor] = useState('emerald')
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('wallet')
  const [editColor, setEditColor] = useState('emerald')
  
  // Balance editing state
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null)
  const [newBalanceAmount, setNewBalanceAmount] = useState('')
  const [balanceReason, setBalanceReason] = useState('')
  
  // Transfer state
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [transferFrom, setTransferFrom] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferDescription, setTransferDescription] = useState('')
  
  // Reset confirmation
  const [resetTarget, setResetTarget] = useState<Account | null>(null)

  const totalBalance = Object.values(balances).reduce((sum, b) => sum + b, 0)

  // Get transactions for selected account
  const getAccountTransactions = (accountId: string) => {
    return transactions
      .filter((t) => t.accountId === accountId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim(), newIcon, newColor)
      setNewName('')
      setNewIcon('wallet')
      setNewColor('emerald')
      setIsAdding(false)
    }
  }

  const handleEdit = (account: Account) => {
    setEditingId(account.id)
    setEditName(account.name || '')
    setEditIcon(account.icon || 'wallet')
    setEditColor(account.color || 'emerald')
  }

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      onUpdate(editingId, editName.trim(), editIcon, editColor)
      setEditingId(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditIcon('wallet')
    setEditColor('emerald')
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  // Balance editing handlers
  const handleStartEditBalance = (account: Account) => {
    setEditingBalanceId(account.id)
    setNewBalanceAmount(String(balances[account.id] || 0))
    setBalanceReason('')
  }

  const handleSaveBalance = () => {
    if (editingBalanceId) {
      const amount = parseFloat(newBalanceAmount) || 0
      onAdjustBalance(editingBalanceId, amount, balanceReason || undefined)
      setEditingBalanceId(null)
      setNewBalanceAmount('')
      setBalanceReason('')
    }
  }

  const handleCancelEditBalance = () => {
    setEditingBalanceId(null)
    setNewBalanceAmount('')
    setBalanceReason('')
  }

  // Transfer handlers
  const handleOpenTransfer = (fromAccountId?: string) => {
    setIsTransferOpen(true)
    setTransferFrom(fromAccountId || '')
    setTransferTo('')
    setTransferAmount('')
    setTransferDescription('')
  }

  const handleConfirmTransfer = () => {
    const amount = parseFloat(transferAmount)
    if (transferFrom && transferTo && amount > 0 && transferFrom !== transferTo) {
      onTransfer(transferFrom, transferTo, amount, transferDescription || undefined)
      setIsTransferOpen(false)
      setTransferFrom('')
      setTransferTo('')
      setTransferAmount('')
      setTransferDescription('')
    }
  }

  // Reset handlers
  const handleConfirmReset = () => {
    if (resetTarget) {
      onResetBalance(resetTarget.id)
      setResetTarget(null)
    }
  }

  return (
    <Card className="border-0 shadow-sm bg-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-xl active:scale-[0.99]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Saldos por Cuenta
                </CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${totalBalance >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {formatCurrency(totalBalance)}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-3">
              Controla cuanto dinero tienes en cada billetera o cuenta.
            </p>

            {/* Account Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {accounts.map((account) => {
                const Icon = getIconComponent(account.icon)
                const balance = balances[account.id] || 0
                
                if (editingId === account.id) {
                  return (
                    <div key={account.id} className="col-span-2 p-3 rounded-xl bg-secondary/50 border border-border space-y-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nombre"
                        className="h-10 text-sm"
                      />
                      <div className="flex gap-2">
                        <Select value={editIcon} onValueChange={setEditIcon}>
                          <SelectTrigger className="h-10 flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {iconOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <opt.Icon className="w-4 h-4" />
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={editColor} onValueChange={setEditColor}>
                          <SelectTrigger className="h-10 flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {colorOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <span className={`w-3 h-3 rounded-full ${opt.class}`} />
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 h-10" onClick={handleSaveEdit}>
                          <Check className="w-4 h-4 mr-1" />
                          Guardar
                        </Button>
                        <Button variant="outline" size="sm" className="h-10" onClick={handleCancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                }

                const accountData = breakdown[account.id] || { income: 0, expenses: 0 }
                const isExpanded = expandedAccount === account.id

                return (
                  <div 
                    key={account.id} 
                    className={`p-3 rounded-xl bg-secondary/50 border border-border transition-all ${isExpanded ? 'col-span-2' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${getColorClass(account.color)}`}
                        onClick={() => setExpandedAccount(isExpanded ? null : account.id)}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setExpandedAccount(isExpanded ? null : account.id)}
                        >
                          <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleEdit(account)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(account)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{account.name}</p>
                    <p className={`text-lg font-bold ${balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                      {formatCurrency(balance)}
                    </p>
                    
                    {/* Breakdown expanded section */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                              <TrendingUp className="w-3 h-3 text-accent" />
                            </div>
                            <span className="text-xs text-muted-foreground">Ingresos</span>
                          </div>
                          <span className="text-sm font-semibold text-accent">
                            +{formatCurrency(accountData.income)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                              <TrendingDown className="w-3 h-3 text-destructive" />
                            </div>
                            <span className="text-xs text-muted-foreground">Egresos</span>
                          </div>
                          <span className="text-sm font-semibold text-destructive">
                            -{formatCurrency(accountData.expenses)}
                          </span>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-xs flex-col gap-1 py-2"
                            onClick={() => handleStartEditBalance(account)}
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-xs flex-col gap-1 py-2"
                            onClick={() => handleOpenTransfer(account.id)}
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            Transferir
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-xs flex-col gap-1 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950"
                            onClick={() => setResetTarget(account)}
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reiniciar
                          </Button>
                        </div>
                        
                        <Button
                          variant="outline"
                          className="w-full h-9 text-xs"
                          onClick={() => setSelectedAccountForDetails(account.id)}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {isAdding ? (
              <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre de la cuenta"
                  className="h-12"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Select value={newIcon} onValueChange={setNewIcon}>
                    <SelectTrigger className="h-12 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <opt.Icon className="w-4 h-4" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newColor} onValueChange={setNewColor}>
                    <SelectTrigger className="h-12 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${opt.class}`} />
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 h-12" onClick={handleAdd}>
                    <Check className="w-4 h-4 mr-1" />
                    Agregar Cuenta
                  </Button>
                  <Button variant="outline" className="h-12" onClick={() => setIsAdding(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.length >= 2 && (
                  <Button
                    variant="outline"
                    className="w-full h-12 active:scale-95 border-dashed"
                    onClick={() => handleOpenTransfer()}
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Transferir entre Cuentas
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full h-12 active:scale-95"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Cuenta
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Cuenta</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que quieres eliminar la cuenta{' '}
              <span className="font-semibold">{deleteTarget?.name}</span>? 
              Las transacciones asociadas no se eliminaran.
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

      {/* Transaction Details Modal */}
      {selectedAccountForDetails && (
        <Dialog open={!!selectedAccountForDetails} onOpenChange={(open) => !open && setSelectedAccountForDetails(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => {
                  const account = accounts.find((a) => a.id === selectedAccountForDetails)
                  const Icon = account ? getIconComponent(account.icon) : Wallet
                  return (
                    <>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${account ? getColorClass(account.color) : 'bg-zinc-500'}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span>{accounts.find((a) => a.id === selectedAccountForDetails)?.name}</span>
                    </>
                  )
                })()}
              </DialogTitle>
              <DialogDescription>
                Desglose de transacciones
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-96 pr-4">
              {(() => {
                const accountTransactions = getAccountTransactions(selectedAccountForDetails)
                if (accountTransactions.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <div className="text-muted-foreground text-sm">
                        <p className="font-medium mb-1">Sin transacciones</p>
                        <p className="text-xs">Agrega tu primera transacción a esta cuenta</p>
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="space-y-2">
                    {accountTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{transaction.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.timestamp).toLocaleDateString('es-MX', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className={`text-sm font-bold ${transaction.type === 'sale' ? 'text-accent' : 'text-destructive'}`}>
                          {transaction.type === 'sale' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Balance Dialog */}
      <Dialog open={!!editingBalanceId} onOpenChange={(open) => !open && handleCancelEditBalance()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Editar Saldo
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const account = accounts.find((a) => a.id === editingBalanceId)
                return account ? `Ajustar saldo de ${account.name}` : ''
              })()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nuevo saldo</label>
              <Input
                type="number"
                value={newBalanceAmount}
                onChange={(e) => setNewBalanceAmount(e.target.value)}
                placeholder="0"
                className="h-12 text-lg"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Motivo (opcional)</label>
              <Input
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
                placeholder="Ej: Consignación, Retiro ATM..."
                className="h-12"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleCancelEditBalance}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSaveBalance}>
              <Check className="w-4 h-4 mr-1" />
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Transferir Fondos
            </DialogTitle>
            <DialogDescription>
              Mover dinero entre cuentas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Desde</label>
              <Select value={transferFrom} onValueChange={setTransferFrom}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Seleccionar cuenta origen" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => {
                    const Icon = getIconComponent(account.icon)
                    return (
                      <SelectItem key={account.id} value={account.id} disabled={account.id === transferTo}>
                        <span className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center ${getColorClass(account.color)}`}>
                            <Icon className="w-3 h-3 text-white" />
                          </span>
                          {account.name} ({formatCurrency(balances[account.id] || 0)})
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Hacia</label>
              <Select value={transferTo} onValueChange={setTransferTo}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Seleccionar cuenta destino" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => {
                    const Icon = getIconComponent(account.icon)
                    return (
                      <SelectItem key={account.id} value={account.id} disabled={account.id === transferFrom}>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Monto</label>
              <Input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0"
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Descripcion (opcional)</label>
              <Input
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                placeholder="Ej: Pago de servicios..."
                className="h-12"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsTransferOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleConfirmTransfer}
              disabled={!transferFrom || !transferTo || !transferAmount || transferFrom === transferTo}
            >
              <ArrowRightLeft className="w-4 h-4 mr-1" />
              Transferir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation */}
      <AlertDialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reiniciar Saldo
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                El saldo actual de <span className="font-semibold">{resetTarget?.name}</span> es{' '}
                <span className="font-semibold">{resetTarget && formatCurrency(balances[resetTarget.id] || 0)}</span>.
              </p>
              <p>
                Esta accion pondra el saldo en <span className="font-semibold">$0</span>. 
                Usa esto cuando hayas recibido una consignacion externa y quieras empezar de cero.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={handleConfirmReset}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reiniciar a $0
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
