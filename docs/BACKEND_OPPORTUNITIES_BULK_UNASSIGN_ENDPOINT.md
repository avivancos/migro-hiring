# Backend: Endpoint Batch para Desasignación Masiva de Oportunidades

**Fecha**: 2025-01-29  
**Prioridad**: 🟡 Media  
**Estado**: 📋 Pendiente de implementación (opcional - mejora de rendimiento)  
**Módulo**: CRM - Opportunities

---

## 📋 Resumen Ejecutivo

El frontend actualmente implementa desasignación bulk de oportunidades haciendo múltiples llamadas individuales al endpoint `PATCH /crm/opportunities/{id}` con `assigned_to_id: undefined`. **La funcionalidad funciona correctamente sin este endpoint**, pero para optimizar el rendimiento y reducir la carga en el servidor, se recomienda implementar un endpoint batch que permita desasignar múltiples oportunidades en una sola transacción.

---

## ⚠️ Estado Actual

**✅ La funcionalidad YA funciona** usando el endpoint existente:
- `PATCH /api/crm/opportunities/{id}` con `{ assigned_to_id: undefined }`
- El frontend hace múltiples llamadas individuales (en lotes de 10)
- Funciona correctamente pero no es óptimo para grandes volúmenes

**🎯 Este endpoint es una OPTIMIZACIÓN**, no un requisito.

---

## 🎯 Objetivo

Crear un endpoint que permita desasignar múltiples oportunidades en una sola operación, reduciendo:
- Número de requests HTTP
- Tiempo de respuesta total
- Carga en el servidor
- Posibilidad de inconsistencias (operación atómica)

---

## 📍 Endpoint Propuesto

### **POST `/api/crm/opportunities/bulk-unassign`**

**Descripción**: Desasigna múltiples oportunidades (remueve `assigned_to_id`) en una sola operación.

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
  ]
}
```

### Esquema de Validación

```python
from pydantic import BaseModel, Field
from typing import List
from uuid import UUID

class BulkUnassignRequest(BaseModel):
    opportunity_ids: List[UUID] = Field(
        ...,
        description="Lista de IDs de oportunidades a desasignar",
        min_items=1,
        max_items=100  # Límite razonable para evitar timeouts
    )
```

---

## 📤 Response

### Éxito (200 OK)

```json
{
  "success": true,
  "unassigned_count": 3,
  "failed_count": 0,
  "opportunities": [
    {
      "id": "uuid-1",
      "assigned_to_id": null,
      "status": "pending",
      "updated_at": "2025-01-29T10:30:00Z"
    },
    {
      "id": "uuid-2",
      "assigned_to_id": null,
      "status": "pending",
      "updated_at": "2025-01-29T10:30:00Z"
    }
  ],
  "errors": []
}
```

### Éxito Parcial (200 OK)

```json
{
  "success": false,
  "unassigned_count": 2,
  "failed_count": 1,
  "opportunities": [
    {
      "id": "uuid-1",
      "assigned_to_id": null,
      "status": "pending",
      "updated_at": "2025-01-29T10:30:00Z"
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

### Error de Validación (400 Bad Request)

```json
{
  "detail": "La lista de oportunidades debe contener entre 1 y 100 elementos"
}
```

### Error de Permisos (403 Forbidden)

```json
{
  "detail": "Solo administradores pueden desasignar oportunidades en bulk"
}
```

---

## 🔧 Implementación Propuesta

### Esquema de Respuesta

```python
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class BulkUnassignError(BaseModel):
    opportunity_id: UUID
    error: str

class BulkUnassignResponse(BaseModel):
    success: bool
    unassigned_count: int
    failed_count: int
    opportunities: List[dict]
    errors: List[BulkUnassignError] = []
```

### Endpoint

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime

router = APIRouter()

class BulkUnassignRequest(BaseModel):
    opportunity_ids: List[UUID] = Field(..., min_items=1, max_items=100)

class BulkUnassignResponse(BaseModel):
    success: bool
    unassigned_count: int
    failed_count: int
    opportunities: List[dict]
    errors: List[dict] = []

@router.post(
    "/opportunities/bulk-unassign",
    response_model=BulkUnassignResponse,
    status_code=status.HTTP_200_OK
)
async def bulk_unassign_opportunities(
    request: BulkUnassignRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)  # Verificar que sea admin
):
    """
    Desasigna múltiples oportunidades removiendo el assigned_to_id.
    
    Requiere permisos de administrador.
    """
    
    # Verificar permisos (solo admins)
    if current_user.role not in ['admin', 'superuser']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden desasignar oportunidades en bulk"
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
            # Remover asignación
            opportunity.assigned_to_id = None
            # Cambiar estado a 'pending' si estaba 'assigned'
            if opportunity.status == 'assigned':
                opportunity.status = 'pending'
            opportunity.updated_at = now
            
            updated_opportunities.append({
                "id": str(opportunity.id),
                "assigned_to_id": None,
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
            detail=f"Error al guardar desasignaciones: {str(e)}"
        )
    
    return BulkUnassignResponse(
        success=len(errors) == 0,
        unassigned_count=len(updated_opportunities),
        failed_count=len(errors),
        opportunities=updated_opportunities,
        errors=errors
    )
```

---

## 🔄 Actualización del Frontend

Una vez implementado el endpoint en el backend, actualizar `src/services/opportunityApi.ts`:

```typescript
async bulkUnassign(request: {
  opportunity_ids: string[];
}): Promise<{
  success: boolean;
  unassigned_count: number;
  failed_count: number;
  opportunities: LeadOpportunity[];
  errors: Array<{ opportunity_id: string; error: string }>;
}> {
  // Usar el endpoint batch del backend
  const { data } = await api.post(
    `${CRM_BASE_PATH}/opportunities/bulk-unassign`,
    request
  );
  return data;
}
```

---

## 📊 Comparación de Rendimiento

### Implementación Actual (Múltiples Requests)

- **100 oportunidades**: ~10 requests (10 lotes × 10 oportunidades)
- **Tiempo estimado**: ~2-5 segundos (dependiendo de latencia)
- **Carga en servidor**: Media-Alta

### Con Endpoint Batch

- **100 oportunidades**: 1 request
- **Tiempo estimado**: ~0.5-1 segundo
- **Carga en servidor**: Baja
- **Transacción atómica**: ✅ Sí

---

## ✅ Beneficios

1. **Rendimiento**: Reducción significativa en tiempo de respuesta
2. **Escalabilidad**: Mejor para grandes volúmenes (>50 oportunidades)
3. **Atomicidad**: Operación atómica en base de datos
4. **Menor carga**: Un solo request vs múltiples requests
5. **Consistencia**: Menor posibilidad de estados inconsistentes

---

## 🚀 Prioridad

**🟡 Media** - La funcionalidad funciona correctamente sin este endpoint. Implementar cuando:
- Se procesen regularmente grandes volúmenes (>50 oportunidades)
- Se note degradación de rendimiento en el servidor
- Se implemente el endpoint `bulk-assign` (hacer ambos juntos)

---

## 📝 Notas

- Este endpoint es **opcional** - la funcionalidad funciona sin él
- Similar al endpoint propuesto para `bulk-assign` (ver `BACKEND_OPPORTUNITIES_BULK_ASSIGN_ENDPOINT.md`)
- Considerar implementar ambos endpoints juntos para mantener consistencia
- El frontend ya está preparado para usar el endpoint batch cuando esté disponible

---

**Propuesto por**: Sistema de Desarrollo  
**Revisado por**: -  
**Aprobado por**: -
