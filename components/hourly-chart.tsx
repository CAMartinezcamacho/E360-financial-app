'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Clock } from 'lucide-react'
import type { Transaction } from '@/lib/types'

interface HourlyChartProps {
  transactions: Transaction[]
  formatCurrency: (amount: number) => string
  shiftStartHour?: number
}

const isInternalTransaction = (title: string) =>
  title.startsWith('↗ ') || title.startsWith('↙ ')

const chartConfig = {
  earnings: { label: 'Ganancias', color: '#22c55e' },
}

export function HourlyChart({ transactions, formatCurrency, shiftStartHour = 0 }: HourlyChartProps) {
  const hourlyData = useMemo(() => {
    // Only count sales/income, not expenses or internal transfers
    const salesTransactions = transactions.filter(
      (t) => t.type === 'sale' && !isInternalTransaction(t.title)
    )

    // Aggregate by hour of day
    const hourTotals = Array.from({ length: 24 }, (_, i) => ({ hour: i, total: 0, count: 0 }))

    for (const t of salesTransactions) {
      const hour = new Date(t.timestamp).getHours()
      hourTotals[hour].total += t.amount
      hourTotals[hour].count++
    }

    // Build ordered array starting from shiftStartHour
    const ordered = []
    for (let i = 0; i < 24; i++) {
      const hour = (shiftStartHour + i) % 24
      const label = hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`
      ordered.push({
        hour,
        label,
        total: hourTotals[hour].total,
        count: hourTotals[hour].count,
      })
    }

    return ordered
  }, [transactions, shiftStartHour])

  const maxTotal = Math.max(...hourlyData.map((d) => d.total), 1)
  const hasData = hourlyData.some((d) => d.total > 0)

  // Find best hour
  const bestHour = hasData
    ? hourlyData.reduce((best, d) => (d.total > best.total ? d : best), hourlyData[0])
    : null

  if (!hasData) {
    return (
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Ganancias por Hora
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-6">
            Sin datos suficientes para mostrar el gráfico horario.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Ganancias por Hora
        </CardTitle>
        {bestHour && (
          <p className="text-xs text-muted-foreground">
            Mejor hora:{' '}
            <span className="font-medium text-foreground">
              {bestHour.label} — {formatCurrency(bestHour.total)}
            </span>
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0 pb-3">
        <ChartContainer config={chartConfig} className="h-40 w-full px-2">
          <BarChart data={hourlyData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="bg-card border border-border rounded-lg p-2 shadow-md text-xs">
                    <p className="font-medium">{`${d.hour}:00 hs`}</p>
                    <p className="text-primary">{formatCurrency(d.total)}</p>
                    {d.count > 0 && (
                      <p className="text-muted-foreground">{d.count} viaje{d.count !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                )
              }}
            />
            <Bar dataKey="total" radius={[3, 3, 0, 0]}>
              {hourlyData.map((entry) => (
                <Cell
                  key={entry.hour}
                  fill={
                    entry.total === maxTotal && entry.total > 0
                      ? '#22c55e'
                      : '#22c55e66'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
