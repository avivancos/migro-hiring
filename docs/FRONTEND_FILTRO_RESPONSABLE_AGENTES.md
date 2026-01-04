# Frontend: Corrección del Filtro de Responsable para Incluir Agentes

**Fecha**: 2025-01-30  
**Prioridad**: 🔴 Alta  
**Estado**: ✅ Completado  
**Módulo**: Frontend - CRM Filters

---

## 📋 Resumen

Se corrigió el filtro de "Responsable" en el calendario y otros componentes para que muestre tanto **abogados (lawyers)** como **agentes (agents)**, en lugar de solo abogados.

---

## 🔍 Problema Identificado

### Síntomas

- En el filtro de "Responsable" del calendario solo aparecían abogados
- Los agentes no aparecían en la lista de responsables disponibles
- El componente `TaskFilters` estaba cargando todos los usuarios en lugar de solo los responsables

### Causa

El componente `TaskFilters.tsx` estaba usando `useCRMUsers({ isActive: true })` sin el parámetro `onlyResponsibles: true`, lo que causaba que:

1. Se cargaran **todos** los usuarios activos del sistema (no solo responsables)
2. Si el backend tenía algún filtro adicional, podría estar devolviendo solo lawyers
3. El frontend no estaba usando el endpoint optimizado `/api/crm/users/responsibles` que devuelve solo lawyers y agents

---

## ✅ Cambios Realizados

### 1. Corrección en TaskFilters.tsx

**Archivo:** `src/components/CRM/Tasks/TaskFilters.tsx`

**Antes:**
```typescript
const { users, loading: usersLoading } = useCRMUsers({ isActive: true });
```

**Después:**
```typescript
// Usar onlyResponsibles para cargar solo lawyers y agents (no todos los usuarios)
const { users, loading: usersLoading } = useCRMUsers({ isActive: true, onlyResponsibles: true });
```

**Efecto:**
- ✅ Ahora usa el endpoint optimizado `/api/crm/users/responsibles`
- ✅ Solo carga usuarios con rol `lawyer` o `agent`
- ✅ Más eficiente (menos datos transferidos)
- ✅ Muestra tanto abogados como agentes en el filtro

### 2. Corrección en ModifyResponsiblesStep.tsx

**Archivo:** `src/components/pipelines/Wizards/Steps/ModifyResponsiblesStep.tsx`

**Antes:**
```typescript
const { users, loading: loadingUsers } = useCRMUsers({ isActive: true });
```

**Después:**
```typescript
// Usar onlyResponsibles para cargar solo lawyers y agents (no todos los usuarios)
const { users, loading: loadingUsers } = useCRMUsers({ isActive: true, onlyResponsibles: true });
```

**Efecto:**
- ✅ El wizard de modificación de responsables ahora muestra solo usuarios elegibles
- ✅ Consistente con otros componentes del sistema

---

## 🔧 Cómo Funciona

### Hook useCRMUsers

El hook `useCRMUsers` tiene lógica para determinar qué endpoint usar:

```typescript
// Si se solicita solo responsables, usar el endpoint optimizado
if (filters?.onlyResponsibles || (filters?.role && (filters.role === 'lawyer' || filters.role === 'agent'))) {
  const responsibleUsers = await crmService.getResponsibleUsers(filters?.isActive ?? true, true);
  
  // Si se especifica un rol específico además, filtrar por ese rol
  const filtered = filters?.role && (filters.role === 'lawyer' || filters.role === 'agent')
    ? responsibleUsers.filter((u) => u.role_name === filters.role)
    : responsibleUsers;
  
  setUsers(filtered);
} else {
  // Para otros casos, usar el endpoint general
  const allUsers = await crmService.getUsers(filters?.isActive, true);
  // ...
}
```

### Endpoint Backend

El frontend llama a:
```
GET /api/crm/users/responsibles?is_active=true
```

Que debería devolver:
```json
[
  {
    "id": "uuid-lawyer",
    "email": "lawyer@example.com",
    "name": "Juan Pérez",
    "role_name": "lawyer",
    "is_active": true
  },
  {
    "id": "uuid-agent",
    "email": "agent@example.com",
    "name": "María García",
    "role_name": "agent",
    "is_active": true
  }
]
```

---

## 📊 Componentes Afectados

### Componentes Corregidos

1. ✅ **TaskFilters.tsx** - Filtro de responsable en la página de tareas/calendario
2. ✅ **ModifyResponsiblesStep.tsx** - Wizard de modificación de responsables

### Componentes que Ya Estaban Correctos

- ✅ **CRMOpportunityDetail.tsx** - Ya usa `onlyResponsibles: true`
- ✅ **CRMTaskCalendar.tsx** - Ya usa `getResponsibleUsers()` directamente

---

## 🧪 Verificación

### Pasos para Verificar

1. **Abrir el calendario** (`/crm/calendar`)
2. **Si eres admin**, deberías ver el filtro de "Responsable"
3. **Verificar que aparecen:**
   - ✅ Abogados (lawyers)
   - ✅ Agentes (agents)
   - ❌ NO deberían aparecer otros roles (admin, etc.)

### Verificación en Consola

Abrir la consola del navegador y verificar:

```javascript
// Debería mostrar usuarios con role_name: 'lawyer' o 'agent'
console.log('Usuarios responsables:', users);
```

---

## ⚠️ Notas Importantes

### Backend Requerido

El backend **debe** implementar el endpoint `/api/crm/users/responsibles` que devuelva:

- ✅ Usuarios con `role_name = 'lawyer'`
- ✅ Usuarios con `role_name = 'agent'`
- ✅ Respetar el parámetro `is_active` (default: `true`)

**Implementación esperada en el backend:**
```python
@router.get("/users/responsibles", response_model=List[CRMUserResponse])
async def get_responsible_users(
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_crm_auth)
):
    """
    Obtiene usuarios que pueden ser asignados como responsables.
    Solo incluye usuarios con role 'lawyer' o 'agent'.
    """
    query = db.query(User).filter(
        User.role.in_(['lawyer', 'agent'])  # ⚠️ IMPORTANTE: Incluir ambos roles
    )
    
    if is_active:
        query = query.filter(User.is_active == True)
    
    users = query.order_by(User.full_name.asc()).all()
    return users
```

### Caché

El frontend usa caché de 10 minutos para los usuarios responsables, por lo que:

- Los cambios en el backend pueden tardar hasta 10 minutos en reflejarse
- Para desarrollo, se puede desactivar el caché temporalmente

---

## 🔗 Referencias

- [Backend Endpoint Responsible Users](./BACKEND_ENDPOINT_RESPONSIBLE_USERS.md) - Documentación del endpoint
- [Frontend Responsible Badge Fix](./FRONTEND_RESPONSIBLE_BADGE_FIX.md) - Fix relacionado con badges
- [Frontend Calendar Day View Improvements](./FRONTEND_CALENDAR_DAY_VIEW_IMPROVEMENTS.md) - Mejoras del calendario

---

## ✅ Checklist de Implementación

- [x] Corregir `TaskFilters.tsx` para usar `onlyResponsibles: true`
- [x] Corregir `ModifyResponsiblesStep.tsx` para usar `onlyResponsibles: true`
- [x] Verificar que no hay errores de linting
- [x] Documentar los cambios
- [ ] Verificar en producción que el backend devuelve correctamente lawyers y agents
- [ ] Probar el filtro en el calendario con datos reales

---

**Prioridad**: Alta  
**Estimación**: 30 minutos  
**Dependencias**: Backend debe devolver correctamente lawyers y agents en `/api/crm/users/responsibles`
