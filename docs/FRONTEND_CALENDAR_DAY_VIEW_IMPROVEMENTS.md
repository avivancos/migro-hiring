# Mejoras: Vista de Día del Calendario con Badges y Filtrado por Creador

**Fecha**: 2025-01-30  
**Prioridad**: 🔴 Alta  
**Estado**: ✅ Completado  
**Módulo**: Frontend - CRM Calendar

---

## 📋 Resumen

Se implementaron mejoras en la vista de día del calendario (`CRMTaskCalendar.tsx`) para:
- Mostrar badges de responsable, tipo y estado en tareas, llamadas y notas
- Filtrar elementos por creador (solo visibles a sus creadores o admins)
- Incluir notas en la vista de día del calendario
- Aplicar el mismo diseño visual de badges que en `CRMCallHandler.tsx`

---

## 🔍 Problema Identificado

La vista de día del calendario tenía las siguientes limitaciones:

1. **Falta de badges informativos**: No mostraba badges de responsable, tipo o estado en tareas, llamadas y notas
2. **Sin filtrado por creador**: Todos los usuarios veían todos los elementos, sin importar quién los creó
3. **Notas no incluidas**: Las notas no aparecían en la vista de día del calendario
4. **Inconsistencia visual**: El diseño no era consistente con otros componentes como `CRMCallHandler.tsx`

### Síntomas

- Los usuarios veían tareas, llamadas y notas de otros usuarios
- No había información visual sobre el responsable de cada elemento
- Las notas no aparecían en el calendario
- Falta de badges de tipo y estado para mejor identificación visual

---

## ✅ Cambios Realizados

### 1. Carga de Usuarios Responsables

**Archivo:** `src/pages/CRMTaskCalendar.tsx`

Se agregó la carga de usuarios responsables usando `getResponsibleUsers()`:

```typescript
const [users, setUsers] = useState<CRMUser[]>([]);

const loadUsers = async () => {
  try {
    const usersData = await crmService.getResponsibleUsers(true);
    setUsers(usersData);
    console.log('👥 [CRMTaskCalendar] Usuarios responsables cargados:', usersData.length);
  } catch (err) {
    console.error('Error loading users:', err);
  }
};
```

**Beneficios:**
- ✅ Carga solo usuarios que pueden ser responsables (lawyers y agents)
- ✅ Más eficiente y rápido
- ✅ Usa caché (10 minutos TTL)
- ✅ Mejor rendimiento

### 2. Carga de Notas

**Archivo:** `src/pages/CRMTaskCalendar.tsx`

Se agregó la carga de notas en el rango de fechas:

```typescript
const [notes, setNotes] = useState<Note[]>([]);

// En loadData:
const notesData = await crmService.getNotes({
  limit: 1000, // Cargar muchas notas para el rango de fechas
}).then(response => response.items || []).catch((err) => {
  console.warn('⚠️ [CRMTaskCalendar] Error cargando notas:', err);
  return [];
});

// Filtrar notas por fecha (usando created_at)
const notesInRange = filteredNotes.filter(note => {
  if (!note.created_at) return false;
  const noteDate = new Date(note.created_at);
  return noteDate >= startDate && noteDate <= endDate;
});
```

**Características:**
- ✅ Carga notas en el rango de fechas del calendario
- ✅ Filtra por fecha usando `created_at`
- ✅ Maneja errores gracefully

### 3. Filtrado por Creador

**Archivo:** `src/pages/CRMTaskCalendar.tsx`

Se implementó filtrado para mostrar solo elementos del usuario actual o todos si es admin:

```typescript
const { user } = useAuth();

// Determinar si el usuario es admin
const isAdmin = user?.is_superuser || user?.role === 'admin' || user?.role === 'superuser';
const currentUserId = user?.id;

// Filtrar tareas
const filteredTasks = isAdmin 
  ? tasksData 
  : tasksData.filter(task => 
      task.created_by === currentUserId || 
      task.responsible_user_id === currentUserId
    );

// Filtrar llamadas
const filteredCalls = isAdmin 
  ? callsData 
  : callsData.filter(call => call.responsible_user_id === currentUserId);

// Filtrar notas
const filteredNotes = isAdmin 
  ? notesData 
  : notesData.filter(note => note.created_by === currentUserId);
```

