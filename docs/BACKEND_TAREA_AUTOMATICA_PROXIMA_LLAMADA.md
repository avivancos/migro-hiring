# Backend: Creación Automática de Tarea de Seguimiento para Próxima Llamada

**Fecha**: 2025-01-30  
**Prioridad**: 🔴 Alta  
**Estado**: ⏳ Pendiente  
**Módulo**: Backend - CRM Calls Endpoint

---

## 📋 Resumen

El backend debe crear automáticamente una tarea de seguimiento cuando se crea o actualiza una llamada con el campo `proxima_llamada_fecha` especificado.

---

## 🎯 Objetivo

Centralizar la lógica de creación automática de tareas en el backend, eliminando la necesidad de que el frontend haga múltiples llamadas y evitando problemas de timing/race conditions.

---

## ✅ Requerimientos

### 1. Endpoint POST `/crm/calls`

Cuando se crea una llamada con `proxima_llamada_fecha`, el backend debe:

1. **Crear la llamada normalmente**
2. **Si `proxima_llamada_fecha` está presente y no es vacío:**
   - Crear automáticamente una tarea de seguimiento asociada al contacto/lead
   - La tarea debe tener:
     - `text`: "Llamada de seguimiento programada"
     - `task_type`: "call"
     - `entity_type`: El mismo que la llamada (contacts/leads)
     - `entity_id`: El mismo que la llamada
     - `responsible_user_id`: El mismo que la llamada (o el usuario actual si no está especificado)
     - `complete_till`: El valor de `proxima_llamada_fecha`
     - `created_by`: El ID del usuario actual

### 2. Endpoint PATCH `/crm/calls/{call_id}`

Cuando se actualiza una llamada y se establece/modifica `proxima_llamada_fecha`, el backend debe:

1. **Actualizar la llamada normalmente**
2. **Si `proxima_llamada_fecha` está presente y no es vacío:**
   - Crear automáticamente una tarea de seguimiento (similar al caso de creación)
   - **NOTA**: No es necesario eliminar tareas previas, solo crear una nueva

---

## 🔍 Detalles de Implementación

### Ubicación del Código

**Archivo sugerido**: `backend_implementation/app/api/endpoints/crm_calls.py` (o equivalente según la estructura)

### Ejemplo de Implementación

```python
@router.post("/calls", response_model=schemas.Call, status_code=status.HTTP_201_CREATED)
async def create_call(
    call_data: schemas.CallCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Registrar una llamada"""
    # Crear la llamada
    call = models.Call(**call_data.dict())
    db.add(call)
    db.commit()
    db.refresh(call)
    
    # Si hay proxima_llamada_fecha, crear tarea automática
    if call_data.proxima_llamada_fecha:
        # Obtener el usuario responsable (el de la llamada o el usuario actual)
        responsible_user_id = call_data.responsible_user_id or current_user.id
        
        # Crear la tarea de seguimiento
        task = models.Task(
            text="Llamada de seguimiento programada",
            task_type="call",
            entity_type=call.entity_type,
            entity_id=call.entity_id,
            responsible_user_id=responsible_user_id,
            complete_till=call_data.proxima_llamada_fecha,
            created_by=current_user.id
        )
        db.add(task)
        db.commit()
    
    return call


@router.patch("/calls/{call_id}", response_model=schemas.Call)
async def update_call(
    call_id: str,
    call_data: schemas.CallUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Actualizar una llamada"""
    call = db.query(models.Call).filter(models.Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Llamada no encontrada")
    
    # Actualizar campos de la llamada
    update_data = call_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(call, field, value)
    
    db.commit()
    db.refresh(call)
    
    # Si se actualiza proxima_llamada_fecha, crear tarea automática
    if call_data.proxima_llamada_fecha:
        # Obtener el usuario responsable (el de la llamada o el usuario actual)
        responsible_user_id = call.responsible_user_id or current_user.id
        
        # Crear la tarea de seguimiento
        task = models.Task(
            text="Llamada de seguimiento programada",
            task_type="call",
            entity_type=call.entity_type,
            entity_id=call.entity_id,
            responsible_user_id=responsible_user_id,
            complete_till=call_data.proxima_llamada_fecha,
            created_by=current_user.id
        )
        db.add(task)
        db.commit()
    
    return call
```

