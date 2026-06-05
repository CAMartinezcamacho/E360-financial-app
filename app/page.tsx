'use client'

import { useState, useEffect } from 'react'
import { useFinance } from '@/hooks/use-finance'
import { TransactionFeed } from '@/components/transaction-feed'
import { FixedExpenses } from '@/components/fixed-expenses'
import { ServiceEntry } from '@/components/service-entry'
import { BottomNav } from '@/components/bottom-nav'
import { SettingsPanel } from '@/components/settings-panel'
import { HistoryPanel } from '@/components/history-panel'
import { UpcomingPayments } from '@/components/upcoming-payments'
import { AccountBalances } from '@/components/account-balances'
import { CreditsPanel } from '@/components/credits-panel'
import { DailyQuotaDebts } from '@/components/daily-quota-debts'
import { DailyChart } from '@/components/daily-chart'
import { HourlyChart } from '@/components/hourly-chart'
import { QuickEntry } from '@/components/quick-entry'
import { MonthlySummary } from '@/components/monthly-summary'
import { DebtPlans } from '@/components/debt-plans'
import { ShiftSummaryModal } from '@/components/shift-summary'
import { Skeleton } from '@/components/ui/skeleton'
import { Minus, ChevronDown, ChevronUp, Info, Play, Square, Zap } from 'lucide-react'
import { Onboarding } from '@/components/onboarding'
import { setSyncKey } from '@/lib/cloud-sync'
import { Button } from '@/components/ui/button'
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

