# 🚀 Implementación Frontend: Leads/Oportunidades y Call Data Wizard

**Fecha**: 2025-01-28  
**Versión**: 1.0  
**Estado**: ✅ IMPLEMENTACIÓN COMPLETA (Fase 1)

---

## 📋 Resumen Ejecutivo

Se ha implementado la estructura base completa del módulo frontend de **Leads/Oportunidades** y **Call Data Wizard** según las especificaciones del mega prompt, incluyendo:

- ✅ Tipos TypeScript completos
- ✅ Servicios API (opportunityApi, wizardApi)
- ✅ Configuración de TanStack Query
- ✅ Hooks personalizados con React Query
- ✅ Componentes base de Opportunities
- ✅ Componentes base del Wizard
- ✅ Páginas principales
- ✅ Integración de rutas

---

## 📦 Estructura de Archivos Implementados

### Tipos TypeScript

```
src/types/
├── opportunity.ts      # Tipos para oportunidades
└── wizard.ts          # Tipos para Call Data Wizard
```

**Archivos:**
- `src/types/opportunity.ts` - Interfaces para LeadOpportunity, OpportunityFilters, etc.
- `src/types/wizard.ts` - Interfaces para CallDataWizard, WizardStepResponse, etc.

### Servicios API

```
src/services/
├── opportunityApi.ts   # Cliente API para oportunidades
└── wizardApi.ts       # Cliente API para wizard
```

**Endpoints implementados:**

**Opportunity API:**
- `list(filters)` - Listar oportunidades con filtros
- `get(id)` - Obtener oportunidad por ID
- `assign(id, userId)` - Asignar oportunidad a usuario
- `update(id, updates)` - Actualizar oportunidad
- `createPipeline(id)` - Crear pipeline para oportunidad

**Wizard API:**
- `start(callId)` - Iniciar wizard
- `get(callId)` - Obtener estado del wizard
- `getNextStep(callId)` - Obtener siguiente paso
- `getGuidance(callId)` - Obtener guía del wizard
- `saveStep(callId, stepNumber, stepData)` - Guardar datos de paso
- `complete(callId, options)` - Completar wizard
- `pause(callId, reason)` - Pausar wizard
- `resume(callId)` - Reanudar wizard

### Configuración TanStack Query

```
src/providers/
└── QueryProvider.tsx  # Provider de TanStack Query
```

**Configuración:**
- QueryClient con staleTime de 30 segundos
- Retry configurado a 1 intento
- Provider integrado en `main.tsx`

### Hooks Personalizados

```
src/hooks/
├── useOpportunities.ts      # Hook principal para lista de oportunidades
└── useOpportunityDetail.ts  # Hook para detalle de oportunidad
└── useCallWizard.ts        # Hook principal para Call Data Wizard
```

**Funcionalidades:**

**useOpportunities:**
- Lista de oportunidades con filtros
- Mutaciones para asignar y actualizar
- Invalidación automática de caché

**useOpportunityDetail:**
- Detalle de oportunidad por ID
- Mutaciones para asignar, actualizar y crear pipeline
- Actualización optimista de caché

**useCallWizard:**
- Estado del wizard
- Siguiente paso del wizard
- Mutaciones para start, saveStep, complete, pause, resume

### Componentes de Opportunities

```
src/components/opportunities/
├── OpportunityCard.tsx            # Card de oportunidad en lista
├── OpportunityPriorityBadge.tsx   # Badge de prioridad
├── OpportunityScore.tsx           # Visualización de score
└── OpportunityFilters.tsx         # Filtros de oportunidades
```

**Características:**

**OpportunityCard:**
- Diseño mobile-first
- Información esencial visible (score, prioridad, estado)
- Información del contacto (nombre, email, teléfono, ciudad)
- Razón de detección
- Indicador de intentos de contacto
- Botones de acción

**OpportunityPriorityBadge:**
- Badges de colores según prioridad (high=rojo, medium=amarillo, low=verde)

**OpportunityScore:**
- Barra de progreso visual del score (0-100)
- Colores según score (>=80=verde, >=60=amarillo, <60=rojo)

**OpportunityFilters:**
- Filtros por estado, prioridad, agente asignado
- Búsqueda por texto
- Filtro por rango de score
- Chips de filtros activos
- Panel colapsable

### Componentes del Wizard

```
src/components/wizard/
├── WizardProgress.tsx    # Barra de progreso
├── WizardGuidance.tsx    # Mensaje de guía
├── WizardField.tsx       # Campo individual
└── WizardStep.tsx        # Paso individual del wizard
```

**Características:**

**WizardProgress:**
- Barra de progreso visual (0-100%)
- Indicadores de pasos (completados, actual, pendiente)
- Información de paso actual y total

**WizardGuidance:**
- Mensaje principal de guía
- Pregunta sugerida destacada
- Conexión con Migro (por qué es importante)
- Campo a recolectar

**WizardField:**
- Soporte para múltiples tipos (text, email, tel, textarea, select, boolean, datetime)
- Validación de campos requeridos
- Labels siempre visibles
- Inputs grandes (mínimo 48px de altura)

**WizardStep:**
- Renderizado de campos según tipo
- Validación en tiempo real
- Mensaje de guía visible
- Indicador de campos faltantes
- Navegación entre pasos

### Páginas

