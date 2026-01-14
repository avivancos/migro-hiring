# Rutas CRM - Lista Completa y Sincronización

## Resumen
Se han agregado todas las rutas faltantes del CRM al sistema de permisos dinámicos. El sistema ahora sincroniza automáticamente las rutas que faltan cuando se inicializa la base de datos.

## Rutas Agregadas

### Rutas que faltaban y ahora están incluidas:

1. **`/crm/tasks`** - Lista de tareas
   - Agente: ✅ Permitido
   - Abogado: ✅ Permitido

2. **`/crm/notes`** - Notas
   - Agente: ✅ Permitido
   - Abogado: ✅ Permitido

3. **`/crm/journal`** - Diario del agente
   - Agente: ✅ Permitido
   - Abogado: ✅ Permitido

4. **`/crm/opportunities/:opportunityId/analyze`** - Análisis de caso
   - Agente: ✅ Permitido
   - Abogado: ✅ Permitido

5. **`/crm/expedientes/new`** - Crear expediente
   - Agente: ✅ Permitido
   - Abogado: ✅ Permitido

6. **`/crm/call-handler`** - Manejador de llamadas (alias)
   - Agente: ✅ Permitido
   - Abogado: ✅ Permitido

7. **`/crm/settings/timezone`** - Configuración de zona horaria
   - Agente: ❌ Bloqueado
   - Abogado: ✅ Permitido

## Lista Completa de Rutas CRM (26 rutas)

### Dashboard y Navegación
- `/crm` - Dashboard principal del CRM

### Contactos
- `/crm/contacts` - Lista de contactos
- `/crm/contacts/:id` - Detalle de contacto
- `/crm/contacts/:id/edit` - Editar contacto
- `/crm/contacts/new` - Crear contacto

### Contratos (Solo Administradores)
- `/crm/contracts` - Contratos - **Solo administradores**

### Leads
- `/crm/leads` - Lista de leads
- `/crm/leads/:id` - Detalle de lead

### Oportunidades
- `/crm/opportunities` - Lista de oportunidades
- `/crm/opportunities/:id` - Detalle de oportunidad
- `/crm/opportunities/:opportunityId/analyze` - Análisis de caso

### Tareas y Calendario
- `/crm/calendar` - Calendario de tareas
- `/crm/tasks` - Lista de tareas
- `/crm/tasks/:id` - Detalle de tarea

### Notas y Diario
- `/crm/notes` - Notas
- `/crm/journal` - Diario del agente

### Expedientes
- `/crm/expedientes` - Lista de expedientes
- `/crm/expedientes/:id` - Detalle de expediente
- `/crm/expedientes/new` - Crear expediente

### Llamadas
- `/crm/call` - Manejador de llamadas
- `/crm/call-handler` - Manejador de llamadas (alias)

### Acciones
- `/crm/actions` - Acciones

### Configuración (Solo Abogados y Admins)
- `/crm/settings` - Configuración del CRM
- `/crm/settings/task-templates` - Plantillas de tareas
- `/crm/settings/custom-fields` - Campos personalizados
- `/crm/settings/timezone` - Configuración de zona horaria

## Sincronización Automática

El sistema ahora incluye una función `syncMissingRoutes()` que:

1. **Se ejecuta automáticamente** cuando la base de datos ya existe
2. **Detecta rutas faltantes** comparando con la lista completa
3. **Agrega automáticamente** las rutas que no existen en la base de datos
4. **No sobrescribe** rutas existentes que ya han sido modificadas manualmente

## Permisos por Defecto

### Agentes
- ✅ Acceso a la mayoría de rutas del CRM
- ❌ Sin acceso a configuración
- ❌ Sin acceso a contratos

### Abogados
- ✅ Acceso completo a todas las rutas excepto contratos
- ✅ Acceso a configuración
- ❌ Sin acceso a contratos

### Administradores
- ✅ Acceso completo a todas las rutas (siempre)
- ✅ Pueden gestionar permisos desde `/admin/route-permissions`

## Archivos Modificados

1. **`src/services/localDatabase.ts`**
   - Agregadas 7 rutas faltantes a la lista de rutas por defecto
   - Implementada función `syncMissingRoutes()` para sincronización automática
   - Actualización automática de permisos de `/crm/contracts` para instalaciones existentes

## Verificación

Para verificar que todas las rutas están sincronizadas:

1. Ir a `/admin/route-permissions`
2. Verificar que aparecen 26 rutas del módulo CRM
3. Verificar que `/crm/contracts` muestra checkboxes desmarcados para Agente y Abogado
4. Verificar que todas las nuevas rutas aparecen en la lista

## Notas Técnicas

- La sincronización solo agrega rutas que no existen
- No modifica rutas existentes que ya han sido configuradas manualmente
- Los cambios se guardan automáticamente en la base de datos SQLite local
- La sincronización se ejecuta cada vez que se inicializa la base de datos
