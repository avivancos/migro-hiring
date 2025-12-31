# 🔧 Fix Rápido: Crear Tabla agent_daily_journals en Render

**Fecha**: 2025-01-29  
**Problema**: Tabla `agent_daily_journals` no existe  
**Solución**: Ejecutar script SQL directamente en el servidor

---

## 🚀 Solución Rápida (Desde el Servidor Render)

### Opción 1: Ejecutar SQL directamente con psql

Desde el servidor de Render, ejecuta:

```bash
# 1. Obtener la URL de la base de datos desde las variables de entorno
echo $DATABASE_URL

# 2. Ejecutar el script SQL directamente
psql $DATABASE_URL -f create_agent_daily_journals.sql

# O si prefieres ejecutar el SQL directamente sin archivo:
psql $DATABASE_URL << 'EOF'
-- Pegar aquí el contenido del script SQL
EOF
```

### Opción 2: Crear el script en el servidor y ejecutarlo

```bash
# 1. Crear el archivo SQL en el servidor
cat > create_agent_daily_journals.sql << 'SQLSCRIPT'
-- [Pegar aquí el contenido completo del script SQL]
SQLSCRIPT

# 2. Ejecutarlo
psql $DATABASE_URL -f create_agent_daily_journals.sql
```

### Opción 3: Ejecutar SQL directamente (más rápido)

Ejecuta este comando completo directamente:

```bash
psql $DATABASE_URL << 'EOF'
CREATE TABLE IF NOT EXISTS agent_daily_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_call_time_seconds INTEGER NOT NULL DEFAULT 0,
    total_calls INTEGER NOT NULL DEFAULT 0,
    effective_calls INTEGER NOT NULL DEFAULT 0,
    avg_call_duration_seconds DOUBLE PRECISION,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    tasks_pending INTEGER NOT NULL DEFAULT 0,
    notes_created INTEGER NOT NULL DEFAULT 0,
    opportunities_worked INTEGER NOT NULL DEFAULT 0,
    call_attempts_count INTEGER NOT NULL DEFAULT 0,
    extra_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT agent_daily_journals_user_date_unique UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_agent_daily_journals_user_id ON agent_daily_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_daily_journals_date ON agent_daily_journals(date);
CREATE INDEX IF NOT EXISTS idx_agent_daily_journals_user_date ON agent_daily_journals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_agent_daily_journals_date_range ON agent_daily_journals(date DESC);

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
EOF
```

---

## ✅ Verificar que Funcionó

Después de ejecutar el script, verifica:

```bash
psql $DATABASE_URL -c "\d agent_daily_journals"
```

Deberías ver la estructura de la tabla.

O verificar que existe:

```bash
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name = 'agent_daily_journals';"
```

---

## 📝 Notas Importantes

1. **Variable DATABASE_URL**: En Render, esta variable contiene la conexión completa a PostgreSQL
2. **Permisos**: Asegúrate de tener permisos para crear tablas
3. **Backup**: Aunque este script no modifica datos existentes, es buena práctica tener un backup antes

---

**Última actualización**: 2025-01-29
