# 🔧 Fix: Tabla agent_daily_journals No Existe

**Fecha**: 2025-01-29  
**Problema**: Error 500 en endpoints de Agent Daily Journal  
**Causa**: La tabla `agent_daily_journals` no existe en la base de datos  
**Solución**: Ejecutar script SQL para crear la tabla

---

## 🚨 Error Identificado

Los siguientes endpoints están fallando:

```
GET /api/agent-journal/daily-report?target_date=2025-12-30
GET /api/agent-journal/performance-dashboard?period=today
```

**Error en logs:**
```
relation "agent_daily_journals" does not exist
[SQL: SELECT agent_daily_journals.user_id, agent_daily_journals.date, ... 
FROM agent_daily_journals 
WHERE agent_daily_journals.user_id = $1::UUID AND agent_daily_journals.date = $2::DATE]
```

---

## ✅ Solución

### Paso 1: Localizar el Script SQL

El script de creación se encuentra en:
```
backend_implementation/create_agent_daily_journals.sql
```

### Paso 2: Ejecutar el Script

La forma de ejecutarlo depende de dónde esté la base de datos:

#### Opción A: Base de datos en servidor remoto (Render, AWS, etc.)

Si usas una base de datos gestionada externamente:

```bash
# Conectar usando psql desde tu máquina local
psql -h <HOST> -U <USER> -d <DATABASE> -f backend_implementation/create_agent_daily_journals.sql

# Ejemplo con Render PostgreSQL:
psql "postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com/migro_db" -f backend_implementation/create_agent_daily_journals.sql
```

#### Opción B: Base de datos en Docker local

Si tienes PostgreSQL en Docker localmente:

```bash
# 1. Copiar el script al contenedor
docker cp backend_implementation/create_agent_daily_journals.sql <container_name>:/tmp/

# 2. Ejecutar el script dentro del contenedor
docker exec -i <container_name> psql -U postgres -d migro_db -f /tmp/create_agent_daily_journals.sql

# O directamente:
cat backend_implementation/create_agent_daily_journals.sql | docker exec -i <container_name> psql -U postgres -d migro_db
```

#### Opción C: Desde el servidor backend

Si tienes acceso SSH al servidor backend:

```bash
# 1. Conectarse al servidor
ssh usuario@servidor-backend

# 2. Conectar a PostgreSQL
psql -h localhost -U postgres -d migro_db

# 3. Ejecutar el script
\i /ruta/al/script/create_agent_daily_journals.sql
```

#### Opción D: Usando herramienta gráfica (pgAdmin, DBeaver, etc.)

1. Abrir la herramienta y conectar a la base de datos
2. Abrir el archivo `backend_implementation/create_agent_daily_journals.sql`
3. Ejecutar el script completo

### Paso 3: Verificar la Creación

Después de ejecutar el script, verificar que la tabla se creó:

```sql
-- Verificar que la tabla existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'agent_daily_journals';

-- Ver estructura de la tabla
\d agent_daily_journals

-- Verificar índices creados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'agent_daily_journals';

-- Verificar constraint de unicidad
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'agent_daily_journals'::regclass;
```

Deberías ver:
- ✅ Tabla `agent_daily_journals` existe
- ✅ Columnas: id, user_id, date, total_call_time_seconds, total_calls, etc.
- ✅ Índices: idx_agent_daily_journals_user_id, idx_agent_daily_journals_date, etc.
- ✅ Constraint: agent_daily_journals_user_date_unique

### Paso 4: Probar los Endpoints

Después de crear la tabla, los endpoints deberían funcionar:

```bash
# Probar reporte diario
curl -X GET "https://api.migro.es/api/agent-journal/daily-report?target_date=2025-12-30" \
  -H "Authorization: Bearer <token>"

# Probar dashboard de desempeño
curl -X GET "https://api.migro.es/api/agent-journal/performance-dashboard?period=today" \
  -H "Authorization: Bearer <token>"
```

---

## 📋 Estructura de la Tabla

La tabla `agent_daily_journals` incluye:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | ID único del reporte |
| `user_id` | UUID | ID del usuario (agente) |
| `date` | DATE | Fecha del reporte |
| `total_call_time_seconds` | INTEGER | Tiempo total de llamadas |
| `total_calls` | INTEGER | Número total de llamadas |
| `effective_calls` | INTEGER | Llamadas efectivas |
| `avg_call_duration_seconds` | DOUBLE PRECISION | Duración promedio |
| `tasks_completed` | INTEGER | Tareas completadas |
| `tasks_pending` | INTEGER | Tareas pendientes |
| `notes_created` | INTEGER | Notas creadas |
| `opportunities_worked` | INTEGER | Oportunidades trabajadas |
| `call_attempts_count` | INTEGER | Intentos de llamada |
| `extra_data` | JSONB | Datos adicionales (firma, metadata) |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de actualización |

**Constraint de Unicidad:**
- Un usuario solo puede tener un journal por fecha: `UNIQUE (user_id, date)`

**Índices:**
- `idx_agent_daily_journals_user_id` - Búsquedas por usuario
- `idx_agent_daily_journals_date` - Búsquedas por fecha
- `idx_agent_daily_journals_user_date` - Búsqueda compuesta (más frecuente)
- `idx_agent_daily_journals_date_range` - Consultas por rango de fechas

---

## 📚 Documentación Relacionada

- [Script SQL Completo](./BACKEND_AGENT_DAILY_JOURNALS_TABLE_CREATION.md) - Documentación detallada
- [Frontend Implementation](./FRONTEND_AGENT_JOURNAL_IMPLEMENTATION.md) - Implementación frontend
- [Backend Sign and Email](./BACKEND_AGENT_JOURNAL_SIGN_AND_EMAIL.md) - Endpoint de firma y email

---

## ⚠️ Notas Importantes

1. **Nombre de Columna**: En la BD es `date`, en TypeScript es `journal_date`. El backend debe hacer el mapeo.

2. **Foreign Key**: La tabla referencia `users(id)`. Asegúrate de que la tabla `users` existe antes de ejecutar el script.

3. **JSONB**: `extra_data` usa JSONB para almacenar datos flexibles como firma digital, metadata, etc.

4. **Trigger**: Se crea un trigger para actualizar automáticamente `updated_at` cuando se modifica un registro.

---

**Última actualización**: 2025-01-29  
**Versión**: 1.0
