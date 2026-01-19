# Fix: navegación diaria no actualiza fecha

**Fecha**: 2026-01-18

## Problema
En la vista diaria, al usar las flechas, la fecha podía quedar en el mismo día (ej.: viernes) aunque se intentara ir a ayer. Esto ocurría porque `view` y `currentDateStr` estaban memoizados usando el objeto `searchParams`, que puede no cambiar de referencia aunque el contenido sí cambie, provocando valores stale.

## Solución
Se dejó de memoizar `view` y `currentDateStr` y se leen directamente desde `searchParams` en cada render. Esto asegura que el cambio de URL siempre actualice la fecha actual usada por el calendario.

## Cambios aplicados
- `src/pages/CRMTaskCalendar.tsx`
  - `view` y `currentDateStr` ahora se calculan sin `useMemo`
  - Mantiene validación de formato `YYYY-MM-DD`

## Resultado esperado
- Al pulsar flechas en vista diaria, la fecha cambia correctamente (ayer/hoy/mañana).
- El título de la vista diaria se actualiza al cambiar la fecha.

