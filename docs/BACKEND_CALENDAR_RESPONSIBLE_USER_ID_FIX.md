# Backend: Fix de responsible_user_id en Endpoint de Calendario

**Fecha**: 2025-01-30  
**Prioridad**: 🔴 Alta  
**Estado**: 📋 Pendiente de revisión  
**Módulo**: Backend - CRM Calendar Calls

---

## 📋 Resumen

El endpoint `GET /api/crm/calls/calendar` está devolviendo `responsible_user_id` incorrectos o que no coinciden con los usuarios reales, causando que aparezca "abogado de prueba" en el calendario cuando en el listado de llamadas sí aparece el responsable correcto.

---

## 🔍 Problema Identificado

### Síntomas

- En el **calendario** (`/crm/calendar`), las llamadas muestran "abogado de prueba" como responsable
- En el **listado de llamadas** (`CRMCallHandler`), el responsable se muestra correctamente
- Ambos usan el mismo endpoint `/api/crm/users/responsibles` para cargar usuarios
- El problema está en cómo el backend devuelve `responsible_user_id` en el endpoint de calendario

### Causa Probable

El endpoint `/api/crm/calls/calendar` puede estar:
1. **Devolviendo un ID incorrecto** en el campo `responsible_user_id`
2. **No serializando correctamente** el `responsible_user_id` (puede estar devolviendo un objeto en lugar de un string UUID)
3. **Usando un mapeo incorrecto** entre `User` y `CRMUser` al serializar
4. **Devolviendo un ID de un usuario de prueba** en lugar del usuario real asignado

---

## 🔍 Verificación Requerida

### 1. Comparar Endpoints

**Comparar cómo se devuelve `responsible_user_id` en:**

#### Endpoint Normal: `GET /api/crm/calls`
```python
# Verificar cómo se serializa responsible_user_id
# Debe ser un string UUID, no un objeto
```

#### Endpoint Calendario: `GET /api/crm/calls/calendar`
```python
# Verificar cómo se serializa responsible_user_id
# Debe ser EXACTAMENTE igual que en el endpoint normal
```

### 2. Verificar Serialización

**El `responsible_user_id` debe ser:**
- ✅ Un **string UUID** (ej: `"550e8400-e29b-41d4-a716-446655440000"`)
- ✅ **NO** un objeto `User` o `CRMUser`
- ✅ **NO** `null` si hay un responsable asignado
- ✅ El mismo ID que se usa en el endpoint normal de llamadas

**Ejemplo correcto:**
```json
{
  "id": "call-uuid",
  "responsible_user_id": "550e8400-e29b-41d4-a716-446655440000",  // ✅ String UUID
  "entity_id": "contact-uuid",
  ...
}
```

**Ejemplo incorrecto:**
```json
{
  "id": "call-uuid",
  "responsible_user_id": {  // ❌ Objeto en lugar de string
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Abogado de Prueba"
  },
  ...
}
```

### 3. Verificar Mapeo User → CRMUser

**Problema común:**
- El `current_user` puede ser de la tabla `users`
- El `responsible_user_id` en `crm_calls` referencia a `crm_users.id`
- Si hay un mapeo incorrecto, puede estar devolviendo el ID del usuario de prueba

**Verificar:**
```python
# En el endpoint de calendario, verificar cómo se obtiene el responsible_user_id
call.responsible_user_id  # Debe ser el ID de crm_users, no de users

# Si hay relación, verificar:
# - ¿Se está usando call.responsible_user_id directamente?
# - ¿O se está haciendo algún join/mapeo que pueda estar devolviendo el ID incorrecto?
```

---

## 🔧 Solución Requerida

### 1. Verificar Serialización en el Endpoint de Calendario

**Archivo**: `app/api/endpoints/crm.py` (o donde esté implementado el endpoint)

