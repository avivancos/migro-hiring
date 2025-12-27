# Sistema de Protección de Rutas Dinámico

**Fecha**: 2025-01-16  
**Estado**: ✅ Completado  
**Versión**: 1.0.0

---

## 📋 Resumen Ejecutivo

Se ha implementado un sistema completo de protección de rutas dinámico que permite gestionar permisos de acceso a rutas para diferentes roles de usuario (agentes y abogados) mediante una base de datos SQLite local. El sistema incluye:

- ✅ Base de datos SQLite local para almacenar privilegios
- ✅ Sistema de gestión de permisos por ruta y rol
- ✅ Interfaz de administración con tabla de rutas y checks
- ✅ Protección automática de rutas basada en permisos
- ✅ Sistema de logging y tracing integrado
- ✅ Los administradores siempre tienen acceso completo sin posibilidad de modificación

---

## 🎯 Objetivos

1. **Control Granular de Acceso**: Permitir restringir o permitir acceso a rutas específicas para agentes y abogados
2. **Gestión Dinámica**: Los administradores pueden modificar permisos sin necesidad de cambiar código
3. **Persistencia Local**: Los permisos se guardan en una base de datos SQLite local en el navegador
4. **Trazabilidad**: Registrar todos los accesos y cambios de permisos en logs
5. **Rendimiento**: Sistema de caché para optimizar verificaciones de permisos

---

## 🏗️ Arquitectura

### Componentes Principales

#### 1. **Base de Datos SQLite Local** (`src/services/localDatabase.ts`)

Servicio que gestiona la base de datos SQLite en el navegador usando `sql.js`.

**Tablas:**
- `route_permissions`: Almacena permisos por ruta y rol
- `logs`: Registra eventos y acciones del sistema
- `traces`: Almacena información de tracing de operaciones

**Características:**
- Persistencia en `localStorage`
- Inicialización automática de rutas por defecto
- Búsqueda de rutas por patrón (soporta parámetros dinámicos como `:id`)

#### 2. **Servicio de Permisos** (`src/services/routePermissionService.ts`)

Gestiona la lógica de permisos de rutas con caché para optimizar rendimiento.

**Funcionalidades:**
- Verificación de permisos por ruta y rol
- Actualización de permisos
- Sincronización de rutas desde la aplicación
- Caché con expiración de 5 minutos

#### 3. **Componente ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`)

Componente actualizado que integra el sistema dinámico de permisos.

**Comportamiento:**
- Verifica permisos estáticos (roles permitidos)
- Verifica permisos dinámicos desde la base de datos
- Los administradores siempre tienen acceso
- Registra accesos denegados en logs

#### 4. **Interfaz de Administración** (`src/pages/admin/AdminRoutePermissions.tsx`)

Panel de administración para gestionar permisos de rutas.

**Características:**
- Tabla con todas las rutas del sistema
- Checks para activar/desactivar permisos por rol
- Filtros por módulo y búsqueda
- Actualización masiva de permisos
- Los permisos de admin no son modificables

#### 5. **Servicio de Logging y Tracing** (`src/services/loggingService.ts`)

Sistema integrado de logging y tracing que guarda información en SQLite.

**Funcionalidades:**
- Logging con diferentes niveles (info, warn, error, debug)
- Tracing de operaciones con medición de tiempo
- Consulta de logs y traces con filtros
- Limpieza automática de registros antiguos

---

## 📊 Esquema de Base de Datos

### Tabla: `route_permissions`

