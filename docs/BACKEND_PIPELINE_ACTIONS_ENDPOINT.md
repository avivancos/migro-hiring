# Endpoint: Listar Acciones de Pipeline

## 📋 Resumen

Implementación del endpoint `GET /api/pipelines/actions/{entity_type}/{entity_id}` para listar las acciones de un pipeline asociadas a una entidad (leads, contacts).

## ✅ Estado

**Implementado**: 2025-01-16  
**Prioridad**: Alta - Resuelve bloqueo de funcionalidad frontend  
**Status**: ✅ Completado y probado

## 🔗 Endpoint

```
GET /api/pipelines/actions/{entity_type}/{entity_id}
```

## 📝 Descripción

Obtiene todas las acciones del pipeline asociadas a una entidad específica. Si no existe un pipeline stage para la entidad, retorna un array vacío con código 200 OK (en lugar de 404).

## 🔑 Parámetros

### Path Parameters

- **entity_type** (EntityType, required): Tipo de entidad
  - Valores válidos: `contacts`, `leads`
  
- **entity_id** (UUID, required): ID de la entidad (oportunidad o contacto)

### Query Parameters (opcionales)

- **status** (string, optional): Filtrar por estado de acción
  - Valores: `pending_validation`, `validated`, `rejected`, `completed`
  
- **skip** (integer, optional): Número de resultados a omitir (paginación)
  - Default: `0`
  - Mínimo: `0`
  
- **limit** (integer, optional): Número máximo de resultados
  - Default: `50`
  - Mínimo: `1`
  - Máximo: `1000`

### Headers

- **Authorization**: Token de autenticación (requerido)
- **X-CRM-Auth**: Token CRM (requerido para algunos flujos)

## 📤 Respuestas

### 200 OK - Éxito

**Con acciones:**
```json
{
  "items": [
    {
      "id": "uuid",
      "pipeline_stage_id": "uuid",
      "action_type": "elevate_to_lawyer",
      "action_name": "Elevar Caso a Abogado",
      "description": "Descripción de la acción",
      "status": "pending_validation",
      "performed_by_id": "uuid",
      "responsible_for_validation_id": "uuid",
      "validated_by_id": null,
      "validated_at": null,
      "validation_notes": null,
      "completed_at": null,
      "action_data": null,
      "created_at": "2025-01-16T10:00:00Z",
      "updated_at": "2025-01-16T10:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 50
}
```

**Sin stage (array vacío):**
```json
{
  "items": [],
  "total": 0,
  "skip": 0,
  "limit": 50
}
```

### 400 Bad Request - Parámetros inválidos

```json
{
  "detail": "Invalid entity_type: invalid_type. Must be 'leads' or 'contacts'"
}
```

### 401 Unauthorized - Token faltante o inválido

```json
{
  "detail": "Not authenticated"
}
```

## 🔍 Lógica de Negocio

### Flujo de Obtención

1. **Validar entity_type**: Debe ser `contacts` o `leads`
2. **Buscar Pipeline Stage**: Buscar stage asociado a `{entity_type}/{entity_id}`
3. **Si no existe stage**: Retornar 200 OK con array vacío
4. **Si existe stage**: 
   - Buscar acciones asociadas al `pipeline_stage_id`
   - Aplicar filtro de status si se proporciona
   - Aplicar paginación (skip, limit)
   - Ordenar por `created_at DESC`
5. **Retornar respuesta paginada**

### Estructura de Datos

#### PipelineAction Model

```python
class PipelineAction(Base):
    __tablename__ = "pipeline_actions"
    
    id: UUID (PK)
    pipeline_stage_id: UUID (FK -> pipeline_stages.id)
    action_type: str  # Tipo de acción (e.g., "elevate_to_lawyer")
    action_name: Optional[str]  # Nombre legible
    description: Optional[str]
    status: str  # pending_validation, validated, rejected, completed
    performed_by_id: UUID (FK -> users.id)
    responsible_for_validation_id: Optional[UUID]
    validated_by_id: Optional[UUID]
    validated_at: Optional[datetime]
    validation_notes: Optional[str]
    completed_at: Optional[datetime]
    action_data: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
```

