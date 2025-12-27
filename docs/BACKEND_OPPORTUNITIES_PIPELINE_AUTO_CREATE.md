# Backend: Creación Automática de Pipeline para Oportunidades

**Fecha**: 2025-01-16  
**Prioridad**: 🔴 Alta  
**Estado**: 📋 Pendiente de implementación  
**Módulo**: Backend - CRM Opportunities

---

## 📋 Resumen Ejecutivo

Las oportunidades deben tener **siempre** un pipeline asociado automáticamente al momento de su creación. La relación debe ser **1:1:1** (Contacto:Oportunidad:Pipeline). Esto debe implementarse en el backend, no en el frontend.

---

## 🎯 Objetivo

Garantizar que cada oportunidad tenga un pipeline asociado desde su creación, eliminando la necesidad de crear pipelines manualmente.

---

## 🔗 Relación 1:1:1

```
Contacto (1) ←→ (N) Oportunidad (1) ←→ (1) Pipeline Stage
```

**Relaciones:**
- Contacto → Oportunidad: **1:N** (Un contacto puede tener múltiples oportunidades)
- Oportunidad → Pipeline Stage: **1:1** (Cada oportunidad tiene exactamente 1 pipeline)
- Pipeline Stage → Oportunidad: **1:1** (Cada pipeline pertenece a exactamente 1 oportunidad)

**Constraints de Base de Datos (Garantizar 1:1:1):**
- `pipeline_stage_id` en `lead_opportunities`: `NOT NULL`, `UNIQUE`
- `(entity_type, entity_id)` en `pipeline_stages`: `UNIQUE` (donde entity_type='leads')
- Foreign Key con `ON DELETE CASCADE` (eliminar pipeline al eliminar oportunidad)

**Comportamiento:**
- El pipeline se crea automáticamente al crear la oportunidad
- No se puede crear una oportunidad sin pipeline
- No se puede crear un pipeline sin oportunidad asociada
- Eliminar una oportunidad elimina su pipeline automáticamente

---

## 📍 Implementación Requerida

### 1. Crear Oportunidad con Pipeline Automático

Cuando se crea una oportunidad, el backend debe:

1. Crear la oportunidad
2. Crear automáticamente un pipeline stage asociado
3. Vincular la oportunidad con el pipeline stage mediante `pipeline_stage_id`
4. Retornar la oportunidad con el pipeline incluido

#### Endpoint: `POST /api/crm/opportunities`

**Request Body:**
```json
{
  "contact_id": "uuid-del-contacto",
  "opportunity_score": 75,
  "detection_reason": "Alta probabilidad de conversión",
  "priority": "high"
}
```

**Proceso Backend:**
```python
@router.post("/opportunities", response_model=LeadOpportunity)
async def create_opportunity(
    opportunity_data: OpportunityCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Crear oportunidad con pipeline automático
    
    - Crea la oportunidad
    - Crea automáticamente un pipeline stage
    - Asocia el pipeline stage a la oportunidad
    """
    
    # 1. Crear la oportunidad
    opportunity = models.LeadOpportunity(
        contact_id=opportunity_data.contact_id,
        opportunity_score=opportunity_data.opportunity_score,
        detection_reason=opportunity_data.detection_reason,
        priority=opportunity_data.priority,
        status='pending',
        detected_at=datetime.utcnow(),
    )
    db.add(opportunity)
    db.flush()  # Para obtener el ID
    
    # 2. Crear pipeline stage automáticamente
    pipeline_stage = models.PipelineStage(
        entity_type='leads',  # Las oportunidades se tratan como leads
        entity_id=opportunity.id,
        current_stage='agent_initial',  # Stage inicial por defecto
        created_at=datetime.utcnow(),
    )
    db.add(pipeline_stage)
    db.flush()
    
    # 3. Vincular pipeline stage a la oportunidad
    opportunity.pipeline_stage_id = pipeline_stage.id
    db.flush()
    
    # 4. Commit
    db.commit()
    db.refresh(opportunity)
    
    # 5. Expandir relaciones si es necesario
    # ... cargar contacto, pipeline_stage, etc.
    
    return opportunity
```

