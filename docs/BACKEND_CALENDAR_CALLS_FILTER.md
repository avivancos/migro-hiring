# ⚠️ URGENTE: Problema con Endpoint /crm/calls en Calendario

## 📋 Problema Identificado

El endpoint `/api/crm/calls` está devolviendo **error 422 (Unprocessable Entity)** cuando se llama desde el calendario, incluso sin parámetros o con parámetros mínimos.

### Error Actual

```
GET /api/crm/calls?limit=1000
Status: 422
```

El error 422 indica que el backend está rechazando la petición debido a problemas de validación.

## 🔍 Investigación

### Intentos Realizados

1. ❌ Con `date_from` y `date_to`: Error 422
2. ❌ Con solo `limit`: Error 422  
3. ❌ Sin parámetros: Error 422

### Casos que Funcionan

En otros componentes del frontend, el endpoint funciona cuando se usa con parámetros específicos:

- ✅ `getCalls({ entity_id: '...', entity_type: 'contacts', limit: 100 })` - Funciona en `CRMContactList`
- ✅ `getCalls({ limit: 50 })` - Funciona en `CRMCallHandler`

## 🎯 Solución Requerida

El backend necesita:

1. **Aceptar peticiones sin parámetros** o con parámetros opcionales básicos (`limit`, `skip`)
2. **Implementar filtros de fecha** (`date_from`, `date_to`) que filtren por `created_at`

### Implementación Esperada

```python
@router.get("/calls")
async def get_calls(
    limit: int = Query(50, ge=1, le=1000),
    skip: int = Query(0, ge=0),
    date_from: Optional[str] = Query(None),  # ISO 8601
    date_to: Optional[str] = Query(None),    # ISO 8601
    entity_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    # ... otros filtros opcionales
):
    query = select(Call)
    
    # Filtrar por fecha usando created_at
    if date_from:
        date_from_dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
        query = query.where(Call.created_at >= date_from_dt)
    
    if date_to:
        date_to_dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        query = query.where(Call.created_at <= date_to_dt)
    
    # ... otros filtros
    
    # Paginación
    total = await db.execute(select(func.count()).select_from(query.subquery()))
    results = await db.execute(query.offset(skip).limit(limit))
    
    calls = results.scalars().all()
    
    return {
        "items": [call.dict() for call in calls],
        "total": total.scalar(),
        "skip": skip,
        "limit": limit,
    }
```

## ⚡ Solución Temporal (Frontend)

Por ahora, el frontend maneja el error graciosamente:

- Si el backend devuelve 422, se muestra una lista vacía de llamadas
- El calendario sigue funcionando para tareas
- Se registran warnings en la consola para debugging

## ✅ Estado Actual

- ✅ Frontend preparado para usar filtros de fecha cuando estén disponibles
- ✅ Frontend filtra llamadas por `created_at` en el cliente como solución temporal
- ❌ Backend necesita corregir el error 422
- ❌ Backend necesita implementar filtros `date_from` y `date_to`

## 📝 Notas

El calendario necesita poder obtener llamadas por rango de fechas para mostrarlas agrupadas por día. Actualmente, aunque el frontend está preparado para esto, el backend no permite la petición.

Cuando el backend esté corregido, el calendario automáticamente:
1. Usará los filtros `date_from` y `date_to` para obtener solo las llamadas del rango
2. Las agrupará por día usando `created_at`
3. Las mostrará junto con las tareas
