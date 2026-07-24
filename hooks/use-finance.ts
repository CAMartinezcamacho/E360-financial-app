'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Transaction, FinanceState, UserSettings, Account, ServiceType, RidePlatform, ShiftSummary, PlatformBreakdown } from '@/lib/types'
import { scheduleSave, loadFromCloud } from '@/lib/cloud-sync'

const STORAGE_KEY = 'flujopro-finance-data'

const defaultSettings: UserSettings = {
  userName: '',
  currencySymbol: '$',
  shiftStartHour: 0,
  notificationsEnabled: false,
  notificationInterval: 30,
}

const defaultAccounts: Account[] = [
  { id: 'efectivo', name: 'Efectivo', icon: 'banknote', color: 'emerald' },
  { id: 'nequi', name: 'Nequi', icon: 'smartphone', color: 'purple' },
  { id: 'uber', name: 'Uber', icon: 'car', color: 'zinc' },
  { id: 'didi', name: 'Didi', icon: 'car', color: 'orange' },
]

const defaultState: FinanceState = {
  transactions: [],
  dailyGoal: 0,
  settings: defaultSettings,
  accounts: defaultAccounts,
}

function parseStoredData(data: string): FinanceState {
  try {
    const parsed = JSON.parse(data)

    // Validate and sanitize accounts - ensure no empty values
    const validatedAccounts = (parsed.accounts || defaultAccounts).map((a: Account) => ({
      ...a,
      id: a.id || crypto.randomUUID(),
      name: a.name || 'Cuenta',
      icon: a.icon || 'wallet',
      color: a.color || 'emerald',
    }))

    return {
      ...parsed,
      dailyGoal: typeof parsed.dailyGoal === 'number' ? parsed.dailyGoal : 0,
      settings: { ...defaultSettings, ...parsed.settings },
      accounts: validatedAccounts,
      transactions: (parsed.transactions || []).map((t: Transaction) => ({
        ...t,
        timestamp: new Date(t.timestamp),
        // Ensure accountId is valid (not empty string)
        accountId: t.accountId && t.accountId !== '' ? t.accountId : undefined,
      })),
      currentShift: parsed.currentShift
        ? { id: parsed.currentShift.id, startTime: new Date(parsed.currentShift.startTime) }
        : undefined,
    }
  } catch {
    return defaultState
  }
}

const ONBOARDING_KEY = 'e360-onboarding-done'

