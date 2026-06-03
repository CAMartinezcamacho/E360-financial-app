'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Transaction, FixedExpense, FinanceState, UserSettings, Account, Credit, Liability, RecurringDebt, PaymentFrequency, DailyQuotaDebt, ServiceType, RidePlatform } from '@/lib/types'
import { scheduleSave, loadFromCloud } from '@/lib/cloud-sync'

const STORAGE_KEY = 'flujopro-finance-data'

const defaultSettings: UserSettings = {
  userName: '',
  currencySymbol: '$',
  nonWorkingDays: [0], // Sunday by default
  shiftStartHour: 0,
}

const defaultAccounts: Account[] = [
  { id: 'efectivo', name: 'Efectivo', icon: 'banknote', color: 'emerald' },
  { id: 'nequi', name: 'Nequi', icon: 'smartphone', color: 'purple' },
  { id: 'uber', name: 'Uber', icon: 'car', color: 'zinc' },
  { id: 'didi', name: 'Didi', icon: 'car', color: 'orange' },
]

const defaultFixedExpenses: FixedExpense[] = [
  { id: '1', name: 'Arriendo', amount: 8000, dueDay: 22 },
  { id: '2', name: 'Servicios', amount: 1500, dueDay: 15 },
  { id: '3', name: 'Internet', amount: 600, dueDay: 5 },
  { id: '4', name: 'Celular', amount: 400, dueDay: 10 },
]

const defaultState: FinanceState = {
  transactions: [],
  fixedExpenses: defaultFixedExpenses,
  monthlyIncome: 25000,
  settings: defaultSettings,
  accounts: defaultAccounts,
  credits: [],
  liabilities: [],
  recurringDebts: [],
  dailyQuotaDebts: [],
}

function parseStoredData(data: string): FinanceState {
  try {
    const parsed = JSON.parse(data)
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    
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
      settings: { ...defaultSettings, ...parsed.settings },
      accounts: validatedAccounts,
      transactions: (parsed.transactions || []).map((t: Transaction) => ({
        ...t,
        timestamp: new Date(t.timestamp),
        // Ensure accountId is valid (not empty string)
        accountId: t.accountId && t.accountId !== '' ? t.accountId : undefined,
      })),
      // Reset isPaid status if month changed
      fixedExpenses: (parsed.fixedExpenses || defaultFixedExpenses).map((e: FixedExpense) => ({
        ...e,
        id: e.id || crypto.randomUUID(),
        name: e.name || 'Gasto',
        amount: e.amount || 0,
        isPaid: e.paidMonth === currentMonth ? e.isPaid : false,
        paidMonth: e.paidMonth === currentMonth ? e.paidMonth : undefined,
      })),
      // Parse credits (Me Deben)
      credits: (parsed.credits || []).map((c: Credit) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      })),
      // Parse and reset liabilities (Debo) status if month changed
      liabilities: (parsed.liabilities || []).map((l: Liability) => ({
        ...l,
        createdAt: new Date(l.createdAt),
        status: l.paidMonth === currentMonth && l.status === 'paid' ? 'paid' : (l.status === 'partial' ? 'partial' : 'pending'),
        paidMonth: l.paidMonth === currentMonth ? l.paidMonth : undefined,
      })),
      // Parse recurring debts
      recurringDebts: (parsed.recurringDebts || []).map((d: RecurringDebt) => ({
        ...d,
        startDate: new Date(d.startDate),
      })),
      // Parse daily quota debts
      dailyQuotaDebts: (parsed.dailyQuotaDebts || []).map((d: DailyQuotaDebt) => ({
        ...d,
        startDate: new Date(d.startDate),
      })),
    }
  } catch {
    return defaultState
  }
}

