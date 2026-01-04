# Frontend: Filtro de Responsable en Calendario - Incluir Agentes, Abogados y Admins

**Fecha**: 2025-01-30  
**Prioridad**: 🔴 Alta  
**Estado**: ✅ Completado  
**Módulo**: Frontend - CRM Calendar Filters

---

## 📋 Resumen

Se modificó el filtro de "Responsable" en el calendario y en los filtros de tareas para que incluya todos los usuarios que pueden ser responsables: **agentes**, **abogados** y **admins**, no solo abogados como estaba configurado anteriormente.

---

## 🔍 Problema Identificado

El filtro de "Responsable" en el calendario y en los filtros de tareas solo mostraba abogados (`lawyers`) y agentes (`agents`), pero no incluía administradores (`admins`) ni otros usuarios que pueden ser responsables de tareas y llamadas.

### Síntomas

- En el filtro de "Responsable" del calendario solo aparecían abogados y agentes
- Los administradores no aparecían en la lista de responsables disponibles
- Otros usuarios con permisos de responsable tampoco aparecían

---

## ✅ Cambios Realizados

### 1. Modificación del Hook `useCRMUsers`

**Archivo:** `src/hooks/useCRMUsers.ts`

Se modificó la lógica para que cuando se use `onlyResponsibles: true`, incluya también usuarios con rol `admin`:

```typescript
// Antes: Solo usaba getResponsibleUsers() que devuelve solo lawyers y agents
if (filters?.onlyResponsibles) {
  const responsibleUsers = await crmService.getResponsibleUsers(...);
}

// Después: Carga todos los usuarios y filtra por roles responsables
if (filters?.onlyResponsibles) {
  const allUsers = await crmService.getUsers(filters?.isActive ?? true, true);
  const responsibleUsers = allUsers.filter((u) => 
    u.role_name === 'lawyer' || 
    u.role_name === 'agent' || 
    u.role_name === 'admin' ||
    u.role === 'lawyer' ||
    u.role === 'agent' ||
    u.role === 'admin'
  );
}
```

**Beneficios:**
- ✅ Incluye todos los tipos de usuarios que pueden ser responsables
- ✅ Compatible con diferentes estructuras de datos (role_name y role)
- ✅ Más flexible y extensible

### 2. Actualización del Calendario

**Archivo:** `src/pages/CRMTaskCalendar.tsx`

Se modificó la función `loadUsers()` para que cargue todos los usuarios responsables (agentes, abogados y admins):

```typescript
const loadUsers = async () => {
  try {
    // Cargar todos los usuarios activos y filtrar por roles responsables
    const allUsers = await crmService.getUsers(true);
    const responsibleUsers = allUsers.filter((u) => 
      u.role_name === 'lawyer' || 
      u.role_name === 'agent' || 
      u.role_name === 'admin' ||
      u.role === 'lawyer' ||
      u.role === 'agent' ||
      u.role === 'admin'
    );
    setUsers(responsibleUsers);
    // ...
  }
};
```

**Beneficios:**
- ✅ El calendario muestra todos los responsables disponibles
- ✅ Los badges de responsable funcionan correctamente con todos los tipos de usuarios
- ✅ Consistencia con el filtro de tareas

### 3. Actualización de Comentarios

**Archivo:** `src/components/CRM/Tasks/TaskFilters.tsx`

Se actualizó el comentario para reflejar que ahora incluye admins:

```typescript
// Antes:
// Usar onlyResponsibles para cargar solo lawyers y agents (no todos los usuarios)

// Después:
// Usar onlyResponsibles para cargar responsables: lawyers, agents y admins
```

---

## 📊 Roles Incluidos

El filtro de "Responsable" ahora incluye usuarios con los siguientes roles:

1. **`lawyer`** - Abogados
2. **`agent`** - Agentes
3. **`admin`** - Administradores

---

## 🔧 Compatibilidad

Los cambios son compatibles con diferentes estructuras de datos:

- Usa `role_name` si está disponible (estructura del CRM)
- Usa `role` como fallback (estructura del sistema de usuarios)
- Maneja ambos campos para máxima compatibilidad

---

## ✅ Checklist de Implementación

- [x] Modificar `useCRMUsers` para incluir admins cuando se use `onlyResponsibles`
- [x] Actualizar `CRMTaskCalendar` para cargar todos los responsables
- [x] Actualizar comentarios en `TaskFilters.tsx`
- [x] Verificar que no hay errores de linting
- [x] Documentar cambios

---

## 🧪 Testing

### Verificación Manual

1. **Calendario:**
   - Ir a `/crm/calendar`
   - Verificar que en los badges de responsable aparecen agentes, abogados y admins
   - Verificar que los nombres se muestran correctamente

2. **Filtros de Tareas:**
   - Ir a la página de tareas con filtros
   - Abrir el filtro de "Responsable" (solo visible para admins)
   - Verificar que aparecen agentes, abogados y admins en la lista

3. **Formularios:**
   - Crear una nueva tarea
   - Verificar que en el campo "Responsable" aparecen agentes, abogados y admins

---

## 📝 Notas Técnicas

### Endpoint Utilizado

**GET `/api/crm/users?is_active=true`**

- Carga todos los usuarios activos del CRM
- El filtrado por roles responsables se hace en el frontend
- Esto permite incluir cualquier rol que se necesite sin modificar el backend

### Alternativa Considerada

Se consideró modificar el endpoint `/api/crm/users/responsibles` del backend para incluir admins, pero se decidió hacer el filtrado en el frontend para:

- Mayor flexibilidad sin requerir cambios en el backend
- Compatibilidad con diferentes estructuras de datos
- Facilidad para agregar más roles en el futuro

---

## 🔗 Referencias

- [Backend: Endpoint para Usuarios Responsables](./BACKEND_ENDPOINT_RESPONSIBLE_USERS.md) - Documentación del endpoint original
- [Frontend: Badge de Responsable](./FRONTEND_RESPONSIBLE_BADGE_FIX.md) - Fix relacionado con badges de responsable
- [Frontend: Vista de Día del Calendario](./FRONTEND_CALENDAR_DAY_VIEW_IMPROVEMENTS.md) - Mejoras en el calendario

---

## 🚀 Próximos Pasos

1. **Verificar en producción**: Asegurarse de que el filtro funciona correctamente con datos reales
2. **Considerar optimización**: Si hay muchos usuarios, considerar agregar paginación o un endpoint optimizado en el backend
3. **Monitorear rendimiento**: Verificar que la carga de todos los usuarios no afecta el rendimiento

---

**Prioridad**: Alta  
**Estimación**: 1 hora  
**Dependencias**: Ninguna
