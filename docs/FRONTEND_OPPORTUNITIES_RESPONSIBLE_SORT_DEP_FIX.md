# Fix: ordenacion por responsable y filtro por rol

## Problema
- El ordenamiento por responsable podia quedar stale cuando cambiaba la lista de responsables.
- El filtro por rol incluia usuarios sin `role_name`.

## Solucion
- Agregar `resolveResponsibleName` a dependencias del `useMemo` de ordenamiento.
- Ajustar el filtro por rol para exigir `u.role_name === filters.role`.

## Verificacion
- El `useMemo` de oportunidades incluye `resolveResponsibleName` en dependencias.
- El filtro por rol excluye usuarios sin `role_name` cuando se pide un rol.

## Archivos tocados
- `src/components/opportunities/OpportunityList.tsx`
- `src/hooks/useCRMUsers.ts`