### 2. Script de Migración para Oportunidades Existentes

Para oportunidades que ya existen sin pipeline, crear un script de migración:

```python
# scripts/migrate_opportunities_pipelines.py
"""
Script de migración: Crear pipelines para oportunidades existentes sin pipeline
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import crm as models
from datetime import datetime

def migrate_opportunities_with_pipelines():
    """
    Crear pipelines para todas las oportunidades que no tienen pipeline_stage_id
    """
    db: Session = SessionLocal()
    
    try:
        # Obtener todas las oportunidades sin pipeline
        opportunities_without_pipeline = db.query(models.LeadOpportunity).filter(
            models.LeadOpportunity.pipeline_stage_id.is_(None)
        ).all()
        
        print(f"📊 Encontradas {len(opportunities_without_pipeline)} oportunidades sin pipeline")
        
        created_count = 0
        error_count = 0
        
        for opportunity in opportunities_without_pipeline:
            try:
                # Verificar si ya existe un pipeline stage para esta oportunidad
                existing_stage = db.query(models.PipelineStage).filter(
                    models.PipelineStage.entity_type == 'leads',
                    models.PipelineStage.entity_id == opportunity.id
                ).first()
                
                if existing_stage:
                    # Si existe, solo vincular
                    opportunity.pipeline_stage_id = existing_stage.id
                    print(f"  ✅ Vinculado pipeline existente a oportunidad {opportunity.id}")
                else:
                    # Crear nuevo pipeline stage
                    pipeline_stage = models.PipelineStage(
                        entity_type='leads',
                        entity_id=opportunity.id,
                        current_stage='agent_initial',  # Stage inicial por defecto
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                    )
                    db.add(pipeline_stage)
                    db.flush()
                    
                    # Vincular a la oportunidad
                    opportunity.pipeline_stage_id = pipeline_stage.id
                    created_count += 1
                    print(f"  ✅ Creado pipeline para oportunidad {opportunity.id}")
                
            except Exception as e:
                error_count += 1
                print(f"  ❌ Error procesando oportunidad {opportunity.id}: {e}")
                continue
        
        # Commit todos los cambios
        db.commit()
        
        print(f"\n✅ Migración completada:")
        print(f"   - Pipelines creados: {created_count}")
        print(f"   - Pipelines vinculados: {len(opportunities_without_pipeline) - created_count - error_count}")
        print(f"   - Errores: {error_count}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error en migración: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Iniciando migración de pipelines para oportunidades...")
    migrate_opportunities_with_pipelines()
    print("✅ Migración finalizada")
```

### 3. Constraints de Base de Datos (Requerido para 1:1:1)

Para garantizar la integridad referencial y la relación 1:1:1, se deben implementar las siguientes constraints:

#### 3.1. Modelo de Oportunidad

```python
# En el modelo LeadOpportunity
class LeadOpportunity(Base):
    __tablename__ = "lead_opportunities"
    
    id = Column(UUID, primary_key=True)
    contact_id = Column(UUID, ForeignKey("contacts.id"), nullable=False, index=True)
    
    # Pipeline Stage - REQUERIDO (1:1)
    # NOTA: Durante migración mantener nullable=True, luego cambiar a nullable=False
    pipeline_stage_id = Column(
        UUID, 
        ForeignKey("pipeline_stages.id", ondelete="CASCADE"), 
        nullable=False,  # Después de migración
        unique=True,     # Garantiza 1:1
        index=True
    )
    
    # ... otros campos ...
    
    # Relación
    pipeline_stage = relationship(
        "PipelineStage",
        foreign_keys=[pipeline_stage_id],
        uselist=False,  # Garantiza 1:1 en SQLAlchemy
        cascade="all, delete-orphan"  # Eliminar pipeline si se elimina oportunidad
    )
```

