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
  km?: number // Distance traveled for this trip
}

export interface UserSettings {
  userName: string
  currencySymbol: string
  shiftStartHour: number // Hour (0-23) when work shift starts. Default 0 = midnight.
  notificationsEnabled: boolean
  notificationInterval: number // minutes between reminders: 15, 30, 45, 60
}

export interface PlatformBreakdown {
  uber: number
  indriver: number
  cabify: number
  taxi: number
  otro: number
  corporate: number
  other: number
}

export interface FinanceState {
  transactions: Transaction[]
  dailyGoal: number // Meta diaria de ingresos, editable en cualquier momento
  settings: UserSettings
  accounts: Account[]
  currentShift?: {
    id: string
    startTime: Date
  }
}

export interface ShiftSummary {
  tripCount: number
  totalEarned: number
  totalExpenses: number
  totalKm: number
  walletBalances: Record<string, number>
  startTime: Date
  endTime: Date
}
