'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Download,
  Smartphone,
  Trash2,
  AlertTriangle,
  User,
  Coins,
  Check,
  FileSpreadsheet,
  CalendarDays,
  Bell,
} from 'lucide-react'
import { downloadReport } from '@/lib/export'
import type { Transaction, FixedExpense } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserSettings } from '@/lib/types'
// Select is still used for currency selector

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

const currencyOptions = [
  { value: '$', label: '$ (USD/General)' },
  { value: 'MXN$', label: 'MXN$ (Peso Mexicano)' },
  { value: 'COP$', label: 'COP$ (Peso Colombiano)' },
  { value: 'ARS$', label: 'ARS$ (Peso Argentino)' },
  { value: 'S/', label: 'S/ (Sol Peruano)' },
  { value: 'Q', label: 'Q (Quetzal)' },
  { value: 'Bs', label: 'Bs (Boliviano)' },
  { value: 'RD$', label: 'RD$ (Peso Dominicano)' },
  { value: '€', label: '€ (Euro)' },
]

const weekDays = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miercoles', short: 'Mie' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sabado', short: 'Sab' },
]

interface SettingsPanelProps {
  settings: UserSettings
  onUpdateSettings: (settings: Partial<UserSettings>) => void
  onClearData: () => void
  transactions: Transaction[]
  fixedExpenses: FixedExpense[]
}

