# Fix: filtro por rol incluye usuarios sin `role_name`

## Problema
- Al filtrar por rol se exigia `u.role_name === filters.role`.
- Como `role_name` es opcional en `CRMUser`, los usuarios sin rol quedaban fuera aunque fueran validos.
- Esto podia producir listas vacias cuando el backend no envia `role_name`.

## Solucion
- Permitir usuarios sin `role_name` cuando se filtra por rol: `!u.role_name || u.role_name === filters.role`.
- Aplicado tanto en el endpoint de responsables como en el endpoint general.

## Archivos tocados
- `src/hooks/useCRMUsers.ts`

