# 📋 Instrucciones para Agente Frontend - Resumen Ejecutivo

**Última actualización**: 2025-01-30

---

## 🎯 Documentación Principal

### 1. **Prompt Completo del Agente Frontend**
📄 **Archivo**: `docs/admin-react/FRONTEND_AGENT_PROMPT.md`

**Contenido**:
- Principios fundamentales de UX/UI
- Stack tecnológico recomendado (React 18+, TypeScript, MUI, etc.)
- Arquitectura de componentes
- Guías de implementación por módulo
- Checklist de calidad
- Priorización de implementación

**Uso**: Este es el documento principal para desarrollar el panel de administración completo.

---

### 2. **Instrucciones Específicas por Funcionalidad**

#### A. **Sistema de Anexos al Contrato** (NUEVO - 2025-01-30)
📄 **Archivo**: `docs/BACKEND_CONTRACT_ANNEXES_IMPLEMENTATION.md`

**Endpoints a implementar**:
- `GET /api/admin/hiring/{hiring_code}/annexes` - Listar anexos
- `POST /api/admin/hiring/{hiring_code}/annexes` - Crear anexo
- `PATCH /api/admin/hiring/annexes/{annex_id}` - Actualizar anexo
- `DELETE /api/admin/hiring/annexes/{annex_id}` - Eliminar anexo

**Autenticación**: Header `X-Admin-Password: Pomelo2005.1`

**Schemas**:
- `ContractAnnexResponse` - Para respuestas
- `ContractAnnexCreate` - Para crear
- `ContractAnnexUpdate` - Para actualizar

---

#### B. **Solicitud de Código de Contratación por Agente**
📄 **Archivo**: `docs/FRONTEND_AGENT_HIRING_CODE_REQUEST_SUMMARY.md`

**Endpoint**:
- `POST /api/pipelines/stages/{entity_type}/{entity_id}/request-hiring-code`

**Funcionalidad**: Permitir que un agente solicite un código de contratación desde una oportunidad, confirmando con su firma.

**Componentes sugeridos**:
- Formulario con firma del agente
- Selector de servicio (catálogo o texto libre)
- Selector de precio (monto fijo o por grado)
- Configuración del contrato
- Información del cliente (auto-completada)

**Documentación relacionada**:
- `docs/FRONTEND_AGENT_HIRING_CODE_REQUEST_QUICK_START.md` - Guía rápida
- `docs/FRONTEND_AGENT_HIRING_CODE_REQUEST_TECHNICAL.md` - Detalles técnicos
- `docs/FRONTEND_AGENT_HIRING_CODE_REQUEST_INTEGRATION.md` - Integración

---

#### C. **Módulo de Email Actions**
📄 **Archivo**: `docs/FRONTEND_APROBACION_HIRING_CODE_TOKEN.md`

**Rutas públicas**:
- `/email/approve-hiring-code?token={hash}` - Aprobar hiring code desde email

**Endpoints**:
- `GET /api/pipelines/email/approve-hiring-code/validate?token={hash}`
- `POST /api/pipelines/email/approve-hiring-code?token={hash}`

**Características**:
- Ruta pública (sin autenticación)
- Token hash como autenticación
- Módulo genérico para futuras acciones

---

#### D. **Creación de Contactos desde Replit**
📄 **Archivo**: `docs/MENSAJE_PARA_AGENTE_REPLIT.md`

**Endpoint**:
- `POST /api/crm/contacts`

**Importante**: Incluir `source: "replit"` para crear automáticamente una oportunidad asociada.

---

#### E. **Acceso Sin Restricciones para Agentes** (NUEVO - 2025-01-30)
📄 **Archivo**: `docs/FRONTEND_ACCESO_AGENTES_SIN_RESTRICCIONES.md`

**Cambio Crítico**: El backend ha eliminado todas las restricciones de acceso basadas en roles.

**Recursos afectados**:
- Oportunidades (Opportunities)
- Contactos (Contacts)
- Notas (Notes)
- Tareas (Tasks)
- Llamadas (Calls)
- Actividades (Activities)

