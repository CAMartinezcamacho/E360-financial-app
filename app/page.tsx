'use client'

import { useState } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Zap, Minus } from 'lucide-react'
import { Onboarding } from '@/components/onboarding'
import { setSyncKey } from '@/lib/cloud-sync'
import { Button } from '@/components/ui/button'

type TabType = 'hoy' | 'historial' | 'deudas' | 'ajustes'

export default function FinanceDashboard() {
  const [entryType, setEntryType] = useState<'sale' | 'expense' | null>(null)
  const [quickEntryOpen, setQuickEntryOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('hoy')

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
    calculateDailyQuotaPortion,
    activeDailyQuotaDebts,
    todayPlatformBreakdown,
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
  const missing = Math.max(0, dailyTarget - todaySales)
  const progressPercent = dailyTarget > 0 ? Math.min(100, (todaySales / dailyTarget) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-lg mx-auto p-4 pb-24 space-y-4">

        {activeTab === 'hoy' && (
          <>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
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
    </div>
  )
}
