'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
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

const isInternalTransaction = (title: string) =>
  title.startsWith('↗ ') ||
  title.startsWith('↙ ') ||
  title.startsWith('Reinicio de saldo') ||
  title.startsWith('Ajuste:')

const compactValue = (v: number) => {
  if (v === 0) return ''
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return String(Math.round(v))
}

const chartConfig = {
  sales: { label: 'Ventas', color: '#22c55e' },
  expenses: { label: 'Gastos', color: '#ef4444' },
  net: { label: 'Neto', color: '#3b82f6' },
}

export function DailyChart({ transactions, formatCurrency }: DailyChartProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'comparison' | 'net'>('comparison')

  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const dailyData = useMemo(() => {
    const monthTxns = transactions.filter((t) => {
      const d = new Date(t.timestamp)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    const data: DailyData[] = []
    for (let day = 1; day <= currentDay; day++) {
      const dayTxns = monthTxns.filter((t) => new Date(t.timestamp).getDate() === day)
      const sales = dayTxns
        .filter((t) => t.type === 'sale' && !isInternalTransaction(t.title))
        .reduce((s, t) => s + t.amount, 0)
      const expenses = dayTxns
        .filter((t) => t.type === 'expense' && !isInternalTransaction(t.title))
        .reduce((s, t) => s + t.amount, 0)
      data.push({
        day,
        dayLabel: String(day),
        sales,
        expenses,
        net: sales - expenses,
        isToday: day === currentDay,
        hasData: dayTxns.length > 0,
      })
    }
    return data
  }, [transactions, currentMonth, currentYear, currentDay])

  const summary = useMemo(() => {
    const daysWithData = dailyData.filter((d) => d.hasData)
    const totalSales = dailyData.reduce((s, d) => s + d.sales, 0)
    const totalExpenses = dailyData.reduce((s, d) => s + d.expenses, 0)
    const avgSales = daysWithData.length > 0 ? totalSales / daysWithData.length : 0
    const avgExpenses = daysWithData.length > 0 ? totalExpenses / daysWithData.length : 0
    const best = [...dailyData].sort((a, b) => b.net - a.net)[0]
    const worst = daysWithData.length > 0 ? [...daysWithData].sort((a, b) => a.net - b.net)[0] : dailyData[0]
    return { totalSales, totalExpenses, avgSales, avgExpenses, bestDay: best, worstDay: worst, daysWithData: daysWithData.length }
  }, [dailyData])

  const totalPoints = dailyData.length
  // Show label every N points to avoid clutter
  const labelEvery = totalPoints <= 10 ? 1 : totalPoints <= 20 ? 2 : 3

  // Custom dot renderer — shows a marker + value label above the dot
  const makeDot = (color: string, labelOffset = 10) =>
    ({ cx, cy, value, index, payload }: { cx?: number; cy?: number; value?: number; index?: number; payload?: DailyData }) => {
      if (cx === undefined || cy === undefined || index === undefined) return <g key={`d-${index}`} />
      const isToday = payload?.isToday ?? false
      const r = isToday ? 5 : 3
      const showLabel = (value ?? 0) > 0 && (index % labelEvery === 0 || isToday)
      return (
        <g key={`dot-${color}-${index}`}>
          <circle cx={cx} cy={cy} r={r} fill={color} stroke={isToday ? '#fff' : 'none'} strokeWidth={isToday ? 1.5 : 0} />
          {showLabel && (
            <text
              x={cx}
              y={cy - labelOffset}
              textAnchor="middle"
              fontSize={8}
              fontWeight="700"
              fill={color}
            >
              {compactValue(value ?? 0)}
            </text>
          )}
        </g>
      )
    }

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
    if (!active || !payload?.length) return null
    const dayData = dailyData.find((d) => d.dayLabel === label)
    if (!dayData) return null
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-xs">
        <p className="font-semibold mb-2">
          {dayData.day} de {monthNames[currentMonth]}
          {dayData.isToday && <span className="ml-2 text-accent">(Hoy)</span>}
        </p>
        {viewMode === 'comparison' ? (
          <>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Ventas</span>
              <span className="font-medium text-green-500">+{formatCurrency(dayData.sales)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Gastos</span>
              <span className="font-medium text-red-500">-{formatCurrency(dayData.expenses)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-1 mt-1">
              <span className="text-muted-foreground">Neto</span>
              <span className={`font-bold ${dayData.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {dayData.net >= 0 ? '+' : ''}{formatCurrency(dayData.net)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Neto</span>
            <span className={`font-bold ${dayData.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {dayData.net >= 0 ? '+' : ''}{formatCurrency(dayData.net)}
            </span>
          </div>
        )}
      </div>
    )
  }

  const tickInterval = Math.max(0, Math.ceil(totalPoints / 8) - 1)

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 px-3">
        <button className="flex items-center justify-between w-full" onClick={() => setIsOpen(!isOpen)}>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Gráfica Diaria
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">{summary.daysWithData} días</span>
            {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 px-3 pb-3 space-y-3">
          <div className="flex gap-1.5">
            <Button
              variant={viewMode === 'comparison' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-7 text-[11px] px-2"
              onClick={() => setViewMode('comparison')}
            >
              Ventas vs Gastos
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

          {/* Extra top padding so labels above dots don't get clipped */}
          <div className="h-60 w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart data={dailyData} margin={{ top: 18, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30" />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval={tickInterval}
                  height={20}
                  label={{ value: 'Días', position: 'insideBottomRight', offset: -4, fontSize: 9, fill: '#9ca3af' }}
                />
                <YAxis
                  tick={{ fontSize: 8 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />

                {viewMode === 'comparison' ? (
                  <>
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={makeDot('#22c55e', 11)}
                      activeDot={{ r: 6, fill: '#22c55e' }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={makeDot('#ef4444', 11)}
                      activeDot={{ r: 6, fill: '#ef4444' }}
                      isAnimationActive={false}
                    />
                  </>
                ) : (
                  <>
                    <ReferenceLine y={0} stroke="#e5e7eb" strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={makeDot('#3b82f6', 11)}
                      activeDot={{ r: 6, fill: '#3b82f6' }}
                      isAnimationActive={false}
                    />
                  </>
                )}
              </LineChart>
            </ChartContainer>
          </div>

          {viewMode === 'comparison' && (
            <div className="flex items-center justify-center gap-5 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-green-500 rounded-full" />
                <span className="text-muted-foreground">Ventas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-red-500 rounded-full" />
                <span className="text-muted-foreground">Gastos</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent/10 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingUp className="w-3 h-3 text-accent flex-shrink-0" />
                <span className="text-[10px] text-muted-foreground">Prom. Ventas</span>
              </div>
              <p className="text-sm font-bold text-accent truncate">
                {formatCurrency(summary.avgSales)}<span className="text-[10px] font-normal">/día</span>
              </p>
            </div>
            <div className="bg-destructive/10 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingDown className="w-3 h-3 text-destructive flex-shrink-0" />
                <span className="text-[10px] text-muted-foreground">Prom. Gastos</span>
              </div>
              <p className="text-sm font-bold text-destructive truncate">
                {formatCurrency(summary.avgExpenses)}<span className="text-[10px] font-normal">/día</span>
              </p>
            </div>
          </div>

          {summary.daysWithData > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-accent/30 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Calendar className="w-3 h-3 text-accent flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground">Mejor Día</span>
                </div>
                <p className="text-xs font-semibold">Día {summary.bestDay?.day}</p>
                <p className="text-[10px] text-accent truncate">+{formatCurrency(summary.bestDay?.net ?? 0)}</p>
              </div>
              <div className="border border-destructive/30 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Calendar className="w-3 h-3 text-destructive flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground">Peor Día</span>
                </div>
                <p className="text-xs font-semibold">Día {summary.worstDay?.day}</p>
                <p className={`text-[10px] truncate ${(summary.worstDay?.net ?? 0) >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {(summary.worstDay?.net ?? 0) >= 0 ? '+' : ''}{formatCurrency(summary.worstDay?.net ?? 0)}
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-border pt-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground flex-shrink-0">Total Mes</span>
              <div className="text-right min-w-0">
                <span className="text-sm font-bold block truncate">
                  {summary.totalSales - summary.totalExpenses >= 0 ? '+' : ''}
                  {formatCurrency(summary.totalSales - summary.totalExpenses)}
                </span>
                <p className="text-[10px] text-muted-foreground truncate">
                  V: {formatCurrency(summary.totalSales)} | G: {formatCurrency(summary.totalExpenses)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
