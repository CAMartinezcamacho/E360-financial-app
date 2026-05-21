'use client'

import { Progress } from '@/components/ui/progress'
import { AlertTriangle, CheckCircle, TrendingUp, Flame, Sparkles, Trophy, Coffee, Zap, Rocket } from 'lucide-react'
import { getDailyQuote } from '@/lib/quotes'

interface SurvivalHeaderProps {
  coveragePercent: number
  shortfall: number
  totalFixedExpenses: number
  unpaidFixedExpenses: number
  netIncome: number
  dailyTarget: number
  todayBalance: number
  userName: string
  formatCurrency: (amount: number) => string
  isTodayRestDay: boolean
  remainingWorkingDays: number
  dailyDebtPortion?: number // Prorrateo diario de deudas recurrentes + cuotas diarias
}

// Dynamic motivation messages based on goal progress
function getDailyMotivation(percent: number, goalMet: boolean): { message: string; color: string } {
  if (goalMet) {
    return { message: 'Meta cumplida! Excelente trabajo, campeon!', color: 'text-accent' }
  }
  if (percent >= 90) {
    return { message: 'Ya casi llegas! Un ultimo esfuerzo!', color: 'text-accent' }
  }
  if (percent >= 75) {
    return { message: 'Vas muy bien! Sigue con ese ritmo!', color: 'text-warning' }
  }
  if (percent >= 50) {
    return { message: 'Buen progreso! Vas por buen camino!', color: 'text-foreground' }
  }
  if (percent >= 25) {
    return { message: 'Cada viaje cuenta! Sigue adelante!', color: 'text-foreground' }
  }
  if (percent > 0) {
    return { message: 'Arrancando con todo! Tu puedes!', color: 'text-muted-foreground' }
  }
  return { message: 'Nuevo dia, nueva oportunidad!', color: 'text-muted-foreground' }
}

export function SurvivalHeader({
  coveragePercent,
  shortfall,
  totalFixedExpenses,
  unpaidFixedExpenses,
  netIncome,
  dailyTarget,
  todayBalance,
  userName,
  formatCurrency,
  isTodayRestDay,
  remainingWorkingDays,
  dailyDebtPortion = 0,
}: SurvivalHeaderProps) {
  const isCovered = shortfall <= 0
  const isOnTrack = coveragePercent >= 50
  const dailyQuote = getDailyQuote()

  // Meta diaria dinamica usando Saldo Real (todayBalance = ventas - gastos)
  const dailyRemaining = Math.max(0, dailyTarget - todayBalance)
  const dailyGoalMet = todayBalance >= dailyTarget && dailyTarget > 0
  const dailyProgress = dailyTarget > 0 ? Math.min(100, (todayBalance / dailyTarget) * 100) : 0
  const isCloseToDailyGoal = dailyProgress >= 70 && dailyProgress < 100

  // Get dynamic motivation based on progress
  const motivation = getDailyMotivation(dailyProgress, dailyGoalMet)

  return (
    <header className="bg-card border-b border-border px-3 py-3 sticky top-0 z-40">
      <div className="max-w-lg mx-auto">
        {/* App Name, Greeting and Status - Combined Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-accent tracking-tight">E360</h1>
            {userName && (
              <span className="text-sm text-muted-foreground">
                | <span className="font-medium text-foreground">{userName}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isCovered ? (
              <CheckCircle className="w-4 h-4 text-accent" />
            ) : isOnTrack ? (
              <TrendingUp className="w-4 h-4 text-warning" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-destructive" />
            )}
            <span className="text-sm font-medium text-foreground">
              {Math.round(coveragePercent)}%
            </span>
          </div>
        </div>

        {/* Rest Day Message - Compact */}
        {isTodayRestDay && !isCovered && (
          <div className="mb-2 p-2 rounded-lg bg-accent/10 border border-accent/30">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-accent flex-shrink-0" />
              <p className="text-xs font-medium text-accent">Dia de descanso - Tu meta se reparte entre dias laborales</p>
            </div>
          </div>
        )}

        {/* Termometro de Meta - Compact */}
        <div className="space-y-1">
          <Progress 
            value={coveragePercent} 
            className={`h-2 ${isCovered ? '[&>[data-slot=progress-indicator]]:bg-accent' : isOnTrack ? '[&>[data-slot=progress-indicator]]:bg-warning' : '[&>[data-slot=progress-indicator]]:bg-destructive'}`}
          />
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {formatCurrency(netIncome)} / {formatCurrency(unpaidFixedExpenses)}
            </span>
            {!isCovered && (
              <span className="text-destructive font-medium">
                -{formatCurrency(shortfall)}
              </span>
            )}
          </div>
        </div>

        {/* Meta diaria prorrateada - Compact */}
        {dailyTarget > 0 && !isTodayRestDay && (
          <div className={`mt-2 p-2 rounded-lg border transition-colors ${
            dailyGoalMet 
              ? 'bg-accent/20 border-accent/40' 
              : isCloseToDailyGoal 
                ? 'bg-warning/10 border-warning/30' 
                : 'bg-accent/10 border-accent/20'
          }`}>
            <div className="flex items-center gap-2">
              {dailyGoalMet ? (
                <>
                  <Trophy className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-xs font-bold text-accent">{motivation.message}</span>
                </>
              ) : isCloseToDailyGoal ? (
                <>
                  <Flame className="w-4 h-4 text-warning flex-shrink-0" />
                  <span className="text-xs font-medium text-warning">
                    {motivation.message}
                  </span>
                </>
              ) : dailyProgress >= 25 ? (
                <>
                  <Zap className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className={`text-xs font-medium ${motivation.color}`}>
                    {motivation.message}
                  </span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className={`text-xs font-medium ${motivation.color}`}>
                    {motivation.message}
                  </span>
                </>
              )}
            </div>
            {/* Barra de progreso diario */}
            {!dailyGoalMet && (
              <div className="mt-1.5">
                <Progress 
                  value={dailyProgress} 
                  className={`h-1.5 ${
                    isCloseToDailyGoal 
                      ? '[&>[data-slot=progress-indicator]]:bg-warning' 
                      : '[&>[data-slot=progress-indicator]]:bg-accent'
                  }`}
                />
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[10px] text-muted-foreground">
                    {formatCurrency(todayBalance)} / {formatCurrency(dailyTarget)}
                    {remainingWorkingDays > 1 && (
                      <span className="ml-1">- {remainingWorkingDays} dias</span>
                    )}
                  </p>
                  <p className="text-[10px] font-semibold text-accent">
                    Faltan: {formatCurrency(dailyRemaining)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Frase Motivacional del Dia - Compact */}
        <div className="mt-2 p-2 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-start gap-1.5">
            <Sparkles className="w-3 h-3 text-accent mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground italic leading-relaxed line-clamp-2">
              &ldquo;{dailyQuote}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
