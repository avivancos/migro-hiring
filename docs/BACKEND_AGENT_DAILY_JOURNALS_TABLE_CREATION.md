# 📊 Creación de Tabla agent_daily_journals

**Fecha**: 2025-01-29  
**Problema**: La tabla `agent_daily_journals` no existe en la base de datos, causando errores 500 en los endpoints de Agent Daily Journal.  
**Solución**: Script SQL para crear la tabla con todas las columnas necesarias.

---

## 🔍 Problema Identificado

Los endpoints siguientes están fallando con error 500:
- `GET /api/agent-journal/daily-report`
- `GET /api/agent-journal/performance-dashboard`

**Error específico:**
```
relation "agent_daily_journals" does not exist
```

---

## 🗄️ Script SQL de Creación

### PostgreSQL

```sql
-- =============================================================================
-- TABLA: agent_daily_journals
-- =============================================================================
-- Descripción: Almacena los reportes diarios de trabajo de los agentes
-- =============================================================================

CREATE TABLE IF NOT EXISTS agent_daily_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relación con usuario (agente)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Fecha del reporte (único por usuario y fecha)
    date DATE NOT NULL,
    
    -- Métricas de llamadas
    total_call_time_seconds INTEGER NOT NULL DEFAULT 0,
    total_calls INTEGER NOT NULL DEFAULT 0,
    effective_calls INTEGER NOT NULL DEFAULT 0,
    avg_call_duration_seconds DOUBLE PRECISION,
    
    -- Métricas de tareas
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    tasks_pending INTEGER NOT NULL DEFAULT 0,
    
    -- Métricas de notas
    notes_created INTEGER NOT NULL DEFAULT 0,
    
    -- Métricas de oportunidades
    opportunities_worked INTEGER NOT NULL DEFAULT 0,
    
    -- Métricas de intentos de llamada
    call_attempts_count INTEGER NOT NULL DEFAULT 0,
    
    -- Datos adicionales (JSONB para flexibilidad)
    extra_data JSONB,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraint: un único journal por usuario y fecha
    CONSTRAINT agent_daily_journals_user_date_unique UNIQUE (user_id, date)
);

-- =============================================================================
-- ÍNDICES
-- =============================================================================

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_agent_daily_journals_user_id 
ON agent_daily_journals(user_id);

-- Índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_agent_daily_journals_date 
ON agent_daily_journals(date);

-- Índice compuesto para búsquedas frecuentes (usuario + fecha)
CREATE INDEX IF NOT EXISTS idx_agent_daily_journals_user_date 
ON agent_daily_journals(user_id, date);

-- Índice para consultas por rango de fechas
CREATE INDEX IF NOT EXISTS idx_agent_daily_journals_date_range 
ON agent_daily_journals(date DESC);

-- =============================================================================
-- TRIGGER: Actualizar updated_at automáticamente
-- =============================================================================

CREATE OR REPLACE FUNCTION update_agent_daily_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_daily_journals_updated_at
    BEFORE UPDATE ON agent_daily_journals
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_daily_journals_updated_at();

-- =============================================================================
-- COMENTARIOS EN TABLA Y COLUMNAS
-- =============================================================================

COMMENT ON TABLE agent_daily_journals IS 'Reportes diarios de trabajo de agentes con métricas de llamadas, tareas, notas y oportunidades';
COMMENT ON COLUMN agent_daily_journals.id IS 'ID único del reporte (UUID)';
COMMENT ON COLUMN agent_daily_journals.user_id IS 'ID del usuario (agente) que genera el reporte';
COMMENT ON COLUMN agent_daily_journals.date IS 'Fecha del reporte (YYYY-MM-DD)';
COMMENT ON COLUMN agent_daily_journals.total_call_time_seconds IS 'Tiempo total de llamadas en segundos';
COMMENT ON COLUMN agent_daily_journals.total_calls IS 'Número total de llamadas realizadas';
COMMENT ON COLUMN agent_daily_journals.effective_calls IS 'Número de llamadas efectivas (con éxito)';
COMMENT ON COLUMN agent_daily_journals.avg_call_duration_seconds IS 'Duración promedio de llamadas en segundos';
COMMENT ON COLUMN agent_daily_journals.tasks_completed IS 'Número de tareas completadas';
COMMENT ON COLUMN agent_daily_journals.tasks_pending IS 'Número de tareas pendientes';
COMMENT ON COLUMN agent_daily_journals.notes_created IS 'Número de notas creadas';
COMMENT ON COLUMN agent_daily_journals.opportunities_worked IS 'Número de oportunidades trabajadas';
COMMENT ON COLUMN agent_daily_journals.call_attempts_count IS 'Número total de intentos de llamada';
COMMENT ON COLUMN agent_daily_journals.extra_data IS 'Datos adicionales en formato JSON (firma, metadata, etc.)';
COMMENT ON COLUMN agent_daily_journals.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN agent_daily_journals.updated_at IS 'Fecha de última actualización del registro';
```

---

## 📋 Notas Importantes

### 1. Nombre de Columna: `date` vs `journal_date`
- En la base de datos, la columna se llama `date`
- En el modelo TypeScript (frontend), el campo se llama `journal_date`
- El backend debe hacer el mapeo entre estos nombres al serializar/deserializar

### 2. Constraint de Unicidad
- Un agente solo puede tener un journal por fecha
- Esto se asegura con `UNIQUE (user_id, date)`

### 3. Foreign Key
- `user_id` referencia a `users(id)` con `ON DELETE CASCADE`
- Si se elimina un usuario, se eliminan sus journals automáticamente

### 4. Índices
- Se crean índices para optimizar las consultas más comunes:
  - Por usuario
  - Por fecha
  - Por usuario + fecha (búsqueda más frecuente)
  - Por rango de fechas (para dashboards)

### 5. JSONB para extra_data
- Permite almacenar datos flexibles como firma digital, metadata, etc.
- Soporte nativo de PostgreSQL para consultas JSON

---

## 🔧 Ejecución del Script

### Opción 1: Desde psql

```bash
# Conectar a la base de datos
psql -h localhost -U postgres -d migro_db

# Ejecutar script
\i path/to/create_agent_daily_journals.sql
```

### Opción 2: Desde línea de comandos

```bash
psql -h localhost -U postgres -d migro_db -f create_agent_daily_journals.sql
```

### Opción 3: En Docker

```bash
# Si la base de datos está en Docker
docker exec -i <container_name> psql -U postgres -d migro_db < create_agent_daily_journals.sql
```

---

## ✅ Verificación

Después de ejecutar el script, verificar que la tabla se creó correctamente:

```sql
-- Verificar que la tabla existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'agent_daily_journals';

-- Ver estructura de la tabla
\d agent_daily_journals

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'agent_daily_journals';

-- Verificar constraint de unicidad
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'agent_daily_journals'::regclass;
```

---

## 🔄 Migraciones Futuras

Si se necesitan agregar nuevas columnas en el futuro, crear migraciones incrementales:

```sql
-- Ejemplo: Agregar nueva columna
ALTER TABLE agent_daily_journals 
ADD COLUMN IF NOT EXISTS new_metric INTEGER DEFAULT 0;
```

---

## 📚 Referencias

- Frontend TypeScript Types: `src/types/agentJournal.ts`
- Error SQL: `relation "agent_daily_journals" does not exist`
- Documentación relacionada:
  - `docs/BACKEND_AGENT_JOURNAL_SIGN_AND_EMAIL.md`
  - `docs/FRONTEND_AGENT_JOURNAL_IMPLEMENTATION.md`

---

**Última actualización**: 2025-01-29  
**Versión**: 1.0
