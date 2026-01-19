# Debug: responsables en select de oportunidades

## Objetivo
Detectar por que el select de responsables muestra opciones en blanco.

## Instrumentacion agregada
- Logs en `useCRMUsers` con muestra de usuarios devueltos (`console.info`).
- Logs en `CRMOpportunities` con muestra de responsables normalizados para el select (`console.info`).
- Logs en `OpportunityFilters` al renderizar el select cuando termina la carga (`console.info`).

## Archivos tocados
- `src/hooks/useCRMUsers.ts`
- `src/pages/CRMOpportunities.tsx`
- `src/components/opportunities/OpportunityFilters.tsx`

## Como validar
- Abrir `/crm/opportunities`.
- En consola, revisar logs `🐛 [useCRMUsers]`, `🐛 [CRMOpportunities]`, `🐛 [OpportunityFilters]`.
- Verificar si `name`/`email` vienen vacios o si el `id` no llega.

## Proximos pasos
- Si los datos vienen vacios desde backend, ajustar endpoint `/crm/users/responsibles`.
- Si los datos llegan bien pero se pierde el nombre, revisar mapeo del select.
