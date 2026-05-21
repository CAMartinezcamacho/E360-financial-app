export interface Account {
  id: string
  name: string
  icon: string
  color: string
}

// Platform types for ride-hailing services
export type RidePlatform = 'uber' | 'indriver' | 'cabify' | 'taxi' | 'otro'

// Service types for transactions
export type ServiceType = 'platform_trip' | 'corporate' | 'sale' | 'other' | 'expense'

export interface Transaction {
  id: string
  type: 'sale' | 'expense'
  amount: number
  title: string
  timestamp: Date
  accountId?: string // Which account the money went to/from
  // Extended fields for service tracking
  serviceType?: ServiceType
  platform?: RidePlatform
  grossAmount?: number // Original amount before commission
  commissionPercent?: number // Platform commission percentage
  companyName?: string // For corporate services
}

export interface FixedExpense {
  id: string
  name: string
  amount: number
  dueDay?: number // Day of month (1-31)
  isPaid?: boolean // Paid status for current month
  paidMonth?: string // Format: "YYYY-MM" to track which month was marked as paid
}

export interface UserSettings {
  userName: string
  currencySymbol: string
  nonWorkingDays: number[] // 0=Sunday, 1=Monday, etc.
}

// "Me Deben" - Money others owe to me
export interface Credit {
  id: string
  name: string // Who owes me
  description?: string
  amount: number
  originalAmount: number // Track the original debt
  createdAt: Date
  status: 'active' | 'partial' | 'collected' // Active, partially paid, or fully collected
}

// "Debo" - Money I owe to others
export interface Liability {
  id: string
  name: string // Who I owe
  description?: string
  amount: number
  originalAmount: number // Track the original debt
  dueDay?: number // Day of month when due
  createdAt: Date
  status: 'pending' | 'partial' | 'paid' // Pending, partially paid, or fully paid
  paidMonth?: string // Format: "YYYY-MM" to track which month was marked as paid
}

// Recurring debts with payment frequency (for daily goal calculation)
export type PaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface RecurringDebt {
  id: string
  name: string // Creditor name or debt description
  description?: string
  amount: number // Total amount per period
  frequency: PaymentFrequency
  dueDay?: number // Day of week (0-6) for weekly, or day of month (1-31) for monthly
  startDate: Date
  isActive: boolean
}

// Daily Quota Debt (Cuota Diaria) - loans paid in daily installments
export interface DailyQuotaDebt {
  id: string
  name: string // Creditor name
  description?: string
  totalAmount: number // Total borrowed amount
  totalDays: number // Total days to pay back
  startDate: Date
  isActive: boolean
}

export interface FinanceState {
  transactions: Transaction[]
  fixedExpenses: FixedExpense[]
  monthlyIncome: number
  settings: UserSettings
  accounts: Account[]
  credits: Credit[] // "Me Deben"
  liabilities: Liability[] // "Debo"
  recurringDebts: RecurringDebt[] // Deudas recurrentes con prorrateo diario
  dailyQuotaDebts: DailyQuotaDebt[] // Cuotas diarias (gota a gota)
}
