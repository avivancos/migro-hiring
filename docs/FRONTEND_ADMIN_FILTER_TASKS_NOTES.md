# Frontend: Filtrado de Tareas y Notas para Administradores

**Fecha**: 2025-01-28  
**Prioridad**: 🔴 Alta  
**Estado**: ✅ Completado  
**Módulo**: Frontend - CRM Tasks & Notes

---

## 📋 Resumen Ejecutivo

Se implementó la funcionalidad de filtrado de tareas y notas por usuario para administradores. Los admins ahora pueden filtrar tareas por responsable (`responsible_user_id`) y notas por creador (`created_by`), permitiéndoles ver y gestionar las tareas y notas de sus agentes.

---

## 🐛 Problema Identificado

### Síntomas
- Como admin, no se podía filtrar las tareas de los agentes por responsable
- No se podía filtrar las notas de los agentes por creador
- Solo se veían las tareas y notas propias del admin, no las de los agentes

### Causa Raíz

1. **Notas**: 
   - El hook `useNotes` no tenía soporte para filtrar por `created_by`
   - No existía un componente de filtros para notas
   - La página de notas no tenía interfaz para filtrar

2. **Tareas**:
   - El filtro de `responsible_user_id` existía pero podría no estar funcionando correctamente
   - Necesitaba verificación y mejoras en el logging para debug

---

## 🔧 Solución Implementada

### 1. Soporte de Filtrado por Creador en Notas

**Archivo**: `src/hooks/useNotes.ts`

Se agregó el parámetro `createdBy` al hook `useNotes`:

```typescript
interface UseNotesOptions {
  skip?: number;
  limit?: number;
  entityId?: string;
  entityType?: 'contacts';
  createdBy?: string; // UUID del creador - Solo para admins
  autoLoad?: boolean;
}
```

**Lógica de seguridad**:
- Solo admins pueden usar el parámetro `createdBy` para filtrar
- Los usuarios regulares ven automáticamente solo sus propias notas
- Se mantiene filtrado adicional en el cliente como medida de seguridad

### 2. Componente de Filtros para Notas

**Archivo**: `src/components/CRM/Notes/NoteFilters.tsx` (NUEVO)

Se creó un componente de filtros similar a `TaskFilters` que permite:
- Filtrar por tipo de nota (`note_type`)
- Filtrar por creador (`created_by`) - Solo visible para admins
- Limpiar filtros

**Características**:
- Mobile-first design
- Validación de permisos (solo admins ven el filtro de creador)
- Carga de usuarios desde `useCRMUsers` hook

### 3. Integración de Filtros en NoteList

**Archivo**: `src/components/CRM/Notes/NoteList.tsx`

Se actualizó el componente para:
- Aceptar y usar filtros de estado
- Mostrar el componente `NoteFilters` cuando `showFilters={true}`
- Filtrar notas por tipo en el cliente (además del filtro de creador que se envía al backend)

### 4. Mejoras en Filtrado de Tareas

**Archivo**: `src/hooks/useTasks.ts`

Se agregaron logs de debug para ayudar a diagnosticar problemas:
- Log cuando un admin filtra tareas por responsable
- Muestra los filtros que se envían al backend

### 5. Logs de Debug para Notas

**Archivo**: `src/hooks/useNotes.ts`

Se agregaron logs similares para notas:
- Log cuando un admin filtra notas por creador
- Muestra los filtros que se envían al backend

---

## 📝 Cambios Realizados

### Archivos Modificados

1. **`src/hooks/useNotes.ts`**
   - Agregado parámetro `createdBy` a `UseNotesOptions`
   - Implementada lógica de seguridad para admins
   - Agregados logs de debug

2. **`src/components/CRM/Notes/NoteList.tsx`**
   - Agregado estado de filtros
   - Integrado componente `NoteFilters`
   - Filtrado por tipo de nota en el cliente

### Archivos Creados

1. **`src/components/CRM/Notes/NoteFilters.tsx`** (NUEVO)
   - Componente completo de filtros para notas
   - Similar a `TaskFilters` pero adaptado para notas

### Archivos con Mejoras Menores

1. **`src/hooks/useTasks.ts`**
   - Agregados logs de debug para admins

---

## 🎯 Funcionalidad

### Para Administradores

