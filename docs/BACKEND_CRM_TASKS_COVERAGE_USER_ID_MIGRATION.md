# Fix 500 en `/api/crm/tasks`: columna `coverage_user_id` faltante

**Fecha:** 2026-01-22  
**Contexto:** Error 500 en `GET /api/crm/tasks` por columna inexistente en `crm_tasks`.

---

## ✅ Síntoma

El backend falla al listar tareas:

- Error: `UndefinedColumnError: column crm_tasks.coverage_user_id does not exist`
- Endpoint afectado: `GET /api/crm/tasks`
- Causa directa: el ORM ya selecciona `coverage_user_id`, pero la base de datos no tiene esa columna.

---

## 🎯 Objetivo

Agregar la columna `coverage_user_id` a `crm_tasks` y dejar el schema en línea con el modelo.

---

## ✅ Cambio mínimo en base de datos

**SQL recomendado (PostgreSQL):**

```sql
ALTER TABLE crm_tasks
ADD COLUMN IF NOT EXISTS coverage_user_id UUID;

ALTER TABLE crm_tasks
ADD CONSTRAINT crm_tasks_coverage_user_id_fkey
FOREIGN KEY (coverage_user_id) REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_coverage_user_id
ON crm_tasks (coverage_user_id);
```

---

## ✅ Verificación rápida

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'crm_tasks'
  AND column_name = 'coverage_user_id';
```

Debe retornar una fila con tipo `uuid`.

---

## 🧩 Notas de consistencia

- Este cambio es coherente con el plan de cobertura documentado en
  `docs/BACKEND_COVERAGE_USER_NOTIFICATIONS.md`.
- Si existen migraciones, agregar la operación en la migración oficial.
- Si el backend usa alembic, generar una migración con `op.add_column`.

---

## ✅ Resultado esperado

- `GET /api/crm/tasks` vuelve a responder 200.
- Las tareas pueden incluir `coverage_user_id` sin error.