**Código actual (ejemplo):**
```python
@router.get("/calls/calendar")
async def get_calls_calendar(
    start_date: str = Query(...),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    # ... query ...
    
    # ❌ VERIFICAR: ¿Cómo se está serializando responsible_user_id?
    return [{
        "id": str(call.id),
        "responsible_user_id": call.responsible_user_id,  # ⚠️ Verificar esto
        # ...
    } for call in calls]
```

**Código corregido:**
```python
@router.get("/calls/calendar")
async def get_calls_calendar(
    start_date: str = Query(...),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    # ... query ...
    
    # ✅ Asegurar que responsible_user_id sea un string UUID
    return [{
        "id": str(call.id),
        "responsible_user_id": str(call.responsible_user_id) if call.responsible_user_id else None,  # ✅ Convertir a string
        # ... otros campos ...
    } for call in calls]
```

### 2. Usar el Mismo Schema que el Endpoint Normal

**Mejor solución**: Usar el mismo schema (`CallResponse`) que el endpoint normal:

```python
from app.schemas.crm_call import CallResponse

@router.get("/calls/calendar")
async def get_calls_calendar(
    start_date: str = Query(...),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    # ... query ...
    
    calls = query.order_by(Call.created_at.desc()).all()
    
    # ✅ Usar el mismo schema que el endpoint normal
    return [CallResponse.from_orm(call).dict() for call in calls]
```

**Ventajas:**
- ✅ Garantiza que la serialización sea idéntica
- ✅ Reutiliza la lógica existente
- ✅ Evita inconsistencias

### 3. Verificar que No Haya Usuarios de Prueba en la Base de Datos

**Verificar en la base de datos:**
```sql
-- Buscar usuarios con nombre "abogado de prueba" o similar
SELECT id, name, email, role_name 
FROM crm_users 
WHERE name ILIKE '%prueba%' OR name ILIKE '%test%' OR name ILIKE '%abogado de prueba%';

-- Verificar si hay llamadas asignadas a estos usuarios
SELECT c.id, c.responsible_user_id, u.name, u.email
FROM crm_calls c
LEFT JOIN crm_users u ON c.responsible_user_id = u.id
WHERE u.name ILIKE '%prueba%' OR u.name ILIKE '%test%';
```

**Si hay usuarios de prueba:**
- Considerar eliminarlos o marcarlos como inactivos
- Verificar que no se estén usando como responsables por defecto

### 4. Agregar Logging para Debugging

**Agregar logs temporales para identificar el problema:**
```python
@router.get("/calls/calendar")
async def get_calls_calendar(...):
    # ... query ...
    
    calls = query.order_by(Call.created_at.desc()).all()
    
    # ✅ Logging temporal para debugging
    for call in calls[:5]:  # Solo los primeros 5 para no saturar logs
        logger.info(f"Call {call.id}: responsible_user_id={call.responsible_user_id}, type={type(call.responsible_user_id)}")
        if call.responsible_user_id:
            # Verificar si el usuario existe
            crm_user = db.query(CRMUser).filter(CRMUser.id == call.responsible_user_id).first()
            if crm_user:
                logger.info(f"  -> CRM User found: {crm_user.name}, {crm_user.email}")
            else:
                logger.warning(f"  -> CRM User NOT found for ID: {call.responsible_user_id}")
    
    return [CallResponse.from_orm(call).dict() for call in calls]
```

---

## 📊 Comparación con Endpoint Normal

### Endpoint Normal: `GET /api/crm/calls`

**Verificar cómo se serializa:**
```python
# Buscar en el código del endpoint normal
@router.get("/calls")
async def get_calls(...):
    # ... query ...
    
    # ✅ Ver cómo se serializa aquí
    return {
        "items": [CallResponse.from_orm(call).dict() for call in calls],
        "total": total,
        ...
    }
```

**El endpoint de calendario debe usar EXACTAMENTE la misma serialización.**

---

## ✅ Checklist de Verificación

