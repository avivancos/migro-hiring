## Filtro de rol en useCRMUsers (role_name opcional)

### Contexto
El tipo `CRMUser` define `role_name` como opcional. Un filtro estricto por rol puede excluir usuarios válidos sin `role_name`.

### Verificación
- Archivo: `src/hooks/useCRMUsers.ts`
- Comportamiento esperado: cuando se filtra por rol, se debe aceptar usuarios sin `role_name`.
- Estado actual: el filtro permite usuarios sin `role_name` usando la condición:
  - `!u.role_name || u.role_name === filters.role`

### Resultado
No se requieren cambios de código: el filtro ya mantiene el comportamiento permisivo y evita listas vacías por ausencia de `role_name`.

### Validación (2026-01-20)
- Se confirma que el filtro actual sigue siendo permisivo y no fuerza `role_name` obligatorio.
