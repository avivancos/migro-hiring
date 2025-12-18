# ⚠️ URGENTE: Problema con Endpoints de Llamadas en Calendario

## 📋 Problemas Identificados

### 1. Endpoint `/crm/calls/calendar` - Error 404

El endpoint `/api/crm/calls/calendar` **no existe en el backend** y devuelve **error 404 (Not Found)**.

**Error Actual:**
```
GET /api/crm/calls/calendar?start_date=2025-12-01T03:00:00.000Z&end_date=2026-01-01T02:59:59.999Z
Status: 404
```

Este endpoint fue diseñado específicamente para el calendario y debería permitir filtrar llamadas por rango de fechas sin requerir `entity_id`.

### 2. Endpoint `/crm/calls` - Error 422

El endpoint `/api/crm/calls` está devolviendo **error 422 (Unprocessable Entity)** cuando se llama desde el calendario, incluso sin parámetros o con parámetros mínimos.

**Error Actual:**
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

### Para el endpoint `/crm/calls/calendar`:

1. **Implementar el endpoint** `/api/crm/calls/calendar` que permita filtrar llamadas por rango de fechas
2. **No requerir `entity_id`** - debe permitir obtener todas las llamadas en un rango de fechas
3. **Filtrar por `created_at`** usando los parámetros `start_date` y `end_date`

### Para el endpoint `/crm/calls`:

1. **Aceptar peticiones sin parámetros** o con parámetros opcionales básicos (`limit`, `skip`)
2. **Implementar filtros de fecha** (`date_from`, `date_to`) que filtren por `created_at`

### Implementación Esperada

#### Endpoint `/crm/calls/calendar` (Recomendado para Calendario)

```python
@router.get("/calls/calendar")
async def get_calls_calendar(
    start_date: str = Query(..., description="Fecha de inicio en formato ISO 8601"),
    end_date: Optional[str] = Query(None, description="Fecha de fin en formato ISO 8601"),
):
    """
    Endpoint específico para calendario que permite obtener llamadas por rango de fechas
    sin requerir entity_id. Filtra por created_at.
    """
    query = select(Call)
    
    # Filtrar por fecha usando created_at
    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    query = query.where(Call.created_at >= start_dt)
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        query = query.where(Call.created_at <= end_dt)
    
    results = await db.execute(query)
    calls = results.scalars().all()
    
    # Retornar array directo (no objeto con items)
    return [call.dict() for call in calls]
```

#### Endpoint `/crm/calls` (Mejora General)

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

Por ahora, el frontend maneja los errores graciosamente:

- Si el endpoint `/crm/calls/calendar` devuelve 404, se captura el error y se retorna un array vacío
- Si el backend devuelve 422, se muestra una lista vacía de llamadas
- El calendario sigue funcionando para tareas
- Se registran warnings en la consola para debugging

**Corrección aplicada:**
- ✅ Se corrigió el error `ReferenceError: callsResponse is not defined` en `CRMTaskCalendar.tsx`
- ✅ El código ahora usa correctamente `callsData` en lugar de `callsResponse`

## ✅ Estado Actual

- ✅ **Backend implementado**: El endpoint `/crm/calls/calendar` está disponible
- ✅ **Backend implementado**: El endpoint `/crm/tasks/calendar` está disponible
- ✅ Frontend actualizado para usar los endpoints correctamente
- ✅ Frontend agrupa por fecha usando `complete_till` (tareas) y `created_at` (llamadas)
- ✅ Frontend maneja errores graciosamente
- ✅ Código simplificado: los endpoints ya filtran por fecha, no se necesita filtrado adicional

**Ver documentación completa**: `docs/CALENDAR_ENDPOINTS_GUIDE.md`

## 📝 Notas

El calendario necesita poder obtener llamadas por rango de fechas para mostrarlas agrupadas por día. Actualmente, aunque el frontend está preparado para esto, el backend no permite la petición.

Cuando el backend esté corregido, el calendario automáticamente:
1. Usará los filtros `date_from` y `date_to` para obtener solo las llamadas del rango
2. Las agrupará por día usando `created_at`
3. Las mostrará junto con las tareas