---

## 📝 Esquemas de Datos

### CallCreate Schema

El campo `proxima_llamada_fecha` ya existe en el schema (según `FORMULARIOS_ESQUEMAS_DATOS.md`):

```python
class CallCreate(BaseModel):
    # ... otros campos ...
    proxima_llamada_fecha: Optional[str] = None  # ISO 8601 datetime string
    # ...
```

### Task Schema

El backend debe crear una tarea con los siguientes campos:

```python
{
    "text": "Llamada de seguimiento programada",
    "task_type": "call",
    "entity_type": call.entity_type,  # "contacts" o "leads"
    "entity_id": call.entity_id,
    "responsible_user_id": call.responsible_user_id or current_user.id,
    "complete_till": call_data.proxima_llamada_fecha,  # ISO 8601 datetime string
    "created_by": current_user.id
}
```

---

## 🎨 Comportamiento Esperado

### Caso 1: Crear llamada con próxima llamada

**Request:**
```json
POST /crm/calls
{
    "entity_type": "contacts",
    "entity_id": "123e4567-e89b-12d3-a456-426614174000",
    "direction": "outbound",
    "phone": "+34600123456",
    "call_status": "completed",
    "started_at": "2025-01-30T10:00:00Z",
    "proxima_llamada_fecha": "2025-02-05T14:00:00Z",
    "responsible_user_id": "456e7890-e12b-34c5-d678-901234567890"
}
```

**Resultado:**
1. ✅ Se crea la llamada
2. ✅ Se crea automáticamente una tarea con:
   - `text`: "Llamada de seguimiento programada"
   - `complete_till`: "2025-02-05T14:00:00Z"
   - `entity_type`: "contacts"
   - `entity_id`: "123e4567-e89b-12d3-a456-426614174000"
   - `responsible_user_id`: "456e7890-e12b-34c5-d678-901234567890"

### Caso 2: Crear llamada sin próxima llamada

**Request:**
```json
POST /crm/calls
{
    "entity_type": "contacts",
    "entity_id": "123e4567-e89b-12d3-a456-426614174000",
    "direction": "outbound",
    "call_status": "completed",
    "started_at": "2025-01-30T10:00:00Z"
}
```

**Resultado:**
1. ✅ Se crea la llamada
2. ❌ NO se crea ninguna tarea (porque no hay `proxima_llamada_fecha`)

### Caso 3: Actualizar llamada con próxima llamada

**Request:**
```json
PATCH /crm/calls/{call_id}
{
    "proxima_llamada_fecha": "2025-02-10T16:00:00Z"
}
```

**Resultado:**
1. ✅ Se actualiza la llamada
2. ✅ Se crea automáticamente una NUEVA tarea con la fecha actualizada

---

## ✅ Beneficios

1. **Centralización**: La lógica de negocio está en el backend donde corresponde
2. **Consistencia**: Siempre se crea la tarea, sin depender del frontend
3. **Confiabilidad**: No hay problemas de timing o race conditions
4. **Atomicidad**: La creación de la llamada y la tarea pueden estar en la misma transacción
5. **Simplicidad del frontend**: El frontend solo necesita crear/actualizar la llamada

---

## 🔄 Cambios en el Frontend

Una vez que el backend implemente esta funcionalidad, el frontend debe:

1. **Eliminar la lógica de creación automática de tareas** de:
   - `src/pages/CRMContactDetail.tsx` → `handleCallSubmit()`
   - `src/pages/CRMContactDetail.tsx` → `handleSaveProximaAccion()`
   - `src/pages/CRMCallHandler.tsx` → `handleSaveCallAndNext()`