export function useFinance() {
  const [state, setState] = useState<FinanceState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Load from localStorage; if empty try cloud restore
  useEffect(() => {
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
    companyName?: string
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

  const addFixedExpense = useCallback((name: string, amount: number, dueDay?: number) => {
    // Validate inputs
    const validName = name.trim() || 'Nuevo Gasto'
    const validAmount = amount > 0 ? amount : 0
    
    const expense: FixedExpense = {
      id: crypto.randomUUID(),
      name: validName,
      amount: validAmount,
      dueDay,
      isPaid: false,
    }
    setState((prev) => ({
      ...prev,
      fixedExpenses: [...prev.fixedExpenses, expense],
    }))
  }, [])

  const updateFixedExpense = useCallback((id: string, name: string, amount: number, dueDay?: number) => {
    // Validate inputs
    const validName = name.trim() || 'Gasto'
    const validAmount = amount > 0 ? amount : 0
    
    setState((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.map((e) =>
        e.id === id ? { ...e, name: validName, amount: validAmount, dueDay } : e
      ),
    }))
  }, [])

  const toggleExpensePaid = useCallback((id: string) => {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    setState((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.map((e) =>
        e.id === id ? { ...e, isPaid: !e.isPaid, paidMonth: !e.isPaid ? currentMonth : undefined } : e
      ),
    }))
  }, [])

  const deleteFixedExpense = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.filter((e) => e.id !== id),
    }))
  }, [])

  const setMonthlyIncome = useCallback((income: number) => {
    setState((prev) => ({
      ...prev,
      monthlyIncome: income,
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

  // Credit management (Me Deben)
  const addCredit = useCallback((name: string, amount: number, description?: string) => {
    const credit: Credit = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Deudor',
      description,
      amount,
      originalAmount: amount,
      createdAt: new Date(),
      status: 'active',
    }
    setState((prev) => ({
      ...prev,
      credits: [credit, ...prev.credits],
    }))
  }, [])

  const updateCredit = useCallback((id: string, name: string, amount: number, description?: string) => {
    setState((prev) => ({
      ...prev,
      credits: prev.credits.map((c) =>
        c.id === id ? { ...c, name: name.trim() || 'Deudor', amount, description } : c
      ),
    }))
  }, [])

  const deleteCredit = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      credits: prev.credits.filter((c) => c.id !== id),
    }))
  }, [])

  // Collect credit - reduces the amount owed and optionally adds a sale transaction
  const collectCredit = useCallback((id: string, amountCollected: number, addAsSale: boolean = true, accountId?: string) => {
    setState((prev) => {
      const credit = prev.credits.find((c) => c.id === id)
      if (!credit) return prev

      const newAmount = Math.max(0, credit.amount - amountCollected)
      const newStatus = newAmount === 0 ? 'collected' : 'partial'

      const updatedCredits = prev.credits.map((c) =>
        c.id === id ? { ...c, amount: newAmount, status: newStatus as Credit['status'] } : c
      )

      // Optionally add as a sale transaction
      const newTransactions = addAsSale
        ? [
            {
              id: crypto.randomUUID(),
              type: 'sale' as const,
              amount: amountCollected,
              title: `Cobro: ${credit.name}`,
              timestamp: new Date(),
              accountId,
            },
            ...prev.transactions,
          ]
        : prev.transactions

      return {
        ...prev,
        credits: updatedCredits,
        transactions: newTransactions,
      }
    })
  }, [])

  // Liability management (Debo)
  const addLiability = useCallback((name: string, amount: number, dueDay?: number, description?: string) => {
    const liability: Liability = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Acreedor',
      description,
      amount,
      originalAmount: amount,
      dueDay,
      createdAt: new Date(),
      status: 'pending',
    }
    setState((prev) => ({
      ...prev,
      liabilities: [liability, ...prev.liabilities],
    }))
  }, [])

  const updateLiability = useCallback((id: string, name: string, amount: number, dueDay?: number, description?: string) => {
    setState((prev) => ({
      ...prev,
      liabilities: prev.liabilities.map((l) =>
        l.id === id ? { ...l, name: name.trim() || 'Acreedor', amount, dueDay, description } : l
      ),
    }))
  }, [])

  const deleteLiability = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      liabilities: prev.liabilities.filter((l) => l.id !== id),
    }))
  }, [])

  // Pay liability - reduces the amount owed and optionally adds an expense transaction
  const payLiability = useCallback((id: string, amountPaid: number, addAsExpense: boolean = true, accountId?: string) => {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    
    setState((prev) => {
      const liability = prev.liabilities.find((l) => l.id === id)
      if (!liability) return prev

      const newAmount = Math.max(0, liability.amount - amountPaid)
      const newStatus = newAmount === 0 ? 'paid' : 'partial'

      const updatedLiabilities = prev.liabilities.map((l) =>
        l.id === id
          ? { ...l, amount: newAmount, status: newStatus as Liability['status'], paidMonth: newStatus === 'paid' ? currentMonth : l.paidMonth }
          : l
      )

      // Optionally add as an expense transaction
      const newTransactions = addAsExpense
        ? [
            {
              id: crypto.randomUUID(),
              type: 'expense' as const,
              amount: amountPaid,
              title: `Pago: ${liability.name}`,
              timestamp: new Date(),
              accountId,
            },
            ...prev.transactions,
          ]
        : prev.transactions

      return {
        ...prev,
        liabilities: updatedLiabilities,
        transactions: newTransactions,
      }
    })
  }, [])

  // Recurring Debt management (Deudas Recurrentes para Meta Diaria)
  const addRecurringDebt = useCallback((name: string, amount: number, frequency: PaymentFrequency, dueDay?: number, description?: string) => {
    const debt: RecurringDebt = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Deuda',
      description,
      amount,
      frequency,
      dueDay,
      startDate: new Date(),
      isActive: true,
    }
    setState((prev) => ({
      ...prev,
      recurringDebts: [debt, ...prev.recurringDebts],
    }))
  }, [])

  const updateRecurringDebt = useCallback((id: string, name: string, amount: number, frequency: PaymentFrequency, dueDay?: number, description?: string) => {
    setState((prev) => ({
      ...prev,
      recurringDebts: prev.recurringDebts.map((d) =>
        d.id === id ? { ...d, name: name.trim() || 'Deuda', amount, frequency, dueDay, description } : d
      ),
    }))
  }, [])

  const deleteRecurringDebt = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      recurringDebts: prev.recurringDebts.filter((d) => d.id !== id),
    }))
  }, [])

  const toggleRecurringDebtActive = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      recurringDebts: prev.recurringDebts.map((d) =>
        d.id === id ? { ...d, isActive: !d.isActive } : d
      ),
    }))
  }, [])

  // Daily Quota Debt management (Cuota Diaria)
  const addDailyQuotaDebt = useCallback((name: string, totalAmount: number, totalDays: number, startDate: Date, description?: string) => {
    const debt: DailyQuotaDebt = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Cuota Diaria',
      description,
      totalAmount,
      totalDays,
      startDate,
      isActive: true,
    }
    setState((prev) => ({
      ...prev,
      dailyQuotaDebts: [debt, ...prev.dailyQuotaDebts],
    }))
  }, [])

  const updateDailyQuotaDebt = useCallback((id: string, name: string, totalAmount: number, totalDays: number, startDate: Date, description?: string) => {
    setState((prev) => ({
      ...prev,
      dailyQuotaDebts: prev.dailyQuotaDebts.map((d) =>
        d.id === id ? { ...d, name: name.trim() || 'Cuota Diaria', totalAmount, totalDays, startDate, description } : d
      ),
    }))
  }, [])

  const deleteDailyQuotaDebt = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      dailyQuotaDebts: prev.dailyQuotaDebts.filter((d) => d.id !== id),
    }))
  }, [])

  const toggleDailyQuotaDebtActive = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      dailyQuotaDebts: prev.dailyQuotaDebts.map((d) =>
        d.id === id ? { ...d, isActive: !d.isActive } : d
      ),
    }))
  }, [])

  const clearAllData = useCallback(() => {
    setState(defaultState)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Calculations
  const totalFixedExpenses = state.fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
  const unpaidFixedExpenses = state.fixedExpenses.filter((e) => !e.isPaid).reduce((sum, e) => sum + e.amount, 0)
  
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
  const currentShiftStart = getShiftStart(now)
  const currentShiftEnd = new Date(currentShiftStart.getTime() + 24 * 60 * 60 * 1000)
  const today = currentShiftStart

  const todayTransactions = state.transactions.filter((t) => {
    const ts = new Date(t.timestamp).getTime()
    return ts >= currentShiftStart.getTime() && ts < currentShiftEnd.getTime()
  })

  const monthTransactions = state.transactions.filter((t) => {
    const shiftStart = getShiftStart(new Date(t.timestamp))
    return (
      shiftStart.getMonth() === today.getMonth() &&
      shiftStart.getFullYear() === today.getFullYear()
    )
  })

  // Identify internal/adjustment transactions that should NOT count toward totals
  // These are transfers between accounts, balance adjustments, and resets
  // Fixed: Now detects ANY transfer (↗/↙ prefix) regardless of custom description
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
    const breakdown: Record<string, number> = {
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
  const coverageAmount = netIncome
  
  // Dynamic coverage: only count UNPAID fixed expenses for the goal
  // When you pay an expense, the goal decreases immediately
  const coveragePercent = unpaidFixedExpenses > 0 
    ? Math.min(100, Math.max(0, (coverageAmount / unpaidFixedExpenses) * 100))
    : coverageAmount >= 0 ? 100 : 0 // If all paid, you're 100% covered
  
  // Shortfall is based on unpaid expenses only - this is the "Descent Effect"
  const shortfall = Math.max(0, unpaidFixedExpenses - coverageAmount)

  // Calculate working days in month
  const currentDate = new Date()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  
  // Count remaining working days (excluding non-working days)
  const getRemainingWorkingDays = useMemo(() => {
    const nonWorkingDays = state.settings.nonWorkingDays || []
    let workingDays = 0
    for (let day = currentDate.getDate(); day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      if (!nonWorkingDays.includes(date.getDay())) {
        workingDays++
      }
    }
    return workingDays
  }, [currentDate, daysInMonth, state.settings.nonWorkingDays])

  // Check if today is a non-working day
  const isTodayRestDay = useMemo(() => {
    const nonWorkingDays = state.settings.nonWorkingDays || []
    return nonWorkingDays.includes(currentDate.getDay())
  }, [currentDate, state.settings.nonWorkingDays])

  // Calculate daily proration of recurring debts
  const calculateDailyDebtPortion = useMemo(() => {
    const activeDebts = state.recurringDebts.filter((d) => d.isActive)
    let dailyTotal = 0

    activeDebts.forEach((debt) => {
      switch (debt.frequency) {
        case 'daily':
          // Daily debt adds full amount each day
          dailyTotal += debt.amount
          break
        case 'weekly':
          // Weekly debt: divide by 7 days
          dailyTotal += debt.amount / 7
          break
        case 'biweekly':
          // Biweekly debt: divide by 14 days
          dailyTotal += debt.amount / 14
          break
        case 'monthly':
          // Monthly debt: divide by days in current month
          dailyTotal += debt.amount / daysInMonth
          break
      }
    })

    return Math.ceil(dailyTotal)
  }, [state.recurringDebts, daysInMonth])

  // Calculate total daily quota debt portion (Cuota Diaria)
  const calculateDailyQuotaPortion = useMemo(() => {
    const activeQuotas = state.dailyQuotaDebts.filter((d) => d.isActive)
    let dailyTotal = 0

    activeQuotas.forEach((quota) => {
      const startDate = new Date(quota.startDate)
      startDate.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Only add if still within payment period
      if (daysPassed < quota.totalDays) {
        dailyTotal += quota.totalAmount / quota.totalDays
      }
    })

    return Math.ceil(dailyTotal)
  }, [state.dailyQuotaDebts])

  // Get daily quota debt details (days passed, remaining, progress)
  const getDailyQuotaDetails = useCallback((quota: DailyQuotaDebt) => {
    const startDate = new Date(quota.startDate)
    startDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.max(0, quota.totalDays - daysPassed)
    const dailyQuota = quota.totalAmount / quota.totalDays
    const amountPaid = Math.min(dailyQuota * daysPassed, quota.totalAmount)
    const amountRemaining = quota.totalAmount - amountPaid
    const progressPercent = Math.min(100, (daysPassed / quota.totalDays) * 100)
    const isCompleted = daysPassed >= quota.totalDays

    return {
      daysPassed: Math.max(0, daysPassed),
      daysRemaining,
      dailyQuota: Math.ceil(dailyQuota),
      amountPaid: Math.ceil(amountPaid),
      amountRemaining: Math.ceil(amountRemaining),
      progressPercent,
      isCompleted,
    }
  }, [])

  // Total monthly equivalent of recurring debts (for expense display)
  const totalMonthlyRecurringDebts = useMemo(() => {
    const activeDebts = state.recurringDebts.filter((d) => d.isActive)
    let monthlyTotal = 0

    activeDebts.forEach((debt) => {
      switch (debt.frequency) {
        case 'daily':
          monthlyTotal += debt.amount * daysInMonth
          break
        case 'weekly':
          monthlyTotal += debt.amount * (daysInMonth / 7)
          break
        case 'biweekly':
          monthlyTotal += debt.amount * (daysInMonth / 14)
          break
        case 'monthly':
          monthlyTotal += debt.amount
          break
      }
    })

    return Math.ceil(monthlyTotal)
  }, [state.recurringDebts, daysInMonth])

  // Daily target now includes: base shortfall proration + daily debt portion
  const baseShortfallDaily = shortfall > 0 && getRemainingWorkingDays > 0 
    ? Math.ceil(shortfall / getRemainingWorkingDays) 
    : 0
  
  // Final daily target = base + recurring debts daily portion + daily quota portion
  const dailyTarget = baseShortfallDaily + calculateDailyDebtPortion + calculateDailyQuotaPortion

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

  // Get upcoming payments (sorted by due date proximity)
  const upcomingPayments = useMemo(() => {
    const currentDay = currentDate.getDate()
    const unpaid = state.fixedExpenses
      .filter((e) => !e.isPaid && e.dueDay)
      .map((e) => {
        const dueDay = e.dueDay!
        // Calculate days until due (considering month wrap)
        let daysUntil = dueDay - currentDay
        if (daysUntil < 0) {
          // Already passed this month, count as overdue (negative)
          daysUntil = daysUntil
        }
        return { ...e, daysUntil }
      })
      .sort((a, b) => {
        // Overdue first (negative), then by closest due date
        if (a.daysUntil < 0 && b.daysUntil >= 0) return -1
        if (b.daysUntil < 0 && a.daysUntil >= 0) return 1
        return a.daysUntil - b.daysUntil
      })
    return unpaid.slice(0, 3)
  }, [state.fixedExpenses, currentDate])

  // Currency formatting helper
  const formatCurrency = useCallback((amount: number) => {
    const symbol = state.settings.currencySymbol || '$'
    return `${symbol}${new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`
  }, [state.settings.currencySymbol])

  // Credits and Liabilities calculations
  const totalCredits = useMemo(() => 
    state.credits.filter(c => c.status !== 'collected').reduce((sum, c) => sum + c.amount, 0),
    [state.credits]
  )

  const totalLiabilities = useMemo(() => 
    state.liabilities.filter(l => l.status !== 'paid').reduce((sum, l) => sum + l.amount, 0),
    [state.liabilities]
  )

  const activeCredits = useMemo(() => 
    state.credits.filter(c => c.status !== 'collected'),
    [state.credits]
  )

  const activeLiabilities = useMemo(() => 
    state.liabilities.filter(l => l.status !== 'paid'),
    [state.liabilities]
  )

  return {
    state,
    isLoaded,
    syncStatus,
    shiftStartHour,
    getShiftStart,
    currentShiftStart,
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
    // Credit management (Me Deben)
    addCredit,
    updateCredit,
    deleteCredit,
    collectCredit,
    // Liability management (Debo)
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
    setMonthlyIncome,
    updateSettings,
    clearAllData,
    formatCurrency,
    // Calculated values
    totalFixedExpenses,
    unpaidFixedExpenses,
    todayTransactions,
    monthTransactions,
    todaySales,
    todayExpenses,
    todayBalance,
    monthSales,
    monthExpenses,
    netIncome,
    coverageAmount,
    coveragePercent,
    shortfall,
    dailyTarget,
    accountBalances,
    accountBreakdown,
    upcomingPayments,
    isTodayRestDay,
    getRemainingWorkingDays,
    // Credits and Liabilities
    totalCredits,
    totalLiabilities,
    activeCredits,
    activeLiabilities,
    // Recurring debts
    calculateDailyDebtPortion,
    totalMonthlyRecurringDebts,
    activeRecurringDebts: state.recurringDebts.filter((d) => d.isActive),
    // Daily quota debts
    calculateDailyQuotaPortion,
    activeDailyQuotaDebts: state.dailyQuotaDebts.filter((d) => d.isActive),
    // Platform breakdown
    todayPlatformBreakdown,
  }
}
