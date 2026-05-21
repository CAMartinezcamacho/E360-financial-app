import type { Transaction, FixedExpense } from '@/lib/types'

export function generateCSVReport(
  transactions: Transaction[],
  fixedExpenses: FixedExpense[],
  currencySymbol: string
): string {
  const lines: string[] = []

  // Header
  lines.push('REPORTE FINANCIERO - ENFOQUE 360')
  lines.push(`Generado el: ${new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date())}`)
  lines.push('')

  // Fixed Expenses Section
  lines.push('=== GASTOS FIJOS MENSUALES ===')
  lines.push('Nombre,Monto')
  const totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
  fixedExpenses.forEach((expense) => {
    lines.push(`"${expense.name}","${currencySymbol}${expense.amount}"`)
  })
  lines.push(`"TOTAL GASTOS FIJOS","${currencySymbol}${totalFixed}"`)
  lines.push('')

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  // Group transactions by month
  const transactionsByMonth = sortedTransactions.reduce((acc, t) => {
    const date = new Date(t.timestamp)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(date)
    
    if (!acc[monthKey]) {
      acc[monthKey] = { name: monthName, transactions: [] }
    }
    acc[monthKey].transactions.push(t)
    return acc
  }, {} as Record<string, { name: string; transactions: Transaction[] }>)

  // Transactions Section
  lines.push('=== MOVIMIENTOS ===')
  lines.push('Fecha,Hora,Tipo,Descripcion,Monto')
  
  Object.entries(transactionsByMonth)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([, monthData]) => {
      lines.push('')
      lines.push(`--- ${monthData.name.toUpperCase()} ---`)
      
      let monthSales = 0
      let monthExpenses = 0
      
      monthData.transactions.forEach((t) => {
        const date = new Date(t.timestamp)
        const dateStr = new Intl.DateTimeFormat('es-MX', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        }).format(date)
        const timeStr = new Intl.DateTimeFormat('es-MX', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }).format(date)
        const typeStr = t.type === 'sale' ? 'Venta' : 'Gasto'
        const sign = t.type === 'sale' ? '+' : '-'
        
        if (t.type === 'sale') {
          monthSales += t.amount
        } else {
          monthExpenses += t.amount
        }
        
        lines.push(`"${dateStr}","${timeStr}","${typeStr}","${t.title}","${sign}${currencySymbol}${t.amount}"`)
      })
      
      const monthNet = monthSales - monthExpenses
      lines.push('')
      lines.push(`"Ventas del mes","","","","+${currencySymbol}${monthSales}"`)
      lines.push(`"Gastos del mes","","","","-${currencySymbol}${monthExpenses}"`)
      lines.push(`"NETO DEL MES","","","","${monthNet >= 0 ? '+' : ''}${currencySymbol}${monthNet}"`)
    })

  // Summary Section
  lines.push('')
  lines.push('=== RESUMEN TOTAL ===')
  const totalSales = transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const totalNet = totalSales - totalExpenses
  
  lines.push(`Total Ventas,${currencySymbol}${totalSales}`)
  lines.push(`Total Gastos Variables,${currencySymbol}${totalExpenses}`)
  lines.push(`Total Gastos Fijos (mensual),${currencySymbol}${totalFixed}`)
  lines.push(`Neto Total,${totalNet >= 0 ? '+' : ''}${currencySymbol}${totalNet}`)
  lines.push(`Numero de Transacciones,${transactions.length}`)

  return lines.join('\n')
}

export function downloadReport(
  transactions: Transaction[],
  fixedExpenses: FixedExpense[],
  currencySymbol: string
): void {
  const csvContent = generateCSVReport(transactions, fixedExpenses, currencySymbol)
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  
  const date = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date()).replace(/\//g, '-')
  
  link.download = `enfoque360-reporte-${date}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
