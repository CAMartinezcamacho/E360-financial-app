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
  shiftStartHour: number // Hour (0-23) when work shift starts. Default 0 = midnight.
  notificationsEnabled: boolean
  notificationInterval: number // minutes between reminders: 15, 30, 45, 60
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

// Daily/Weekly Quota Debt - loans paid in daily or weekly installments
export type QuotaFrequency = 'daily' | 'weekly'

export interface DailyQuotaDebt {
  id: string
  name: string // Creditor name
  description?: string
  totalAmount: number // Total borrowed amount
  totalDays: number // Total periods (days or weeks) to pay back
  startDate: Date
  isActive: boolean
  frequency?: QuotaFrequency // 'daily' (default) or 'weekly'
}
// Unified debt plan: total debt + periodic payment + progress tracking
export interface DebtPlan {
  id: string
  name: string                // Who you owe (e.g., "Mamá", "Banco")
  description?: string
  totalAmount: number         // Original total debt
  remainingAmount: number     // Current remaining balance
  paymentAmount: number       // Amount per payment period
  frequency: PaymentFrequency // How often you pay
  dueDay?: number             // Day of month (1-31) the payment is due
  startDate: Date
  isActive: boolean
  paidMonth?: string          // "YYYY-MM" — tracks if this month's payment is done
}

export interface FinanceState {
  transactions: Transaction[]
  fixedExpenses: FixedExpense[]
  monthlyIncome: number
  settings: UserSettings
  accounts: Account[]
  credits: Credit[] // "Me Deben"
  liabilities: Liability[] // (legacy — kept for data migration)
  recurringDebts: RecurringDebt[] // (legacy — kept for data migration)
  dailyQuotaDebts: DailyQuotaDebt[] // Cuotas diarias (gota a gota)
  debtPlans: DebtPlan[] // Deudas con abono periódico
  currentShift?: {
    id: string
    startTime: Date
  }
}

export interface ShiftSummary {
  tripCount: number
  totalEarned: number
  walletBalances: Record<string, number>
  startTime: Date
  endTime: Date
}