#### 3.2. Modelo de Pipeline Stage

```python
# En el modelo PipelineStage
class PipelineStage(Base):
    __tablename__ = "pipeline_stages"
    
    id = Column(UUID, primary_key=True)
    entity_type = Column(String(50), nullable=False, index=True)  # 'leads', 'contacts', etc.
    entity_id = Column(UUID, nullable=False, index=True)
    current_stage = Column(String(50), nullable=False)
    
    # ... otros campos ...
    
    # Constraint único compuesto: entity_type + entity_id debe ser único
    # Esto garantiza que cada entidad (oportunidad) tenga solo un pipeline stage
    __table_args__ = (
        UniqueConstraint('entity_type', 'entity_id', name='uq_pipeline_stage_entity'),
    )
```

#### 3.3. Migración de Base de Datos

Crear migración SQLAlchemy/Alembic:

```python
# migrations/versions/XXXX_add_pipeline_stage_constraints.py

"""add pipeline_stage_constraints

Revision ID: xxxx
Revises: previous_revision
Create Date: 2025-01-16
"""

from alembic import op
import sqlalchemy as sa

def upgrade():
    # Paso 1: Asegurar que todas las oportunidades tengan pipeline_stage_id
    # (Ejecutar script de migración primero)
    
    # Paso 2: Agregar constraint NOT NULL
    op.alter_column('lead_opportunities', 'pipeline_stage_id',
                    existing_type=sa.UUID(),
                    nullable=False)
    
    # Paso 3: Agregar constraint UNIQUE
    op.create_unique_constraint(
        'uq_lead_opportunity_pipeline_stage',
        'lead_opportunities',
        ['pipeline_stage_id']
    )
    
    # Paso 4: Agregar índice si no existe (ya debería existir, pero por si acaso)
    op.create_index(
        'ix_lead_opportunities_pipeline_stage_id',
        'lead_opportunities',
        ['pipeline_stage_id']
    )
    
    # Paso 5: Agregar constraint único compuesto en pipeline_stages
    op.create_unique_constraint(
        'uq_pipeline_stage_entity',
        'pipeline_stages',
        ['entity_type', 'entity_id']
    )

def downgrade():
    # Revertir cambios (solo si es necesario)
    op.drop_constraint('uq_pipeline_stage_entity', 'pipeline_stages')
    op.drop_index('ix_lead_opportunities_pipeline_stage_id', 'lead_opportunities')
    op.drop_constraint('uq_lead_opportunity_pipeline_stage', 'lead_opportunities')
    op.alter_column('lead_opportunities', 'pipeline_stage_id',
                    existing_type=sa.UUID(),
                    nullable=True)
```

#### 3.4. Constraints SQL Directos (PostgreSQL)

Alternativamente, usando SQL directo:

```sql
-- 1. Agregar constraint NOT NULL
ALTER TABLE lead_opportunities 
ALTER COLUMN pipeline_stage_id SET NOT NULL;

-- 2. Agregar constraint UNIQUE
ALTER TABLE lead_opportunities
ADD CONSTRAINT uq_lead_opportunity_pipeline_stage 
UNIQUE (pipeline_stage_id);

-- 3. Agregar constraint único compuesto en pipeline_stages
ALTER TABLE pipeline_stages
ADD CONSTRAINT uq_pipeline_stage_entity 
UNIQUE (entity_type, entity_id);

-- 4. Agregar índice (si no existe)
CREATE INDEX IF NOT EXISTS ix_lead_opportunities_pipeline_stage_id 
ON lead_opportunities(pipeline_stage_id);

-- 5. Agregar foreign key con ON DELETE CASCADE
ALTER TABLE lead_opportunities
DROP CONSTRAINT IF EXISTS fk_lead_opportunity_pipeline_stage;

ALTER TABLE lead_opportunities
ADD CONSTRAINT fk_lead_opportunity_pipeline_stage
FOREIGN KEY (pipeline_stage_id) 
REFERENCES pipeline_stages(id) 
ON DELETE CASCADE;
```

