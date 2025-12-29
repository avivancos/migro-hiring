# Endpoint para Asignar 50 Oportunidades Aleatorias No Asignadas

## Resumen

Este endpoint permite asignar un número específico de oportunidades aleatorias no asignadas a un agente. Esto es útil para la asignación rápida de oportunidades en el sistema de CRM.

## Endpoint

```
POST /api/crm/opportunities/assign-random
```

## Headers

```
Content-Type: application/json
Authorization: Bearer <token>
```

## Request Body

```json
{
  "assigned_to_id": "uuid-del-usuario-crm",
  "count": 50
}
```

### Parámetros

- **assigned_to_id** (string, requerido): UUID del usuario CRM (agente) al que se asignarán las oportunidades
- **count** (integer, opcional): Número de oportunidades a asignar. Por defecto: 50. Máximo: 100

## Lógica de Negocio

1. **Validar el usuario asignado**: Verificar que el `assigned_to_id` corresponde a un usuario CRM válido y activo
2. **Obtener oportunidades no asignadas**: 
   - Filtrar oportunidades donde `assigned_to_id IS NULL`
   - Opcionalmente, filtrar por estado (solo oportunidades con estado válido, excluyendo eliminadas/canceladas si aplica)
3. **Seleccionar aleatoriamente**: Seleccionar `count` oportunidades aleatorias de las disponibles
4. **Asignar en batch**: Asignar todas las oportunidades seleccionadas al usuario especificado en una sola transacción
5. **Retornar resultado**: Devolver información sobre cuántas se asignaron y cuáles fueron

## Response Exitoso (200 OK)

```json
{
  "success": true,
  "assigned_count": 50,
  "available_count": 150,
  "requested_count": 50,
  "opportunity_ids": [
    "uuid-1",
    "uuid-2",
    ...
    "uuid-50"
  ],
  "assigned_to_id": "uuid-del-usuario-crm",
  "assigned_to_name": "Nombre del Agente",
  "assigned_at": "2024-12-19T10:30:00Z"
}
```

### Campos de Respuesta

- **success** (boolean): Siempre `true` en respuesta exitosa
- **assigned_count** (integer): Número de oportunidades que se asignaron exitosamente
- **available_count** (integer): Número total de oportunidades no asignadas disponibles en el sistema
- **requested_count** (integer): Número de oportunidades que se solicitaron asignar
- **opportunity_ids** (array[string]): Lista de IDs de las oportunidades asignadas
- **assigned_to_id** (string): ID del usuario al que se asignaron (confirmación)
- **assigned_to_name** (string): Nombre del usuario asignado (para mostrar en frontend)
- **assigned_at** (string, ISO 8601): Timestamp de cuando se realizó la asignación

## Errores

### 400 Bad Request - Usuario no válido

```json
{
  "detail": "El usuario especificado no existe o no es válido"
}
```

### 400 Bad Request - Parámetro inválido

```json
{
  "detail": "El parámetro 'count' debe ser un número entre 1 y 100"
}
```

### 404 Not Found - No hay suficientes oportunidades

```json
{
  "success": false,
  "available_count": 25,
  "requested_count": 50,
  "detail": "Solo hay 25 oportunidades no asignadas disponibles. Se requiere un mínimo de 50."
}
```

### 200 OK - Asignación parcial

Si hay menos oportunidades disponibles que las solicitadas, se asignan todas las disponibles y se retorna:

```json
{
  "success": true,
  "assigned_count": 25,
  "available_count": 25,
  "requested_count": 50,
  "opportunity_ids": [
    "uuid-1",
    ...
    "uuid-25"
  ],
  "assigned_to_id": "uuid-del-usuario-crm",
  "assigned_to_name": "Nombre del Agente",
  "assigned_at": "2024-12-19T10:30:00Z",
  "warning": "Solo se asignaron 25 oportunidades de las 50 solicitadas. No hay más oportunidades no asignadas disponibles."
}
```

## Ejemplo de Implementación (Pseudocódigo)

