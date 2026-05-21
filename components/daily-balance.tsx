'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Car, Building, Wallet, Flame, Trophy, Target } from 'lucide-react'

interface PlatformBreakdown {
  uber: number
  indriver: number
  cabify: number
  taxi: number
  otro: number
  corporate: number
  other: number
}

interface DailyBalanceProps {
  todaySales: number
  todayExpenses: number
  todayBalance: number
  dailyTarget: number
  platformBreakdown: PlatformBreakdown
  formatCurrency: (amount: number) => string
}

const platformColors: Record<string, string> = {
  uber: 'bg-zinc-700 text-white',
  indriver: 'bg-emerald-600 text-white',
  cabify: 'bg-purple-600 text-white',
  taxi: 'bg-yellow-500 text-black',
  otro: 'bg-gray-500 text-white',
  corporate: 'bg-blue-600 text-white',
  other: 'bg-slate-600 text-white',
}

const platformNames: Record<string, string> = {
  uber: 'Uber',
  indriver: 'InDriver',
  cabify: 'Cabify',
  taxi: 'Taxi',
  otro: 'Otro',
  corporate: 'Corp',
  other: 'Varios',
}

function getMotivationMessage(percent: number, goalMet: boolean): { message: string; icon: typeof Trophy } {
  if (goalMet) {
    return { message: 'Meta cumplida! Excelente trabajo!', icon: Trophy }
  }
  if (percent >= 90) {
    return { message: 'Ya casi! Un ultimo esfuerzo!', icon: Flame }
  }
  if (percent >= 70) {
    return { message: 'Buen ritmo! Sigue asi!', icon: Flame }
  }
  if (percent >= 50) {
    return { message: 'Vas por buen camino!', icon: Target }
  }
  if (percent >= 25) {
    return { message: 'Cada viaje cuenta!', icon: Car }
  }
  return { message: 'Arrancando el dia con todo!', icon: Car }
}

export function DailyBalance({ 
  todaySales, 
  todayExpenses, 
  todayBalance, 
  dailyTarget,
  platformBreakdown,
  formatCurrency 
}: DailyBalanceProps) {
  const isPositive = todayBalance > 0
  const isNegative = todayBalance < 0
  
  const goalMet = dailyTarget > 0 && todayBalance >= dailyTarget
  const goalPercent = dailyTarget > 0 ? Math.min(100, (todayBalance / dailyTarget) * 100) : 0
  
  const { message: motivationMessage, icon: MotivationIcon } = getMotivationMessage(goalPercent, goalMet)

  // Filter platforms with values > 0
  const activePlatforms = Object.entries(platformBreakdown)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])

  return (
    <Card className={`border-0 shadow-sm transition-colors ${
      goalMet 
        ? 'bg-accent/20 border-2 border-accent' 
        : 'bg-card'
    }`}>
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Saldo del Dia
          </span>
          <div className={`flex items-center gap-1 ${
            goalMet 
              ? 'text-accent' 
              : isPositive 
                ? 'text-accent' 
                : isNegative 
                  ? 'text-destructive' 
                  : 'text-muted-foreground'
          }`}>
            {goalMet ? (
              <Trophy className="w-4 h-4" />
            ) : isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : isNegative ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
          </div>
        </div>

        {/* Main Balance */}
        <div className={`text-2xl font-bold tracking-tight mb-2 ${
          goalMet 
            ? 'text-accent' 
            : isPositive 
              ? 'text-accent' 
              : isNegative 
                ? 'text-destructive' 
                : 'text-foreground'
        }`}>
          {isPositive && '+'}{formatCurrency(todayBalance)}
        </div>

        {/* Motivation Message */}
        {dailyTarget > 0 && (
          <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg ${
            goalMet 
              ? 'bg-accent/20' 
              : goalPercent >= 70 
                ? 'bg-warning/10' 
                : 'bg-secondary/50'
          }`}>
            <MotivationIcon className={`w-4 h-4 flex-shrink-0 ${
              goalMet 
                ? 'text-accent' 
                : goalPercent >= 70 
                  ? 'text-warning' 
                  : 'text-muted-foreground'
            }`} />
            <span className={`text-xs font-medium ${
              goalMet 
                ? 'text-accent' 
                : goalPercent >= 70 
                  ? 'text-warning' 
                  : 'text-muted-foreground'
            }`}>
              {motivationMessage}
            </span>
            {!goalMet && dailyTarget > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {Math.round(goalPercent)}%
              </span>
            )}
          </div>
        )}

        {/* Platform Breakdown */}
        {activePlatforms.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
              Desglose de Ingresos
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activePlatforms.map(([platform, amount]) => (
                <Badge 
                  key={platform} 
                  className={`text-[10px] px-2 py-0.5 ${platformColors[platform]}`}
                >
                  {platformNames[platform]}: {formatCurrency(amount)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sales vs Expenses Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-2 rounded-lg bg-accent/10">
            <span className="text-xs text-muted-foreground">Ingresos</span>
            <span className="text-sm font-semibold text-accent">{formatCurrency(todaySales)}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
            <span className="text-xs text-muted-foreground">Gastos</span>
            <span className="text-sm font-semibold text-destructive">{formatCurrency(todayExpenses)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
