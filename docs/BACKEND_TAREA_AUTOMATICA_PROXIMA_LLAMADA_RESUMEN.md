# 🔴 REQUERIMIENTO BACKEND: Creación Automática de Tarea de Seguimiento

**Prioridad**: 🔴 Alta  
**Fecha**: 2025-01-30  
**Estado**: ⏳ Pendiente

---

## 📋 Resumen Ejecutivo

Cuando se crea o actualiza una llamada con el campo `proxima_llamada_fecha`, el backend debe **crear automáticamente una tarea de seguimiento** asociada al contacto/lead.

---

## ✅ Qué Implementar

### Endpoint: `POST /crm/calls`

**Cuando:** Se crea una llamada con `proxima_llamada_fecha`

**Acción:** Crear automáticamente una tarea con:
- `text`: "Llamada de seguimiento programada"
- `task_type`: "call"
- `entity_type`: El mismo que la llamada
- `entity_id`: El mismo que la llamada
- `responsible_user_id`: El de la llamada (o usuario actual)
- `complete_till`: El valor de `proxima_llamada_fecha`

### Endpoint: `PATCH /crm/calls/{call_id}`

**Cuando:** Se actualiza una llamada y se establece/modifica `proxima_llamada_fecha`

**Acción:** Crear automáticamente una nueva tarea (igual que arriba)

---

## 💻 Ejemplo de Código

```python
@router.post("/calls", response_model=schemas.Call, status_code=status.HTTP_201_CREATED)
async def create_call(
    call_data: schemas.CallCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Registrar una llamada"""
    call = models.Call(**call_data.dict())
    db.add(call)
    db.commit()
    db.refresh(call)
    
    # ✨ NUEVO: Si hay proxima_llamada_fecha, crear tarea automática
    if call_data.proxima_llamada_fecha:
        responsible_user_id = call_data.responsible_user_id or current_user.id
        
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

## 📝 Detalles Completos

Ver documentación completa en:
**`docs/BACKEND_TAREA_AUTOMATICA_PROXIMA_LLAMADA.md`**

Incluye:
- ✅ Esquemas de datos completos
- ✅ Casos de prueba
- ✅ Manejo de errores
- ✅ Validaciones
- ✅ Checklist de implementación

---

## 🎯 Beneficios

1. ✅ Centralización de lógica en el backend
2. ✅ Consistencia garantizada
3. ✅ Atomicidad (transacciones)
4. ✅ Sin problemas de timing/race conditions
5. ✅ Frontend más simple

---

## ⚠️ Nota Importante

Actualmente el **frontend** está creando estas tareas manualmente. Una vez que el backend implemente esto, el frontend eliminará esa lógica.

---

**Documentación completa**: `docs/BACKEND_TAREA_AUTOMATICA_PROXIMA_LLAMADA.md`
