# Backend: Endpoint para Usuarios Responsables

## 📋 Resumen

Solicitud de un nuevo endpoint optimizado para obtener únicamente los usuarios que pueden ser asignados como responsables en el CRM (lawyers y agents activos).

---

## 🎯 Objetivo

Actualmente, el frontend obtiene todos los usuarios activos con `GET /crm/users?is_active=true` y luego filtra en el cliente para mostrar solo lawyers y agents. Esto es ineficiente y carga datos innecesarios.

**Solución:** Crear un endpoint dedicado que devuelva directamente solo los usuarios elegibles como responsables.

---

## 🔌 Nuevo Endpoint

### `GET /api/crm/users/responsibles`

**Descripción:** Obtiene una lista de usuarios activos que pueden ser asignados como responsables (lawyers y agents).

**Permisos:** Cualquier usuario autenticado del CRM (`verify_crm_auth`)

**Query Parameters:**
- `is_active` (opcional, boolean): Filtrar solo usuarios activos. Default: `true`
  - Si `true`: Solo devuelve usuarios con `is_active = true`
  - Si `false`: Devuelve todos los usuarios (activos e inactivos)
  - Si no se proporciona: Default a `true`

**Respuesta:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "lawyer@example.com",
    "name": "Juan Pérez",
    "role_name": "lawyer",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "email": "agent@example.com",
    "name": "María García",
    "role_name": "agent",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
]
```

**Campos mínimos requeridos en la respuesta:**
- `id` (UUID): ID del usuario
- `email` (string): Email del usuario
- `name` (string, opcional): Nombre completo o nombre del usuario
- `role_name` (string): Rol del usuario (`lawyer` o `agent`)
- `is_active` (boolean): Estado activo/inactivo

---

## 🔧 Implementación Backend

### Opción 1: Nuevo Endpoint Dedicado (Recomendado)

**Ruta:** `GET /api/crm/users/responsibles`

**Lógica:**
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
        User.role.in_(['lawyer', 'agent'])
    )
    
    if is_active:
        query = query.filter(User.is_active == True)
    
    # Ordenar por nombre para mejor UX
    users = query.order_by(User.full_name.asc()).all()
    
    return users
```

**Ventajas:**
- Endpoint dedicado con propósito claro
- Optimizado para este caso de uso específico
- Fácil de cachear y optimizar
- Reduce transferencia de datos innecesarios

---

### Opción 2: Extender Endpoint Existente

**Ruta:** `GET /api/crm/users`

**Nuevo Query Parameter:**
- `only_responsibles` (opcional, boolean): Si `true`, solo devuelve lawyers y agents

**Ejemplo:**
```python
@router.get("/users", response_model=List[CRMUserResponse])
async def get_crm_users(
    is_active: Optional[bool] = None,
    only_responsibles: Optional[bool] = None,  # NUEVO
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_crm_auth)
):
    query = db.query(User)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    # NUEVO: Filtrar solo responsables
    if only_responsibles:
        query = query.filter(User.role.in_(['lawyer', 'agent']))
    
    users = query.order_by(User.full_name.asc()).all()
    return users
```

**Uso:**
```
GET /api/crm/users?is_active=true&only_responsibles=true
```

**Ventajas:**
- No requiere nuevo endpoint
- Reutiliza código existente
- Compatible hacia atrás

**Desventajas:**
- Menos semántico que un endpoint dedicado
- Parámetro adicional puede confundir

---

## 💡 Recomendación

**Recomendamos la Opción 1 (Endpoint Dedicado)** porque:
1. ✅ Es más semántico y claro en su propósito
2. ✅ Facilita el cacheo específico para este caso de uso
3. ✅ Permite optimizaciones futuras sin afectar el endpoint general
4. ✅ Mejora la experiencia del desarrollador frontend

---

## 🔄 Uso en Frontend

Una vez implementado, el frontend actualizará `crmService.getUsers()` o creará un nuevo método:

```typescript
// Opción A: Nuevo método (si se implementa endpoint dedicado)
async getResponsibleUsers(isActive: boolean = true): Promise<CRMUser[]> {
  const { data } = await api.get<CRMUser[]>(`${CRM_BASE_PATH}/users/responsibles`, {
    params: { is_active: isActive },
  });
  return data;
}

// Opción B: Usar parámetro (si se extiende endpoint existente)
async getUsers(isActive?: boolean, onlyResponsibles?: boolean): Promise<CRMUser[]> {
  const { data } = await api.get<CRMUser[]>(`${CRM_BASE_PATH}/users`, {
    params: { 
      is_active: isActive,
      only_responsibles: onlyResponsibles,
    },
  });
  return data;
}
```

---

## 📝 Casos de Uso

Este endpoint se utilizará en:

1. **Formularios de creación/edición:**
   - `CallForm` - Select de responsable
   - `TaskForm` - Select de responsable
   - `LeadForm` - Select de responsable
   - `CompanyForm` - Select de responsable

2. **Modales de asignación:**
   - Modal de asignar agente en `CRMOpportunityDetail`
   - Cualquier modal que requiera seleccionar un responsable

3. **Filtros y búsquedas:**
   - Filtrar tareas/llamadas por responsable
   - Mostrar lista de responsables disponibles

---

## ✅ Checklist de Implementación

- [ ] Decidir entre Opción 1 (endpoint dedicado) o Opción 2 (parámetro)
- [ ] Implementar endpoint/parámetro en el backend
- [ ] Filtrar correctamente por roles `lawyer` y `agent`
- [ ] Respetar el parámetro `is_active` (default: `true`)
- [ ] Ordenar resultados por nombre (alfabético) para mejor UX
- [ ] Agregar tests unitarios
- [ ] Documentar en la API docs (Swagger/OpenAPI)
- [ ] Notificar al equipo frontend para actualizar el código

---

## 🔍 Ejemplo de Respuesta Completa

```json
[
  {
    "id": "1c22ca8f-2de6-4013-ab9d-706ea0dff658",
    "email": "lawyer@example.com",
    "name": "Juan Pérez Abogado",
    "role_name": "lawyer",
    "is_active": true,
    "phone_number": "+34600123456",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T15:45:00.000Z"
  },
  {
    "id": "2d33eb9g-3ef7-5124-bc0e-817fb1e0gg769",
    "email": "agent@example.com",
    "name": "María García Agente",
    "role_name": "agent",
    "is_active": true,
    "phone_number": "+34600987654",
    "created_at": "2024-01-16T11:20:00.000Z",
    "updated_at": "2024-01-21T09:30:00.000Z"
  }
]
```

---

## 📚 Notas Adicionales

- **Performance:** Este endpoint debería ser cacheable (usar cache en el frontend con TTL de 5-10 minutos, ya que los usuarios no cambian frecuentemente)
- **Seguridad:** Solo usuarios autenticados del CRM pueden acceder
- **Ordenamiento:** Recomendamos ordenar por `name` o `full_name` ascendente para mejor UX en los selects
- **Paginación:** Si se esperan muchos usuarios, considerar agregar paginación (pero inicialmente puede no ser necesario si solo hay lawyers y agents)

---

**Prioridad:** Media-Alta  
**Estimación:** 1-2 horas  
**Dependencias:** Ninguna

