# Backend: Endpoint Batch para Asignación Masiva de Oportunidades

**Fecha**: 2025-01-16  
**Prioridad**: 🟡 Media  
**Estado**: 📋 Pendiente de implementación  
**Módulo**: CRM - Opportunities

---

## 📋 Resumen Ejecutivo

El frontend actualmente implementa asignación bulk de oportunidades haciendo múltiples llamadas individuales al endpoint `/crm/opportunities/{id}/assign`. Para optimizar el rendimiento y reducir la carga en el servidor, se recomienda implementar un endpoint batch que permita asignar múltiples oportunidades a un agente en una sola transacción.

---

## 🎯 Objetivo

Crear un endpoint que permita asignar múltiples oportunidades a un agente en una sola operación, reduciendo:
- Número de requests HTTP
- Tiempo de respuesta total
- Carga en el servidor
- Posibilidad de inconsistencias (operación atómica)

---

## 📍 Endpoint Propuesto

### **POST `/api/crm/opportunities/bulk-assign`**

**Descripción**: Asigna múltiples oportunidades a un agente en una sola operación.

**Autenticación**: Requerida (usuario autenticado)

**Permisos**: Solo administradores (`admin` o `superuser`)

---

## 📥 Request Body

```json
{
  "opportunity_ids": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ],
  "assigned_to_id": "uuid-del-agente"
}
```

### Esquema de Validación

```python
from pydantic import BaseModel, Field
from typing import List
from uuid import UUID

class BulkAssignRequest(BaseModel):
    opportunity_ids: List[UUID] = Field(
        ...,
        description="Lista de IDs de oportunidades a asignar",
        min_items=1,
        max_items=100  # Límite razonable para evitar timeouts
    )
    assigned_to_id: UUID = Field(
        ...,
        description="ID del usuario (agente) al que se asignarán las oportunidades"
    )
```

---

## 📤 Response

### Éxito (200 OK)

```json
{
  "success": true,
  "assigned_count": 3,
  "failed_count": 0,
  "opportunities": [
    {
      "id": "uuid-1",
      "assigned_to_id": "uuid-del-agente",
      "status": "assigned",
      "updated_at": "2025-01-16T10:30:00Z"
    },
    {
      "id": "uuid-2",
      "assigned_to_id": "uuid-del-agente",
      "status": "assigned",
      "updated_at": "2025-01-16T10:30:00Z"
    },
    {
      "id": "uuid-3",
      "assigned_to_id": "uuid-del-agente",
      "status": "assigned",
      "updated_at": "2025-01-16T10:30:00Z"
    }
  ],
  "errors": []
}
```

### Error Parcial (207 Multi-Status) - Opcional

Si algunas asignaciones fallan pero otras tienen éxito:

```json
{
  "success": true,
  "assigned_count": 2,
  "failed_count": 1,
  "opportunities": [
    {
      "id": "uuid-1",
      "assigned_to_id": "uuid-del-agente",
      "status": "assigned",
      "updated_at": "2025-01-16T10:30:00Z"
    },
    {
      "id": "uuid-2",
      "assigned_to_id": "uuid-del-agente",
      "status": "assigned",
      "updated_at": "2025-01-16T10:30:00Z"
    }
  ],
  "errors": [
    {
      "opportunity_id": "uuid-3",
      "error": "Oportunidad no encontrada"
    }
  ]
}
```

### Error (400 Bad Request)

```json
{
  "detail": "Lista de IDs de oportunidades vacía"
}
```

### Error (403 Forbidden)

```json
{
  "detail": "Solo administradores pueden asignar oportunidades en bulk"
}
```

### Error (404 Not Found)

```json
{
  "detail": "Usuario asignado no encontrado"
}
```

---

## 🔧 Implementación Sugerida

### FastAPI (Python)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter()

class BulkAssignRequest(BaseModel):
    opportunity_ids: List[UUID] = Field(..., min_items=1, max_items=100)
    assigned_to_id: UUID

class BulkAssignResponse(BaseModel):
    success: bool
    assigned_count: int
    failed_count: int
    opportunities: List[dict]
    errors: List[dict] = []

