# Backend: Filtrado de Llamadas del Calendario por Usuario Actual (Agente)

**Fecha**: 2025-01-28  
**Prioridad**: 🔴 Alta  
**Estado**: 📋 Pendiente de implementación  
**Módulo**: Backend - CRM Calendar Calls

---

## 📋 Resumen Ejecutivo

El endpoint `GET /api/crm/calls/calendar` debe filtrar las llamadas para que los usuarios con rol **agente** (`agent`) solo vean sus propias llamadas (donde `responsible_user_id` coincide con el usuario actual). Los administradores y otros roles deben ver todas las llamadas.

---

## 🎯 Objetivo

Garantizar que:
- **Agentes**: Solo vean en el calendario las llamadas que les están asignadas (`responsible_user_id = su_id`)
- **Administradores**: Vean **ABSOLUTAMENTE TODO** sin ninguna limitación (todas las llamadas, incluso sin asignar o de otros agentes)

Esto mejora la privacidad y la experiencia de usuario para agentes al mostrar solo información relevante, mientras que los administradores tienen acceso completo para supervisión y gestión.

---

## 🔗 Relación Llamada-Usuario

```
Call (N) ←→ (1) CRMUser
```

**Relaciones:**
- Call → CRMUser: **N:1** (Muchas llamadas pueden estar asignadas a un usuario)
- Call tiene campo `responsible_user_id` que referencia al usuario CRM asignado
- El usuario actual se obtiene de la sesión (`current_user`)

**Estructura de Datos:**
- `crm_calls`: Tabla de llamadas
  - `responsible_user_id`: UUID del usuario CRM asignado (FK a `crm_users.id`, nullable)
  - `created_at`: Fecha de creación (usada para filtrar por rango de fechas)

---

## 📍 Implementación Requerida

### Endpoint Afectado

**`GET /api/crm/calls/calendar`**

### Cambios Necesarios

1. **Obtener el usuario actual** de la sesión (`current_user`)
2. **Verificar el rol del usuario**:
   - Si es `agent` → Filtrar por `responsible_user_id = current_user.id` (o el ID del usuario CRM correspondiente)
   - Si es `admin`, `lawyer`, `superuser` → Mostrar todas las llamadas (sin filtrar)
3. **Mantener** todos los filtros existentes (fechas, etc.)

---

## 🔧 Implementación Backend

### Código Sugerido

```python
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.crm import Call, CRMUser
from app.core.deps import get_current_admin_user

@router.get("/calls/calendar")
async def get_calls_calendar(
    start_date: str = Query(..., description="Fecha de inicio en formato ISO 8601"),
    end_date: Optional[str] = Query(None, description="Fecha de fin en formato ISO 8601"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """
    Endpoint específico para calendario que permite obtener llamadas por rango de fechas.
    
    - AGENTES: Solo llamadas donde responsible_user_id = current_user.id
    - ADMINISTRADORES: TODAS las llamadas sin ninguna limitación
    """
    
    # Verificar si es administrador
    is_admin = (
        getattr(current_user, 'is_superuser', False) or 
        getattr(current_user, 'role', None) == 'admin' or
        getattr(current_user, 'role', None) == 'superuser'
    )
    
    # Query base: Filtrar por fechas usando created_at
    query = db.query(Call).filter(
        Call.is_deleted == False
    )
    
    # Filtrar por fecha de inicio
    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    query = query.filter(Call.created_at >= start_dt)
    
    # Filtrar por fecha de fin (si se proporciona)
    if end_date:
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        query = query.filter(Call.created_at <= end_dt)
    
    # Filtrar por usuario SOLO si es agente
    if not is_admin:
        user_role = getattr(current_user, 'role', None)
        
        if user_role == 'agent':
            # AGENTE: Filtrar solo sus propias llamadas
            # Obtener el ID del usuario CRM correspondiente al usuario actual
            # OPCIÓN A: Si current_user.id es directamente el crm_user.id
            crm_user_id = current_user.id
            
            # OPCIÓN B: Si necesitas buscar el crm_user por user.id
            # crm_user = db.query(CRMUser).filter(CRMUser.user_id == current_user.id).first()
            # if not crm_user:
            #     return []  # Usuario no tiene perfil CRM, retornar lista vacía
            # crm_user_id = crm_user.id
            
            query = query.filter(
                and_(
                    Call.responsible_user_id == crm_user_id,
                    Call.responsible_user_id.isnot(None)  # Excluir NULLs
                )
            )
    # Si es admin, no aplicar ningún filtro adicional (ver TODO)
    
    # Ejecutar query
    calls = query.order_by(Call.created_at.desc()).all()
    
    # Retornar array directo (no objeto con items)
    # Incluir contact_name si está disponible en el modelo
    return [{
        "id": call.id,
        "entity_id": call.entity_id,
        "entity_type": call.entity_type,
        "direction": call.direction,
        "phone": call.phone_number,
        "duration": call.duration,
        "call_status": call.status,
        "started_at": call.started_at.isoformat() if call.started_at else None,
        "ended_at": call.ended_at.isoformat() if call.ended_at else None,
        "responsible_user_id": str(call.responsible_user_id) if call.responsible_user_id else None,
        "created_at": call.created_at.isoformat() if call.created_at else None,
        "contact_name": getattr(call, 'contact_name', None),  # Si está disponible
        # ... otros campos
    } for call in calls]
```

