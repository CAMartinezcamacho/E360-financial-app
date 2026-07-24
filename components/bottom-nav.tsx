'use client'

import { CalendarDays, Settings, History, Wallet } from 'lucide-react'

type TabType = 'hoy' | 'historial' | 'cuentas' | 'ajustes'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs: { id: TabType; label: string; icon: typeof CalendarDays }[] = [
    { id: 'hoy', label: 'Hoy', icon: CalendarDays },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'cuentas', label: 'Cuentas', icon: Wallet },
    { id: 'ajustes', label: 'Ajustes', icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-lg mx-auto flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full min-h-[44px] transition-colors active:scale-95 ${
                isActive
                  ? 'text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
