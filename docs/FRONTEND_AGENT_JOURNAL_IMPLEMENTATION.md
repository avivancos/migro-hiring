# 📊 Frontend - Agent Daily Journal Implementation

**Fecha**: 2025-01-29  
**Estado**: ✅ Completo  
**Versión**: 1.0

---

## 📋 Resumen Ejecutivo

Este documento describe la implementación completa del módulo frontend **Agent Daily Journal** (Diario de Trabajo Diario del Agente) en React con TypeScript. El módulo proporciona una interfaz mobile-first para que los agentes visualicen sus métricas diarias, reportes y dashboard de desempeño.

---

## 🎯 Funcionalidades Implementadas

### 1. Reporte Diario
- ✅ Visualización de métricas principales (llamadas, tiempo, tareas, notas, oportunidades)
- ✅ Selector de fecha con navegación prev/next
- ✅ Puntuación de productividad con badge visual
- ✅ Tasa de éxito de llamadas
- ✅ Gráfico de distribución de intentos de llamada (1-5)
- ✅ Lista de oportunidades trabajadas con detalles expandibles
- ✅ Sincronización manual de métricas
- ✅ Auto-refresh cada 5 minutos
- ✅ Firma digital del reporte
- ✅ Envío del reporte firmado por email a administradores

### 2. Dashboard de Desempeño
- ✅ Selector de período (Hoy, Semana, Mes)
- ✅ Métricas del período actual
- ✅ Comparación con período anterior (con porcentajes de cambio)
- ✅ Gráficos de tendencias (llamadas, tiempo, tareas, notas)
- ✅ Ranking en el equipo
- ✅ Promedio del equipo (si está disponible)

---

## 📁 Estructura de Archivos

```
src/
├── types/
│   └── agentJournal.ts              # Tipos TypeScript
├── services/
│   └── agentJournalApi.ts           # Cliente API
├── hooks/
│   └── useAgentJournal.ts           # Hooks personalizados
├── utils/
│   └── agentJournal.ts              # Utilidades de formateo
├── components/
│   └── agentJournal/
│       ├── MetricCard.tsx           # Card para métricas individuales
│       ├── ProductivityScoreBadge.tsx  # Badge de productividad
│       ├── CallAttemptsChart.tsx    # Gráfico de intentos
│       ├── TrendsChart.tsx          # Gráfico de tendencias
│       ├── OpportunityDetailCard.tsx # Card de oportunidad
│       ├── ComparisonCard.tsx       # Card de comparación
│       ├── PeriodSelector.tsx       # Selector de período
│       ├── DatePicker.tsx           # Selector de fecha
│       ├── SignReportDialog.tsx     # Diálogo de firma de reporte
│       ├── DailyReportView.tsx      # Vista de reporte diario
│       └── PerformanceDashboardView.tsx # Vista de dashboard
└── pages/
    └── CRMAgentJournal.tsx          # Página principal con tabs
```

---

## 🔌 Integración con Backend

### Endpoints Utilizados

1. **GET `/api/agent-journal/daily-report`**
   - Obtiene reporte diario del agente autenticado
   - Parámetros: `target_date` (opcional, formato: YYYY-MM-DD)

2. **GET `/api/agent-journal/performance-dashboard`**
   - Obtiene dashboard de desempeño
   - Parámetros: `period` (today/week/month)

3. **POST `/api/agent-journal/sync`**
   - Sincroniza/actualiza métricas del día
   - Parámetros: `target_date` (opcional)

4. **POST `/api/agent-journal/sign-and-send`**
   - Firma y envía el reporte diario por email a administradores
   - Body: `{ target_date?: string, agent_signature: string }`
   - Retorna: estado, IDs de destinatarios, fecha de firma

5. **GET `/api/agent-journal/metrics/{user_id}`** (Admin)
   - Obtiene métricas de un agente específico
   - Parámetros: `target_date` (opcional)

### Cliente API

El servicio `agentJournalApi` (`src/services/agentJournalApi.ts`) encapsula todas las llamadas al backend:

```typescript
// Ejemplo de uso
const report = await agentJournalApi.getDailyReport(new Date());
const dashboard = await agentJournalApi.getPerformanceDashboard('week');
await agentJournalApi.syncMetrics();
```

---

## 🪝 Hooks Personalizados

### `useDailyReport(targetDate?: Date)`

Hook para obtener el reporte diario con auto-refresh cada 5 minutos.

```typescript
const { data, isLoading, error, refetch } = useDailyReport(new Date());
```

### `usePerformanceDashboard(period: PeriodType)`

Hook para obtener el dashboard de desempeño.

```typescript
const { data, isLoading, error } = usePerformanceDashboard('week');
```

### `useSyncMetrics()`

Mutation hook para sincronizar métricas manualmente.