### Alternativa: Usar Subquery

```python
@router.get("/calls/calendar")
async def get_calls_calendar(
    start_date: str = Query(...),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """
    Endpoint para calendario con filtro por usuario para agentes.
    """
    
    # Obtener ID del usuario CRM
    crm_user_id = current_user.id  # Ajustar según estructura
    
    # Verificar rol
    user_role = getattr(current_user, 'role', None)
    
    # Query base
    query = db.query(Call).filter(
        and_(
            Call.is_deleted == False,
            Call.created_at >= datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        )
    )
    
    if end_date:
        query = query.filter(
            Call.created_at <= datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        )
    
    # Filtrar por usuario si es agente
    if user_role == 'agent':
        query = query.filter(Call.responsible_user_id == crm_user_id)
    
    calls = query.order_by(Call.created_at.desc()).all()
    
    return [call_to_dict(call) for call in calls]
```

---

## 🔍 Consideraciones Importantes

### 1. Mapeo de Usuario Actual a Usuario CRM

**Problema**: El `current_user` puede ser de la tabla `users`, pero `responsible_user_id` en llamadas referencia a `crm_users`.

**Solución**: Necesitas mapear correctamente:
- Si `current_user` es directamente un `CRMUser`, usar `current_user.id`
- Si `current_user` es un `User` y existe relación con `CRMUser`, buscar el `CRMUser` correspondiente

**Ejemplo de mapeo:**
```python
# Si existe relación directa
crm_user = db.query(CRMUser).filter(
    CRMUser.user_id == current_user.id
).first()

if not crm_user:
    # Usuario no tiene perfil CRM, retornar lista vacía
    return []

crm_user_id = crm_user.id
```

### 2. Verificación de Rol

**Opciones para obtener el rol:**
1. Desde `current_user.role` (si está disponible)
2. Desde la tabla `users` relacionada
3. Desde `current_user.is_superuser` o `current_user.is_admin`

**Ejemplo:**
```python
# Opción 1: Desde current_user
user_role = getattr(current_user, 'role', None)

# Opción 2: Desde tabla users
user = db.query(User).filter(User.id == current_user.id).first()
user_role = user.role if user else None

# Opción 3: Verificar permisos
is_admin = getattr(current_user, 'is_superuser', False) or getattr(current_user, 'is_admin', False)
if is_admin:
    # Mostrar todas
else:
    # Filtrar por usuario
```

### 3. Llamadas sin Usuario Asignado

**Comportamiento**: Si una llamada tiene `responsible_user_id = NULL`, los agentes **NO** deben verla (solo admins).

**Implementación:**
```python
if user_role == 'agent':
    query = query.filter(
        and_(
            Call.responsible_user_id == crm_user_id,
            Call.responsible_user_id.isnot(None)  # Excluir NULLs
        )
    )
```

### 4. Permisos de Administrador

**IMPORTANTE**: Los administradores (`admin`, `superuser`) deben ver **ABSOLUTAMENTE TODO** sin ninguna limitación. No se aplica ningún filtro de usuario para ellos.

**Lógica:**
```python
# Verificar si es administrador
is_admin = (
    getattr(current_user, 'is_superuser', False) or 
    getattr(current_user, 'role', None) == 'admin' or
    getattr(current_user, 'role', None) == 'superuser'
)

if is_admin:
    # ADMIN: Ver TODAS las llamadas sin ninguna limitación
    # No aplicar filtro de usuario
    # La query ya tiene los filtros de fecha, no agregar nada más
    pass
elif user_role == 'agent':
    # AGENTE: Filtrar solo sus propias llamadas
    query = query.filter(
        and_(
            Call.responsible_user_id == crm_user_id,
            Call.responsible_user_id.isnot(None)  # Excluir NULLs
        )
    )
else:
    # Otros roles (lawyer, etc.): Ver todas las llamadas
    pass
```

---

## 📊 SQL Equivalente

La consulta SQL equivalente sería:

