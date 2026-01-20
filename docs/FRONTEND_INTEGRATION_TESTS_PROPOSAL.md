## Propuesta de nuevos tests de integracion frontend

### Objetivo
Evaluar y proponer tests de integracion adicionales en frontend usando Vitest + React Testing Library,
sin llamadas reales a APIs externas.

### Estado actual
- Runner: `vitest` con `jsdom`.
- Setup global: `src/test/setup.ts`.
- Tests existentes: formularios CRM, calendario, login admin, hooks y servicios.

### Propuestas prioritarias (alto impacto)
1) **AdminContractDetail - seccion Stripe**
   - Render con contrato `subscription`.
   - Mock de `contractsService.getStripeBillingSummary`.
   - Validar: status, facturas, transacciones y links.
   - Validar: boton "Actualizar datos de pago" abre portal.

2) **CRMContactList - switch "Solo mis contactos"**
   - Mock de `useAuth` con `user.id`.
   - Activar switch -> aplica `responsible_user_id`.
   - Desactivar switch -> limpia el filtro.
   - Validar que el filtro final usa `currentUserId`.

3) **CRMContactDetail - timeline unificado**
   - Datos mixtos (call, task_due, call_scheduled, contact_created).
   - Validar orden descendente y badge "Proximo".

4) **OpportunityFilters - switch "Solo mis oportunidades"**
   - Con `currentUserId`, activar switch y validar `assigned_to`.
   - Desactivar y limpiar.

### Propuestas secundarias
5) **AdminContracts - filtros + paginacion**
   - Mock de `contractsService.getContracts`.
   - Validar filtros por estado y tipo de pago.

6) **HiringFlow - checkout subscription**
   - Mock de `useHiringData` y `usePayment`.
   - Validar que el flujo llega a success con `payment=success`.

7) **ContractSuccess**
   - Mostrar hiring code y boton copiar.

### Estrategia de mocks
- Servicios API mockeados con `vi.mock`.
- Hooks de auth mockeados cuando se necesita `user.id`.
- No usar Stripe real ni endpoints remotos.

### Comandos sugeridos
- Referencia base: `TESTING_README.md`.
- Modo run: `npm run test:run`.
- Con cobertura: `npm run test:coverage`.

### Notas
- Los tests propuestos son compatibles con el setup actual (jsdom + RTL).
- Se recomienda priorizar la seccion Stripe y los switches de filtros por impacto operativo.
