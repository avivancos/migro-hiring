# Fix: tareas visibles en fechas pasadas

**Fecha**: 2026-01-18

## Problema
`getTasksForDate` filtraba por la fecha solicitada y luego descartaba cualquier tarea si esa fecha era anterior a hoy. Esto impedía ver tareas históricas en vistas de fechas pasadas.

## Solución
Se eliminó el filtro que bloqueaba fechas pasadas, manteniendo solo:
- tareas con `complete_till`
- tareas no completadas
- tareas cuya fecha coincide con el día solicitado

## Archivo tocado
- `src/pages/CRMTaskCalendar.tsx`

## Resultado esperado
Al navegar a fechas pasadas, las tareas correspondientes se muestran correctamente.