export function useFinance() {
  const [state, setState] = useState<FinanceState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  // Load from localStorage; if empty try cloud restore
  useEffect(() => {
    const onboardingDone = localStorage.getItem(ONBOARDING_KEY)
    if (!onboardingDone) {
      setNeedsOnboarding(true)
      setIsLoaded(true)
      return
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setState(parseStoredData(stored))
      setIsLoaded(true)
    } else {
      loadFromCloud().then((cloudState) => {
        if (cloudState) {
          const parsed = parseStoredData(JSON.stringify(cloudState))
          setState(parsed)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
        }
        setIsLoaded(true)
      }).catch(() => setIsLoaded(true))
    }
  }, [])

  // Called when onboarding finishes
  const completeOnboarding = useCallback((
    name: string,
    currency: string,
    restoredState?: object | null
  ) => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    if (restoredState) {
      const parsed = parseStoredData(JSON.stringify(restoredState))
      // Override name/currency with what user just entered
      parsed.settings = { ...parsed.settings, userName: name, currencySymbol: currency }
      setState(parsed)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    } else {
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, userName: name, currencySymbol: currency },
      }))
    }
    setNeedsOnboarding(false)
  }, [])

  // Save to localStorage + schedule cloud sync on state change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      setSyncStatus('saving')
      scheduleSave(state, (ok) => setSyncStatus(ok ? 'saved' : 'error'))
    }
  }, [state, isLoaded])

  const addTransaction = useCallback((
    type: 'sale' | 'expense',
    amount: number,
    title: string,
    accountId?: string,
    serviceType?: ServiceType,
    platform?: RidePlatform,
    grossAmount?: number,
    commissionPercent?: number,
    companyName?: string,
    km?: number
  ) => {
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      amount,
      title,
      timestamp: new Date(),
      accountId,
      serviceType,
      platform,
      grossAmount,
      commissionPercent,
      companyName,
      km,
    }
    setState((prev) => ({
      ...prev,
      transactions: [transaction, ...prev.transactions],
    }))
  }, [])

  const deleteTransaction = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }))
  }, [])

  // Edit transaction (with optional date change)
  const editTransaction = useCallback((id: string, amount: number, title: string, accountId?: string, newDate?: Date) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === id ? {
          ...t,
          amount,
          title,
          accountId,
          timestamp: newDate || t.timestamp
        } : t
      ),
    }))
  }, [])

  const setDailyGoal = useCallback((goal: number) => {
    setState((prev) => ({
      ...prev,
      dailyGoal: Math.max(0, goal),
    }))
  }, [])

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }))
  }, [])

  const addAccount = useCallback((name: string, icon: string, color: string) => {
    // Validate inputs - never allow empty strings
    const validName = name.trim() || 'Nueva Cuenta'
    const validIcon = icon || 'wallet'
    const validColor = color || 'emerald'

    const account: Account = {
      id: crypto.randomUUID(),
      name: validName,
      icon: validIcon,
      color: validColor,
    }
    setState((prev) => ({
      ...prev,
      accounts: [...prev.accounts, account],
    }))
  }, [])

  const updateAccount = useCallback((id: string, name: string, icon: string, color: string) => {
    // Validate inputs - never allow empty strings
    const validName = name.trim() || 'Cuenta'
    const validIcon = icon || 'wallet'
    const validColor = color || 'emerald'

    setState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) =>
        a.id === id ? { ...a, name: validName, icon: validIcon, color: validColor } : a
      ),
    }))
  }, [])

  const deleteAccount = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
    }))
  }, [])

  // Adjust account balance manually (creates a special adjustment transaction)
  const adjustAccountBalance = useCallback((accountId: string, newBalance: number, reason?: string) => {
    setState((prev) => {
      // Calculate current balance for this account
      let currentBalance = 0
      prev.transactions.forEach((t) => {
        if (t.accountId === accountId) {
          if (t.type === 'sale') {
            currentBalance += t.amount
          } else {
            currentBalance -= t.amount
          }
        }
      })

      const difference = newBalance - currentBalance
      if (difference === 0) return prev

      // Create an adjustment transaction
      const adjustmentTransaction: Transaction = {
        id: crypto.randomUUID(),
        type: difference > 0 ? 'sale' : 'expense',
        amount: Math.abs(difference),
        title: reason || (difference > 0 ? 'Ajuste: Consignación' : 'Ajuste: Retiro'),
        timestamp: new Date(),
        accountId,
      }

      return {
        ...prev,
        transactions: [adjustmentTransaction, ...prev.transactions],
      }
    })
  }, [])

  // Transfer funds between accounts
  const transferBetweenAccounts = useCallback((fromAccountId: string, toAccountId: string, amount: number, description?: string) => {
    if (amount <= 0) return

    setState((prev) => {
      const fromAccount = prev.accounts.find((a) => a.id === fromAccountId)
      const toAccount = prev.accounts.find((a) => a.id === toAccountId)

      if (!fromAccount || !toAccount) return prev

      const transferDescription = description || `Transferencia: ${fromAccount.name} → ${toAccount.name}`

      // Create two transactions: expense from source, income to destination
      const expenseTransaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'expense',
        amount,
        title: `↗ ${transferDescription}`,
        timestamp: new Date(),
        accountId: fromAccountId,
      }

      const incomeTransaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'sale',
        amount,
        title: `↙ ${transferDescription}`,
        timestamp: new Date(),
        accountId: toAccountId,
      }

      return {
        ...prev,
        transactions: [incomeTransaction, expenseTransaction, ...prev.transactions],
      }
    })
  }, [])

  // Reset account balance to zero (useful after external deposit/withdrawal)
  const resetAccountBalance = useCallback((accountId: string) => {
    setState((prev) => {
      // Calculate current balance for this account
      let currentBalance = 0
      prev.transactions.forEach((t) => {
        if (t.accountId === accountId) {
          if (t.type === 'sale') {
            currentBalance += t.amount
          } else {
            currentBalance -= t.amount
          }
        }
      })

      if (currentBalance === 0) return prev

      // Create a zeroing transaction
      const zeroTransaction: Transaction = {
        id: crypto.randomUUID(),
        type: currentBalance > 0 ? 'expense' : 'sale',
        amount: Math.abs(currentBalance),
        title: 'Reinicio de saldo (Consignación externa)',
        timestamp: new Date(),
        accountId,
      }

      return {
        ...prev,
        transactions: [zeroTransaction, ...prev.transactions],
      }
    })
  }, [])

  const clearAllData = useCallback(() => {
    setState(defaultState)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const startShift = useCallback(() => {
    setState((prev) => {
      const now = new Date()
      // Create zeroing transactions for all accounts with non-zero balance
      const resetTransactions: Transaction[] = []
      prev.accounts.forEach((account) => {
        let balance = 0
        prev.transactions.forEach((t) => {
          if (t.accountId === account.id) {
            balance += t.type === 'sale' ? t.amount : -t.amount
          }
        })
        if (balance !== 0) {
          resetTransactions.push({
            id: crypto.randomUUID(),
            type: balance > 0 ? 'expense' : 'sale',
            amount: Math.abs(balance),
            title: 'Reinicio de saldo',
            timestamp: now,
            accountId: account.id,
          })
        }
      })
      return {
        ...prev,
        currentShift: { id: crypto.randomUUID(), startTime: now },
        transactions: [...resetTransactions, ...prev.transactions],
      }
    })
  }, [])

  const endShift = useCallback((): ShiftSummary | null => {
    if (!state.currentShift) return null
    const shiftStart = new Date(state.currentShift.startTime)
    const shiftTxns = state.transactions.filter(
      (t) => new Date(t.timestamp) >= shiftStart
    )
    const isInternal = (title: string) =>
      title.startsWith('↗ ') || title.startsWith('↙ ') ||
      title.startsWith('Reinicio de saldo') || title.startsWith('Ajuste:')
    const trips = shiftTxns.filter((t) => t.type === 'sale' && !isInternal(t.title))
    const walletBalances: Record<string, number> = {}
    state.accounts.forEach((a) => { walletBalances[a.id] = 0 })
    shiftTxns.filter((t) => !isInternal(t.title)).forEach((t) => {
      if (t.accountId && walletBalances[t.accountId] !== undefined) {
        walletBalances[t.accountId] += t.type === 'sale' ? t.amount : -t.amount
      }
    })
    const totalKm = trips.reduce((sum, t) => sum + (t.km ?? 0), 0)
    setState((prev) => ({ ...prev, currentShift: undefined }))
    return {
      tripCount: trips.length,
      totalEarned: trips.reduce((sum, t) => sum + t.amount, 0),
      totalKm,
      walletBalances,
      startTime: shiftStart,
      endTime: new Date(),
    }
  }, [state])

  // Calculations
  const shiftStartHour = state.settings.shiftStartHour ?? 0

  const getShiftStart = (date: Date): Date => {
    const d = new Date(date)
    if (shiftStartHour === 0) {
      d.setHours(0, 0, 0, 0)
      return d
    }
    if (d.getHours() < shiftStartHour) {
      d.setDate(d.getDate() - 1)
    }
    d.setHours(shiftStartHour, 0, 0, 0)
    return d
  }

  const now = new Date()

  // "Today" boundary: start of active shift, or calendar midnight if no shift.
  // This means a shift started Monday 2 PM that runs past midnight still shows
  // Monday's trips — no automatic cutoff at a fixed hour.
  const midnight = new Date(now)
  midnight.setHours(0, 0, 0, 0)
  const currentShiftStart = state.currentShift
    ? new Date(state.currentShift.startTime)
    : midnight

  const todayTransactions = state.transactions.filter(
    (t) => new Date(t.timestamp).getTime() >= currentShiftStart.getTime()
  )

  // Monthly totals always use the actual calendar month of each transaction
  const monthTransactions = state.transactions.filter((t) => {
    const d = new Date(t.timestamp)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  // Identify internal/adjustment transactions that should NOT count toward totals
  // These are transfers between accounts, balance adjustments, and resets
  const isInternalTransaction = (title: string) => {
    return title.startsWith('↗ ') ||  // Any outgoing transfer
           title.startsWith('↙ ') ||  // Any incoming transfer
           title.startsWith('Reinicio de saldo') ||
           title.startsWith('Ajuste:')
  }

  const todaySales = todayTransactions
    .filter((t) => t.type === 'sale' && !isInternalTransaction(t.title))
    .reduce((sum, t) => sum + t.amount, 0)

  const todayExpenses = todayTransactions
    .filter((t) => t.type === 'expense' && !isInternalTransaction(t.title))
    .reduce((sum, t) => sum + t.amount, 0)

  const todayBalance = todaySales - todayExpenses

  // Platform breakdown for today's income
  const todayPlatformBreakdown = useMemo(() => {
    const breakdown: PlatformBreakdown = {
      uber: 0,
      indriver: 0,
      cabify: 0,
      taxi: 0,
      otro: 0,
      corporate: 0,
      other: 0,
    }

    todayTransactions
      .filter((t) => t.type === 'sale' && !isInternalTransaction(t.title))
      .forEach((t) => {
        if (t.serviceType === 'platform_trip' && t.platform) {
          breakdown[t.platform] += t.amount
        } else if (t.serviceType === 'corporate') {
          breakdown.corporate += t.amount
        } else {
          breakdown.other += t.amount
        }
      })

    return breakdown
  }, [todayTransactions])

  // Filter out internal transactions for accurate monthly totals
  const monthSales = monthTransactions
    .filter((t) => t.type === 'sale' && !isInternalTransaction(t.title))
    .reduce((sum, t) => sum + t.amount, 0)

  const monthExpenses = monthTransactions
    .filter((t) => t.type === 'expense' && !isInternalTransaction(t.title))
    .reduce((sum, t) => sum + t.amount, 0)

  const netIncome = monthSales - monthExpenses

  // Calculate account balances with income/expense breakdown
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {}
    state.accounts.forEach((account) => {
      balances[account.id] = 0
    })
    state.transactions.forEach((t) => {
      if (t.accountId && balances[t.accountId] !== undefined) {
        if (t.type === 'sale') {
          balances[t.accountId] += t.amount
        } else {
          balances[t.accountId] -= t.amount
        }
      }
    })
    return balances
  }, [state.transactions, state.accounts])

  // Calculate detailed account breakdown (income and expenses separately)
  const accountBreakdown = useMemo(() => {
    const breakdown: Record<string, { income: number; expenses: number }> = {}
    state.accounts.forEach((account) => {
      breakdown[account.id] = { income: 0, expenses: 0 }
    })
    state.transactions.forEach((t) => {
      if (t.accountId && breakdown[t.accountId] !== undefined) {
        if (t.type === 'sale') {
          breakdown[t.accountId].income += t.amount
        } else {
          breakdown[t.accountId].expenses += t.amount
        }
      }
    })
    return breakdown
  }, [state.transactions, state.accounts])

  // Currency formatting helper
  const formatCurrency = useCallback((amount: number) => {
    const symbol = state.settings.currencySymbol || '$'
    return `${symbol}${new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`
  }, [state.settings.currencySymbol])

  return {
    state,
    isLoaded,
    syncStatus,
    needsOnboarding,
    completeOnboarding,
    shiftStartHour,
    getShiftStart,
    currentShiftStart,
    addTransaction,
    deleteTransaction,
    editTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    adjustAccountBalance,
    transferBetweenAccounts,
    resetAccountBalance,
    dailyGoal: state.dailyGoal,
    setDailyGoal,
    updateSettings,
    clearAllData,
    formatCurrency,
    // Calculated values
    todayTransactions,
    monthTransactions,
    todaySales,
    todayExpenses,
    todayBalance,
    monthSales,
    monthExpenses,
    netIncome,
    accountBalances,
    accountBreakdown,
    // Platform breakdown
    todayPlatformBreakdown,
    // Shift management
    currentShift: state.currentShift,
    isShiftActive: !!state.currentShift,
    startShift,
    endShift,
  }
}
