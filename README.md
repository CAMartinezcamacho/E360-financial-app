# 💰 E360 - Financial Dashboard

**Control total de tus finanzas personales y empresariales en un dashboard interactivo**

[![Vercel](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel)](https://e360-financial-app.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](.)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](.)
[![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](.)
[![License MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📋 Descripción

**E360** es un dashboard financiero moderno, intuitivo y potente para:
- 💵 Registrar ingresos y gastos en tiempo real
- 📊 Analizar tendencias con gráficos interactivos
- 🎯 Crear presupuestos y recibir alertas
- 📈 Exportar reportes mensuales
- 👥 Gestión multi-usuario

Diseñado para emprendedores, freelancers y pequeños negocios en Colombia que necesitan visibilidad financiera **sin complicaciones**.

---

## ✨ Características Principales

### 📊 Dashboard Inteligente
- Vista general de ingresos vs gastos (mes actual/año)
- Gráficos de tendencias por categoría
- Tarjetas de resumen rápido
- Dark mode integrado

### 💼 Gestión de Transacciones
- Crear, editar, eliminar ingresos/gastos
- Categorización automática
- Búsqueda y filtros avanzados
- Historial completo

### 🎯 Presupuestos & Alertas
- Definir presupuestos por categoría
- Alertas cuando se alcance 80% del presupuesto
- Proyecciones automáticas de gasto

### 📈 Reportes & Exportación
- Reportes mensuales PDF
- Exportación a Excel
- Gráficos descargables
- Email de resumen semanal (próxima versión)

### 👥 Multi-Usuario
- Autenticación segura (Firebase)
- Perfiles individuales
- Compartir presupuestos entre usuarios

---

## 🚀 Quick Start

### Requisitos
- Node.js 18+
- npm o yarn
- Cuenta Firebase (gratis)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/CAMartinezcamacho/E360-financial-app.git
cd E360-financial-app

# Instalar dependencias
npm install

# Variables de entorno
cp .env.example .env.local
# Llenar FIREBASE_API_KEY, etc.

# Ejecutar desarrollo
npm run dev

# Build para producción
npm run build
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Estructura de Proyecto

```
E360-financial-app/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── Dashboard.tsx
│   │   ├── TransactionForm.tsx
│   │   └── Charts.tsx
│   ├── pages/           # Rutas principales
│   │   ├── dashboard.tsx
│   │   ├── transactions.tsx
│   │   └── budgets.tsx
│   ├── services/        # Lógica Firebase
│   │   ├── auth.ts
│   │   └── firestore.ts
│   ├── styles/          # Tailwind + globals
│   └── App.tsx
├── .env.example
├── package.json
└── vercel.json
```

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|-----------|-----|
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **Firebase** | Auth + Database |
| **Chart.js / Recharts** | Gráficos |
| **Vercel** | Hosting & Deploy |

---

## 📊 Casos de Uso Reales

### 👨‍💼 Freelancer/Consultor
Seguimiento de ingresos por proyecto, deducibles, y balance mensual.

### 🍽️ Pequeño Negocio
E360 es usado en **El Sazón Tolimense** (restaurante) para:
- Ingresos diarios por venta
- Gastos en insumos/servicios
- Análisis de rentabilidad por plato

### 📈 Empresa Pequeña
Múltiples usuarios, presupuestos departamentales, reportes ejecutivos.

---

## 🎯 Roadmap

- [ ] Integración con APIs bancarias (plaid.com)
- [ ] Análisis predictivo de gastos con IA
- [ ] Mobile app nativa (React Native)
- [ ] Notificaciones push
- [ ] Integración con contadores

---

## 🤝 Contribuciones

¿Encontraste un bug? ¿Tienes ideas?

1. Fork el repositorio
2. Crea tu rama: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Abre un Pull Request

---

## 📸 Screenshots

> Próximamente - Agrega screenshots del dashboard aquí

---

## 📝 Changelog

### v1.2.0 (Actual)
- ✅ Dark mode completo
- ✅ Exportación a Excel
- ✅ Alertas de presupuesto
- ✅ Búsqueda avanzada

### v1.1.0
- ✅ Gráficos de tendencias
- ✅ Categorías personalizadas

### v1.0.0
- ✅ Versión inicial
- ✅ Dashboard, transacciones, presupuestos

---

## 📧 Soporte

¿Problemas? ¿Preguntas?
- 📧 Email: krlos1993a@gmail.com
- 💬 WhatsApp: +57 304-369-1037
- 💼 LinkedIn: [carlos-martinez](https://linkedin.com/in/carlos-martinez-4145291b4)

---

## 📄 Licencia

MIT License - Copyright © 2024 Carlos Andrey Martínez Camacho

Siéntete libre de usar, modificar y distribuir este proyecto.

---

## ⭐ Agradecimiento

Si E360 te ayuda a controlar mejor tus finanzas, dale una ⭐ en GitHub!

**Hecho con ❤️ en Bogotá, Colombia**
