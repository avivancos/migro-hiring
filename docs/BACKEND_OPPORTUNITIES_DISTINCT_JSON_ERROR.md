# 🐛 Error Backend: SELECT DISTINCT con Columnas JSON

**Fecha**: 2025-01-28  
**Módulo**: CRM - Opportunities  
**Prioridad**: 🔴 Crítica  
**Estado**: ✅ Corregido (Fix Final aplicado)

---

## 📋 Problema Identificado

El endpoint `GET /api/crm/opportunities` está devolviendo **500 Internal Server Error** debido a un error de PostgreSQL al intentar hacer un `SELECT DISTINCT` con columnas de tipo JSON.

### Error SQL Detallado

```
asyncpg.exceptions.UndefinedFunctionError: could not identify an equality operator for type json
```

### SQL Problemático

El backend está intentando ejecutar esta consulta:

```sql
SELECT DISTINCT 
  crm_contacts.name, 
  crm_contacts.first_name, 
  crm_contacts.last_name,
  ... (todas las columnas de crm_contacts) ...,
  lead_opportunities.contact_id,
  lead_opportunities.detected_at,
  lead_opportunities.opportunity_score,
  lead_opportunities.priority,
  lead_opportunities.detection_reason,
  lead_opportunities.status,
  lead_opportunities.pipeline_stage_id,
  lead_opportunities.assigned_to_id,
  lead_opportunities.last_contact_attempt_at,
  lead_opportunities.next_action_due_date,
  lead_opportunities.notes,  -- ⚠️ Probablemente es JSON
  lead_opportunities.id,
  lead_opportunities.created_at,
  lead_opportunities.updated_at
FROM lead_opportunities 
JOIN crm_contacts ON lead_opportunities.contact_id = crm_contacts.id 
ORDER BY lead_opportunities.priority DESC, 
         lead_opportunities.opportunity_score DESC, 
         lead_opportunities.detected_at DESC 
LIMIT 50 OFFSET 0
```

### Causa Raíz

PostgreSQL **no puede usar `DISTINCT` con columnas JSON** porque no tiene un operador de igualdad definido para el tipo JSON. Cuando SQLAlchemy genera un `SELECT DISTINCT` y una de las columnas seleccionadas es de tipo JSON, PostgreSQL lanza este error.

---

## ✅ Soluciones Posibles

### Opción 1: Eliminar DISTINCT (Recomendada)

Si no hay duplicados reales en la consulta (lo cual es probable si `lead_opportunities.id` es único), simplemente eliminar el `DISTINCT`:

```python
# En app/services/lead_opportunity_service.py o similar
query = select(LeadOpportunity).options(
    selectinload(LeadOpportunity.contact)
)
# NO usar: query = select(LeadOpportunity).distinct()
```

**Ventajas:**
- Solución más simple
- Mejor rendimiento (DISTINCT es costoso)
- Si no hay duplicados, no es necesario

### Opción 2: Convertir JSON a Texto para DISTINCT

Si realmente necesitas DISTINCT, convertir las columnas JSON a texto:

```python
from sqlalchemy import cast, String
from sqlalchemy.dialects.postgresql import JSON

# Convertir columnas JSON a texto antes de DISTINCT
query = select(
    LeadOpportunity,
    cast(LeadOpportunity.notes, String).label('notes_text')
).distinct()
```

O en SQL directo:

```sql
SELECT DISTINCT 
  ...,
  lead_opportunities.notes::text as notes_text
FROM ...
```

**Desventajas:**
- Más complejo
- Puede afectar el rendimiento
- Solo necesario si realmente hay duplicados

### Opción 3: Usar GROUP BY en lugar de DISTINCT

Si necesitas eliminar duplicados, usar `GROUP BY` con las columnas no-JSON:

```python
from sqlalchemy import func

query = select(LeadOpportunity).group_by(LeadOpportunity.id)
```

**Nota:** Esto solo funciona si agrupas por una clave única (como `id`).

### Opción 4: Excluir Columnas JSON del SELECT DISTINCT

