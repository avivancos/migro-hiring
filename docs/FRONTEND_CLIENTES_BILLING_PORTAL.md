# Portal de Facturación para Clientes — Frontend

## Objetivo
Permitir a los clientes autenticados ver y gestionar su información de facturación mediante Stripe Billing Portal, sin requerir acceso administrativo.

## Implementación

### Página principal
- **Ruta**: `/clientes/billing`
- **Archivo**: `src/pages/ClientesBilling.tsx`
- **Autenticación**: Requiere sesión de cliente (redirige a login si no está autenticado)

### Componente de billing
- **Archivo**: `src/components/stripe/ClientesBillingSection.tsx`
- **Reutiliza**: Lógica de `StripeBillingSection` pero usando endpoints públicos

### Servicios
- **Archivo**: `src/services/contractsService.ts`
- **Métodos agregados**:
  - `getClientStripeBillingSummary(code: string)`: Obtiene resumen de billing (endpoint público)
  - `createClientStripeBillingPortalSession(code: string)`: Crea sesión del Billing Portal (endpoint público)

## Flujo de usuario

1. **Cliente autenticado** accede a `/clientes/billing`
2. Ingresa su **código de contratación** (hiring code)
3. Ve información de:
   - Suscripción (estado, periodo, cancelación)
   - Método de pago por defecto
   - Transacciones
   - Facturas (con links para descargar)
4. Puede hacer clic en **"Gestionar pago"** para abrir Stripe Billing Portal y:
   - Cambiar método de pago
   - Actualizar información de facturación
   - Descargar facturas
   - Gestionar suscripción

## Acceso desde portal cliente

En `/clientes`, cuando el usuario está autenticado, se muestra un botón **"Ver facturación y pagos"** que navega a `/clientes/billing`.

## Endpoints requeridos (backend)

Ver documentación completa en: `docs/api/clientes_billing_stripe.md`

### Resumen
- `GET /api/clientes/contracts/{code}/stripe/summary` (requiere token JWT de cliente)
- `POST /api/clientes/contracts/{code}/stripe/portal` (requiere token JWT de cliente)

### Seguridad
- El backend **debe** verificar que el `hiring_code` pertenece al cliente autenticado (por email o relación en BD)
- No requiere `X-Admin-Password` (a diferencia de endpoints admin)

## Diferencias con Admin Billing

| Característica | Admin | Clientes |
|---------------|-------|----------|
| Ruta | `/admin/contracts/:code` | `/clientes/billing` |
| Autenticación | `X-Admin-Password` | Token JWT de cliente |
| Endpoints | `/admin/contracts/{code}/stripe/*` | `/clientes/contracts/{code}/stripe/*` |
| Verificación | Admin puede ver cualquier contrato | Cliente solo puede ver sus propios contratos |
| Links a Stripe Dashboard | Sí (admin) | No (cliente no tiene acceso) |

## Estados de error

- **401**: Redirige a login con `returnUrl=/clientes/billing`
- **403**: Muestra error "Este código no pertenece a tu cuenta"
- **404**: Muestra mensaje informativo "Contrato no encontrado o sin datos de Stripe"
- **500**: Muestra "Stripe no está configurado"
- **502**: Muestra error recuperable con botón "Reintentar"

## Test manual rápido

1. Iniciar sesión en `/clientes` con OTP
2. Hacer clic en "Ver facturación y pagos"
3. Ingresar un `hiring_code` válido asociado al email del cliente
4. Verificar que se carga la información de billing
5. Hacer clic en "Gestionar pago" y verificar que se abre Stripe Billing Portal