#### 3.5. Verificación de Constraints

Después de aplicar las constraints, verificar:

```sql
-- Verificar constraint NOT NULL
SELECT COUNT(*) 
FROM lead_opportunities 
WHERE pipeline_stage_id IS NULL;
-- Debe retornar 0

-- Verificar constraint UNIQUE
SELECT pipeline_stage_id, COUNT(*) 
FROM lead_opportunities 
GROUP BY pipeline_stage_id 
HAVING COUNT(*) > 1;
-- No debe retornar filas

-- Verificar constraint único compuesto en pipeline_stages
SELECT entity_type, entity_id, COUNT(*) 
FROM pipeline_stages 
WHERE entity_type = 'leads'
GROUP BY entity_type, entity_id 
HAVING COUNT(*) > 1;
-- No debe retornar filas
```

#### 3.6. Orden de Implementación

**IMPORTANTE**: Seguir este orden para evitar errores:

1. ✅ Ejecutar script de migración de datos (crear pipelines para oportunidades existentes)
2. ✅ Verificar que todas las oportunidades tienen `pipeline_stage_id`
3. ✅ Aplicar constraint `NOT NULL` a `pipeline_stage_id`
4. ✅ Aplicar constraint `UNIQUE` a `pipeline_stage_id`
5. ✅ Aplicar constraint único compuesto en `pipeline_stages` (entity_type, entity_id)
6. ✅ Actualizar código del modelo para reflejar constraints
7. ✅ Ejecutar tests para verificar integridad

**Nota**: No aplicar constraints hasta que todas las oportunidades existentes tengan `pipeline_stage_id`, de lo contrario la migración fallará.

---

## 🔍 Verificación

### Validación Post-Creación

Después de crear una oportunidad, verificar:

```python
def validate_opportunity_pipeline(opportunity_id: str, db: Session) -> bool:
    """
    Verificar que una oportunidad tiene pipeline asociado
    """
    opportunity = db.query(models.LeadOpportunity).filter(
        models.LeadOpportunity.id == opportunity_id
    ).first()
    
    if not opportunity:
        return False
    
    # Debe tener pipeline_stage_id
    if not opportunity.pipeline_stage_id:
        return False
    
    # El pipeline stage debe existir
    pipeline_stage = db.query(models.PipelineStage).filter(
        models.PipelineStage.id == opportunity.pipeline_stage_id
    ).first()
    
    return pipeline_stage is not None
```

### Query de Verificación

```sql
-- Oportunidades sin pipeline
SELECT COUNT(*) 
FROM lead_opportunities 
WHERE pipeline_stage_id IS NULL;

-- Debe retornar 0 después de la migración
```

---

## 🧪 Testing

### Test Unitario

```python
async def test_create_opportunity_with_pipeline(db: AsyncSession):
    """
    Test: Crear oportunidad debe crear pipeline automáticamente
    """
    # Crear contacto de prueba
    contact = models.Contact(...)
    db.add(contact)
    db.flush()
    
    # Crear oportunidad
    opportunity_data = OpportunityCreate(
        contact_id=contact.id,
        opportunity_score=75,
        detection_reason="Test",
        priority="high"
    )
    
    result = await create_opportunity(opportunity_data, db, current_user)
    
    # Verificar que tiene pipeline
    assert result.pipeline_stage_id is not None
    assert result.pipeline_stage is not None
    assert result.pipeline_stage.current_stage == 'agent_initial'
    assert result.pipeline_stage.entity_type == 'leads'
    assert result.pipeline_stage.entity_id == result.id
```

---

## 📝 Checklist de Implementación

### Fase 1: Migración de Datos
- [ ] Crear script de migración `migrate_opportunities_pipelines.py`
- [ ] Ejecutar script de migración en desarrollo/staging
- [ ] Verificar que todas las oportunidades existentes tienen `pipeline_stage_id`
- [ ] Ejecutar queries de verificación SQL
- [ ] Confirmar que no hay oportunidades sin pipeline