```python
@router.post("/opportunities/assign-random")
async def assign_random_opportunities(
    request: AssignRandomOpportunitiesRequest,
    current_user: User = Depends(get_current_user)
):
    # Validar usuario asignado
    assigned_user = await get_crm_user_by_id(request.assigned_to_id)
    if not assigned_user or not assigned_user.is_active:
        raise HTTPException(status_code=400, detail="El usuario especificado no existe o no es válido")
    
    # Validar count
    count = request.count or 50
    if count < 1 or count > 100:
        raise HTTPException(status_code=400, detail="El parámetro 'count' debe ser un número entre 1 y 100")
    
    # Obtener todas las oportunidades no asignadas
    unassigned_opportunities = await db.query(
        Opportunity
    ).filter(
        Opportunity.assigned_to_id.is_(None),
        Opportunity.status != "deleted",  # Ajustar según tu modelo
        # Agregar otros filtros si es necesario
    ).all()
    
    total_available = len(unassigned_opportunities)
    
    if total_available == 0:
        raise HTTPException(
            status_code=404,
            detail={
                "success": False,
                "available_count": 0,
                "requested_count": count,
                "detail": "No hay oportunidades no asignadas disponibles"
            }
        )
    
    # Seleccionar aleatoriamente
    import random
    selected_count = min(count, total_available)
    selected_opportunities = random.sample(unassigned_opportunities, selected_count)
    
    # Asignar en batch
    opportunity_ids = []
    for opportunity in selected_opportunities:
        opportunity.assigned_to_id = request.assigned_to_id
        opportunity.updated_at = datetime.utcnow()
        opportunity_ids.append(opportunity.id)
    
    await db.commit()
    
    # Preparar respuesta
    response = {
        "success": True,
        "assigned_count": selected_count,
        "available_count": total_available,
        "requested_count": count,
        "opportunity_ids": opportunity_ids,
        "assigned_to_id": request.assigned_to_id,
        "assigned_to_name": assigned_user.name or assigned_user.email,
        "assigned_at": datetime.utcnow().isoformat()
    }
    
    if selected_count < count:
        response["warning"] = f"Solo se asignaron {selected_count} oportunidades de las {count} solicitadas. No hay más oportunidades no asignadas disponibles."
    
    return response
```

## Modelo de Request (Pydantic)

```python
from pydantic import BaseModel, Field
from typing import Optional

class AssignRandomOpportunitiesRequest(BaseModel):
    assigned_to_id: str = Field(..., description="UUID del usuario CRM al que se asignarán las oportunidades")
    count: Optional[int] = Field(50, ge=1, le=100, description="Número de oportunidades a asignar (máximo 100)")
```

## Consideraciones Adicionales

### 1. Rendimiento
- Para grandes volúmenes, considerar usar `ORDER BY RANDOM()` en SQL (o equivalente) en lugar de cargar todas las oportunidades
- En PostgreSQL: `ORDER BY RANDOM() LIMIT count`
- En SQLAlchemy: `.order_by(func.random()).limit(count)`

### 2. Transacciones
- La asignación debe ser atómica (todo o nada)
- Si una asignación falla, todas deben revertirse

### 3. Filtros Adicionales (Opcional)
Podrías querer agregar filtros adicionales en el futuro:
- Por estado de oportunidad
- Por score mínimo/máximo
- Por fecha de detección
- Por pipeline

Ejemplo de request extendido:
```json
{
  "assigned_to_id": "uuid-del-usuario-crm",
  "count": 50,
  "filters": {
    "min_score": 50,
    "status": "new",
    "pipeline_id": "uuid-pipeline"
  }
}
```

### 4. Auditoría
- Considerar registrar esta operación en una tabla de auditoría
- Incluir información sobre quién realizó la asignación (current_user)

### 5. Validaciones de Negocio
- Verificar que el usuario tenga permisos para asignar oportunidades
- Verificar que el usuario asignado tenga el rol correcto (agent, lawyer, etc.)
- Considerar límites diarios de asignación por usuario

## Testing

### Casos de Prueba

1. **Asignación exitosa**: 50 oportunidades disponibles, solicitar 50
2. **Asignación parcial**: 25 disponibles, solicitar 50
3. **Sin oportunidades**: 0 disponibles, solicitar 50
4. **Usuario inválido**: assigned_to_id no existe
5. **Count inválido**: count = 0, count = 101, count negativo
6. **Múltiples usuarios**: Diferentes usuarios asignando simultáneamente (debe ser thread-safe)

### Ejemplo de Test (Python/Pytest)

```python
async def test_assign_random_opportunities_success():
    # Crear usuario y oportunidades no asignadas
    user = create_crm_user()
    opportunities = [create_opportunity() for _ in range(100)]
    
    response = await client.post(
        "/api/crm/opportunities/assign-random",
        json={"assigned_to_id": user.id, "count": 50}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["assigned_count"] == 50
    assert len(data["opportunity_ids"]) == 50
    assert data["assigned_to_id"] == user.id

async def test_assign_random_opportunities_insufficient():
    user = create_crm_user()
    opportunities = [create_opportunity() for _ in range(25)]
    
    response = await client.post(
        "/api/crm/opportunities/assign-random",
        json={"assigned_to_id": user.id, "count": 50}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["assigned_count"] == 25
    assert "warning" in data
```

## Fecha de Creación

2024-12-19