**Lógica de filtrado:**
- **Tareas**: Muestra si el usuario es admin, o si `created_by` o `responsible_user_id` coinciden con el usuario actual
- **Llamadas**: Muestra si el usuario es admin, o si `responsible_user_id` coincide con el usuario actual
- **Notas**: Muestra si el usuario es admin, o si `created_by` coincide con el usuario actual

### 4. Funciones Helper para Badges

**Archivo:** `src/pages/CRMTaskCalendar.tsx`

Se agregaron funciones helper para obtener nombres de responsables y badges:

#### `getResponsibleName(userId)`
```typescript
const getResponsibleName = (userId: string | undefined): string => {
  if (!userId) return 'Sin asignar';
  
  if (users.length === 0) {
    return 'Cargando...';
  }
  
  const user = users.find(u => {
    const uId = String(u.id || '').trim();
    const searchId = String(userId || '').trim();
    return uId === searchId;
  });
  
  if (user) {
    const name = user.name?.trim();
    if (name && name.length > 0) {
      return name;
    }
    const email = user.email?.trim();
    if (email && email.length > 0) {
      return email.split('@')[0];
    }
    return 'Usuario sin nombre';
  }
  
  return userId.substring(0, 8) + '...';
};
```

#### `getCallTypeBadge(callType)`
```typescript
const getCallTypeBadge = (callType: string | undefined) => {
  if (!callType) return null;
  
  const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
    'primera_llamada': { label: 'Contacto Inicial', bg: 'bg-blue-100', text: 'text-blue-800' },
    'contacto_inicial': { label: 'Contacto Inicial', bg: 'bg-blue-100', text: 'text-blue-800' },
    'seguimiento': { label: 'Seguimiento', bg: 'bg-green-100', text: 'text-green-800' },
    'venta': { label: 'Venta', bg: 'bg-purple-100', text: 'text-purple-800' },
  };

  const config = typeConfig[callType] || { label: callType, bg: 'bg-gray-100', text: 'text-gray-800' };
  
  return (
    <span className={`text-xs px-2 py-1 rounded ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};