#### Pipeline Stage Model

```python
class PipelineStage(Base):
    __tablename__ = "pipeline_stages"
    
    id: UUID (PK)
    entity_id: UUID  # ID de la entidad (Contact o Lead)
    entity_type: EntityType  # "contacts" o "leads"
    current_stage: str
    is_active: bool
    
    # Relación
    actions: List[PipelineAction]
```

### Optimizaciones Implementadas

1. **Paginación en SQL**: La paginación se realiza a nivel de base de datos, no en memoria
2. **Índices**: Se utilizan índices en:
   - `pipeline_stages(entity_id, entity_type)`
   - `pipeline_actions(pipeline_stage_id, status)`
   - `pipeline_actions(created_at)`
3. **Query optimizada**: Se obtiene el total y los resultados paginados en queries separadas pero eficientes

## 💻 Implementación

### Archivo: `app/api/endpoints/pipelines.py`

```python
@router.get("/actions/{entity_type}/{entity_id}", response_model=PipelineActionsListResponse)
async def get_pipeline_actions(
    entity_type: EntityType,
    entity_id: uuid.UUID,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_crm_auth),
) -> PipelineActionsListResponse:
    """Get pipeline actions for an entity."""
    service = PipelineService(db)
    stage = await service.get_stage_by_entity(
        entity_id=entity_id, entity_type=entity_type
    )

    # If no stage exists, return empty array (200 OK)
    if not stage:
        return PipelineActionsListResponse(
            items=[],
            total=0,
            skip=skip,
            limit=limit,
        )

    # Get actions with pagination applied at SQL level
    actions, total = await service.get_actions_by_stage_paginated(
        stage_id=stage.id, 
        status=status_filter,
        skip=skip,
        limit=limit,
    )

    return PipelineActionsListResponse(
        items=[PipelineActionRead.model_validate(a) for a in actions],
        total=total,
        skip=skip,
        limit=limit,
    )
```

### Archivo: `app/services/pipeline_service.py`

```python
async def get_actions_by_stage_paginated(
    self, 
    *, 
    stage_id: uuid.UUID, 
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[List[PipelineAction], int]:
    """Get paginated actions for a pipeline stage."""
    # Build base filter
    base_filter = and_(
        PipelineAction.pipeline_stage_id == stage_id
    )
    if status:
        base_filter = and_(base_filter, PipelineAction.status == status)

    # Get total count
    count_query = select(func.count(PipelineAction.id)).where(base_filter)
    count_result = await self.db.execute(count_query)
    total = count_result.scalar() or 0

    # Get paginated results
    query = (
        select(PipelineAction)
        .where(base_filter)
        .order_by(PipelineAction.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await self.db.execute(query)
    actions = list(result.scalars().all())

    return actions, total
```

## ✅ Cambios Realizados

### 1. Modificación del Endpoint

- **Antes**: Retornaba 404 cuando no existía pipeline stage
- **Ahora**: Retorna 200 OK con array vacío cuando no existe stage
- **Razón**: Mejor experiencia de usuario y consistencia con APIs RESTful

### 2. Optimización de Paginación

- **Antes**: Paginación en memoria (obtenía todas las acciones y luego paginaba)
- **Ahora**: Paginación a nivel SQL (más eficiente para grandes volúmenes)
- **Beneficio**: Mejor rendimiento y menor uso de memoria

### 3. Nuevo Método en Servicio

- **Método**: `get_actions_by_stage_paginated()`
- **Retorna**: Tupla `(List[PipelineAction], int)` con acciones y total
- **Uso**: Solo para endpoints que requieren paginación

## 🧪 Tests

### Tests Agregados

1. **test_get_pipeline_actions_no_stage**: Verifica que retorne 200 con array vacío cuando no hay stage
2. **test_get_pipeline_actions_with_pagination**: Verifica paginación correcta con skip y limit