**Para Agentes:**
```sql
SELECT c.*
FROM crm_calls c
WHERE c.is_deleted = false
  AND c.created_at >= :start_date
  AND (:end_date IS NULL OR c.created_at <= :end_date)
  AND c.responsible_user_id = :crm_user_id  -- Solo sus llamadas
  AND c.responsible_user_id IS NOT NULL  -- Excluir NULLs
ORDER BY c.created_at DESC;
```

**Para Administradores (SIN filtro de usuario):**
```sql
SELECT c.*
FROM crm_calls c
WHERE c.is_deleted = false
  AND c.created_at >= :start_date
  AND (:end_date IS NULL OR c.created_at <= :end_date)
  -- NO se aplica filtro de responsible_user_id para admins
ORDER BY c.created_at DESC;
```

---

## 🧪 Testing

### Casos de Prueba

1. **Agente ve solo sus llamadas**: Debe ver solo llamadas donde `responsible_user_id = su_id`
2. **Agente no ve llamadas de otros**: No debe ver llamadas asignadas a otros agentes
3. **Agente no ve llamadas sin asignar**: No debe ver llamadas con `responsible_user_id = NULL`
4. **Admin ve ABSOLUTAMENTE TODO**: Debe ver TODAS las llamadas sin ninguna limitación (incluso sin asignar, de otros agentes, etc.)
5. **Superuser ve ABSOLUTAMENTE TODO**: Debe ver TODAS las llamadas sin ninguna limitación
6. **Lawyer ve todas las llamadas**: Debe ver todas las llamadas sin filtrar (comportamiento similar a admin)
7. **Filtros de fecha funcionan**: Los filtros de fecha deben seguir funcionando correctamente para todos los roles

### Ejemplo de Test

```python
async def test_get_calls_calendar_filtered_by_agent():
    # Crear usuarios
    admin_user = create_user(role='admin')
    agent_user = create_user(role='agent')
    crm_agent = create_crm_user(user_id=agent_user.id)
    
    # Crear llamadas
    call1 = create_call(responsible_user_id=crm_agent.id)  # Asignada al agente
    call2 = create_call(responsible_user_id=other_agent.id)  # Asignada a otro agente
    call3 = create_call(responsible_user_id=None)  # Sin asignar
    
    # Llamar como agente
    response = await client.get(
        "/api/crm/calls/calendar",
        params={"start_date": "2025-01-01T00:00:00Z"},
        headers={"Authorization": f"Bearer {agent_token}"}
    )
    
    assert response.status_code == 200
    calls = response.json()
    
    # Solo debe ver call1 (la asignada a él)
    assert len(calls) == 1
    assert calls[0]["id"] == str(call1.id)
    
    # Llamar como admin
    response = await client.get(
        "/api/crm/calls/calendar",
        params={"start_date": "2025-01-01T00:00:00Z"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    calls = response.json()
    
    # Admin debe ver ABSOLUTAMENTE TODAS las llamadas (sin ninguna limitación)
    assert len(calls) == 3
    # Verificar que incluye llamadas de todos los agentes y sin asignar
    call_ids = [c["id"] for c in calls]
    assert str(call1.id) in call_ids
    assert str(call2.id) in call_ids
    assert str(call3.id) in call_ids
```

---

## 📝 Notas Adicionales

1. **Rendimiento**: Considerar agregar índices en:
   - `crm_calls.responsible_user_id`
   - `crm_calls.created_at`
   - `crm_calls.is_deleted`

2. **Compatibilidad**: Mantener todos los parámetros existentes para no romper el frontend

3. **Logging**: Agregar logs para debugging:
   ```python
   logger.info(f"Filtrando llamadas del calendario para usuario: {crm_user_id}, Rol: {user_role}, Total encontradas: {len(calls)}")
   ```

4. **Frontend**: El frontend no necesita cambios, ya que el filtro se aplica automáticamente en el backend según el usuario autenticado.

---

## ✅ Checklist de Implementación

- [ ] Modificar endpoint `GET /api/crm/calls/calendar`
- [ ] Obtener usuario actual de la sesión
- [ ] Verificar rol del usuario
- [ ] Filtrar por `responsible_user_id` si es agente
- [ ] Mantener filtros de fecha existentes
- [ ] Mapear correctamente `current_user` a `crm_user_id`
- [ ] Agregar lógica para admins/lawyers (ver todas)
- [ ] Agregar índices en base de datos si es necesario
- [ ] Probar con diferentes roles de usuario
- [ ] Verificar que filtros de fecha funcionan correctamente
- [ ] Verificar que agentes no ven llamadas sin asignar

---

## 🔗 Relación con Otros Requerimientos

Este requerimiento está relacionado con:
- **Filtrado de Contactos por Usuario**: `docs/BACKEND_CONTACTS_FILTER_BY_USER_OPPORTUNITIES.md`
- Ambos requieren filtrar por usuario actual cuando el rol es `agent`

---

## 📅 Fecha de Creación

2025-01-28

