## Filtros rápidos "Solo mis contactos" y "Solo mis oportunidades"

### Objetivo
Agregar switches rápidos para filtrar listados por elementos asignados al usuario autenticado.

### Contactos (CRM)
- Pantalla: `src/pages/CRMContactList.tsx`
- Switch: "Solo mis contactos"
- Comportamiento:
  - Activo: aplica `responsible_user_id` con `user.id`.
  - Inactivo: limpia el filtro `responsible_user_id`.
  - Deshabilitado si no se puede resolver el usuario actual.

### Oportunidades (CRM)
- Componentes:
  - `src/components/opportunities/OpportunityFilters.tsx`
  - `src/components/opportunities/OpportunityList.tsx`
- Switch: "Solo mis oportunidades"
- Comportamiento:
  - Activo: aplica `assigned_to` con `user.id`.
  - Inactivo: limpia el filtro `assigned_to`.
  - Deshabilitado si no se puede resolver el usuario actual.

### Notas técnicas
- El switch de oportunidades usa el filtro API `assigned_to` (server-side).
- El switch de contactos reutiliza el filtro existente `responsible_user_id`.
- La UI se integra en el bloque de filtros rápidos sin afectar los filtros avanzados.
