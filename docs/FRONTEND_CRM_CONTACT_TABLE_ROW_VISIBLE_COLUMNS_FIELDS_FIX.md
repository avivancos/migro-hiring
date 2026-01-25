## Contexto
`ContactTableRow` usa `React.memo()` con una función de comparación custom para evitar re-renders en tablas grandes.

El render de algunas columnas usa **keys de columna** que no coinciden con el **nombre real del campo** en el objeto `contact`.

Ejemplo:
- Columna: `ultima_llamada`
- Campo real: `contact.ultima_llamada_fecha`

## Problema
La función de comparación filtraba `visibleColumns` contra una lista de `relevantFields`, pero comparaba **nombres distintos**:
- `visibleColumns` contenía `ultima_llamada` y `proxima_llamada`
- `relevantFields` contenía `ultima_llamada_fecha` y `proxima_llamada_fecha`

Resultado: esas columnas **nunca entraban** en el set de campos comparados, por lo que:
- cambios en `ultima_llamada_fecha` / `proxima_llamada_fecha`
- **no disparaban re-render** cuando las columnas estaban visibles
- y la tabla podía mostrar datos **stale** (fechas de llamadas antiguas).

## Fix aplicado
- Archivo: `src/components/CRM/ContactTableRow.tsx`
- Cambio: la comparación de `memo()` ahora mapea **columna → campos del contacto** y compara esos campos.

Mapping relevante:
- `ultima_llamada` → `ultima_llamada_fecha`
- `proxima_llamada` → `proxima_llamada_fecha`
- `name` → `name`, `first_name`, `last_name` (para cubrir el fallback visual)

## Test de regresión
- Archivo: `src/components/CRM/__tests__/ContactTableRow.memoVisibleColumnsFields.test.tsx`
- Cubre:
  - cambio en `ultima_llamada_fecha` con columna `ultima_llamada` visible
  - cambio en `proxima_llamada_fecha` con columna `proxima_llamada` visible

