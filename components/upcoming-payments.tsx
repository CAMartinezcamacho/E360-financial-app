'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, AlertCircle, Clock, AlertTriangle } from 'lucide-react'
import type { FixedExpense } from '@/lib/types'

interface UpcomingPayment extends FixedExpense {
  daysUntil: number
}

interface UpcomingPaymentsProps {
  payments: UpcomingPayment[]
  formatCurrency: (amount: number) => string
}

export function UpcomingPayments({ payments, formatCurrency }: UpcomingPaymentsProps) {
  if (payments.length === 0) return null

  const totalUpcoming = payments.reduce((sum, p) => sum + p.amount, 0)
  const hasOverdue = payments.some((p) => p.daysUntil < 0)
  const hasUrgent = payments.some((p) => p.daysUntil >= 0 && p.daysUntil <= 3)

  return (
    <Card className={`border-0 shadow-sm ${
      hasOverdue ? 'bg-destructive/10 border border-destructive/30' : 
      hasUrgent ? 'bg-warning/10 border border-warning/30' : 
      'bg-card'
    }`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {hasOverdue ? (
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            ) : hasUrgent ? (
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            ) : (
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="text-xs font-medium text-muted-foreground uppercase">Vencimientos</span>
          </div>
          <span className={`text-xs font-semibold ${hasOverdue ? 'text-destructive' : hasUrgent ? 'text-warning' : 'text-foreground'}`}>
            {formatCurrency(totalUpcoming)}
          </span>
        </div>
        
        <div className="space-y-1.5">
          {payments.map((payment) => {
            const isOverdue = payment.daysUntil < 0
            const isUrgent = payment.daysUntil >= 0 && payment.daysUntil <= 3
            const isToday = payment.daysUntil === 0

            return (
              <div 
                key={payment.id} 
                className={`flex items-center justify-between p-2 rounded-lg ${
                  isOverdue ? 'bg-destructive/20' : 
                  isToday ? 'bg-warning/20' :
                  isUrgent ? 'bg-warning/10' : 
                  'bg-secondary/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isOverdue ? 'bg-destructive/20 text-destructive' : 
                    isUrgent ? 'bg-warning/20 text-warning' : 
                    'bg-accent/10 text-accent'
                  }`}>
                    {isOverdue ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : isToday ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium truncate ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                      {payment.name}
                    </p>
                    <p className={`text-[10px] ${
                      isOverdue ? 'text-destructive' : 
                      isUrgent ? 'text-warning' : 
                      'text-muted-foreground'
                    }`}>
                      {isOverdue 
                        ? `Vencido hace ${Math.abs(payment.daysUntil)}d` 
                        : isToday 
                          ? 'HOY!' 
                          : `${payment.daysUntil}d`
                      }
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-bold ml-2 ${isOverdue ? 'text-destructive' : isUrgent ? 'text-warning' : 'text-foreground'}`}>
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            )
          })}
        </div>
        
        {/* Reserve Alert - Compact */}
        {(hasOverdue || hasUrgent) && (
          <div className={`mt-2 p-2 rounded-lg ${hasOverdue ? 'bg-destructive/20' : 'bg-warning/20'}`}>
            <p className={`text-[10px] font-medium ${hasOverdue ? 'text-destructive' : 'text-warning'}`}>
              {hasOverdue 
                ? `Pagos vencidos! Reserva ${formatCurrency(totalUpcoming)}`
                : `Reservar ${formatCurrency(totalUpcoming)} para proximos dias`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
