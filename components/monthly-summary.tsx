'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, ArrowUpRight, ArrowDownRight, Wallet, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Transaction } from '@/lib/types'

interface MonthlySummaryProps {
  monthSales: number
  monthExpenses: number
  netIncome: number
  formatCurrency: (amount: number) => string
  monthTransactions?: Transaction[]
}

export function MonthlySummary({ monthSales, monthExpenses, netIncome, formatCurrency, monthTransactions = [] }: MonthlySummaryProps) {
  const [showSalesDetail, setShowSalesDetail] = useState(false)
  const currentMonth = new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date())
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)

  // Filter sales transactions (same logic as in use-finance)
  const isInternalTransaction = (title: string) => {
    return title.startsWith('↗ ') || 
           title.startsWith('↙ ') ||
           title.startsWith('Reinicio de saldo') ||
           title.startsWith('Ajuste:')
  }

  const salesTransactions = monthTransactions
    .filter((t) => t.type === 'sale' && !isInternalTransaction(t.title))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const calculatedTotal = salesTransactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {capitalizedMonth}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="ghost"
            className="flex flex-col items-center p-2 rounded-lg bg-accent/5 h-auto hover:bg-accent/10"
            onClick={() => setShowSalesDetail(!showSalesDetail)}
          >
            <ArrowUpRight className="w-4 h-4 text-accent" />
            <span className="text-[10px] text-muted-foreground">Ventas</span>
            <span className="text-xs font-semibold text-accent">{formatCurrency(monthSales)}</span>
            {showSalesDetail ? (
              <ChevronUp className="w-2.5 h-2.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
            )}
          </Button>

          <div className="flex flex-col items-center p-2 rounded-lg bg-destructive/5">
            <ArrowDownRight className="w-4 h-4 text-destructive" />
            <span className="text-[10px] text-muted-foreground">Gastos</span>
            <span className="text-xs font-semibold text-destructive">{formatCurrency(monthExpenses)}</span>
          </div>

          <div className={`flex flex-col items-center p-2 rounded-lg ${
            netIncome >= 0 ? 'bg-accent/5' : 'bg-destructive/5'
          }`}>
            <Wallet className={`w-4 h-4 ${
              netIncome >= 0 ? 'text-accent' : 'text-destructive'
            }`} />
            <span className="text-[10px] text-muted-foreground">Neto</span>
            <span className={`text-xs font-semibold ${
              netIncome >= 0 ? 'text-accent' : 'text-destructive'
            }`}>
              {formatCurrency(netIncome)}
            </span>
          </div>
        </div>

        {/* Sales Detail Panel */}
        {showSalesDetail && (
          <div className="mt-4 p-3 rounded-xl bg-muted/50 border">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium">Desglose de Ventas ({salesTransactions.length})</span>
              <span className="text-xs text-muted-foreground">
                Suma: {formatCurrency(calculatedTotal)}
              </span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {salesTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No hay ventas este mes</p>
              ) : (
                salesTransactions.map((t, index) => (
                  <div key={t.id} className="flex justify-between items-center text-sm py-1 border-b border-muted last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{index + 1}. {t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.timestamp).toLocaleDateString('es-MX', { 
                          day: '2-digit', 
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className="text-accent font-semibold ml-2">
                      +{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
            {monthSales !== calculatedTotal && (
              <div className="mt-3 p-2 bg-destructive/10 rounded text-destructive text-xs">
                ERROR: La suma mostrada ({formatCurrency(monthSales)}) no coincide con el calculo ({formatCurrency(calculatedTotal)})
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