```
src/pages/
├── CRMOpportunities.tsx       # Lista de oportunidades
└── CRMOpportunityDetail.tsx   # Detalle de oportunidad
```

**CRMOpportunities:**
- Integración de OpportunityList
- Carga de agentes disponibles
- Navegación a detalle

**CRMOpportunityDetail:**
- Información completa de la oportunidad
- Score y prioridad
- Información del contacto
- Razón de detección
- Acciones (crear pipeline, ver contacto)

---

## 🔌 Integración con Backend

### Endpoints Requeridos

Los siguientes endpoints deben estar disponibles en el backend:

#### Oportunidades

```
GET    /api/crm/opportunities              # Listar oportunidades
GET    /api/crm/opportunities/:id          # Obtener oportunidad
POST   /api/crm/opportunities/:id/assign   # Asignar oportunidad
PATCH  /api/crm/opportunities/:id          # Actualizar oportunidad
POST   /api/crm/opportunities/:id/pipeline # Crear pipeline
```

#### Call Data Wizard

```
POST   /api/crm/calls/:call_id/wizard/start      # Iniciar wizard
GET    /api/crm/calls/:call_id/wizard            # Obtener estado
GET    /api/crm/calls/:call_id/wizard/next-step  # Siguiente paso
GET    /api/crm/calls/:call_id/wizard/guidance   # Obtener guía
POST   /api/crm/calls/:call_id/wizard/step       # Guardar paso
POST   /api/crm/calls/:call_id/wizard/complete   # Completar wizard
POST   /api/crm/calls/:call_id/wizard/pause      # Pausar wizard
POST   /api/crm/calls/:call_id/wizard/resume     # Reanudar wizard
```

---

## 🛣️ Rutas Implementadas

Las siguientes rutas están disponibles en el CRM:

```
/crm/opportunities           # Lista de oportunidades
/crm/opportunities/:id       # Detalle de oportunidad
```

**Nota**: Las rutas del Wizard se integrarán cuando se implemente la funcionalidad completa del wizard (requiere integración con llamadas).

---

## 📱 Diseño Mobile-First

Todos los componentes están diseñados siguiendo principios mobile-first:

1. **Cards full-width** en móvil
2. **Información apilada verticalmente**
3. **Botones grandes** (mínimo 44x44px)
4. **Inputs grandes** (mínimo 48px de altura)
5. **Espaciado generoso** (mínimo 16px entre elementos)
6. **Tipografía legible** (mínimo 16px en móvil)

---

## 🔄 Estado y Caché

El sistema utiliza TanStack Query para gestión de estado del servidor:

- **Caché automático** con staleTime de 30 segundos
- **Invalidación inteligente** al actualizar datos
- **Actualización optimista** en algunos casos
- **Retry automático** en caso de errores

---

## ✅ Checklist de Implementación

### Fase 1: Estructura Base (✅ COMPLETADO)
- [x] Crear tipos TypeScript
- [x] Crear servicios API
- [x] Configurar TanStack Query
- [x] Crear hooks base

### Fase 2: Componentes de Oportunidades (✅ COMPLETADO)
- [x] OpportunityCard
- [x] OpportunityPriorityBadge
- [x] OpportunityScore
- [x] OpportunityFilters
- [x] OpportunityList

### Fase 3: Componentes del Wizard (✅ PARCIAL)
- [x] WizardProgress
- [x] WizardGuidance
- [x] WizardField
- [x] WizardStep
- [ ] WizardContainer (pendiente)
- [ ] WizardNavigation (pendiente)
- [ ] WizardSummary (pendiente)

### Fase 4: Páginas (✅ COMPLETADO)
- [x] CRMOpportunities
- [x] CRMOpportunityDetail
- [ ] CallWizardPage (pendiente - requiere integración con llamadas)

### Fase 5: Integraciones (⏳ PENDIENTE)
- [ ] Integración con Pipelines
- [ ] Integración con Calls
- [ ] Integración con Contacts
- [ ] Notificaciones push

### Fase 6: Optimizaciones Mobile (⏳ PENDIENTE)
- [ ] Implementar swipe gestures
- [ ] Implementar offline support
- [ ] Optimizar performance (virtual scrolling, lazy loading)

### Fase 7: Testing (⏳ PENDIENTE)
- [ ] Tests unitarios de componentes
- [ ] Tests de hooks
- [ ] Tests de servicios API
- [ ] Tests E2E

---

## 🚧 Próximos Pasos

1. **Completar WizardContainer**: Componente principal que orquesta todo el wizard
2. **Integrar con Calls**: Conectar el wizard con el sistema de llamadas existente
3. **Implementar WizardSummary**: Vista de resumen antes de completar
4. **Agregar a Sidebar**: Añadir enlace a oportunidades en CRMSidebar
5. **Optimizaciones Mobile**: Swipe gestures, offline support
6. **Testing**: Tests unitarios y E2E

---

## 📚 Referencias

- Documentación del mega prompt: `MEGA_PROMPT_FRONTEND_OPPORTUNITIES_WIZARD.md`
- Backend API: Ver documentación en `docs/BACKEND_OPPORTUNITIES_API.md` (si existe)
- Diseño mobile-first: Ver principios en el mega prompt

---

**Última actualización**: 2025-01-28  
**Versión**: 1.0

