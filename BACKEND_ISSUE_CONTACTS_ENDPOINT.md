# 🐛 Problema en Backend: Endpoint `/crm/contacts` - Columnas Inexistentes

## Error Actual

El endpoint `GET /crm/contacts` está devolviendo **500 Internal Server Error** porque intenta consultar columnas que **no existen** en la tabla `crm_contacts`.

### Error SQL Detallado:

```
column crm_contacts.status does not exist
HINT: Perhaps you meant to reference the column "crm_contacts.state".

column crm_contacts.service_type does not exist
```

### SQL Problemático:

El backend está intentando ejecutar esta consulta:

```sql
SELECT 
  crm_contacts.name, 
  crm_contacts.first_name, 
  crm_contacts.last_name, 
  ...
  crm_contacts.status,        -- ❌ NO EXISTE (debería ser 'state')
  ...
  crm_contacts.service_type,  -- ❌ NO EXISTE
  ...
FROM crm_contacts 
WHERE crm_contacts.is_deleted = false 
ORDER BY crm_contacts.created_at DESC
```

## Solución Requerida

### Opción 1: Corregir las Referencias de Columnas

Si las columnas existen con otros nombres:
- `status` → `state` (según el hint de PostgreSQL)
- `service_type` → Verificar el nombre correcto en la base de datos

### Opción 2: Agregar las Columnas Faltantes

Si estas columnas deberían existir pero no están en la migración:
- Agregar columna `status` a `crm_contacts` (o usar `state` si es lo mismo)
- Agregar columna `service_type` a `crm_contacts`

### Opción 3: Remover las Columnas del SELECT

Si estas columnas no son necesarias en el endpoint de contactos:
- Remover `status` y `service_type` del SELECT
- O hacerlas opcionales/nullable en el modelo

## Contexto

Según la documentación de unificación de leads con contactos:
- Los leads ahora son contactos con campos adicionales
- El frontend está usando `/crm/contacts` en lugar de `/crm/leads`
- El endpoint debe funcionar correctamente para que el dashboard cargue

## Endpoints Afectados

- ✅ `GET /crm/contacts/count` → Funciona correctamente (200)
- ❌ `GET /crm/contacts` → Error 500 (columnas inexistentes)
- ❌ `GET /crm/leads/count` → Error 500 (mismo problema con `service_type` y `status`)
- ❌ `GET /crm/leads` → Error 500 (mismo problema)

## Prioridad

**ALTA** - El dashboard del CRM no puede cargar contactos debido a este error.