Si el DISTINCT es necesario pero las columnas JSON no son relevantes para la deduplicación:

```python
# Seleccionar solo las columnas necesarias para DISTINCT
query = select(
    LeadOpportunity.id,
    LeadOpportunity.contact_id,
    # ... otras columnas no-JSON
).distinct()
# Luego cargar las relaciones con selectinload
```

---

## 🔍 Identificación del Problema

Para identificar qué columna es JSON, revisar:

1. **Modelo `LeadOpportunity`** - Buscar campos con tipo `JSON` o `JSONB`
2. **Modelo `CRMContact`** - Buscar campos con tipo `JSON` o `JSONB`
3. **Migraciones de base de datos** - Ver qué columnas están definidas como JSON

Columnas comunes que pueden ser JSON:
- `notes` (puede ser JSONB en lugar de TEXT)
- `metadata`
- `custom_fields`
- `extra_data`

---

## 🧪 Testing

Una vez corregido, validar:

1. ✅ `GET /api/crm/opportunities` devuelve 200 OK
2. ✅ La respuesta incluye todas las oportunidades correctamente
3. ✅ No hay duplicados en los resultados
4. ✅ El campo `contact` está expandido en cada oportunidad
5. ✅ La paginación funciona correctamente

---

## 📝 Notas de Implementación

### Ubicación del Código

El código problemático probablemente está en:
- `app/services/lead_opportunity_service.py` (función `list_opportunities`)
- `app/api/routes/crm/opportunities.py` (endpoint GET)
- O en un repositorio/DAO relacionado

### Búsqueda en el Código

Buscar por:
```python
# Patrones a buscar:
.select(LeadOpportunity).distinct()
.distinct()
SELECT DISTINCT
```

### Verificación de Columnas JSON

Para verificar qué columnas son JSON en PostgreSQL:

```sql
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('lead_opportunities', 'crm_contacts')
  AND data_type IN ('json', 'jsonb');
```

---

## 🚨 Impacto

- **Crítico**: El endpoint de oportunidades está completamente inaccesible
- **Usuarios afectados**: Todos los usuarios que intentan ver la lista de oportunidades
- **Funcionalidad bloqueada**: 
  - Lista de oportunidades
  - Dashboard de CRM (si depende de este endpoint)
  - Asignación de oportunidades

---

## ✅ Solución Implementada

**Fix Final Aplicado**: Usar `joinedload` con `contains_eager` y `result.unique()`

El backend implementó la siguiente solución:

```python
# En app/services/lead_opportunity_service.py
from sqlalchemy.orm import contains_eager

query = (
    select(LeadOpportunity)
    .join(Contact, LeadOpportunity.contact_id == Contact.id)
    .options(contains_eager(LeadOpportunity.contact))
    # Note: Usamos result.unique() en lugar de .distinct() para evitar
    # error de PostgreSQL con columnas JSON
)

result = await self.db.execute(query)
opportunities = list(result.unique().scalars().all())
```

**Cambios realizados**:
1. ✅ Cambiado de `selectinload` a `joinedload` con `contains_eager`
2. ✅ Agregado join explícito con `Contact`
3. ✅ Usado `result.unique()` en lugar de `.distinct()` para evitar error con JSON
4. ✅ Ajustado count query para usar `func.count(LeadOpportunity.id)`
5. ✅ Agregado acceso explícito al contacto antes de serializar con Pydantic

**Ventajas de esta solución**:
- ✅ No genera `SELECT DISTINCT` en SQL (evita error con JSON)
- ✅ `result.unique()` elimina duplicados en Python
- ✅ Funciona mejor con relaciones `lazy="noload"`
- ✅ El join explícito asegura que el contacto se carga correctamente

---

## 📚 Referencias

- [PostgreSQL JSON Types](https://www.postgresql.org/docs/current/datatype-json.html)
- [SQLAlchemy DISTINCT](https://docs.sqlalchemy.org/en/14/core/selectable.html#sqlalchemy.sql.expression.Select.distinct)
- [PostgreSQL Equality Operators](https://www.postgresql.org/docs/current/functions-comparison.html)

