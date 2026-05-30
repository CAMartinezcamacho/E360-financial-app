'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, BarChart3, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import type { Transaction } from '@/lib/types'

interface DailyChartProps {
  transactions: Transaction[]
  formatCurrency: (amount: number) => string
}

interface DailyData {
  day: number
  dayLabel: string
  sales: number
  expenses: number
  net: number
  isToday: boolean
  hasData: boolean
}

// Identify internal transactions that should NOT count toward totals
// Fixed: Now detects ANY transfer (↗/↙ prefix) regardless of custom description
const isInternalTransaction = (title: string) => {
  return title.startsWith('↗ ') ||  // Any outgoing transfer
         title.startsWith('↙ ') ||  // Any incoming transfer
         title.startsWith('Reinicio de saldo') ||
         title.startsWith('Ajuste:')
}

const chartConfig = {
  sales: {
    label: 'Ventas',
    color: '#22c55e',
  },
  expenses: {
    label: 'Gastos',
    color: '#ef4444',
  },
}

export function DailyChart({ transactions, formatCurrency }: DailyChartProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'comparison' | 'net'>('comparison')

  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  // Group transactions by day and calculate totals
  const dailyData = useMemo(() => {
    const data: DailyData[] = []

    // Filter transactions for current month only
    const monthTransactions = transactions.filter((t) => {
      const date = new Date(t.timestamp)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    // Create data for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTransactions = monthTransactions.filter((t) => {
        const date = new Date(t.timestamp)
        return date.getDate() === day
      })

      const sales = dayTransactions
        .filter((t) => t.type === 'sale' && !isInternalTransaction(t.title))
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = dayTransactions
        .filter((t) => t.type === 'expense' && !isInternalTransaction(t.title))
        .reduce((sum, t) => sum + t.amount, 0)

      data.push({
        day,
        dayLabel: day.toString(),
        sales,
        expenses,
        net: sales - expenses,
        isToday: day === currentDay,
        hasData: dayTransactions.length > 0,
      })
    }

    return data
  }, [transactions, currentMonth, currentYear, currentDay, daysInMonth])

  // Calculate summary statistics
  const summary = useMemo(() => {
    const daysWithData = dailyData.filter((d) => d.hasData)
    const totalSales = dailyData.reduce((sum, d) => sum + d.sales, 0)
    const totalExpenses = dailyData.reduce((sum, d) => sum + d.expenses, 0)
    const avgSales = daysWithData.length > 0 ? totalSales / daysWithData.length : 0
    const avgExpenses = daysWithData.length > 0 ? totalExpenses / daysWithData.length : 0
    const bestDay = dailyData.reduce((best, d) => (d.net > best.net ? d : best), dailyData[0])
    const worstDay = dailyData.filter((d) => d.hasData).reduce((worst, d) => (d.net < worst.net ? d : worst), dailyData.find((d) => d.hasData) || dailyData[0])

    return {
      totalSales,
      totalExpenses,
      avgSales,
      avgExpenses,
      bestDay,
      worstDay,
      daysWithData: daysWithData.length,
    }
  }, [dailyData])

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null

    const dayData = dailyData.find((d) => d.dayLabel === label)
    if (!dayData) return null

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm mb-2">
          {dayData.day} de {monthNames[currentMonth]}
          {dayData.isToday && <span className="ml-2 text-xs text-accent">(Hoy)</span>}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-accent" />
              Ventas
            </span>
            <span className="text-sm font-medium text-accent">+{formatCurrency(dayData.sales)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              Gastos
            </span>
            <span className="text-sm font-medium text-destructive">-{formatCurrency(dayData.expenses)}</span>
          </div>
          <div className="border-t border-border pt-1 mt-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Neto</span>
              <span className={`text-sm font-bold ${dayData.net >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {dayData.net >= 0 ? '+' : ''}{formatCurrency(dayData.net)}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 px-3">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            Grafica Diaria
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">
              {summary.daysWithData} dias
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 px-3 pb-3 space-y-3">
          {/* View mode toggle */}
          <div className="flex gap-1.5">
            <Button
              variant={viewMode === 'comparison' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-7 text-[11px] px-2"
              onClick={() => setViewMode('comparison')}
            >
              Comparativa
            </Button>
            <Button
              variant={viewMode === 'net' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-7 text-[11px] px-2"
              onClick={() => setViewMode('net')}
            >
              Balance Neto
            </Button>
          </div>

          {/* Chart */}
          <div className="h-52 w-full -mx-2">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30" />
                <XAxis 
                  dataKey="dayLabel" 
                  tick={{ fontSize: 9 }} 
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(daysInMonth / 7)}
                  height={20}
                />
                <YAxis 
                  tick={{ fontSize: 8 }} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                  width={35}
                />
                <ChartTooltip content={<CustomTooltip />} />
                
                {viewMode === 'comparison' ? (
                  <>
                    <Bar 
                      dataKey="sales" 
                      fill="#22c55e" 
                      radius={[2, 2, 0, 0]}
                      maxBarSize={8}
                    >
                      {dailyData.map((entry, index) => (
                        <Cell 
                          key={`sales-${index}`} 
                          fill={entry.isToday ? '#22c55e' : '#22c55e99'}
                          stroke={entry.isToday ? '#22c55e' : 'none'}
                          strokeWidth={entry.isToday ? 2 : 0}
                        />
                      ))}
                    </Bar>
                    <Bar 
                      dataKey="expenses" 
                      fill="#ef4444" 
                      radius={[2, 2, 0, 0]}
                      maxBarSize={8}
                    >
                      {dailyData.map((entry, index) => (
                        <Cell 
                          key={`expenses-${index}`} 
                          fill={entry.isToday ? '#ef4444' : '#ef444499'}
                          stroke={entry.isToday ? '#ef4444' : 'none'}
                          strokeWidth={entry.isToday ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </>
                ) : (
                  <>
                    <ReferenceLine y={0} stroke="#e5e7eb" />
                    <Bar 
                      dataKey="net" 
                      radius={[2, 2, 2, 2]}
                      maxBarSize={10}
                    >
                      {dailyData.map((entry, index) => (
                        <Cell 
                          key={`net-${index}`} 
                          fill={entry.net >= 0 ? '#22c55e' : '#ef4444'}
                          fillOpacity={entry.isToday ? 1 : 0.7}
                          stroke={entry.isToday ? (entry.net >= 0 ? '#22c55e' : '#ef4444') : 'none'}
                          strokeWidth={entry.isToday ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </>
                )}
              </BarChart>
            </ChartContainer>
          </div>

          {/* Legend */}
          {viewMode === 'comparison' && (
            <div className="flex items-center justify-center gap-4 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
                <span className="text-muted-foreground">Ventas</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-destructive" />
                <span className="text-muted-foreground">Gastos</span>
              </div>
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent/10 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingUp className="w-3 h-3 text-accent flex-shrink-0" />
                <span className="text-[10px] text-muted-foreground">Prom. Ventas</span>
              </div>
              <p className="text-sm font-bold text-accent truncate">{formatCurrency(summary.avgSales)}<span className="text-[10px] font-normal">/dia</span></p>
            </div>
            <div className="bg-destructive/10 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingDown className="w-3 h-3 text-destructive flex-shrink-0" />
                <span className="text-[10px] text-muted-foreground">Prom. Gastos</span>
              </div>
              <p className="text-sm font-bold text-destructive truncate">{formatCurrency(summary.avgExpenses)}<span className="text-[10px] font-normal">/dia</span></p>
            </div>
          </div>

          {/* Best/Worst days */}
          {summary.daysWithData > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-accent/30 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Calendar className="w-3 h-3 text-accent flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground">Mejor Dia</span>
                </div>
                <p className="text-xs font-semibold">Dia {summary.bestDay.day}</p>
                <p className="text-[10px] text-accent truncate">+{formatCurrency(summary.bestDay.net)}</p>
              </div>
              <div className="border border-destructive/30 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Calendar className="w-3 h-3 text-destructive flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground">Peor Dia</span>
                </div>
                <p className="text-xs font-semibold">Dia {summary.worstDay.day}</p>
                <p className={`text-[10px] truncate ${summary.worstDay.net >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {summary.worstDay.net >= 0 ? '+' : ''}{formatCurrency(summary.worstDay.net)}
                </p>
              </div>
            </div>
          )}

          {/* Monthly totals */}
          <div className="border-t border-border pt-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground flex-shrink-0">Total Mes</span>
              <div className="text-right min-w-0">
                <span className="text-sm font-bold block truncate">
                  {summary.totalSales - summary.totalExpenses >= 0 ? '+' : ''}
                  {formatCurrency(summary.totalSales - summary.