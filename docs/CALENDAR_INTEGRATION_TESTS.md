# Tests de integración: Calendario CRM

**Fecha**: 2026-01-18

## Objetivo
Cubrir navegación de fechas y enlaces del calendario (vista diaria/mes) para detectar casos donde no avanza a fecha futura o la URL queda desfasada.

## Cobertura agregada
Archivo: `src/pages/__tests__/CRMTaskCalendar.test.tsx`

- **Navegación siguiente/anterior** (vista diaria)
  - Usa `data-testid="calendar-next"` y `data-testid="calendar-prev"`.
  - Verifica que `date` en la URL cambia a **mañana** o **ayer**.

- **Click en día del mes**
  - Usa `data-testid="calendar-day-YYYY-MM-DD"`.
  - Verifica que se cambia a `view=day` y se conserva la fecha clicada.

## Cambios de soporte en UI
Archivo: `src/pages/CRMTaskCalendar.tsx`
- `data-testid` y `aria-label` en botones de navegación.
- `data-testid` en celdas de días en vista mensual y semanal.

## Resultado esperado
Si un cambio rompe la navegación (no avanza a fecha futura), los tests fallan y permiten depurar rápidamente el link/fecha exacta.