@router.post(
    "/opportunities/bulk-assign",
    response_model=BulkAssignResponse,
    status_code=status.HTTP_200_OK
)
async def bulk_assign_opportunities(
    request: BulkAssignRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)  # Verificar que sea admin
):
    """
    Asigna múltiples oportunidades a un agente en una sola operación.
    
    Requiere permisos de administrador.
    """
    
    # Verificar permisos (solo admins)
    if current_user.role not in ['admin', 'superuser']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden asignar oportunidades en bulk"
        )
    
    # Verificar que el usuario asignado existe y es válido (agente, abogado o admin)
    user_query = select(User).where(
        User.id == request.assigned_to_id,
        User.is_active == True
    )
    result = await db.execute(user_query)
    assigned_user = result.scalar_one_or_none()
    
    if not assigned_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario asignado no encontrado o inactivo"
        )
    
    # Verificar que el usuario tiene rol válido para asignación
    valid_roles = ['agent', 'lawyer', 'admin']
    if assigned_user.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El usuario asignado debe tener uno de los siguientes roles: {', '.join(valid_roles)}"
        )
    
    # Obtener todas las oportunidades en una sola query
    opportunities_query = select(Opportunity).where(
        Opportunity.id.in_(request.opportunity_ids)
    )
    result = await db.execute(opportunities_query)
    opportunities = result.scalars().all()
    
    # Verificar que todas las oportunidades existen
    found_ids = {opp.id for opp in opportunities}
    missing_ids = set(request.opportunity_ids) - found_ids
    
    errors = []
    if missing_ids:
        for opp_id in missing_ids:
            errors.append({
                "opportunity_id": str(opp_id),
                "error": "Oportunidad no encontrada"
            })
    
    # Actualizar oportunidades en una sola operación
    updated_opportunities = []
    now = datetime.utcnow()
    
    for opportunity in opportunities:
        try:
            # Actualizar la oportunidad
            opportunity.assigned_to_id = request.assigned_to_id
            opportunity.status = 'assigned'  # Cambiar estado a 'assigned'
            opportunity.updated_at = now
            
            updated_opportunities.append({
                "id": str(opportunity.id),
                "assigned_to_id": str(opportunity.assigned_to_id),
                "status": opportunity.status,
                "updated_at": opportunity.updated_at.isoformat()
            })
        except Exception as e:
            errors.append({
                "opportunity_id": str(opportunity.id),
                "error": str(e)
            })
    
    # Commit de todas las actualizaciones
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar asignaciones: {str(e)}"
        )
    
    # Registrar en logs de auditoría (opcional pero recomendado)
    # await create_audit_log(
    #     db=db,
    #     user_id=current_user.id,
    #     action="bulk_assign_opportunities",
    #     entity_type="opportunity",
    #     metadata={
    #         "assigned_count": len(updated_opportunities),
    #         "assigned_to_id": str(request.assigned_to_id),
    #         "opportunity_ids": [str(oid) for oid in request.opportunity_ids]
    #     }
    # )
    
    return BulkAssignResponse(
        success=True,
        assigned_count=len(updated_opportunities),
        failed_count=len(errors),
        opportunities=updated_opportunities,
        errors=errors
    )
```

---

## 🔄 Implementación con Transacciones (Recomendado)

Para garantizar atomicidad, usar transacciones:

```python
from sqlalchemy.ext.asyncio import AsyncSession