```sql
CREATE TABLE route_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  description TEXT,
  agent_allowed INTEGER DEFAULT 1,
  lawyer_allowed INTEGER DEFAULT 1,
  admin_allowed INTEGER DEFAULT 1,  -- Siempre 1, no modificable
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**Índices:**
- `idx_route_permissions_path` en `route_path`

### Tabla: `logs`

```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL CHECK(level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  context TEXT,
  user_id TEXT,
  user_role TEXT,
  route_path TEXT,
  metadata TEXT,  -- JSON string
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Índices:**
- `idx_logs_level` en `level`
- `idx_logs_created_at` en `created_at`

### Tabla: `traces`

```sql
CREATE TABLE traces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trace_id TEXT NOT NULL,
  span_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  duration_ms REAL NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('success', 'error', 'warning')),
  user_id TEXT,
  route_path TEXT,
  metadata TEXT,  -- JSON string
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Índices:**
- `idx_traces_trace_id` en `trace_id`
- `idx_traces_created_at` en `created_at`

---

## 🔐 Sistema de Permisos

### Reglas de Acceso

1. **Administradores (`admin`)**:
   - ✅ Acceso completo a todas las rutas
   - ✅ No se pueden modificar sus permisos
   - ✅ Siempre tienen `admin_allowed = true`

2. **Agentes (`agent`)**:
   - ⚙️ Acceso controlado por `agent_allowed` en la base de datos
   - ⚙️ Pueden tener restricciones configuradas por administradores

3. **Abogados (`lawyer`)**:
   - ⚙️ Acceso controlado por `lawyer_allowed` en la base de datos
   - ⚙️ Pueden tener restricciones configuradas por administradores

### Flujo de Verificación

```
Usuario intenta acceder a ruta
    ↓
¿Es admin?
    ├─ Sí → Acceso permitido ✅
    └─ No → Verificar permiso en BD
            ├─ ¿Permiso encontrado?
            │   ├─ Sí → Verificar según rol
            │   │   ├─ agent → agent_allowed
            │   │   └─ lawyer → lawyer_allowed
            │   └─ No → Acceso permitido (comportamiento por defecto)
            └─ Registrar en logs
```

---

## 🚀 Uso del Sistema

### Para Administradores

#### Acceder a la Gestión de Permisos

1. Iniciar sesión como administrador
2. Navegar a `/admin/route-permissions`
3. Ver todas las rutas del sistema en la tabla

#### Modificar Permisos

1. **Permiso Individual**:
   - Hacer clic en el checkbox correspondiente (Agente/Abogado)
   - El cambio se guarda automáticamente

2. **Actualización Masiva**:
   - Usar los botones "Permitir todo" o "Bloquear todo"
   - Se aplica a todas las rutas visibles según los filtros

#### Filtrar Rutas

- **Por búsqueda**: Escribir en el campo de búsqueda (ruta, descripción o módulo)
- **Por módulo**: Seleccionar un módulo específico del dropdown

### Para Desarrolladores

#### Usar el Sistema de Permisos en Código

```typescript
import { routePermissionService } from '@/services/routePermissionService';

// Verificar permiso
const hasAccess = await routePermissionService.checkPermission(
  '/crm/contacts',
  'agent'
);

// Obtener todos los permisos
const permissions = await routePermissionService.getAllPermissions();

// Actualizar permiso
await routePermissionService.updateRoutePermission('/crm/contacts', {
  agent_allowed: false,
  lawyer_allowed: true,
});
```

#### Usar el Hook de Permisos

```typescript
import { useRoutePermission } from '@/hooks/useRoutePermission';

function MyComponent() {
  const { hasPermission, isChecking } = useRoutePermission();
  
  if (isChecking) {
    return <Loading />;
  }
  
  if (!hasPermission) {
    return <AccessDenied />;
  }
  
  return <ProtectedContent />;
}
```

#### Usar el Sistema de Logging

```typescript
import { loggingService } from '@/services/loggingService';

// Log simple
await loggingService.info('Usuario accedió a la ruta', {
  user_id: user.id,
  route_path: '/crm/contacts',
});

// Trace de operación
const traceId = loggingService.startTrace('loadContacts', {
  user_id: user.id,
});

try {
  const contacts = await loadContacts();
  await loggingService.endTrace(traceId, 'loadContacts', 'success');
} catch (error) {
  await loggingService.endTrace(traceId, 'loadContacts', 'error');
}

// Wrapper automático
const result = await loggingService.traceOperation(
  'loadContacts',
  async () => {
    return await loadContacts();
  },
  { user_id: user.id }
);
```

---

## 📝 Rutas Iniciales

El sistema inicializa automáticamente las siguientes rutas por defecto:

### Módulo CRM

- `/crm` - Dashboard principal
- `/crm/contacts` - Lista de contactos
- `/crm/contacts/:id` - Detalle de contacto
- `/crm/contacts/:id/edit` - Editar contacto
- `/crm/contacts/new` - Crear contacto
- `/crm/leads` - Lista de leads
- `/crm/leads/:id` - Detalle de lead
- `/crm/opportunities` - Lista de oportunidades
- `/crm/opportunities/:id` - Detalle de oportunidad
- `/crm/calendar` - Calendario de tareas
- `/crm/tasks/:id` - Detalle de tarea
- `/crm/actions` - Acciones
- `/crm/expedientes` - Lista de expedientes
- `/crm/expedientes/:id` - Detalle de expediente
- `/crm/call` - Manejador de llamadas
- `/crm/contracts` - Contratos
- `/crm/settings` - Configuración (solo abogados)
- `/crm/settings/task-templates` - Plantillas de tareas (solo abogados)
- `/crm/settings/custom-fields` - Campos personalizados (solo abogados)

**Nota**: Las rutas de configuración están restringidas por defecto para agentes.

---

## 🔧 Configuración y Mantenimiento

### Inicialización de la Base de Datos

La base de datos se inicializa automáticamente la primera vez que se accede al sistema. Si necesitas reinicializar:

```typescript
import { localDatabase } from '@/services/localDatabase';

// Limpiar y reinicializar
localStorage.removeItem('migro_local_db');
await localDatabase.initialize();
```

### Limpieza de Logs y Traces

```typescript
import { loggingService } from '@/services/loggingService';

// Limpiar logs antiguos (mantener últimos 30 días)
await loggingService.clearOldLogs(30);

// Limpiar traces antiguos (mantener últimos 30 días)
await loggingService.clearOldTraces(30);
```

### Exportar/Importar Base de Datos

```typescript
import { localDatabase } from '@/services/localDatabase';

// Exportar
const data = await localDatabase.exportDatabase();
const blob = new Blob([data], { type: 'application/octet-stream' });
// Guardar blob como archivo

// Importar
const fileData = await file.arrayBuffer();
const uint8Array = new Uint8Array(fileData);
await localDatabase.importDatabase(uint8Array);
```

---

## 🐛 Solución de Problemas

### Problema: Los permisos no se aplican

**Solución:**
1. Verificar que la base de datos esté inicializada
2. Limpiar la caché del navegador
3. Verificar que el usuario no sea admin (los admins siempre tienen acceso)

### Problema: La base de datos no se guarda

**Solución:**
1. Verificar que `localStorage` esté disponible
2. Verificar el tamaño de la base de datos (localStorage tiene límite de ~5-10MB)
3. Revisar la consola del navegador para errores

### Problema: Las rutas no aparecen en la tabla de administración

**Solución:**
1. Recargar la página
2. Verificar que la base de datos esté inicializada
3. Verificar los filtros aplicados

---

## 📈 Rendimiento

### Optimizaciones Implementadas

1. **Caché de Permisos**: Los permisos se cachean durante 5 minutos
2. **Índices en BD**: Índices en campos frecuentemente consultados
3. **Lazy Loading**: La base de datos se carga solo cuando es necesaria
4. **Búsqueda por Patrón**: Soporte para rutas con parámetros dinámicos

### Límites

- **Tamaño de BD**: Limitado por `localStorage` (~5-10MB típicamente)
- **Número de Rutas**: Sin límite práctico (miles de rutas son manejables)
- **Logs/Traces**: Se recomienda limpiar periódicamente (cada 30 días)

---

## 🔒 Seguridad

### Consideraciones

1. **Almacenamiento Local**: Los permisos se almacenan localmente, no en el servidor
2. **Validación en Frontend**: La protección es principalmente en el frontend
3. **Validación en Backend**: Se recomienda implementar validación también en el backend
4. **Tokens de Autenticación**: Los permisos se verifican junto con la autenticación

### Mejoras Futuras

- [ ] Sincronización con backend para permisos centralizados
- [ ] Validación de permisos en el backend
- [ ] Cifrado de la base de datos local
- [ ] Auditoría de cambios de permisos

---

## 📚 Referencias

### Archivos Relacionados

- `src/services/localDatabase.ts` - Servicio de base de datos SQLite
- `src/services/routePermissionService.ts` - Servicio de gestión de permisos
- `src/services/loggingService.ts` - Servicio de logging y tracing
- `src/components/auth/ProtectedRoute.tsx` - Componente de protección de rutas
- `src/hooks/useRoutePermission.ts` - Hook para verificar permisos
- `src/pages/admin/AdminRoutePermissions.tsx` - Interfaz de administración

### Dependencias

- `sql.js` - SQLite en el navegador
- `react-router-dom` - Enrutamiento
- `@/providers/AuthProvider` - Autenticación

---

## ✅ Checklist de Implementación

- [x] Instalación de dependencias (sql.js)
- [x] Creación del servicio de base de datos SQLite
- [x] Creación del servicio de gestión de permisos
- [x] Creación del hook useRoutePermission
- [x] Actualización de ProtectedRoute
- [x] Creación del componente de administración
- [x] Integración del sistema de logging y tracing
- [x] Agregar ruta en App.tsx
- [x] Agregar entrada en Sidebar
- [x] Documentación completa

---

## 🎉 Conclusión

El sistema de protección de rutas dinámico está completamente implementado y funcional. Permite a los administradores gestionar permisos de acceso de forma granular para agentes y abogados, mientras que los administradores mantienen acceso completo sin restricciones.

El sistema es extensible, performante y está completamente integrado con el sistema de logging y tracing para auditoría y depuración.




