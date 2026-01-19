# Fix: Calendario usa fecha local

**Fecha**: 2026-01-18

## Contexto
Al hacer clic en días del calendario, se estaba usando `toISOString()` para generar `YYYY-MM-DD`. Eso convierte a UTC y puede cambiar el día según la zona horaria del usuario, provocando desfases (ej.: hoy 18, clic en ayer terminaba en 17/16 dependiendo del offset).

## Cambio aplicado
Se normalizó el manejo de fechas en `CRMTaskCalendar` para usar **fecha local** en:
- parámetro `date` de la URL
- navegación anterior/siguiente
- `goToToday`
- cambios de vista
- comparaciones por día en tareas, llamadas y notas
- clicks en día desde vistas mensual y semanal

Se agregó un helper:
```typescript
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
```

## Archivos tocados
- `src/pages/CRMTaskCalendar.tsx`

## Resultado esperado
- Navegar por días ya no cambia la fecha por conversión UTC.
- El día seleccionado coincide con el día local del usuario.
- Las comparaciones por día (tareas/llamadas/notas) son consistentes.

## Notas
Los rangos para el backend siguen enviándose en ISO (`start_date` / `end_date`) porque se calculan con `Date` local y luego se transforman con `toISOString()` para el API.