### Fase 2: Implementación de Constraints (1:1:1)
- [ ] Crear migración de base de datos para constraints
- [ ] Aplicar constraint `NOT NULL` a `pipeline_stage_id` en `lead_opportunities`
- [ ] Aplicar constraint `UNIQUE` a `pipeline_stage_id` en `lead_opportunities`
- [ ] Aplicar constraint único compuesto `(entity_type, entity_id)` en `pipeline_stages`
- [ ] Actualizar foreign key con `ON DELETE CASCADE`
- [ ] Verificar constraints con queries SQL
- [ ] Actualizar modelos SQLAlchemy para reflejar constraints

### Fase 3: Código de Creación Automática
- [ ] Modificar endpoint `POST /api/crm/opportunities` para crear pipeline automático
- [ ] Agregar validación en creación de oportunidades (verificar que pipeline se creó)
- [ ] Manejar errores de creación de pipeline (rollback si falla)
- [ ] Actualizar tests unitarios
- [ ] Actualizar tests de integración
- [ ] Actualizar documentación de API

### Fase 4: Validación y Testing
- [ ] Test: Crear oportunidad debe crear pipeline automáticamente
- [ ] Test: No se puede crear oportunidad sin pipeline
- [ ] Test: Eliminar oportunidad debe eliminar pipeline (CASCADE)
- [ ] Test: No se puede crear dos pipelines para la misma oportunidad
- [ ] Test: Migración de datos completa sin errores
- [ ] Test: Constraints funcionan correctamente

---

## 🔄 Integración con Frontend

Una vez implementado en el backend:

1. **El frontend puede eliminar el botón "Crear Pipeline"** (ya no es necesario)
2. **El frontend siempre asume que existe pipeline** (como se hizo en `CRMOpportunityDetail.tsx`)
3. **El frontend muestra acciones del pipeline directamente** cuando se carga la oportunidad

---

## 🚨 Impacto

### Antes de la Implementación

- ❌ Oportunidades pueden existir sin pipeline
- ❌ Usuario debe crear pipeline manualmente
- ❌ Flujo incompleto: oportunidad sin acciones disponibles

### Después de la Implementación

- ✅ Cada oportunidad tiene pipeline automáticamente
- ✅ Relación 1:1:1 garantizada
- ✅ Flujo completo: oportunidad → pipeline → acciones disponibles
- ✅ Frontend simplificado (no necesita botón crear pipeline)

---

## 📚 Referencias

- `docs/BACKEND_OPPORTUNITIES_PIPELINE_ENDPOINT_404.md` - Documentación previa sobre creación de pipeline
- `src/types/opportunity.ts` - Tipos de oportunidades
- `src/types/pipeline.ts` - Tipos de pipelines
- `src/pages/CRMOpportunityDetail.tsx` - Frontend que asume pipeline existente

---

## 🔒 Constraints de Base de Datos - Resumen

Para garantizar la relación 1:1:1, las siguientes constraints son **obligatorias**:

### En `lead_opportunities`:
1. `pipeline_stage_id NOT NULL` - Garantiza que siempre existe
2. `pipeline_stage_id UNIQUE` - Garantiza que solo hay uno
3. Foreign Key con `ON DELETE CASCADE` - Integridad referencial

### En `pipeline_stages`:
1. `(entity_type, entity_id) UNIQUE` - Garantiza que cada oportunidad tiene solo un pipeline
2. Donde `entity_type = 'leads'` y `entity_id = opportunity.id`

### Resultado:
- ✅ Imposible crear oportunidad sin pipeline
- ✅ Imposible tener múltiples pipelines para una oportunidad
- ✅ Eliminar oportunidad elimina pipeline automáticamente
- ✅ Integridad referencial garantizada a nivel de base de datos

---

**Última actualización**: 2025-01-16  
**Prioridad**: Alta - Bloquea funcionalidad completa del sistema  
**Responsable**: Equipo Backend