2. **Mantener solo la creación de la llamada**, sin intentar crear tareas adicionales

3. **Simplificar el código**, eliminando:
   - Try/catch específicos para creación de tareas
   - Lógica de actualización optimista de tareas relacionada con llamadas
   - Logging relacionado con creación automática de tareas

---

## 🧪 Testing

### Casos de Prueba

1. **Crear llamada con próxima llamada:**
   - Verificar que se crea la llamada
   - Verificar que se crea la tarea automáticamente
   - Verificar que la tarea tiene los datos correctos

2. **Crear llamada sin próxima llamada:**
   - Verificar que se crea la llamada
   - Verificar que NO se crea ninguna tarea

3. **Actualizar llamada agregando próxima llamada:**
   - Verificar que se actualiza la llamada
   - Verificar que se crea una nueva tarea

4. **Actualizar llamada modificando próxima llamada:**
   - Verificar que se actualiza la llamada
   - Verificar que se crea una nueva tarea con la nueva fecha

5. **Llamada sin responsable:**
   - Verificar que se usa el usuario actual como responsable de la tarea

---

## 📝 Notas Técnicas

### Transacciones

- La creación de la tarea debe estar en la misma transacción que la creación/actualización de la llamada
- Si falla la creación de la tarea, debe hacer rollback de toda la operación (o al menos loguear el error)

### Manejo de Errores

- Si falla la creación de la tarea, se debe:
  - Loguear el error
  - Decidir si hacer rollback de la llamada o continuar (recomendación: continuar y loguear)

### Validaciones

- Validar que `proxima_llamada_fecha` es una fecha válida (ISO 8601)
- Validar que `responsible_user_id` existe y tiene el rol adecuado (si aplica)

---

## 🔗 Referencias

- [BACKEND_CRM_INTEGRATION.md](../BACKEND_CRM_INTEGRATION.md) - Documentación de endpoints CRM
- [FORMULARIOS_ESQUEMAS_DATOS.md](../FORMULARIOS_ESQUEMAS_DATOS.md) - Esquemas de datos de llamadas
- [FRONTEND_TAREA_PROXIMA_LLAMADA_AUTOMATICA.md](./FRONTEND_TAREA_PROXIMA_LLAMADA_AUTOMATICA.md) - Implementación actual en frontend (a eliminar)

---

## ✅ Checklist de Implementación Backend

- [ ] Modificar endpoint POST `/crm/calls` para crear tarea automática
- [ ] Modificar endpoint PATCH `/crm/calls/{call_id}` para crear tarea automática
- [ ] Validar que `proxima_llamada_fecha` es una fecha válida
- [ ] Obtener `responsible_user_id` correctamente (de la llamada o usuario actual)
- [ ] Manejar errores correctamente (transacciones)
- [ ] Agregar logging para diagnóstico
- [ ] Escribir tests unitarios
- [ ] Escribir tests de integración
- [ ] Documentar cambios en el código
- [ ] Notificar al equipo de frontend cuando esté listo

---

## ✅ Checklist de Actualización Frontend (DESPUÉS de backend)

- [ ] Eliminar lógica de creación automática de `handleCallSubmit()`
- [ ] Eliminar lógica de creación automática de `handleSaveProximaAccion()`
- [ ] Eliminar lógica de creación automática de `handleSaveCallAndNext()`
- [ ] Simplificar código eliminando try/catch específicos
- [ ] Eliminar logging relacionado con creación automática
- [ ] Probar que las tareas se crean correctamente desde el backend
- [ ] Actualizar documentación del frontend

---

**Prioridad**: Alta  
**Estimación Backend**: 2-3 horas  
**Estimación Frontend (actualización)**: 1 hora  
**Dependencias**: Endpoints de llamadas y tareas existentes
