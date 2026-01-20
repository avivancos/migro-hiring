## Corrección de bugs críticos en AdminContractDetail y contractsService

### Fecha
2026-01-20

### Bugs corregidos

#### Bug 1: Optional chaining en useEffect de Stripe
**Archivo**: `src/pages/admin/AdminContractDetail.tsx`
**Líneas**: 99-105

**Problema**: El `useEffect` accedía a `contract.payment_type` y `contract.subscription_id` sin optional chaining completo, aunque había un return temprano que verificaba `contract?.hiring_code`.

**Solución**: Se agregó optional chaining (`contract?.payment_type` y `contract?.subscription_id`) para mayor seguridad y consistencia con el resto del código.

**Cambio**:
```typescript
// Antes
const shouldLoadStripe = contract.payment_type === 'subscription' || !!contract.subscription_id;

// Después
const shouldLoadStripe = contract?.payment_type === 'subscription' || !!contract?.subscription_id;
```

#### Bug 2: Verificación null para propiedades de contract
**Archivo**: `src/pages/admin/AdminContractDetail.tsx`
**Líneas**: 439-446

**Problema**: El código accedía a `contract.expires_at`, `contract.payment_type`, y `contract.subscription_id` sin verificar primero si `contract` es null, lo que podría causar errores en tiempo de ejecución si el contrato falla al cargar.

**Solución**: Se agregaron verificaciones null explícitas antes de acceder a las propiedades.

**Cambios**:
```typescript
// Antes
const isExpired = !!contract?.expires_at && new Date(contract.expires_at) < new Date();
const showStripeSection = contract?.payment_type === 'subscription' || !!contract?.subscription_id;

// Después
const isExpired = contract ? !!contract.expires_at && new Date(contract.expires_at) < new Date() : false;
const showStripeSection = contract ? (contract.payment_type === 'subscription' || !!contract.subscription_id) : false;
```

#### Bug 3: Password hardcodeado en contractsService
**Archivo**: `src/services/contractsService.ts`
**Líneas**: 110, 174, 307, 367, 377, 394, 406

**Problema**: La contraseña de administrador `'Pomelo2005.1'` estaba hardcodeada directamente en 7 lugares del código del cliente, exponiendo la credencial en:
- El bundle compilado de JavaScript
- El historial de control de versiones
- Las peticiones de red (visible en DevTools)

**Solución**: Se reemplazaron todas las instancias de password hardcodeado con la función `getAdminPasswordHeader()`, que:
- Lee la contraseña desde `VITE_ADMIN_PASSWORD` (variable de entorno)
- O desde `sessionStorage.getItem('admin_password')` como fallback
- Lanza un error si no está configurada

**Cambios**:
```typescript
// Antes (7 instancias)
headers: {
  'X-Admin-Password': 'Pomelo2005.1',
}

// Después
headers: {
  ...getAdminPasswordHeader(),
}
```

**Métodos afectados**:
1. `getContracts()` - línea 110
2. `getContract()` - línea 174
3. `createContract()` - línea 307
4. `updateContract()` - línea 367 (PATCH)
5. `updateContract()` - línea 377 (PUT fallback)
6. `deleteContract()` - línea 394
7. `expireContract()` - línea 406

### Notas de seguridad

- La función `getAdminPasswordHeader()` ya existía en el código pero no se estaba usando en todos los lugares.
- Los métodos `getStripeBillingSummary()` y `createStripeBillingPortalSession()` ya usaban `getAdminPasswordHeader()` correctamente.
- Se recomienda configurar `VITE_ADMIN_PASSWORD` en el archivo `.env` y nunca commitear contraseñas en el código fuente.

### Validación

- ✅ No hay errores de linter
- ✅ Todas las instancias de password hardcodeado fueron reemplazadas
- ✅ Las verificaciones null están en su lugar
- ✅ El código mantiene la misma funcionalidad
