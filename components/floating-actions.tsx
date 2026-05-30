'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X, TrendingUp, TrendingDown, Zap } from 'lucide-react'

interface FloatingActionsProps {
  onOpenSale: () => void
  onOpenExpense: () => void
  onOpenQuick?: () => void
}

export function FloatingActions({ onOpenSale, onOpenExpense, onOpenQuick }: FloatingActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed bottom-[72px] right-4 z-40 flex flex-col-reverse items-end gap-2">
      {/* Expanded Actions */}
      <div className={`flex flex-col-reverse items-end gap-2 transition-all duration-300 ${
        isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {/* Quick Trip Button */}
        {onOpenQuick && (
          <div className="flex items-center gap-2">
            <span className="bg-card px-2 py-1 rounded-full text-xs font-medium shadow-lg border border-border">
              ⚡ Viaje
            </span>
            <Button
              size="icon"
              className="w-11 h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg active:scale-95"
              onClick={() => { onOpenQuick(); setIsExpanded(false) }}
            >
              <Zap className="w-5 h-5" />
              <span className="sr-only">Viaje rapido</span>
            </Button>
          </div>
        )}

        {/* Sale Button */}
        <div className="flex items-center gap-2">
          <span className="bg-card px-2 py-1 rounded-full text-xs font-medium shadow-lg border border-border">
            + Venta
          </span>
          <Button
            size="icon"
            className="w-11 h-11 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg active:scale-95"
            onClick={() => {
              onOpenSale()
              setIsExpanded(false)
            }}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="sr-only">Agregar venta</span>
          </Button>
        </div>

        {/* Expense Button */}
        <div className="flex items-center gap-2">
          <span className="bg-card px-2 py-1 rounded-full text-xs font-medium shadow-lg border border-border">
            - Gasto
          </span>
          <Button
            size="icon"
            className="w-11 h-11 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg active:scale-95"
            onClick={() => {
              onOpenExpense()
              setIsExpanded(false)
            }}
          >
            <TrendingDown className="w-5 h-5" />
            <span className="sr-only">Agregar gasto</span>
          </Button>
        </div>
      </div>

      {/* Main FAB */}
      <Button
        size="icon"
        className={`w-12 h-12 rounded-full shadow-xl transition-all duration-300 active:scale-95 ${
          isExpanded 
            ? 'bg-muted text-muted-foreground rotate-45' 
            : 'bg-primary text-primary-foreground'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <X className="w-5 h-5" />
        ) : (
          <Plus className="w-5 h-5" />
        )}
        <span className="sr-only">{isExpanded ? 'Cerrar menu' : 'Agregar transaccion'}</span>
      </Button>

      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}