- [ ] Verificar que `responsible_user_id` se serializa como **string UUID** (no objeto)
- [ ] Comparar serialización entre endpoint normal y endpoint de calendario
- [ ] Usar el mismo schema (`CallResponse`) en ambos endpoints
- [ ] Verificar que no hay usuarios de prueba en la base de datos
- [ ] Verificar que no se está usando un ID de usuario de prueba por defecto
- [ ] Agregar logging temporal para identificar el problema
- [ ] Verificar que el mapeo `User` → `CRMUser` es correcto
- [ ] Probar que los IDs devueltos coinciden con los usuarios en `/api/crm/users/responsibles`

---

## 🧪 Testing

### Test 1: Verificar Serialización

```python
def test_calls_calendar_responsible_user_id_serialization():
    """Verificar que responsible_user_id se serializa como string UUID"""
    response = client.get(
        "/api/crm/calls/calendar",
        params={"start_date": "2025-01-01T00:00:00Z"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    calls = response.json()
    
    for call in calls:
        if call.get("responsible_user_id"):
            # Debe ser un string UUID, no un objeto
            assert isinstance(call["responsible_user_id"], str)
            assert len(call["responsible_user_id"]) == 36  # UUID length
            # No debe contener caracteres de objeto JSON
            assert not call["responsible_user_id"].startswith("{")
```

### Test 2: Comparar con Endpoint Normal

```python
def test_calls_calendar_matches_normal_endpoint():
    """Verificar que responsible_user_id es igual en ambos endpoints"""
    # Obtener llamada del calendario
    calendar_response = client.get(
        "/api/crm/calls/calendar",
        params={"start_date": "2025-01-01T00:00:00Z"},
        headers={"Authorization": f"Bearer {token}"}
    )
    calendar_calls = calendar_response.json()
    
    # Obtener la misma llamada del endpoint normal
    if calendar_calls:
        call_id = calendar_calls[0]["id"]
        normal_response = client.get(
            f"/api/crm/calls/{call_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        normal_call = normal_response.json()
        
        # Los responsible_user_id deben ser idénticos
        assert calendar_calls[0]["responsible_user_id"] == normal_call["responsible_user_id"]
```

### Test 3: Verificar que los IDs Existen

```python
def test_calls_calendar_responsible_user_ids_exist():
    """Verificar que todos los responsible_user_id existen en crm_users"""
    response = client.get(
        "/api/crm/calls/calendar",
        params={"start_date": "2025-01-01T00:00:00Z"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    calls = response.json()
    responsible_ids = {c["responsible_user_id"] for c in calls if c.get("responsible_user_id")}
    
    # Obtener usuarios responsables
    users_response = client.get(
        "/api/crm/users/responsibles",
        headers={"Authorization": f"Bearer {token}"}
    )
    user_ids = {u["id"] for u in users_response.json()}
    
    # Todos los responsible_user_id deben existir en la lista de usuarios responsables
    assert responsible_ids.issubset(user_ids), f"IDs no encontrados: {responsible_ids - user_ids}"
```

---

## 🔗 Referencias

- [Backend Calendar Calls Filter](./BACKEND_CALENDAR_CALLS_FILTER.md) - Documentación del endpoint de calendario
- [Backend Calendar Calls Filter By User](./BACKEND_CALENDAR_CALLS_FILTER_BY_USER.md) - Filtrado por usuario
- [Frontend Responsible Badge Fix](./FRONTEND_RESPONSIBLE_BADGE_FIX.md) - Fix en frontend relacionado

---

## 📝 Notas Adicionales

1. **El problema puede estar en:**
   - La serialización del schema `CallResponse`
   - Un join incorrecto que devuelve el usuario de prueba
   - Un valor por defecto incorrecto al crear llamadas

2. **Solución rápida temporal:**
   - Si el problema es urgente, se puede filtrar en el frontend, pero la solución correcta es arreglarlo en el backend

3. **Prevención:**
   - Usar siempre el mismo schema para serializar
   - Agregar tests que verifiquen la consistencia entre endpoints
   - Documentar claramente cómo se debe serializar `responsible_user_id`

---

**Prioridad**: Alta  
**Estimación**: 1-2 horas  
**Dependencias**: Acceso al código del backend y base de datos

