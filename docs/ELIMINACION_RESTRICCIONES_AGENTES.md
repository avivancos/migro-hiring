# Eliminación de Restricciones para Agentes en el CRM

## Resumen
Se han eliminado todas las restricciones que limitaban a los agentes a ver solo sus oportunidades asignadas y contactos asignados. Ahora los agentes pueden ver todo el CRM, excepto las rutas que estén restringidas mediante el sistema dinámico de permisos de rutas.

## Cambios Implementados

### 1. Dashboard del CRM (`src/pages/CRMDashboardPage.tsx`)

#### Antes:
- ❌ Agentes no veían el card de "Contactos Totales"
- ❌ Agentes solo veían "Mis Oportunidades" (asignadas)
- ❌ Agentes no cargaban todos los contactos

#### Ahora:
- ✅ Agentes ven el card de "Contactos Totales"
- ✅ Agentes ven todas las oportunidades (no solo asignadas)
- ✅ Agentes cargan todos los contactos sin restricciones

**Cambios específicos:**
- Eliminado filtro `if (!userIsAgent)` para cargar contactos
- Eliminado filtro `assigned_to: user.id` para oportunidades
- Mostrar todas las tarjetas de estadísticas para todos los usuarios
- Grid unificado de 4 columnas para todos los usuarios

### 2. Lista de Contactos (`src/pages/CRMContactList.tsx`)

#### Antes:
- ❌ Filtro automático por `responsible_user_id` para agentes
- ❌ Filtro por oportunidades asignadas
- ❌ Búsqueda restringida solo a email/teléfono exacto
- ❌ Lista vacía si no tenía oportunidades asignadas

#### Ahora:
- ✅ Sin filtro automático por responsable
- ✅ Sin filtro por oportunidades asignadas
- ✅ Búsqueda normal en todos los campos
- ✅ Todos los contactos visibles

**Cambios específicos:**
- Eliminado código que filtraba por `contactIdsFromOpportunities`
- Eliminado filtro automático por `responsible_user_id` para agentes
- Eliminada validación de búsqueda exacta (`isExactSearch`)
- Búsqueda normal usando `filters.search` para todos

### 3. Lista de Oportunidades (`src/pages/CRMOpportunities.tsx`)

#### Antes:
- ❌ Filtro automático `assigned_to: user.id` para agentes

#### Ahora:
- ✅ Sin filtro automático, todos ven todas las oportunidades

**Cambios específicos:**
- Eliminado `filters={userIsAgent && user?.id ? { assigned_to: user.id } : undefined}`
- Ahora siempre `filters={undefined}`

## Sistema de Permisos

Los agentes ahora están sujetos **únicamente** al sistema dinámico de permisos de rutas:

- ✅ Pueden ver todas las rutas permitidas en `/admin/route-permissions`
- ✅ Las restricciones se gestionan desde la interfaz de administración
- ✅ No hay restricciones hardcodeadas en el código

### Rutas Restringidas por Defecto para Agentes:
- `/crm/contracts` - Contratos (solo administradores)
- `/crm/settings` - Configuración (solo abogados y admins)
- `/crm/settings/task-templates` - Plantillas (solo abogados y admins)
- `/crm/settings/custom-fields` - Campos personalizados (solo abogados y admins)
- `/crm/settings/timezone` - Zona horaria (solo abogados y admins)

### Rutas Permitidas para Agentes:
- ✅ `/crm` - Dashboard
- ✅ `/crm/contacts` - Contactos
- ✅ `/crm/opportunities` - Oportunidades
- ✅ `/crm/leads` - Leads
- ✅ `/crm/tasks` - Tareas
- ✅ `/crm/notes` - Notas
- ✅ `/crm/journal` - Diario
- ✅ `/crm/calendar` - Calendario
- ✅ `/crm/call` - Llamadas
- ✅ `/crm/expedientes` - Expedientes
- ✅ Y todas las demás rutas del CRM (excepto las restringidas)

## Archivos Modificados

1. **`src/pages/CRMDashboardPage.tsx`**
   - Eliminado filtro de contactos para agentes
   - Eliminado filtro de oportunidades asignadas
   - Mostrar todas las tarjetas para todos los usuarios

2. **`src/pages/CRMContactList.tsx`**
   - Eliminado filtro por oportunidades asignadas
   - Eliminado filtro automático por responsable
   - Eliminadas restricciones de búsqueda exacta
   - Eliminadas referencias a `contactIdsFromOpportunities`

3. **`src/pages/CRMOpportunities.tsx`**
   - Eliminado filtro automático por `assigned_to`

## Impacto

### Para Agentes:
- ✅ Acceso completo a todos los contactos
- ✅ Acceso completo a todas las oportunidades
- ✅ Búsqueda normal sin restricciones
- ✅ Dashboard completo con todas las estadísticas
- ⚠️ Solo restringidos por permisos dinámicos de rutas

### Para Administradores:
- ✅ Pueden gestionar permisos desde `/admin/route-permissions`
- ✅ Pueden restringir cualquier ruta para agentes/abogados
- ✅ Sin cambios en su funcionalidad

## Notas Técnicas

- Las restricciones ahora son **100% dinámicas** y gestionables desde la interfaz
- No hay restricciones hardcodeadas en el código
- Los agentes tienen el mismo nivel de acceso que abogados, excepto por las rutas restringidas en el sistema de permisos
- El sistema de permisos dinámicos es la única fuente de verdad para restricciones

## Verificación

Para verificar que los cambios funcionan:

1. **Como Agente:**
   - ✅ Ver todos los contactos en `/crm/contacts`
   - ✅ Ver todas las oportunidades en `/crm/opportunities`
   - ✅ Ver todas las estadísticas en el dashboard
   - ✅ Búsqueda normal funcionando
   - ❌ No poder acceder a `/crm/contracts` (restringido)

2. **Como Administrador:**
   - ✅ Gestionar permisos desde `/admin/route-permissions`
   - ✅ Ver que agentes tienen acceso a todas las rutas excepto las restringidas