```typescript
const syncMetrics = useSyncMetrics();
await syncMetrics.mutateAsync(new Date());
```

### `useAgentMetrics(userId, targetDate?)`

Hook para obtener métricas de un agente específico (admin).

```typescript
const { data, isLoading } = useAgentMetrics(userId, new Date());
```

### `useSignAndSendReport()`

Mutation hook para firmar y enviar el reporte diario por email.

```typescript
const signAndSend = useSignAndSendReport();
await signAndSend.mutateAsync({
  targetDate: new Date(),
  agentSignature: 'Nombre Completo del Agente'
});
```

---

## 🎨 Componentes Principales

### MetricCard

Card para mostrar una métrica individual con comparación opcional.

**Props:**
- `title`: Título de la métrica
- `value`: Valor numérico o string
- `unit`: Unidad (opcional)
- `change`: Objeto con cambio porcentual e indicador positivo/negativo
- `icon`: Icono de Lucide React (opcional)
- `color`: Variante de color (primary/success/warning/danger)
- `loading`: Estado de carga

### ProductivityScoreBadge

Badge circular para mostrar puntuación de productividad (0-100).

**Props:**
- `score`: Puntuación (0-100 o null)
- `size`: Tamaño (sm/md/lg)
- `showLabel`: Mostrar etiqueta descriptiva

**Colores según score:**
- 80-100: Verde (Excelente)
- 60-79: Amarillo (Bueno)
- 40-59: Naranja (Regular)
- 0-39: Rojo (Bajo)

### CallAttemptsChart

Gráfico de barras apiladas para visualizar distribución de intentos de llamada.

**Props:**
- `data`: Array de CallAttemptDetail
- `loading`: Estado de carga

### TrendsChart

Gráfico de líneas para mostrar tendencias de métricas.

**Props:**
- `data`: Array de TrendDataPoint
- `metric`: Tipo de métrica (calls/time/tasks/notes)
- `loading`: Estado de carga

### OpportunityDetailCard

Card expandible para mostrar detalles de trabajo en una oportunidad.

**Props:**
- `opportunity`: Objeto OpportunityDetail
- `onViewOpportunity`: Callback para ver oportunidad completa

### ComparisonCard

Card para mostrar comparación con período anterior.

**Props:**
- `title`: Título de la métrica
- `current`: Valor actual
- `previous`: Valor anterior
- `unit`: Unidad (opcional)
- `changePercentage`: Porcentaje de cambio
- `loading`: Estado de carga

---

## 🛣️ Rutas

### Ruta Principal

```
/crm/journal
```

**Componente:** `CRMAgentJournal`

**Layout:** CRM Layout (con sidebar y header)

**Tabs:**
- "Reporte Diario" → `DailyReportView`
- "Dashboard" → `PerformanceDashboardView`

### Integración en Dashboard

El Agent Daily Journal se gestiona desde el dashboard principal (`CRMDashboardPage`), no desde el sidebar. Se muestra un widget (`AgentJournalWidget`) que muestra un resumen de las métricas del día actual, solo visible para agentes.

El widget incluye:
- Métricas principales (llamadas, tiempo, tareas, notas, oportunidades)
- Puntuación de productividad
- Tasa de éxito
- Botón para sincronizar métricas
- Botón para ver el reporte completo

Al hacer click en "Ver completo", se navega a la página completa del journal (`/crm/journal`) donde se puede ver el reporte detallado y el dashboard de desempeño.

---

## 🎨 Diseño Mobile-First

### Breakpoints

- **Mobile (base)**: 0px - 639px
  - Grid de 1 columna para métricas
  - Cards full-width
  - Tabs en top sticky

- **Tablet**: 640px+
  - Grid de 2 columnas para métricas
  - Botones side-by-side

- **Desktop**: 1024px+
  - Grid de 3-4 columnas para métricas
  - Gráficos más grandes
  - Mejor uso del espacio horizontal

### Principios de Diseño

1. **Jerarquía Visual Clara**
   - Métricas principales destacadas con números grandes (text-3xl)
   - Indicadores de cambio con flechas y colores semánticos
   - Información escaneable con layout vertical optimizado

2. **Estados Visuales**
   - Loading: Skeletons que imitan la estructura final
   - Empty: Mensajes claros cuando no hay datos
   - Error: Mensajes con opción de reintentar

3. **Interacciones Táctiles**
   - Touch targets mínimo 44x44px
   - Botones grandes y accesibles
   - Navegación intuitiva

---

## 🔄 Gestión de Estado

### TanStack Query

Todos los datos se gestionan con TanStack Query para:
- Caché automática
- Auto-refresh (5 minutos para reporte diario)
- Invalidación de caché al sincronizar
- Manejo de estados de carga y error

### Configuración de Queries

