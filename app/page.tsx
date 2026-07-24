'use client'

import { useState, useEffect } from 'react'
import { useFinance } from '@/hooks/use-finance'
import { TransactionFeed } from '@/components/transaction-feed'
import { ServiceEntry } from '@/components/service-entry'
import { BottomNav } from '@/components/bottom-nav'
import { SettingsPanel } from '@/components/settings-panel'
import { HistoryPanel } from '@/components/history-panel'
import { AccountBalances } from '@/components/account-balances'
import { DailyChart } from '@/components/daily-chart'
import { HourlyChart } from '@/components/hourly-chart'
import { QuickEntry } from '@/components/quick-entry'
import { MonthlySummary } from '@/components/monthly-summary'
import { ShiftSummaryModal } from '@/components/shift-summary'
import { Skeleton } from '@/components/ui/skeleton'
import { Minus, Play, Square, Zap, Navigation, Pencil, Check, X } from 'lucide-react'
import { Onboarding } from '@/components/onboarding'
import { useNotifications } from '@/hooks/use-notifications'
import { useGpsTracking } from '@/hooks/use-gps-tracking'
import { setSyncKey } from '@/lib/cloud-sync'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { ShiftSummary } from '@/lib/types'

type TabType = 'hoy' | 'historial' | 'cuentas' | 'ajustes'