```

#### `getTaskTypeBadge(taskType)`
```typescript
const getTaskTypeBadge = (taskType: string | undefined) => {
  if (!taskType) return null;
  
  const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
    'call': { label: 'Llamada', bg: 'bg-blue-100', text: 'text-blue-800' },
    'meeting': { label: 'Reunión', bg: 'bg-purple-100', text: 'text-purple-800' },
    'email': { label: 'Email', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'reminder': { label: 'Recordatorio', bg: 'bg-orange-100', text: 'text-orange-800' },
  };

  const config = typeConfig[taskType] || { label: taskType, bg: 'bg-gray-100', text: 'text-gray-800' };
  
  return (
    <span className={`text-xs px-2 py-1 rounded ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};
```

#### `getNoteTypeBadge(noteType)`
```typescript
const getNoteTypeBadge = (noteType: string | undefined) => {
  if (!noteType) return null;
  
  const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
    'comment': { label: 'Comentario', bg: 'bg-gray-100', text: 'text-gray-800' },
    'call': { label: 'Llamada', bg: 'bg-blue-100', text: 'text-blue-800' },
    'email': { label: 'Email', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'system': { label: 'Sistema', bg: 'bg-purple-100', text: 'text-purple-800' },
  };

  const config = typeConfig[noteType] || { label: noteType, bg: 'bg-gray-100', text: 'text-gray-800' };
  
  return (
    <span className={`text-xs px-2 py-1 rounded ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};
```

### 5. Función Helper para Obtener Notas por Fecha

**Archivo:** `src/pages/CRMTaskCalendar.tsx`

Se agregó función para filtrar notas por fecha:

```typescript
const getNotesForDate = (date: Date): Note[] => {
  const dateStr = date.toISOString().split('T')[0];
  return notes.filter(note => {
    if (!note.created_at) return false;
    try {
      const noteDate = new Date(note.created_at).toISOString().split('T')[0];
      return noteDate === dateStr;
    } catch (err) {
      console.warn('⚠️ [CRMTaskCalendar] Error parseando fecha de nota:', note.id, note.created_at, err);
      return false;
    }
  });
};
```

### 6. Actualización de la Vista de Día

**Archivo:** `src/pages/CRMTaskCalendar.tsx`

Se actualizó `renderDayView()` para incluir:

1. **Notas en la vista de día**
2. **Badges de responsable** en tareas, llamadas y notas
3. **Badges de tipo** para tareas, llamadas y notas
4. **Badges de estado** para tareas y llamadas
5. **Layout mejorado** con mejor organización visual

#### Estructura de Badges en Tareas

```tsx
<div className="flex items-center gap-2 flex-wrap">
  {getTaskTypeBadge(task.task_type)}
  <span className={`text-xs px-2 py-1 rounded ${
    task.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
  }`}>
    {task.is_completed ? 'Completada' : 'Pendiente'}
  </span>
  {task.responsible_user_id && (
    <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 font-medium">
      <User size={12} className="flex-shrink-0" />
      <span className="truncate max-w-[150px]">{getResponsibleName(task.responsible_user_id)}</span>
    </span>
  )}
</div>
```

#### Estructura de Badges en Llamadas

```tsx
<div className="flex items-center gap-2 flex-wrap">
  <span className={`text-xs px-2 py-1 rounded ${
    call.call_status === 'completed' || call.status === 'completed' 
      ? 'bg-green-100 text-green-800' 
      : (call.call_status === 'no_answer' || call.status === 'no_answer')
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-gray-100 text-gray-800'
  }`}>
    {formatCallStatus(call.call_status || call.status)}
  </span>
  {getCallTypeBadge(call.call_type)}
  {call.responsible_user_id && (
    <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 font-medium">
      <User size={12} className="flex-shrink-0" />
      <span className="truncate max-w-[150px]">{getResponsibleName(call.responsible_user_id)}</span>
    </span>
  )}
</div>
```

#### Estructura de Badges en Notas

```tsx
<div className="flex items-center gap-2 flex-wrap">
  {getNoteTypeBadge(note.note_type)}
  {note.created_by && (
    <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 font-medium">
      <User size={12} className="flex-shrink-0" />
      <span className="truncate max-w-[150px]">{getResponsibleName(note.created_by)}</span>
    </span>
  )}
</div>
```

---

## 🎨 Diseño Visual de Badges

Los badges siguen el mismo diseño que en `CRMCallHandler.tsx`:

### Badge de Responsable

- **Fondo:** `bg-blue-50` (azul muy claro)
- **Borde:** `border-blue-200` (azul claro)
- **Texto:** `text-blue-800` (azul oscuro)
- **Icono:** `User` de lucide-react, tamaño 12px
- **Espaciado:** `gap-1.5` entre icono y texto
- **Truncado:** Máximo 150px de ancho

### Badges de Tipo

- **Tareas:**
  - `call`: Azul (`bg-blue-100 text-blue-800`)
  - `meeting`: Púrpura (`bg-purple-100 text-purple-800`)
  - `email`: Amarillo (`bg-yellow-100 text-yellow-800`)
  - `reminder`: Naranja (`bg-orange-100 text-orange-800`)

- **Llamadas:**
  - `primera_llamada` / `contacto_inicial`: Azul (`bg-blue-100 text-blue-800`)
  - `seguimiento`: Verde (`bg-green-100 text-green-800`)
  - `venta`: Púrpura (`bg-purple-100 text-purple-800`)

- **Notas:**
  - `comment`: Gris (`bg-gray-100 text-gray-800`)
  - `call`: Azul (`bg-blue-100 text-blue-800`)
  - `email`: Amarillo (`bg-yellow-100 text-yellow-800`)
  - `system`: Púrpura (`bg-purple-100 text-purple-800`)

### Badges de Estado

- **Tareas:**
  - Completada: Verde (`bg-green-100 text-green-800`)
  - Pendiente: Amarillo (`bg-yellow-100 text-yellow-800`)

- **Llamadas:**
  - Completada: Verde (`bg-green-100 text-green-800`)
  - Sin respuesta: Amarillo (`bg-yellow-100 text-yellow-800`)
  - Otros: Gris (`bg-gray-100 text-gray-800`)

---

## 🔄 Condiciones de Visualización

### Filtrado por Creador

Los elementos se muestran cuando:

1. **Usuario es admin** (`is_superuser` o `role === 'admin'` o `role === 'superuser'`):
   - ✅ Ve todos los elementos (tareas, llamadas y notas)

2. **Usuario regular**:
   - ✅ **Tareas**: Ve si `created_by === currentUserId` o `responsible_user_id === currentUserId`
   - ✅ **Llamadas**: Ve si `responsible_user_id === currentUserId`
   - ✅ **Notas**: Ve si `created_by === currentUserId`

### Badges

Los badges se muestran cuando:

- ✅ **Badge de responsable**: El elemento tiene `responsible_user_id` (tareas/llamadas) o `created_by` (notas)
- ✅ **Badge de tipo**: El elemento tiene `task_type`, `call_type` o `note_type`
- ✅ **Badge de estado**: El elemento tiene `is_completed` (tareas) o `call_status` (llamadas)

---

## 📚 Archivos Modificados

### `src/pages/CRMTaskCalendar.tsx`

**Cambios realizados:**
- ✅ Importación de `useAuth`, `User`, `MessageSquare` y tipos `Note`, `CRMUser`
- ✅ Estado para usuarios responsables y notas
- ✅ Función `loadUsers()` para cargar usuarios responsables
- ✅ Carga de notas en `loadData()`
- ✅ Filtrado por creador (solo mostrar a creadores o admins)
- ✅ Función `getNotesForDate()` para filtrar notas por fecha
- ✅ Funciones helper: `getResponsibleName()`, `getCallTypeBadge()`, `getTaskTypeBadge()`, `getNoteTypeBadge()`
- ✅ Actualización de `renderDayView()` con badges y notas
- ✅ Layout mejorado con mejor organización visual

**Secciones modificadas:**
- Imports y tipos
- Estados del componente
- Función `loadData()` (carga de notas y filtrado)
- Función `renderDayView()` (badges y notas)
- Funciones helper para badges

---

## ✅ Resultado

Ahora la vista de día del calendario:

- ✅ Muestra badges de responsable en tareas, llamadas y notas
- ✅ Muestra badges de tipo para mejor identificación visual
- ✅ Muestra badges de estado para tareas y llamadas
- ✅ Filtra elementos por creador (solo visibles a creadores o admins)
- ✅ Incluye notas en la vista de día
- ✅ Tiene diseño visual consistente con `CRMCallHandler.tsx`
- ✅ Mejor organización visual con layout mejorado

### Comparación Visual

**Antes:**
- Sin badges informativos
- Todos los usuarios veían todos los elementos
- Notas no aparecían en el calendario
- Diseño inconsistente

**Después:**
- Badges claramente visibles con información de responsable, tipo y estado
- Filtrado por creador (solo creadores o admins)
- Notas incluidas en la vista de día
- Diseño consistente y mejorado

---

## 🔗 Referencias Relacionadas

### Documentación Backend

- [Backend: Endpoint para Usuarios Responsables](./BACKEND_ENDPOINT_RESPONSIBLE_USERS.md) - Documentación del endpoint `/api/crm/users/responsibles`
- [Backend Calendar Calls Filter](./BACKEND_CALENDAR_CALLS_FILTER.md) - Documentación de endpoints de calendario

### Documentación Frontend

- [Frontend Responsible Badge Fix](./FRONTEND_RESPONSIBLE_BADGE_FIX.md) - Corrección similar de badges en lista de llamadas
- [Frontend CRM Tasks Notes Implementation](./FRONTEND_CRM_TASKS_NOTES_IMPLEMENTATION.md) - Documentación del módulo CRUD de tareas y notas

### Componentes Relacionados

1. **CRMCallHandler.tsx** - Lista de llamadas recientes
   - Muestra badges de responsable, tipo y estado
   - Usa `getResponsibleUsers()` para cargar usuarios responsables

2. **CallHistory.tsx** - Historial de llamadas
   - Muestra badges de responsable, tipo y estado
   - Usa `getResponsibleUsers()` para cargar usuarios responsables

Ambos componentes ahora comparten:
- ✅ Mismo diseño visual de badges
- ✅ Misma lógica de carga de usuarios responsables
- ✅ Mismo manejo de errores y casos especiales

---

## 📝 Notas Técnicas

### Endpoint Utilizado

**GET `/api/crm/users/responsibles`**

- **Parámetros:**
  - `is_active` (boolean, opcional, default: `true`): Filtrar solo usuarios activos

- **Respuesta:**
  ```typescript
  interface ResponsibleUser {
    id: string;
    email: string;
    name: string;
    role_name: 'lawyer' | 'agent';
    is_active: boolean;
    is_current_user?: boolean;
    created_at: string;
    updated_at: string;
  }
  ```

### Endpoint de Notas

**GET `/api/crm/notes`**

- **Parámetros:**
  - `limit` (number, opcional): Número máximo de notas a retornar
  - `entity_type` (string, opcional): Tipo de entidad
  - `entity_id` (string, opcional): ID de la entidad
  - `created_by` (string, opcional): ID del creador

- **Respuesta:**
  ```typescript
  interface NotesListResponse {
    items: Note[];
    total: number;
    skip: number;
    limit: number;
  }
  ```

### Filtrado por Creador

**Lógica implementada:**

```typescript
const isAdmin = user?.is_superuser || user?.role === 'admin' || user?.role === 'superuser';
const currentUserId = user?.id;

// Tareas: mostrar si es admin, o si created_by o responsible_user_id coinciden
const filteredTasks = isAdmin 
  ? tasksData 
  : tasksData.filter(task => 
      task.created_by === currentUserId || 
      task.responsible_user_id === currentUserId
    );

// Llamadas: mostrar si es admin, o si responsible_user_id coincide
const filteredCalls = isAdmin 
  ? callsData 
  : callsData.filter(call => call.responsible_user_id === currentUserId);

// Notas: mostrar si es admin, o si created_by coincide
const filteredNotes = isAdmin 
  ? notesData 
  : notesData.filter(note => note.created_by === currentUserId);
```

---

## ✅ Checklist de Implementación

- [x] Agregar carga de usuarios responsables
- [x] Agregar carga de notas
- [x] Implementar filtrado por creador (solo mostrar a creadores o admins)
- [x] Agregar función `getNotesForDate()` para filtrar notas por fecha
- [x] Agregar funciones helper para badges (`getResponsibleName`, `getCallTypeBadge`, `getTaskTypeBadge`, `getNoteTypeBadge`)
- [x] Actualizar `renderDayView()` con badges y notas
- [x] Mejorar layout visual con mejor organización
- [x] Verificar consistencia con `CRMCallHandler.tsx`
- [x] Documentar cambios

---

## 🚀 Próximos Pasos

1. **Verificar en producción**: Asegurarse de que el filtrado y los badges funcionan correctamente con datos reales
2. **Monitorear rendimiento**: Verificar que la carga de usuarios responsables y notas es eficiente
3. **Feedback de usuarios**: Recopilar feedback sobre la visibilidad y usabilidad de los badges
4. **Posibles mejoras futuras:**
   - Agregar tooltip con información completa del responsable
   - Agregar enlace al perfil del responsable al hacer clic en el badge
   - Agregar avatar del responsable junto al badge
   - Implementar filtros adicionales en la vista de día (por tipo, estado, etc.)

---

**Prioridad**: Alta  
**Estimación**: 2 horas  
**Dependencias**: 
- Endpoint `/api/crm/users/responsibles` debe estar disponible
- Hook `useAuth()` debe estar disponible
- Servicio `crmService.getResponsibleUsers()` debe estar implementado