type TabType = 'hoy' | 'historial' | 'deudas' | 'ajustes'

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
  const [entryType, setEntryType] = useState<'expense' | null>(null)
  const [quickEntryOpen, setQuickEntryOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('hoy')
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null)
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
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    toggleExpensePaid,
    addAccount,
    updateAccount,
    deleteAccount,
    adjustAccountBalance,
    transferBetweenAccounts,
    resetAccountBalance,
    addCredit,
    updateCredit,
    deleteCredit,
    collectCredit,
    addLiability,
    updateLiability,
    deleteLiability,
    payLiability,
    addDailyQuotaDebt,
    updateDailyQuotaDebt,
    deleteDailyQuotaDebt,
    toggleDailyQuotaDebtActive,
    getDailyQuotaDetails,
    updateSettings,
    clearAllData,
    formatCurrency,
    totalFixedExpenses,
    unpaidFixedExpenses,
    todayTransactions,
    todaySales,
    todayExpenses,
    todayBalance,
    monthSales,
    monthExpenses,
    netIncome,
    coveragePercent,
    shortfall,
    dailyTarget,
    accountBalances,
    accountBreakdown,
    upcomingPayments,
    isTodayRestDay,
    getRemainingWorkingDays,
    monthTransactions,
    totalCredits,
    totalLiabilities,
    activeCredits,
    activeLiabilities,
    calculateDailyDebtPortion,
    baseShortfallDaily,
    totalMonthlyRecurringDebts,
    addDebtPlan,
    updateDebtPlan,
    deleteDebtPlan,
    toggleDebtPlanActive,
    payDebtPlan,
    calculateDebtPlanDailyPortion,
    debtPlans,
    calculateDailyQuotaPortion,
    activeDailyQuotaDebts,
    isShiftActive,
    currentShift,
    startShift,
    endShift,
  } = useFinance()

  if (needsOnboarding) {
    return (
      <Onboarding
        onComplete={(name, currency, syncKey, restoredState) => {
          setSyncKey(syncKey)
          completeOnboarding(name, currency, [0], restoredState)
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
      !t.title.startsWith('Cobro:') &&
      !t.title.startsWith('Ajuste:') &&
      !t.title.startsWith('Reinicio de saldo')
  ).length
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const breakdownTodayStart = new Date(); breakdownTodayStart.setHours(0, 0, 0, 0)
  const missing = Math.max(0, dailyTarget - todaySales)
  const progressPercent = dailyTarget > 0 ? Math.min(100, (todaySales / dailyTarget) * 100) : 0

  const handleEndShift = () => {
    const summary = endShift()
    if (summary) setShiftSummary(summary)
  }

  const handleConfirmEndShift = () => {
    setConfirmEndShift(false)
    handleEndShift()
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-lg mx-auto p-4 pb-24 space-y-4">

        {activeTab === 'hoy' && (
          <>
            {/* Shift button */}
            {isShiftActive && currentShift ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2.5">
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
              <button className="w-full text-left" onClick={() => setShowBreakdown((v) => !v)}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {isTodayRestDay
                        ? 'Día de descanso'
                        : `Meta diaria · ${getRemainingWorkingDays} día${getRemainingWorkingDays !== 1 ? 's' : ''} restante${getRemainingWorkingDays !== 1 ? 's' : ''}`}
                    </p>
                    <p className="text-3xl font-semibold mt-0.5">{formatCurrency(dailyTarget)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Llevás {formatCurrency(todaySales)} · {progressPercent.toFixed(0)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                    <Info className="w-3.5 h-3.5" />
                    {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </button>
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
              {showBreakdown && (
                <div className="rounded-xl bg-muted/60 border border-border divide-y divide-border text-xs overflow-hidden">
                  {baseShortfallDaily > 0 && (
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-muted-foreground">Gastos fijos</span>
                      <span className="font-semibold">{formatCurrency(baseShortfallDaily)}</span>
                    </div>
                  )}
                  {totalMonthlyRecurringDebts > 0 && getRemainingWorkingDays > 0 && (
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-muted-foreground">Deudas recurrentes</span>
                      <span className="font-semibold">{formatCurrency(Math.ceil(totalMonthlyRecurringDebts / getRemainingWorkingDays))}</span>
                    </div>
                  )}
                  {debtPlans.filter(p => p.isActive && p.remainingAmount > 0).map(p => {
                    let monthly: number
                    switch (p.frequency) {
                      case 'monthly':  monthly = p.paidMonth === currentMonthStr ? 0 : p.paymentAmount; break
                      case 'weekly':   monthly = p.paymentAmount * (daysInMonth / 7); break
                      case 'biweekly': monthly = p.paymentAmount * (daysInMonth / 14); break
                      case 'daily':    monthly = p.paymentAmount * daysInMonth; break
                      default:         monthly = p.paymentAmount
                    }
                    const obligation = Math.min(Math.ceil(monthly), p.remainingAmount)
                    const daily = getRemainingWorkingDays > 0 ? Math.ceil(obligation / getRemainingWorkingDays) : 0
                    if (daily === 0) return null
                    return (
                      <div key={p.id} className="flex justify-between items-center px-3 py-2">
                        <span className="text-muted-foreground truncate max-w-[60%]">Abono: {p.name}</span>
                        <span className="font-semibold">{formatCurrency(daily)}</span>
                      </div>
                    )
                  })}
                  {activeDailyQuotaDebts.filter(q => q.isActive).map(q => {
                    const start = new Date(q.startDate); start.setHours(0, 0, 0, 0)
                    const isWeekly = q.frequency === 'weekly'
                    const daysPassed = Math.floor((breakdownTodayStart.getTime() - start.getTime()) / 86400000)
                    const periodsPassed = isWeekly ? Math.floor(daysPassed / 7) : daysPassed
                    if (periodsPassed >= q.totalDays) return null
                    const daily = getRemainingWorkingDays > 0 ? Math.ceil(q.totalAmount / getRemainingWorkingDays) : 0
                    return (
                      <div key={q.id} className="flex justify-between items-center px-3 py-2">
                        <span className="text-muted-foreground truncate max-w-[60%]">Cuota: {q.name}</span>
                        <span className="font-semibold">{formatCurrency(daily)}</span>
                      </div>
                    )
                  })}
                  {netIncome > 0 && getRemainingWorkingDays > 0 && (
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-muted-foreground">Ya ganado este mes</span>
                      <span className="font-semibold text-green-600">-{formatCurrency(Math.floor(netIncome / getRemainingWorkingDays))}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center px-3 py-2 bg-muted">
                    <span className="font-semibold">Total meta</span>
                    <span className="font-bold text-primary">{formatCurrency(dailyTarget)}</span>
                  </div>
                </div>
              )}
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

            <UpcomingPayments payments={upcomingPayments} formatCurrency={formatCurrency} />

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

        {activeTab === 'deudas' && (
          <>
            <FixedExpenses
              expenses={state.fixedExpenses}
              totalExpenses={totalFixedExpenses}
              unpaidTotal={unpaidFixedExpenses}
              onAdd={addFixedExpense}
              onUpdate={updateFixedExpense}
              onDelete={deleteFixedExpense}
              onTogglePaid={toggleExpensePaid}
              formatCurrency={formatCurrency}
            />
            <DebtPlans
              plans={debtPlans}
              dailyPortion={calculateDebtPlanDailyPortion}
              onAdd={addDebtPlan}
              onUpdate={updateDebtPlan}
              onDelete={deleteDebtPlan}
              onToggleActive={toggleDebtPlanActive}
              onPay={payDebtPlan}
              formatCurrency={formatCurrency}
            />
            <DailyQuotaDebts
              debts={state.dailyQuotaDebts}
              dailyQuotaPortion={calculateDailyQuotaPortion}
              onAdd={addDailyQuotaDebt}
              onUpdate={updateDailyQuotaDebt}
              onDelete={deleteDailyQuotaDebt}
              onToggleActive={toggleDailyQuotaDebtActive}
              getDetails={getDailyQuotaDetails}
              formatCurrency={formatCurrency}
            />
            <CreditsPanel
              credits={activeCredits}
              liabilities={activeLiabilities}
              accounts={state.accounts}
              totalCredits={totalCredits}
              totalLiabilities={totalLiabilities}
              formatCurrency={formatCurrency}
              onAddCredit={addCredit}
              onUpdateCredit={updateCredit}
              onDeleteCredit={deleteCredit}
              onCollectCredit={collectCredit}
              onAddLiability={addLiability}
              onUpdateLiability={updateLiability}
              onDeleteLiability={deleteLiability}
              onPayLiability={payLiability}
            />
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
          </>
        )}

        {activeTab === 'ajustes' && (
          <SettingsPanel
            settings={state.settings}
            onUpdateSettings={updateSettings}
            onClearData={clearAllData}
            transactions={state.transactions}
            fixedExpenses={state.fixedExpenses}
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
        onSubmit={addTransaction}
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
        onClose={() => setShiftSummary(null)}
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
