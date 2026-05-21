'use client'

import { useState } from 'react'
import { useFinance } from '@/hooks/use-finance'
import { SurvivalHeader } from '@/components/survival-header'
import { DailyBalance } from '@/components/daily-balance'
import { TransactionFeed } from '@/components/transaction-feed'
import { FixedExpenses } from '@/components/fixed-expenses'
import { FloatingActions } from '@/components/floating-actions'
import { ServiceEntry } from '@/components/service-entry'
import { MonthlySummary } from '@/components/monthly-summary'
import { BottomNav } from '@/components/bottom-nav'
import { SettingsPanel } from '@/components/settings-panel'
import { HistoryPanel } from '@/components/history-panel'
import { UpcomingPayments } from '@/components/upcoming-payments'
import { AccountBalances } from '@/components/account-balances'
import { CreditsPanel } from '@/components/credits-panel'
import { DailyQuotaDebts } from '@/components/daily-quota-debts'
import { DailyChart } from '@/components/daily-chart'
import { Skeleton } from '@/components/ui/skeleton'

type TabType = 'hoy' | 'historial' | 'creditos' | 'metas' | 'ajustes'

export default function FinanceDashboard() {
  const [entryType, setEntryType] = useState<'sale' | 'expense' | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('hoy')

  const {
    isLoaded,
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
    // Credit management
    addCredit,
    updateCredit,
    deleteCredit,
    collectCredit,
    // Liability management
    addLiability,
    updateLiability,
    deleteLiability,
    payLiability,
    // Recurring debt management
    addRecurringDebt,
    updateRecurringDebt,
    deleteRecurringDebt,
    toggleRecurringDebtActive,
    // Daily quota debt management
    addDailyQuotaDebt,
    updateDailyQuotaDebt,
    deleteDailyQuotaDebt,
    toggleDailyQuotaDebtActive,
    getDailyQuotaDetails,
    updateSettings,
    clearAllData,
    formatCurrency,
    // Calculated values
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
    // Credits and liabilities
    totalCredits,
    totalLiabilities,
    activeCredits,
    activeLiabilities,
    // Recurring debts
    calculateDailyDebtPortion,
    totalMonthlyRecurringDebts,
    activeRecurringDebts,
    // Daily quota debts
    calculateDailyQuotaPortion,
    activeDailyQuotaDebts,
    // Platform breakdown
    todayPlatformBreakdown,
  } = useFinance()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-5 sticky top-0 z-40">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </header>
        <main className="max-w-lg mx-auto p-3 pb-20 space-y-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SurvivalHeader
        coveragePercent={coveragePercent}
        shortfall={shortfall}
        totalFixedExpenses={totalFixedExpenses}
        unpaidFixedExpenses={unpaidFixedExpenses}
        netIncome={netIncome}
        dailyTarget={dailyTarget}
        todayBalance={todayBalance}
        userName={state.settings.userName}
        formatCurrency={formatCurrency}
        isTodayRestDay={isTodayRestDay}
        remainingWorkingDays={getRemainingWorkingDays}
        dailyDebtPortion={calculateDailyDebtPortion + calculateDailyQuotaPortion}
      />

      <main className="max-w-lg mx-auto p-4 pb-24 space-y-4">
        {activeTab === 'hoy' && (
          <>
            {/* Upcoming Payments Alert */}
            <UpcomingPayments 
              payments={upcomingPayments}
              formatCurrency={formatCurrency}
            />

            {/* Daily Cash Flow Analysis with Platform Breakdown */}
            <DailyBalance
              todaySales={todaySales}
              todayExpenses={todayExpenses}
              todayBalance={todayBalance}
              dailyTarget={dailyTarget}
              platformBreakdown={todayPlatformBreakdown}
              formatCurrency={formatCurrency}
            />

            {/* Today's Transaction Feed */}
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
            {/* Daily Sales vs Expenses Chart */}
            <DailyChart
              transactions={state.transactions}
              formatCurrency={formatCurrency}
            />

            {/* Transaction History */}
            <HistoryPanel
              transactions={state.transactions}
              onDelete={deleteTransaction}
              onEdit={editTransaction}
              formatCurrency={formatCurrency}
              accounts={state.accounts}
            />
          </>
        )}

        {activeTab === 'creditos' && (
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
        )}

        {activeTab === 'metas' && (
          <>
            {/* Monthly Summary */}
            <MonthlySummary
              monthSales={monthSales}
              monthExpenses={monthExpenses}
              netIncome={netIncome}
              formatCurrency={formatCurrency}
              monthTransactions={monthTransactions}
            />

            {/* Account Balances */}
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

            {/* Fixed Expenses Configuration */}
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

            {/* Daily Quota Debts - Cuotas Diarias */}
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

      {/* Floating Action Buttons - Only show on "Hoy" tab */}
      {activeTab === 'hoy' && (
        <FloatingActions
          onOpenSale={() => setEntryType('sale')}
          onOpenExpense={() => setEntryType('expense')}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Service Entry Sheet - Enhanced with platform trips */}
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