async def bulk_assign_opportunities_transactional(
    request: BulkAssignRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    async with db.begin():  # Inicia transacción
        try:
            # ... lógica de asignación ...
            await db.flush()  # Flush antes del commit
            # Si todo está bien, el commit se hace automáticamente
        except Exception as e:
            # Rollback automático en caso de error
            raise
```

---

## ✅ Validaciones Requeridas

1. **Permisos**: Solo administradores pueden ejecutar la operación
2. **Usuario asignado**: Debe existir y estar activo
3. **Rol del usuario**: Debe ser `agent`, `lawyer` o `admin`
4. **Oportunidades**: Todas deben existir (o reportar errores individuales)
5. **Límites**: Máximo 100 oportunidades por request (configurable)
6. **IDs únicos**: No permitir IDs duplicados en la lista

---

## 🔍 Consideraciones de Rendimiento

### Opción 1: Actualización Individual (Actual - No Recomendado)

```python
# ❌ NO RECOMENDADO: Múltiples queries
for opp_id in request.opportunity_ids:
    opportunity = await db.get(Opportunity, opp_id)
    opportunity.assigned_to_id = request.assigned_to_id
    await db.commit()  # Múltiples commits
```

**Problemas:**
- Múltiples queries a la base de datos
- Múltiples commits
- No es atómico
- Lento para grandes cantidades

### Opción 2: Actualización Batch (Recomendado)

```python
# ✅ RECOMENDADO: Una sola query batch
stmt = update(Opportunity).where(
    Opportunity.id.in_(request.opportunity_ids)
).values(
    assigned_to_id=request.assigned_to_id,
    status='assigned',
    updated_at=datetime.utcnow()
)
await db.execute(stmt)
await db.commit()  # Un solo commit
```

**Ventajas:**
- Una sola query SQL
- Una sola transacción
- Más rápido
- Atómico

---

## 📊 Ejemplo de Query SQL Generada

```sql
UPDATE opportunities
SET 
    assigned_to_id = 'uuid-del-agente',
    status = 'assigned',
    updated_at = NOW()
WHERE id IN ('uuid-1', 'uuid-2', 'uuid-3', ...);
```

---

## 🧪 Tests Sugeridos

### Test 1: Asignación Exitosa

```python
async def test_bulk_assign_success():
    request = BulkAssignRequest(
        opportunity_ids=[opp1.id, opp2.id, opp3.id],
        assigned_to_id=agent.id
    )
    
    response = await client.post(
        "/api/crm/opportunities/bulk-assign",
        json=request.dict()
    )
    
    assert response.status_code == 200
    assert response.json()["assigned_count"] == 3
    assert response.json()["failed_count"] == 0
```

### Test 2: Permisos Insuficientes

```python
async def test_bulk_assign_no_permission():
    # Usuario no admin
    request = BulkAssignRequest(...)
    
    response = await client.post(...)
    
    assert response.status_code == 403
```

### Test 3: Oportunidades No Encontradas

```python
async def test_bulk_assign_not_found():
    request = BulkAssignRequest(
        opportunity_ids=["invalid-uuid"],
        assigned_to_id=agent.id
    )
    
    response = await client.post(...)
    
    assert response.status_code == 200  # O 207 si se usa Multi-Status
    assert response.json()["failed_count"] > 0
    assert len(response.json()["errors"]) > 0
```

### Test 4: Usuario Asignado Inválido

```python
async def test_bulk_assign_invalid_user():
    request = BulkAssignRequest(
        opportunity_ids=[opp1.id],
        assigned_to_id="invalid-uuid"
    )
    
    response = await client.post(...)
    
    assert response.status_code == 404
```

---

## 🔄 Migración del Frontend

Una vez implementado el endpoint, el frontend puede migrar de:

```typescript
// ❌ Actual: Múltiples llamadas
const promises = opportunityIds.map(id => 
  opportunityApi.assign(id, agentId)
);
await Promise.all(promises);
```

A:

```typescript
// ✅ Nuevo: Una sola llamada
await opportunityApi.bulkAssign({
  opportunity_ids: opportunityIds,
  assigned_to_id: agentId
});
```

### Actualización del Servicio Frontend

```typescript
// src/services/opportunityApi.ts

/**
 * Asignar múltiples oportunidades a un agente (batch)
 */
async bulkAssign(request: {
  opportunity_ids: string[];
  assigned_to_id: string;
}): Promise<{
  success: boolean;
  assigned_count: number;
  failed_count: number;
  opportunities: LeadOpportunity[];
  errors: Array<{ opportunity_id: string; error: string }>;
}> {
  const { data } = await api.post(
    `${CRM_BASE_PATH}/opportunities/bulk-assign`,
    request
  );
  return data;
}
```

---

## 📝 Campos Adicionales Opcionales

Si se desea mayor flexibilidad, el endpoint podría aceptar campos adicionales:

```json
{
  "opportunity_ids": ["uuid-1", "uuid-2"],
  "assigned_to_id": "uuid-del-agente",
  "update_status": true,  // Si debe cambiar el status a 'assigned'
  "status": "assigned",   // Status específico (opcional)
  "notes": "Asignación masiva desde admin panel"  // Notas opcionales
}
```

---

## 🔐 Seguridad

1. **Autenticación**: Requerida en todas las requests
2. **Autorización**: Solo admins pueden ejecutar bulk assign
3. **Validación de Input**: Validar UUIDs y límites
4. **Rate Limiting**: Considerar límite de requests por minuto
5. **Audit Logs**: Registrar todas las asignaciones bulk

---

## 📋 Checklist de Implementación

- [ ] Crear endpoint `POST /api/crm/opportunities/bulk-assign`
- [ ] Implementar validación de permisos (solo admins)
- [ ] Validar que el usuario asignado existe y tiene rol válido
- [ ] Implementar actualización batch en base de datos
- [ ] Manejar errores parciales (algunas oportunidades no encontradas)
- [ ] Implementar transacciones para atomicidad
- [ ] Agregar tests unitarios
- [ ] Agregar tests de integración
- [ ] Documentar en OpenAPI/Swagger
- [ ] Actualizar documentación del API
- [ ] Considerar agregar audit logs
- [ ] Implementar rate limiting si es necesario

---

## 🔮 Alternativa Temporal

Si no se puede implementar el endpoint batch inmediatamente, el frontend actual funcionará correctamente usando múltiples llamadas individuales. Sin embargo, se recomienda implementar el endpoint batch para:

1. **Mejor rendimiento**: Menos overhead de red
2. **Atomicidad**: Transacción única
3. **Escalabilidad**: Mejor para grandes volúmenes
4. **Mantenibilidad**: Código más simple en el frontend

---

## 📚 Referencias

- Endpoint actual individual: `POST /api/crm/opportunities/{id}/assign`
- Documentación frontend: `docs/ADMIN_OPPORTUNITIES_BULK_ASSIGNMENT.md`
- Patrón similar en otros endpoints batch del sistema

---

**Última actualización**: 2025-01-16  
**Prioridad**: Media - Mejora de rendimiento, no bloqueante  
**Responsable**: Equipo Backend