**Acción requerida**: Eliminar filtros automáticos y validaciones de permisos en el frontend. Todos los usuarios autenticados pueden acceder a todos los recursos.

**Ver**: `docs/FRONTEND_ACCESO_AGENTES_SIN_RESTRICCIONES.md` para detalles completos y ejemplos de código.

---

## 🏗️ Stack Tecnológico Recomendado

```typescript
// Framework
React 18+ con TypeScript

// Estado
Zustand o Redux Toolkit (actualmente se usa contexto React)

// Routing
React Router v6 ✅ (implementado)

// UI Library
shadcn/ui + Tailwind CSS ✅ (implementado)
// Alternativas: Material-UI (MUI) v5+ o Chakra UI

// Formularios
React Hook Form + Zod (recomendado)
// Actualmente: formularios nativos con validación manual

// Tablas
TanStack Table (React Table) (recomendado)
// Actualmente: tablas custom con componentes shadcn/ui

// HTTP Client
Axios ✅ (implementado en src/services/api.ts)
// Alternativa: React Query (TanStack Query) para cache

// Notificaciones
React Hot Toast o Sonner (recomendado)
// Actualmente: alertas nativas del navegador
```

---

## 📁 Estructura de Componentes Actual

```
src/
├── components/
│   ├── common/          # Componentes reutilizables ✅
│   │   ├── Modal.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── EmptyState.tsx
│   ├── layout/          # Componentes de layout ✅
│   ├── ui/              # Componentes shadcn/ui ✅
│   ├── contracts/       # Componentes de contratos ✅
│   │   ├── ContractAnnexes.tsx (NUEVO)
│   │   └── EditContractModal.tsx
│   └── modules/         # Componentes específicos de módulos
├── hooks/               # Custom hooks ✅
│   ├── usePageTitle.ts
│   └── useAuth.ts
├── stores/              # Estado global (si se implementa)
├── services/            # API calls ✅
│   ├── api.ts
│   ├── contractsService.ts
│   └── crmService.ts
├── utils/               # Utilidades ✅
│   ├── formatters.ts
│   └── contractPdfGenerator.ts
├── types/               # TypeScript types ✅
│   ├── contracts.ts
│   ├── hiring.ts
│   └── crm.ts
└── pages/               # Páginas principales ✅
    ├── admin/
    │   ├── AdminContractDetail.tsx
    │   └── AdminContractCreate.tsx
    └── crm/
```

---

## ✅ Checklist de Calidad por Módulo

Para cada módulo implementado, verificar:

- [ ] ✅ Diseño visual atractivo y moderno
- [ ] ✅ Responsive en todos los dispositivos
- [ ] ✅ Accesible (WCAG 2.1 AA)
- [ ] ✅ Feedback visual en todas las acciones
- [ ] ✅ Manejo de errores elegante
- [ ] ✅ Loading states apropiados
- [ ] ✅ Validación de formularios clara
- [ ] ✅ Acceso sin restricciones implementado (ver `FRONTEND_ACCESO_AGENTES_SIN_RESTRICCIONES.md`)
- [ ] ✅ Navegación intuitiva
- [ ] ✅ Búsqueda y filtros funcionales
- [ ] ✅ Exportación implementada (si aplica)

---

## 🚀 Priorización de Implementación

### Fase 1: Fundamentos (CRÍTICO) ✅
1. **Auth** - Autenticación y autorización ✅
2. **Layout y Navegación** - Base para todo ✅
3. **Users** - Gestión básica de usuarios ✅
4. **Dashboard** - Vista principal ✅

### Fase 2: Core (ALTA PRIORIDAD) ✅
5. **Conversations** - Comunicación principal
6. **Pili** - Chat IA
7. **Expedientes** - Gestión de casos
8. **Audit Logs** - Trazabilidad

### Fase 3: Contenido (MEDIA PRIORIDAD)
9. **News** - Gestión de contenido
10. **Catalog** - Catálogo de servicios
11. **Legal QA** - Base de conocimiento

### Fase 4: Operaciones (MEDIA PRIORIDAD) ✅
12. **Payments** - Gestión de pagos ✅
13. **Documents** - Gestión de documentos
14. **Notifications** - Sistema de notificaciones
15. **Hiring** - Gestión de contratos ✅ (incluye anexos ✅)

