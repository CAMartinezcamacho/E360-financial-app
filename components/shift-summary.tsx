'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Car, Clock, Wallet, MapPin, Navigation, TrendingDown, Gauge, Timer } from 'lucide-react'
import type { Account, ShiftSummary } from '@/lib/types'

interface ShiftSummaryModalProps {
  summary: ShiftSummary | null
  accounts: Account[]
  formatCurrency: (amount: number) => string
  gpsKm?: number
  onClose: () => void
}

function formatDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime()
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export function ShiftSummaryModal({ summary, accounts, formatCurrency, gpsKm = 0, onClose }: ShiftSummaryModalProps) {
  if (!summary) return null

  const walletsWithBalance = accounts.filter(
    (a) => (summary.walletBalances[a.id] ?? 0) !== 0
  )

  const netMoney = summary.totalEarned - summary.totalExpenses
  const kmForRate = gpsKm > 0 ? gpsKm : summary.totalKm
  const hoursElapsed = (summary.endTime.getTime() - summary.startTime.getTime()) / (1000 * 60 * 60)
  const perKm = kmForRate > 0 ? netMoney / kmForRate : 0
  const perHour = hoursElapsed > 0 ? netMoney / hoursElapsed : 0

  return (
    <Dialog open={!!summary} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Resumen del turno</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-sm">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(summary.startTime)} – {formatTime(summary.endTime)} · {formatDuration(summary.startTime, summary.endTime)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-xl p-3 text-center">
              <Car className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{summary.tripCount}</p>
              <p className="text-xs text-muted-foreground">viajes</p>
            </div>
            <div className="bg-green-500/10 rounded-xl p-3 text-center">
              <Wallet className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <p className="text-xl font-bold text-green-500">{formatCurrency(summary.totalEarned)}</p>
              <p className="text-xs text-muted-foreground">total ganado</p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-3 text-center">
              <TrendingDown className="w-5 h-5 mx-auto mb-1 text-red-500" />
              <p className="text-xl font-bold text-red-500">{formatCurrency(summary.totalExpenses)}</p>
              <p className="text-xs text-muted-foreground">gastos del turno</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <Wallet className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold text-primary">{formatCurrency(netMoney)}</p>
              <p className="text-xs text-muted-foreground">debes tener</p>
            </div>
          </div>

          {gpsKm > 0 && (
            <div className="bg-blue-500/10 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Kilómetros recorridos (GPS)</span>
              </div>
              <span className="text-lg font-bold text-blue-500">{gpsKm.toLocaleString('es')} km</span>
            </div>
          )}

          {summary.totalKm > 0 && (
            <div className="bg-muted rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Km registrados (manual)</span>
              </div>
              <span className="text-lg font-bold">{summary.totalKm.toLocaleString('es')} km</span>
            </div>
          )}

          {kmForRate > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-xl p-3 text-center">
                <Gauge className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{formatCurrency(perKm)}</p>
                <p className="text-xs text-muted-foreground">por km</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <Timer className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{formatCurrency(perHour)}</p>
                <p className="text-xs text-muted-foreground">por hora</p>
              </div>
            </div>
          )}

          {walletsWithBalance.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <p className="text-xs font-medium text-muted-foreground px-3 pt-2.5 pb-1">
                Saldo por billetera
              </p>
              <div className="divide-y divide-border">
                {walletsWithBalance.map((account) => {
                  const balance = summary.walletBalances[account.id] ?? 0
                  return (
                    <div
                      key={account.id}
                      className="flex justify-between items-center px-3 py-2.5 text-sm"
                    >
                      <span className="text-muted-foreground">{account.name}</span>
                      <span
                        className={`font-semibold ${
                          balance >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <Button className="w-full" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