```typescript
// Reporte diario - Auto-refresh cada 5 min
staleTime: 2 * 60 * 1000, // 2 minutos
refetchInterval: 5 * 60 * 1000, // 5 minutos

// Dashboard - Sin auto-refresh
staleTime: 2 * 60 * 1000, // 2 minutos
```

---

## 🧩 Utilidades

### `formatCallTime(seconds: number): string`

Formatea tiempo de llamada de segundos a string legible.

```typescript
formatCallTime(3661) // "1h 1min"
formatCallTime(120)  // "2min"
formatCallTime(45)   // "45s"
```

### `formatChangePercentage(change: number): string`

Formatea porcentaje de cambio con signo.

```typescript
formatChangePercentage(12.5)  // "+12.5%"
formatChangePercentage(-5.2)  // "-5.2%"
```

### `getProductivityColor(score: number | null): string`

Obtiene color según puntuación de productividad.

---

## 📊 Gráficos

### Librería: Recharts

Se utiliza **Recharts** para los gráficos interactivos:

- `CallAttemptsChart`: Barras apiladas
- `TrendsChart`: Líneas con tooltips

### Responsive

Los gráficos son responsive gracias a `ResponsiveContainer` de Recharts, que se adapta automáticamente al tamaño del contenedor.

---

## 🔍 Navegación

### Desde el Sidebar

1. Click en "Diario" en el sidebar del CRM
2. Se abre la página con tab "Reporte Diario" activo por defecto
3. El usuario puede cambiar a tab "Dashboard"

### Navegación a Oportunidades

Desde el reporte diario, al hacer click en "Ver" en una oportunidad, se navega a:
```
/crm/opportunities/{opportunity_id}
```

---

## ✅ Checklist de Implementación

- [x] Crear tipos TypeScript
- [x] Crear servicio API
- [x] Crear hooks personalizados
- [x] Crear componente MetricCard
- [x] Crear componente ProductivityScoreBadge
- [x] Crear componente CallAttemptsChart
- [x] Crear componente TrendsChart
- [x] Crear componente OpportunityDetailCard
- [x] Crear componente ComparisonCard
- [x] Crear componente PeriodSelector
- [x] Crear componente DatePicker
- [x] Crear vista DailyReportView
- [x] Crear vista PerformanceDashboardView
- [x] Crear página principal CRMAgentJournal
- [x] Agregar rutas en App.tsx
- [x] Agregar enlace en CRMSidebar
- [x] Agregar título de página en pageTitles.ts
- [x] Instalar dependencias (recharts)
- [x] Crear utilidades de formateo
- [x] Crear componente SignReportDialog
- [x] Agregar funcionalidad de firma y envío de reporte
- [x] Integrar botón de firma en widget y vista completa

---

## 🚀 Próximos Pasos (Opcional)

### Mejoras Futuras

1. **Pull-to-refresh**: Implementar gesture para actualizar en móvil
2. **Swipe entre tabs**: Navegación por swipe en móvil
3. **Exportar reporte**: Descargar reporte como PDF/Excel
4. **Notificaciones**: Alertas cuando se alcanzan objetivos
5. **Filtros avanzados**: Más opciones de filtrado en dashboard
6. **Comparación entre agentes**: Vista admin para comparar agentes

---

## 📧 Firma y Envío de Reporte

### Funcionalidad

Los agentes pueden firmar su reporte diario y enviarlo por email a todos los administradores del sistema.

**Características:**
- Validación de firma: debe coincidir con el nombre completo del agente
- Guardado de firma en `extra_data` del journal
- Envío automático por email a todos los administradores activos
- Indicador visual cuando el reporte ya está firmado
- Botón de firma disponible en widget y vista completa

**Destinatarios del email:**
- Todos los usuarios con rol `admin` o `superuser` activos
- Si no hay admins en BD: `info@migro.es`, `agustin@migro.es`

### Componente SignReportDialog

Diálogo modal para firmar el reporte con:
- Validación de nombre completo
- Feedback visual (verde cuando es válido)
- Manejo de errores
- Estados de carga

### Documentación Backend

Ver: [BACKEND_AGENT_JOURNAL_SIGN_AND_EMAIL.md](./BACKEND_AGENT_JOURNAL_SIGN_AND_EMAIL.md)

---

## 🔗 Referencias

- [Backend Agent Daily Journal Module](../docs/agent_daily_journal_module.md) (si existe)
- [Backend Frontend Integration Status](../docs/BACKEND_FRONTEND_INTEGRATION_STATUS.md)
- [Backend Sign and Send Report](./BACKEND_AGENT_JOURNAL_SIGN_AND_EMAIL.md)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Recharts Documentation](https://recharts.org/)

---

**Última actualización**: 2025-01-29  
**Versión del documento**: 1.0

