# E360 - Control Financiero Diario 💰

> App de control financiero diseñada especialmente para conductores de plataformas digitales (Uber, InDriver, Cabify) y pequeños negocios.

🔗 **Demo en vivo:** [v0-financial-management-spa.vercel.app](https://v0-financial-management-spa.vercel.app)

---

## 📱 ¿Qué es E360?

E360 nació de una necesidad real: llevar el control financiero diario como conductor de plataformas digitales. La app calcula automáticamente cuánto necesitas generar cada día para cumplir con todos tus compromisos financieros.

### El problema que resuelve:
- ¿Cuánto debo ganar HOY para pagar mis deudas y gastos?
- ¿Cuánto me queda después de las comisiones de Uber/InDriver?
- ¿Cuánto debo pagar hoy de mi préstamo diario?
- ¿Cuánto tengo en mis cuentas (Nequi, Bancolombia, efectivo)?

---

## ✨ Funcionalidades principales

### 🚗 Registro de Viajes/Servicios
- Soporte para múltiples plataformas: **Uber (25%)**, **InDriver (15%)**, **Cabify (20%)**, Taxi, Otro
- Cálculo automático del valor neto después de comisión
- Registro de servicios corporativos
- Total neto del día en tiempo real

### 💳 Cuotas Diarias
- Registra préstamos con pagos diarios
- Calcula automáticamente la cuota diaria (valor total ÷ días)
- Barra de progreso visual
- Se suma automáticamente a la meta diaria

### 🎯 Meta Diaria Inteligente
- Calcula cuánto necesitas ganar cada día laboral
- Considera días laborales configurables (excluye días de descanso)
- Alerta cuando no has alcanzado la meta del día
- Muestra el progreso en tiempo real

### 📊 Control Financiero Completo
- **Hoy:** Ventas, gastos y balance del día
- **Historial:** Gráfica diaria con filtros
- **Créditos:** Control de lo que te deben y debes
- **Metas:** Resumen mensual, saldos por cuenta
- **Ajustes:** Personalización y días laborales

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| **Next.js 16** | Framework principal |
| **React 19** | UI Components |
| **TypeScript** | Tipado estático |
| **Tailwind CSS** | Estilos |
| **Radix UI** | Componentes accesibles |
| **Recharts** | Gráficas financieras |
| **React Hook Form + Zod** | Formularios con validación |
| **Vercel** | Deploy y hosting |

---

## 🚀 Instalación local

```bash
# Clonar el repositorio
git clone https://github.com/CAMartinezcamacho/E360-financial-app.git

# Entrar al directorio
cd E360-financial-app

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📸 Capturas de pantalla

### Dashboard Principal
- Meta del día con progreso
- Vencimientos próximos
- Saldo del día (ventas vs gastos)

### Registro de Viajes
- Selector de plataforma con comisión automática
- Valor cobrado → Valor neto calculado

### Cuotas Diarias
- Préstamos con pagos diarios
- Progreso visual de cada deuda

---

## 🎯 Casos de uso

**Para conductores de plataforma:**
- Registrar cada viaje con la plataforma y ver el neto real
- Saber exactamente cuánto generar al día para cubrir gastos

**Para pequeños negocios:**
- Control de ventas diarias
- Gestión de gastos hormiga
- Seguimiento de deudas y créditos

**Para cualquier persona:**
- Control de gastos fijos mensuales
- Meta de ahorro mensual
- Balance de cuentas bancarias

---

## 👨‍💻 Autor

**Carlos Martínez**  
📧 krlos1993a@gmail.com  
🔗 [GitHub](https://github.com/CAMartinezcamacho)

---

## 📄 Licencia

MIT License - libre para usar y modificar.
