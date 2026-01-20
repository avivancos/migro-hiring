## Seguridad: password admin para Stripe en contratos

### Contexto
Los endpoints Stripe en `contractsService` usaban un password admin hardcodeado en el cliente.
Esto expone la credencial en el bundle y en el historial de código.

### Cambios aplicados
- Se eliminó el literal hardcodeado.
- Se agregó un helper que obtiene el password desde:
  - `sessionStorage` (`admin_password`) o
  - `VITE_ADMIN_PASSWORD` como fallback.
- Si no hay password disponible, se lanza un error explícito.

### Archivos involucrados
- `src/services/contractsService.ts`

### Notas operativas
- Preferir cargar el password en `sessionStorage` en runtime.
- Para entornos locales, se puede usar `VITE_ADMIN_PASSWORD` si es estrictamente necesario.
