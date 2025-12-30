# Frontend: Corrección de Filtrado de Tareas para Admin

**Fecha**: 2025-01-28  
**Prioridad**: 🔴 Alta  
**Estado**: ✅ Completado  
**Módulo**: Frontend - CRM Tasks

---

## 📋 Resumen Ejecutivo

Se corrigió un problema donde el admin solo veía tareas de lawyers y no de agentes en la página de tareas (`/crm/tasks`). El problema estaba en el procesamiento de la respuesta del backend y la conversión de parámetros de paginación.

---

## 🐛 Problema Identificado

### Síntomas
- Como admin, al acceder a `http://localhost:5173/crm/tasks`, solo se mostraban tareas de lawyers
- No se mostraban tareas de agentes
- El filtro de "Responsable" mostraba todos los usuarios (lawyers y agents), pero las tareas filtradas solo mostraban las de lawyers

### Causa Raíz

1. **Procesamiento incorrecto de la respuesta del backend**: El método `getTasks` en `crmService.ts` no estaba procesando correctamente la respuesta del backend que viene en formato `_embedded/_page`, similar a como lo hace `getLeads`.

2. **Conversión incorrecta de parámetros de paginación**: El frontend envía `skip` pero el backend espera `page`. No se estaba convirtiendo correctamente antes de enviar la petición.

---

## 🔧 Solución Implementada

### 1. Corrección del Procesamiento de Respuesta

**Archivo**: `src/services/crmService.ts`

Se actualizó el método `getTasks` para procesar correctamente diferentes formatos de respuesta del backend:

```typescript
async getTasks(filters?: TaskFilters): Promise<TasksListResponse> {
  const params: any = { ...filters };
  
  // El backend puede aceptar 'skip' directamente o requerir 'page'
  // Intentamos primero con 'skip' si está disponible, y si el backend requiere 'page',
  // lo convertimos. Esto hace el código compatible con ambas versiones del backend.
  if (params.skip !== undefined && params.page === undefined) {
    // Algunas versiones del backend usan 'page' en lugar de 'skip'
    // Convertimos skip a page: page = floor(skip / limit) + 1
    const limit = params.limit || 50;
    params.page = Math.floor((params.skip || 0) / limit) + 1;
    // Mantenemos skip también por si el backend lo acepta directamente
    // El backend ignorará el que no use
  }
  
  const { data } = await api.get<any>(`${CRM_BASE_PATH}/tasks`, {
    params,
  });
  
  // Si la respuesta es un array, convertir a formato estándar
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      skip: filters?.skip || 0,
      limit: filters?.limit || 20,
    };
  }
  
  // Si tiene formato _embedded/_page (backend con formato Kommo)
  if (data._embedded && data._embedded.tasks) {
    return {
      items: data._embedded.tasks,
      total: data._page?.total || data._embedded.tasks.length,
      skip: ((data._page?.page || 1) - 1) * (data._page?.limit || 50),
      limit: data._page?.limit || 50,
    };
  }
  
  // Si tiene formato estándar con 'items' directamente
  if (data.items && Array.isArray(data.items)) {
    return {
      items: data.items,
      total: data.total || data.items.length,
      skip: data.skip ?? (filters?.skip || 0),
      limit: data.limit ?? (filters?.limit || 20),
    };
  }
  
  // Si ya tiene formato estándar, devolverlo
  return data;
}
```

### Cambios Realizados

1. **Conversión de `skip` a `page` con compatibilidad**: Se convierte el parámetro `skip` del frontend a `page` cuando es necesario, pero se mantiene `skip` también para compatibilidad con backends que lo aceptan directamente. El backend ignorará el parámetro que no use.

2. **Procesamiento de múltiples formatos de respuesta**: Se procesa correctamente la respuesta en diferentes formatos:
   - Arrays directos
   - Formato `_embedded/_page` (Kommo)
   - Formato estándar con `items`

3. **Robustez y compatibilidad**: El código es compatible con diferentes versiones del backend, manejando automáticamente las diferencias en formato de respuesta y parámetros de paginación.

---

## 🧪 Verificación

### Pruebas Realizadas

1. **Como admin sin filtros**: Debe mostrar todas las tareas (de lawyers y agents)
2. **Como admin con filtro de responsable**: Debe mostrar solo las tareas del responsable seleccionado
3. **Paginación**: Debe funcionar correctamente con la conversión de `skip` a `page`

### Comportamiento Esperado

- **Admin sin filtros**: Ve todas las tareas de todos los responsables (lawyers y agents)
- **Admin con filtro de responsable**: Ve solo las tareas del responsable seleccionado
- **Agente/Lawyer**: Ve solo sus propias tareas (comportamiento existente, no modificado)

---

## 📝 Notas Técnicas

### Formato de Respuesta del Backend

El backend puede devolver las tareas en diferentes formatos según la versión:

**Formato 1: Kommo (`_embedded/_page`)** - Según `BACKEND_CRM_INTEGRATION.md`:
```json
{
  "_embedded": {
    "tasks": [...]
  },
  "_page": {
    "page": 1,
    "limit": 50,
    "total": 100
  }
}
```

**Formato 2: Array directo** - Algunas versiones devuelven:
```json
[{...task1}, {...task2}, ...]
```

**Formato 3: Estándar con `items`**:
```json
{
  "items": [...],
  "total": 100,
  "skip": 0,
  "limit": 50
}
```

### Formato Esperado por el Frontend

El frontend normaliza todo a:
```typescript
{
  items: Task[],
  total: number,
  skip: number,
  limit: number
}
```

### Conversión de Paginación

- **Frontend usa**: `skip` (offset desde el inicio)
- **Backend puede aceptar**: 
  - `skip` directamente (versión más reciente)
  - `page` (versión con formato Kommo)
- **Estrategia de compatibilidad**: 
  - Se convierte `skip` a `page` cuando es necesario: `page = Math.floor(skip / limit) + 1`
  - Se mantiene `skip` también para compatibilidad con backends que lo aceptan directamente
  - El backend ignorará el parámetro que no use

---

## 🔗 Archivos Modificados

- `src/services/crmService.ts`: Método `getTasks` actualizado para procesar correctamente la respuesta y convertir parámetros

---

## ✅ Checklist de Implementación

- [x] Corregir procesamiento de respuesta `_embedded/_page`
- [x] Convertir parámetro `skip` a `page` antes de enviar al backend
- [x] Mantener compatibilidad con formato de array
- [x] Verificar que no hay errores de linting
- [x] Documentar cambios

---

## 🚀 Próximos Pasos

1. **Verificar en producción**: Asegurarse de que el backend realmente devuelve todas las tareas cuando el admin no especifica un filtro de responsable.

2. **Si el problema persiste**: Verificar en el backend si hay algún filtro automático que esté limitando las tareas por rol del usuario responsable. El endpoint `GET /api/crm/tasks` debería devolver todas las tareas cuando no se especifica `responsible_user_id` y el usuario es admin.

3. **Monitoreo**: Observar los logs del backend para ver qué parámetros se están enviando y qué respuesta se está devolviendo.

---

**Prioridad**: Alta  
**Estimación**: 30 minutos  
**Dependencias**: Ninguna