---

## 📚 Documentación Adicional

### Guías de Implementación Específicas

- **Acceso Sin Restricciones para Agentes** (NUEVO - 2025-01-30): `docs/FRONTEND_ACCESO_AGENTES_SIN_RESTRICCIONES.md`
- **Autenticación**: `docs/FRONTEND_AUTHENTICATION_GUIDE.md`
- **Validación de Errores**: `docs/FRONTEND_VALIDATION_ERROR_HANDLING.md`
- **Hiring Payments**: `docs/FRONTEND_HIRING_PAYMENTS_GUIDE.md`
- **Stripe Checkout**: `docs/FRONTEND_STRIPE_CHECKOUT_GUIDE.md`
- **Qualification Tests**: `docs/frontend_qualification_test_guide.md`
- **Agent Journal**: `docs/frontend_agent_journal_mega_prompt.md`

### Quick Starts

- **Quick Start General**: `FRONTEND_QUICK_START.md`
- **Email Actions**: `docs/FRONTEND_EMAIL_ACTIONS_QUICK_START.md`

### Módulos Admin React

- **Implementación Completa**: `docs/admin-react/IMPLEMENTACION_COMPLETA.md`
- **Módulo de Contratos**: `docs/admin-react/MODULO_CONTRATOS.md`
- **Sistema de Auth**: `docs/admin-react/SISTEMA_AUTH_UNIFICADO.md`

---

## 🔗 Enlaces Útiles

- **Material Design**: https://m3.material.io/
- **React Query**: https://tanstack.com/query
- **React Hook Form**: https://react-hook-form.com/
- **TanStack Table**: https://tanstack.com/table
- **shadcn/ui**: https://ui.shadcn.com/ ✅ (usado en el proyecto)
- **Tailwind CSS**: https://tailwindcss.com/ ✅ (usado en el proyecto)
- **Heroicons**: https://heroicons.com/ ✅ (usado en el proyecto)

---

## 📝 Notas Importantes

1. **Iteración constante**: Empezar con MVP y mejorar iterativamente
2. **Feedback de usuarios**: Incorporar feedback real de usuarios
3. **Métricas**: Implementar analytics para entender uso
4. **Documentación**: Documentar componentes y decisiones
5. **Testing**: Tests críticos para funcionalidades importantes
6. **Accesibilidad**: No es opcional, es esencial
7. **Mobile-first**: El diseño debe ser mobile-first ✅ (implementado)
8. **Consistencia**: Usar componentes de `src/components/ui/` para mantener consistencia ✅

---

## 🎯 Objetivo Principal

**Crear una experiencia de usuario excepcional**. Cada decisión de diseño debe estar justificada por mejorar la usabilidad y satisfacción del usuario. Prioriza la claridad sobre la complejidad, y la funcionalidad sobre la estética pura.

---

## 📦 Funcionalidades Recientes Implementadas

### ✅ Anexos al Contrato (2025-01-30)

**Estado**: Frontend completamente implementado, pendiente backend

**Archivos**:
- `src/components/contracts/ContractAnnexes.tsx` - Componente principal
- `src/types/contracts.ts` - Tipos TypeScript
- `src/services/contractsService.ts` - Servicios API
- `src/pages/admin/AdminContractDetail.tsx` - Integración

**Próximos pasos**:
1. Backend debe implementar los endpoints según `docs/BACKEND_ANEXOS_CONTRATO.md`
2. Probar integración completa
3. Agregar tests si es necesario

---

## 🔍 Búsqueda de Documentación

Si necesitas encontrar documentación específica:

```bash
# Buscar documentación de frontend
ls docs/FRONTEND_*.md

# Buscar documentación de backend
ls docs/BACKEND_*.md

# Buscar documentación de admin-react
ls docs/admin-react/*.md

# Buscar documentación de contratos
ls docs/*CONTRATO*.md
ls docs/*HIRING*.md
```

---

---

**Para más detalles, consulta el documento completo**: `docs/admin-react/FRONTEND_AGENT_PROMPT.md`
