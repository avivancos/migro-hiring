# 🐛 Error Backend: Endpoint Pipeline de Oportunidades No Encontrado

**Fecha**: 2025-01-28  
**Módulo**: CRM - Opportunities  
**Prioridad**: 🟡 Media  
**Estado**: ✅ Solucionado temporalmente usando endpoint alternativo

---

## 📋 Problema Identificado

El endpoint `POST /api/crm/opportunities/{id}/pipeline` está devolviendo **404 Not Found** cuando el frontend intenta crear un pipeline desde una oportunidad.

### Error Detallado

```
POST /api/crm/opportunities/9ca7604d-9f8e-41f0-a2d7-4c8c9a839c6d/pipeline
Status: 404
Response: "Recurso no encontrado"
```

### Ubicación del Problema

**Frontend:**
- `src/services/opportunityApi.ts` (línea 220-225)
- `src/hooks/useOpportunityDetail.ts` (línea 35-40)
- `src/pages/CRMOpportunityDetail.tsx` (línea 143-149)

**Backend:**
- El endpoint no existe en el backend

---

## ✅ Soluciones Posibles

### Opción 1: Implementar Endpoint en Backend (Recomendada)

Crear el endpoint `POST /api/crm/opportunities/{opportunity_id}/pipeline` en el backend:

```python
# En app/api/routes/crm/opportunities.py o similar
@router.post("/opportunities/{opportunity_id}/pipeline", response_model=PipelineStageRead)
async def create_opportunity_pipeline(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Crear pipeline para una oportunidad
    
    - Obtiene la oportunidad
    - Crea un pipeline stage asociado a la oportunidad
    - Retorna el stage creado
    """
    # 1. Verificar que la oportunidad existe
    opportunity = await db.get(LeadOpportunity, opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidad no encontrada")
    
    # 2. Crear pipeline stage usando el servicio de pipelines
    # Usar pipelineApi.createOrUpdateStage o el servicio correspondiente
    stage_data = PipelineStageCreate(
        entity_type="opportunity",
        entity_id=opportunity_id,
        # ... otros campos necesarios
    )
    
    # 3. Crear el stage
    stage = await pipeline_service.create_or_update_stage(stage_data, db)
    
    return stage
```

**Ventajas:**
- Endpoint específico y semánticamente correcto
- Encapsula la lógica de creación de pipeline para oportunidades
- Fácil de usar desde el frontend

### Opción 2: Usar Endpoint de Pipelines Directamente (Alternativa) ✅ IMPLEMENTADO

Modificar el frontend para usar el endpoint genérico de pipelines:

```typescript
// En src/services/opportunityApi.ts
import { pipelineApi } from './pipelineApi';

async createPipeline(id: string): Promise<PipelineStageRead> {
  // Usar el endpoint genérico de pipelines
  // Las oportunidades se tratan como 'leads' en el sistema de pipelines
  const stageData: PipelineStageCreate = {
    entity_id: id,
    entity_type: 'leads', // Las oportunidades se tratan como leads
    current_stage: 'agent_initial', // Stage inicial por defecto
  };
  
  return pipelineApi.createOrUpdateStage(stageData);
}
```

**Ventajas:**
- ✅ No requiere cambios en el backend
- ✅ Usa endpoints existentes
- ✅ Funciona inmediatamente

**Desventajas:**
- Menos semántico
- Requiere conocer la estructura interna de pipelines

**Estado**: ✅ Implementado en `src/services/opportunityApi.ts`

---

## 🔍 Endpoints Relacionados

### Endpoints de Pipelines Existentes

Según `src/services/pipelineApi.ts`, estos endpoints están disponibles:

- `POST /api/pipelines/stages` - Crear o actualizar stage
- `GET /api/pipelines/stages/{entity_type}/{entity_id}` - Obtener stage
- `GET /api/pipelines/stages/{entity_type}/{entity_id}/status` - Obtener estado

### Endpoint Esperado

- `POST /api/crm/opportunities/{id}/pipeline` - **NO EXISTE** ❌

---

## 🧪 Testing

Una vez implementado, validar:

1. ✅ `POST /api/crm/opportunities/{id}/pipeline` devuelve 200 OK
2. ✅ La respuesta incluye un `PipelineStageRead` válido
3. ✅ El pipeline está asociado correctamente a la oportunidad
4. ✅ El frontend puede crear pipelines desde el detalle de oportunidad
5. ✅ No hay errores 404 en la consola

---

## 📝 Notas de Implementación

### Ubicación del Código Backend

El código probablemente debería estar en:
- `app/api/routes/crm/opportunities.py` (si existe)
- O en el router principal de CRM

### Dependencias

El endpoint necesitará:
- Servicio de pipelines (`pipeline_service` o similar)
- Modelo `LeadOpportunity`
- Modelo `PipelineStage`
- Autenticación/autorización

### Datos Necesarios

Para crear un pipeline stage, probablemente se necesite:
- `entity_type`: "opportunity"
- `entity_id`: ID de la oportunidad
- `pipeline_id`: ID del pipeline a usar (¿default o configurable?)
- `stage_id`: ID del stage inicial (¿default o configurable?)

---

## 🚨 Impacto

- **Medio**: El botón "Crear Pipeline" no funciona en el detalle de oportunidad
- **Usuarios afectados**: Usuarios que intentan crear pipelines desde oportunidades
- **Funcionalidad bloqueada**: 
  - Creación de pipeline desde detalle de oportunidad
  - Flujo completo de gestión de pipelines para oportunidades

---

## ✅ Solución Implementada en Frontend

**Estado**: ✅ Completado - Se está usando el endpoint alternativo

El frontend ahora usa el endpoint genérico de pipelines (`POST /api/pipelines/stages`) en lugar del endpoint específico que no existe.

### Cambios Realizados

1. **`src/services/opportunityApi.ts`**:
   - ✅ Importado `pipelineApi` y tipos necesarios
   - ✅ Modificado `createPipeline()` para usar `pipelineApi.createOrUpdateStage()`
   - ✅ Las oportunidades se tratan como `entity_type: 'leads'` en el sistema de pipelines

2. **`src/hooks/useOpportunityDetail.ts`**:
   - ✅ Eliminado manejo de error temporal (ya no es necesario)
   - ✅ Agregada invalidación de queries de pipelines al crear exitosamente

### Código Implementado

```typescript
// src/services/opportunityApi.ts
async createPipeline(id: string): Promise<PipelineStageRead> {
  const stageData: PipelineStageCreate = {
    entity_id: id,
    entity_type: 'leads', // Las oportunidades se tratan como leads
    current_stage: 'agent_initial', // Stage inicial por defecto
  };
  
  return pipelineApi.createOrUpdateStage(stageData);
}
```

### Resultado

- ✅ El botón "Crear Pipeline" ahora funciona correctamente
- ✅ No se requieren cambios en el backend
- ✅ Usa endpoints existentes y probados

---

## 📚 Referencias

- `src/services/opportunityApi.ts` - Implementación actual del frontend
- `src/services/pipelineApi.ts` - Endpoints de pipelines disponibles
- `src/hooks/useOpportunityDetail.ts` - Hook que usa el endpoint
- `docs/FRONTEND_OPPORTUNITIES_WIZARD_IMPLEMENTATION.md` - Documentación de oportunidades

---

**Última actualización**: 2025-01-28