export function SettingsPanel({ settings, onUpdateSettings, onClearData, transactions, fixedExpenses }: SettingsPanelProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [customCurrency, setCustomCurrency] = useState('')
  const [showCustomCurrency, setShowCustomCurrency] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission)
    }
  }, [])

  const nonWorkingDays = settings.nonWorkingDays || []

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstallable(false)
      setDeferredPrompt(null)
    }
  }

  const handleCurrencyChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomCurrency(true)
    } else {
      setShowCustomCurrency(false)
      onUpdateSettings({ currencySymbol: value })
    }
  }

  const handleCustomCurrencySubmit = () => {
    if (customCurrency.trim()) {
      onUpdateSettings({ currencySymbol: customCurrency.trim() })
      setShowCustomCurrency(false)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ userName: e.target.value })
    setNameSaved(false)
  }

  const handleNameBlur = () => {
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  const handleExport = () => {
    downloadReport(transactions, fixedExpenses, settings.currencySymbol)
  }

  const handleToggleNotifications = async () => {
    if (settings.notificationsEnabled) {
      onUpdateSettings({ notificationsEnabled: false })
      return
    }
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (notifPermission === 'denied') return
    if (notifPermission === 'default') {
      const result = await Notification.requestPermission()
      setNotifPermission(result)
      if (result !== 'granted') return
    }
    onUpdateSettings({ notificationsEnabled: true })
  }

  const toggleNonWorkingDay = (day: number) => {
    const newNonWorkingDays = nonWorkingDays.includes(day)
      ? nonWorkingDays.filter((d) => d !== day)
      : [...nonWorkingDays, day]
    onUpdateSettings({ nonWorkingDays: newNonWorkingDays })
  }

  // Calculate working days this month
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  let workingDaysInMonth = 0
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(today.getFullYear(), today.getMonth(), day)
    if (!nonWorkingDays.includes(date.getDay())) {
      workingDaysInMonth++
    }
  }

  return (
    <div className="space-y-4">
      {/* Personalizacion */}
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4" />
            Personalizacion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName" className="text-sm text-muted-foreground">
              Tu Nombre
            </Label>
            <div className="relative">
              <Input
                id="userName"
                value={settings.userName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                placeholder="Como te llamas?"
                className="h-12 pr-10"
              />
              {nameSaved && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Aparecera como saludo en la pantalla principal
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dias Laborales */}
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Dias Laborales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Selecciona los dias que NO trabajas. La meta diaria se calculara solo con tus dias laborales.
          </p>
          
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const isNonWorking = nonWorkingDays.includes(day.value)
              return (
                <button
                  key={day.value}
                  onClick={() => toggleNonWorkingDay(day.value)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                    isNonWorking 
                      ? 'bg-muted text-muted-foreground' 
                      : 'bg-accent/10 text-accent border border-accent/30'
                  }`}
                >
                  <span className="text-xs font-medium">{day.short}</span>
                  {isNonWorking ? (
                    <span className="text-[10px] text-muted-foreground">Libre</span>
                  ) : (
                    <span className="text-[10px] text-accent">Laboral</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="p-3 rounded-xl bg-secondary/50 border border-border">
            <p className="text-sm text-foreground">
              Este mes tienes <span className="font-bold text-accent">{workingDaysInMonth} dias laborales</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tu meta diaria se divide entre estos dias para que puedas descansar sin perder el ritmo.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recordatorios */}
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Recordatorios de Viaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Recibe una notificación periódica mientras trabajas para recordarte apuntar cada servicio. Cada viaje registrado es dinero que controlas.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Activar recordatorios</span>
            <button
              onClick={handleToggleNotifications}
              disabled={notifPermission === 'denied'}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.notificationsEnabled && notifPermission === 'granted'
                  ? 'bg-accent'
                  : 'bg-muted'
              } disabled:opacity-40`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.notificationsEnabled && notifPermission === 'granted'
                    ? 'translate-x-5'
                    : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Permission denied warning */}
          {notifPermission === 'denied' && (
            <p className="text-xs text-destructive">
              Los permisos de notificación están bloqueados. Actívalos desde la configuración del navegador o la app.
            </p>
          )}

          {/* Interval selector */}
          {settings.notificationsEnabled && notifPermission === 'granted' && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Recordar cada</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {[15, 30, 45, 60].map((min) => (
                  <button
                    key={min}
                    onClick={() => onUpdateSettings({ notificationInterval: min })}
                    className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                      (settings.notificationInterval ?? 30) === min
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {min} min
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground">
              Los recordatorios funcionan mientras la app está abierta o en segundo plano. Fija la app en tu pantalla para mantenerla activa mientras conduces.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Moneda */}
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Moneda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Simbolo de Moneda
            </Label>
            <Select
              value={currencyOptions.some(o => o.value === settings.currencySymbol) ? settings.currencySymbol : 'custom'}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecciona tu moneda" />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Personalizado...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showCustomCurrency && (
            <div className="flex gap-2">
              <Input
                value={customCurrency}
                onChange={(e) => setCustomCurrency(e.target.value)}
                placeholder="Ej: £, ¥, ₡"
                className="h-12"
                maxLength={5}
              />
              <Button 
                onClick={handleCustomCurrencySubmit}
                className="h-12 px-6 active:scale-95"
              >
                Guardar
              </Button>
            </div>
          )}

          <div className="p-3 rounded-xl bg-secondary/50 border border-border">
            <p className="text-sm text-foreground">
              Simbolo actual: <span className="font-bold text-accent">{settings.currencySymbol}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Exportar Datos */}
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Descarga un reporte CSV con todas tus transacciones y gastos fijos.
          </p>
          <Button
            className="w-full h-12 bg-secondary hover:bg-secondary/80 text-foreground active:scale-95"
            onClick={handleExport}
            disabled={transactions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Reporte ({transactions.length} movimientos)
          </Button>
          {transactions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Aun no tienes transacciones para exportar
            </p>
          )}
        </CardContent>
      </Card>

      {/* Instalacion PWA */}
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Instalacion
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isInstalled ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/10">
              <Download className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">App instalada</p>
                <p className="text-xs text-muted-foreground">Enfoque 360 esta instalada en tu dispositivo</p>
              </div>
            </div>
          ) : isInstallable ? (
            <Button
              className="w-full h-14 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground active:scale-95"
              onClick={handleInstall}
            >
              <Download className="w-5 h-5 mr-2" />
              Instalar en el Celular
            </Button>
          ) : (
            <div className="p-3 rounded-xl bg-secondary/50 border border-border">
              <p className="text-sm text-muted-foreground">
                Para instalar la app, abre este sitio en Chrome (Android) o Safari (iOS) y selecciona &quot;Anadir a pantalla de inicio&quot;.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zona de Peligro */}
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Zona de Peligro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10 active:scale-95"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Borrar todos los datos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Estas seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion eliminara permanentemente todas tus transacciones, gastos fijos y configuraciones. Esta accion no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="active:scale-95">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95"
                  onClick={onClearData}
                >
                  Borrar todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Version */}
      <Card className="border-0 shadow-sm bg-card">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            <span className="text-accent font-semibold">Enfoque 360</span> v2.0 - Tus datos se guardan localmente en tu dispositivo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
