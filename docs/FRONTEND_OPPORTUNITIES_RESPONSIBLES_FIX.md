# Fix: responsables en oportunidades (select y tabla)

## Problema
- En la vista de oportunidades, el select de "Asignado a" a veces no mostraba todos los responsables.
- En la tabla, el nombre del responsable no se renderizaba cuando el backend no expandia `assigned_to`.

## Causa
- El select dependia de `getUsers` y ocultaba el campo si la lista aun no estaba cargada.
- La tabla solo mostraba `assigned_to.name`, sin fallback por `assigned_to_id`.
- La lista de responsables no se alimentaba del endpoint optimizado.

## Solucion
- Usar `useCRMUsers` con `onlyResponsibles` para cargar responsables de forma consistente.
- Manejar respuestas sin `role_name` desde el endpoint optimizado, evitando filtrar todo por rol.
- Mantener siempre visible el select de responsables y mostrar estado "cargando".
- Resolver el nombre del responsable con fallback por `assigned_to_id` usando el mapa de responsables.
- Ajustar el sort por responsable para usar el mismo fallback.

## Archivos tocados
- `src/hooks/useCRMUsers.ts`
- `src/pages/CRMOpportunities.tsx`
- `src/components/opportunities/OpportunityList.tsx`
- `src/components/opportunities/OpportunityFilters.tsx`
- `src/components/opportunities/OpportunityTableRow.tsx`

## Pruebas sugeridas
- Abrir `/crm/opportunities` y verificar que el filtro "Asignado a" siempre aparece.
- Confirmar que el select lista a todos los responsables activos.
- Verificar que la tabla muestra nombre del responsable aunque `assigned_to` no venga expandido.