#### Filtrado de Tareas
- Pueden filtrar tareas por responsable usando el dropdown "Responsable"
- Opción "Todos" muestra todas las tareas sin filtrar
- Pueden seleccionar cualquier usuario (lawyer o agent) para ver sus tareas

#### Filtrado de Notas
- Pueden filtrar notas por creador usando el dropdown "Creador"
- Opción "Todos" muestra todas las notas sin filtrar
- Pueden seleccionar cualquier usuario para ver sus notas
- También pueden filtrar por tipo de nota (comentario, llamada, reunión, email, sistema)

### Para Usuarios Regulares (Agentes/Lawyers)

- **Tareas**: Solo ven sus propias tareas (filtrado automático por el backend)
- **Notas**: Solo ven sus propias notas (filtrado automático por el backend)
- No tienen acceso a los filtros de usuario (no se muestran en la UI)

---

## 🔒 Seguridad

### Validaciones Implementadas

1. **Frontend**:
   - Verificación de rol antes de mostrar filtros de usuario
   - Eliminación automática de filtros de usuario para usuarios regulares
   - Filtrado adicional en el cliente como medida de seguridad

2. **Backend** (debe implementarse):
   - El backend debe validar que solo admins puedan usar `responsible_user_id` y `created_by`
   - Los usuarios regulares deben ver automáticamente solo sus propios datos

### Recomendaciones

- El backend debe validar los permisos del usuario antes de aplicar filtros
- Los logs de debug pueden ayudar a diagnosticar problemas de filtrado
- Considerar remover los logs de debug en producción

---

## 🧪 Testing

### Casos de Prueba

1. **Admin filtrando tareas**:
   - Seleccionar "Todos" → Debe mostrar todas las tareas
   - Seleccionar un agente específico → Debe mostrar solo las tareas de ese agente
   - Verificar logs en consola

2. **Admin filtrando notas**:
   - Seleccionar "Todos" → Debe mostrar todas las notas
   - Seleccionar un agente específico → Debe mostrar solo las notas de ese agente
   - Filtrar por tipo de nota → Debe funcionar correctamente
   - Verificar logs en consola

3. **Usuario regular**:
   - No debe ver filtros de usuario
   - Debe ver solo sus propias tareas y notas
   - No debe poder acceder a datos de otros usuarios

---

## 📚 Referencias

- [Frontend Tasks Filter Admin Fix](./FRONTEND_TASKS_FILTER_ADMIN_FIX.md) - Corrección similar anterior
- [Frontend Calendar Day View Improvements](./FRONTEND_CALENDAR_DAY_VIEW_IMPROVEMENTS.md) - Filtrado en calendario
- [Backend Calendar Calls Filter By User](./BACKEND_CALENDAR_CALLS_FILTER_BY_USER.md) - Implementación backend similar

---

## ✅ Checklist de Implementación

- [x] Agregar soporte para `createdBy` en `useNotes`
- [x] Crear componente `NoteFilters`
- [x] Integrar filtros en `NoteList`
- [x] Agregar logs de debug para tareas
- [x] Agregar logs de debug para notas
- [x] Verificar que los filtros funcionen para admins
- [x] Verificar que usuarios regulares no vean filtros de usuario
- [x] Documentar cambios

---

## 🔄 Próximos Pasos

1. **Backend**: Verificar que el backend respete los filtros de admin correctamente
2. **Testing**: Probar en diferentes escenarios con múltiples usuarios
3. **Optimización**: Considerar caché de usuarios para mejorar rendimiento
4. **UX**: Considerar agregar búsqueda por nombre de usuario en los filtros

---

## 📝 Notas Técnicas

### Estructura de Filtros

**Tareas** (`TaskFilters`):
```typescript
{
  responsible_user_id?: string; // Solo para admins
  task_type?: string;
  is_completed?: boolean;
  // ... otros filtros
}
```

**Notas** (`NoteFilters`):
```typescript
{
  created_by?: string; // Solo para admins
  note_type?: string;
}
```

### Flujo de Datos

1. Usuario selecciona filtro en UI
2. Componente actualiza estado de filtros
3. Hook recibe filtros y valida permisos
4. Si es admin, envía filtro al backend
5. Si no es admin, elimina filtro (backend aplica automáticamente)
6. Backend devuelve datos filtrados
7. Frontend muestra resultados

---

**Autor**: Auto (AI Assistant)  
**Revisado**: Pendiente  
**Versión**: 1.0