function ElapsedTime({ startTime }: { startTime: Date }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])
  const ms = Date.now() - new Date(startTime).getTime()
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  return <>{hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`}</>
}

export default function FinanceDashboard() {
  const [entryType, setEntryType] = useState<'sale' | 'expense' | null>(null)
  const [quickEntryOpen, setQuickEntryOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('hoy')
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null)
  const [shiftGpsKm, setShiftGpsKm] = useState(0)
  const [confirmEndShift, setConfirmEndShift] = useState(false)

  const {
    isLoaded,
    syncStatus,
    shiftStartHour,
    needsOnboarding,
    completeOnboarding,
    state,
    addTransaction,
    deleteTransaction,
    editTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    adjustAccountBalance,
    transferBetweenAccounts,
    resetAccountBalance,
    dailyGoal,
    setDailyGoal,
    updateSettings,
    clearAllData,
    formatCurrency,
    todayTransactions,
    todaySales,
    todayExpenses,
    todayBalance,
    monthSales,
    monthExpenses,
    netIncome,
    accountBalances,
    accountBreakdown,
    monthTransactions,
    isShiftActive,
    currentShift,
    startShift,
    endShift,
  } = useFinance()

  useNotifications({
    isShiftActive,
    enabled: state.settings.notificationsEnabled ?? false,
    intervalMinutes: state.settings.notificationInterval ?? 30,
  })

  const { totalKm: gpsKm, status: gpsStatus } = useGpsTracking({ isShiftActive })

  if (needsOnboarding) {
    return (
      <Onboarding
        onComplete={(name, currency, syncKey, restoredState) => {
          setSyncKey(syncKey)
          completeOnboarding(name, currency, restoredState)
        }}
      />
    )
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-lg mx-auto p-3 pb-20 space-y-3 pt-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </main>
      </div>
    )
  }

  const todayTripCount = todayTransactions.filter(
    (t) =>
      t.type === 'sale' &&
      !t.title.startsWith('↗ ') &&
      !t.title.startsWith('↙ ') &&
      !t.title.startsWith('Ajuste:') &&
      !t.title.startsWith('Reinicio de saldo')
  ).length
  const missing = Math.max(0, dailyGoal - todaySales)
  const progressPercent = dailyGoal > 0 ? Math.min(100, (todaySales / dailyGoal) * 100) : 0

  const handleEndShift = () => {
    const summary = endShift()
    if (summary) {
      setShiftSummary(summary)
      setShiftGpsKm(gpsKm)
    }
  }

  const handleConfirmEndShift = () => {
    setConfirmEndShift(false)
    handleEndShift()
  }

  const startEditingGoal = () => {
    setGoalInput(dailyGoal > 0 ? String(dailyGoal) : '')
    setIsEditingGoal(true)
  }

  const saveGoal = () => {
    const parsed = parseFloat(goalInput)
    setDailyGoal(isNaN(parsed) ? 0 : parsed)
    setIsEditingGoal(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-lg mx-auto p-4 pb-24 space-y-4">

        {activeTab === 'hoy' && (
          <>
            {/* Shift button */}
            {isShiftActive && currentShift ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Turno en curso · <ElapsedTime startTime={currentShift.startTime} />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 border-green-500/40 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                    onClick={() => setConfirmEndShift(true)}
                  >
                    <Square className="w-3.5 h-3.5" />
                    Finalizar
                  </Button>
                </div>
                {/* GPS km indicator */}
                <div className="flex items-center gap-1.5 text-xs">
                  <Navigation className={`w-3 h-3 ${gpsStatus === 'tracking' ? 'text-blue-400' : 'text-muted-foreground'}`} />
                  {gpsStatus === 'tracking' && (
                    <span className="text-blue-400 font-medium">{gpsKm.toLocaleString('es')} km recorridos</span>
                  )}
                  {gpsStatus === 'requesting' && (
                    <span className="text-muted-foreground">Activando GPS…</span>
                  )}
                  {gpsStatus === 'denied' && (
                    <span className="text-yellow-500">GPS sin permiso — km no disponibles</span>
                  )}
                  {gpsStatus === 'paused' && (
                    <span className="text-muted-foreground">{gpsKm > 0 ? `${gpsKm} km (GPS pausado)` : 'GPS pausado'}</span>
                  )}
                  {gpsStatus === 'unavailable' && (
                    <span className="text-muted-foreground">GPS no disponible</span>
                  )}
                </div>
              </div>
            ) : (
              <Button
                className="w-full h-11 gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                variant="ghost"
                onClick={startShift}
              >
                <Play className="w-4 h-4" />
                Iniciar turno
              </Button>
            )}

            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              {isEditingGoal ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    autoFocus
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="Meta de hoy"
                    className="h-11 text-lg"
                    onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                  />
                  <Button size="icon" className="w-11 h-11 shrink-0" onClick={saveGoal}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="w-11 h-11 shrink-0"
                    onClick={() => setIsEditingGoal(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button className="w-full text-left" onClick={startEditingGoal}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Meta de hoy</p>
                      <p className="text-3xl font-semibold mt-0.5">{formatCurrency(dailyGoal)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Llevás {formatCurrency(todaySales)} · {progressPercent.toFixed(0)}%
                      </p>
                    </div>
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground mt-1" />
                  </div>
                </button>
              )}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressPercent}%`,
                    background:
                      progressPercent >= 100 ? '#22c55e' : progressPercent >= 60 ? '#eab308' : '#ef4444',
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Viajes</p>
                  <p className="text-base font-semibold">{todayTripCount}</p>
                </div>
                <div className="bg-muted rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Ganado</p>
                  <p className="text-base font-semibold text-green-500">{formatCurrency(todaySales)}</p>
                </div>
                <div className="bg-muted rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Faltan</p>
                  <p className="text-base font-semibold text-red-500">{formatCurrency(missing)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button
                  onClick={() => setQuickEntryOpen(true)}
                  className="bg-green-500 hover:bg-green-600 text-white h-12 text-base font-medium gap-2"
                >
                  <Zap className="w-4 h-4" />
                  + Viaje
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEntryType('expense')}
                  className="h-12 text-base font-medium gap-2"
                >
                  <Minus className="w-4 h-4" />
                  Gasto
                </Button>
              </div>
            </div>

            <TransactionFeed
              transactions={todayTransactions}
              onDelete={deleteTransaction}
              onEdit={editTransaction}
              formatCurrency={formatCurrency}
              accounts={state.accounts}
            />
          </>
        )}

        {activeTab === 'historial' && (
          <>
            <MonthlySummary
              monthSales={monthSales}
              monthExpenses={monthExpenses}
              netIncome={netIncome}
              formatCurrency={formatCurrency}
              monthTransactions={monthTransactions}
            />
            <DailyChart
              transactions={state.transactions}
              formatCurrency={formatCurrency}
            />
            <HourlyChart
              transactions={state.transactions}
              formatCurrency={formatCurrency}
              shiftStartHour={shiftStartHour}
            />
            <HistoryPanel
              transactions={state.transactions}
              onDelete={deleteTransaction}
              onEdit={editTransaction}
              formatCurrency={formatCurrency}
              accounts={state.accounts}
            />
          </>
        )}

        {activeTab === 'cuentas' && (
          <AccountBalances
            accounts={state.accounts}
            balances={accountBalances}
            breakdown={accountBreakdown}
            transactions={state.transactions}
            onAdd={addAccount}
            onUpdate={updateAccount}
            onDelete={deleteAccount}
            onAdjustBalance={adjustAccountBalance}
            onTransfer={transferBetweenAccounts}
            onResetBalance={resetAccountBalance}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'ajustes' && (
          <SettingsPanel
            settings={state.settings}
            onUpdateSettings={updateSettings}
            onClearData={clearAllData}
            transactions={state.transactions}
          />
        )}
      </main>

      {syncStatus !== 'idle' && (
        <div
          className={`fixed top-2 right-3 z-50 text-[10px] px-2 py-0.5 rounded-full font-medium ${
            syncStatus === 'saving'
              ? 'bg-muted text-muted-foreground'
              : syncStatus === 'saved'
              ? 'bg-green-500/20 text-green-700 dark:text-green-400'
              : 'bg-destructive/20 text-destructive'
          }`}
        >
          {syncStatus === 'saving' ? '☁ guardando…' : syncStatus === 'saved' ? '☁ guardado' : '☁ sin sync'}
        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />


      <QuickEntry
        isOpen={quickEntryOpen}
        onClose={() => setQuickEntryOpen(false)}
        onSubmit={(type, amount, title, accountId, km) =>
          addTransaction(type, amount, title, accountId, undefined, undefined, undefined, undefined, undefined, km)
        }
        currencySymbol={state.settings.currencySymbol}
        accounts={state.accounts}
      />

      <ServiceEntry
        isOpen={entryType !== null}
        type={entryType}
        onClose={() => setEntryType(null)}
        onSubmit={addTransaction}
        currencySymbol={state.settings.currencySymbol}
        accounts={state.accounts}
      />

      <ShiftSummaryModal
        summary={shiftSummary}
        accounts={state.accounts}
        formatCurrency={formatCurrency}
        gpsKm={shiftGpsKm}
        onClose={() => { setShiftSummary(null); setShiftGpsKm(0) }}
      />

      <AlertDialog open={confirmEndShift} onOpenChange={setConfirmEndShift}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar turno</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres finalizar el turno? Se mostrará el resumen de lo ganado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEndShift}>
              Finalizar turno
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
