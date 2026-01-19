# Fix: ordenacion en encabezados de tabla de oportunidades

## Problema
- Los nombres de las columnas en la tabla de oportunidades no disparaban la ordenacion.

## Causa
- Los encabezados eran texto dentro de `th` con `onClick`, pero no estaban expuestos como controles interactivos.

## Solucion
- Convertir encabezados ordenables en botones con `onClick` y `onKeyDown`.
- Agregar `aria-sort` para accesibilidad y feedback de estado.

## Archivo tocado
- `src/components/opportunities/OpportunityList.tsx`

## Pruebas sugeridas
- En `/crm/opportunities`, hacer clic en “Contacto”, “Score”, “Prioridad”, “Estado”, “Responsable”.
- Verificar que el orden alterna asc/desc y el icono cambia.