### Archivo: `tests/api/test_pipeline_endpoints_complete.py`

```python
@pytest.mark.asyncio
async def test_get_pipeline_actions_no_stage(
    self, client: AsyncClient, db: AsyncSession, normal_user_token_headers: dict
):
    """Test: Get pipeline actions when no stage exists - should return 200 with empty array."""
    # ... implementación ...
    response = await client.get(
        f"/api/pipelines/actions/contacts/{contact.id}",
        headers=normal_user_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert len(data["items"]) == 0
```

## 🔐 Permisos y Autorización

- **Todos los usuarios autenticados** pueden ver las acciones del pipeline
- No requiere permisos especiales para listar acciones
- La creación y validación de acciones sí requiere permisos según el rol

## 📊 Ejemplo de Query SQL

```sql
-- Obtener acciones de una oportunidad (lead)
SELECT pa.*
FROM pipeline_actions pa
INNER JOIN pipeline_stages ps ON pa.pipeline_stage_id = ps.id
WHERE ps.entity_type = 'leads'
  AND ps.entity_id = '9ca7604d-9f8e-41f0-a2d7-4c8c9a839c6d'
ORDER BY pa.created_at DESC;
```

## 📊 Ejemplo de Uso

### Request

```bash
curl -X GET "https://api.example.com/api/pipelines/actions/contacts/9ca7604d-9f8e-41f0-a2d7-4c8c9a839c6d?status=pending_validation&skip=0&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-CRM-Auth: YOUR_CRM_TOKEN"
```

### Response

```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "pipeline_stage_id": "223e4567-e89b-12d3-a456-426614174000",
      "action_type": "elevate_to_lawyer",
      "action_name": "Elevar Caso a Abogado",
      "description": "El agente ha completado la evaluación inicial",
      "status": "pending_validation",
      "performed_by_id": "323e4567-e89b-12d3-a456-426614174000",
      "responsible_for_validation_id": "423e4567-e89b-12d3-a456-426614174000",
      "validated_by_id": null,
      "validated_at": null,
      "validation_notes": null,
      "completed_at": null,
      "action_data": null,
      "created_at": "2025-01-16T10:00:00Z",
      "updated_at": "2025-01-16T10:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 10
}
```

## 🔗 Endpoints Relacionados

- `POST /api/pipelines/actions` - Crear nueva acción
- `POST /api/pipelines/actions/{action_id}/validate` - Validar acción
- `GET /api/pipelines/stages/{entity_type}/{entity_id}` - Obtener stage del pipeline
- `GET /api/pipelines/stages/{entity_type}/{entity_id}/status` - Obtener estado del pipeline

## 🚀 Despliegue

### Checklist Pre-Deploy

- [x] Endpoint implementado
- [x] Tests unitarios agregados
- [x] Paginación optimizada
- [x] Documentación creada
- [x] Linter sin errores
- [x] Validación de parámetros implementada

### Notas de Despliegue

- No requiere migraciones de base de datos
- Compatible con datos existentes
- Sin breaking changes para otros endpoints

## 📝 Notas Adicionales

1. **Campos del Schema**: El schema usa `performed_by_id` en lugar de `created_by_id`. Esto refleja el modelo de datos real donde quien realiza la acción es quien la crea.

2. **Ordenamiento**: Las acciones se ordenan por `created_at DESC` (más recientes primero).

3. **Filtrado**: El filtro por status es opcional y se aplica a nivel SQL para mejor rendimiento.

4. **Límite de Paginación**: El límite máximo es 1000 para evitar consultas excesivamente grandes.

5. **Rendimiento**: La implementación utiliza índices en las columnas clave para optimizar las consultas:
   - `pipeline_stages(entity_id, entity_type)`
   - `pipeline_actions(pipeline_stage_id, status)`
   - `pipeline_actions(created_at)`

---

**Última actualización**: 2025-01-16  
**Autor**: Equipo Backend  
**Versión**: 1.0.0
