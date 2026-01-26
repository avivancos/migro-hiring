# Clientes Billing Stripe (API) — Endpoints Públicos

## Objetivo
Exponer endpoints **públicos** (con autenticación de cliente) para que los clientes puedan consultar su información de facturación de Stripe asociada a su contrato por `hiring_code`, incluyendo **suscripción**, **cliente**, **facturas** y **transacciones**, y abrir el **Stripe Billing Portal** para actualizar datos de pago.

## Auth
- Requiere autenticación de cliente (token JWT en header `Authorization: Bearer <token>`)
- **NO** requiere `X-Admin-Password` (a diferencia de los endpoints admin)

> Nota: Estos endpoints son para **clientes autenticados**. El frontend no maneja tarjetas ni tokens: toda la gestión avanzada se hace en Stripe Billing Portal.

---

## 1) GET `/api/clientes/contracts/{code}/stripe/summary`

### Autenticación
- Header: `Authorization: Bearer <access_token>`
- El cliente debe estar autenticado
- El backend debe verificar que el `hiring_code` pertenece al cliente autenticado (por email o relación en BD)

### Respuesta (shape)
```json
{
  "subscription": {
    "id": "sub_123",
    "status": "active",
    "current_period_start": 1705600000,
    "current_period_end": 1708200000,
    "cancel_at_period_end": false
  },
  "customer": {
    "id": "cus_123",
    "email": "cliente@correo.com",
    "name": "Nombre Cliente"
  },
  "default_payment_method": {
    "id": "pm_123",
    "brand": "visa",
    "last4": "4242",
    "exp_month": 12,
    "exp_year": 2026
  },
  "invoices": [
    {
      "id": "in_123",
      "number": "0001",
      "status": "paid",
      "amount_paid": 4800,
      "amount_due": 0,
      "currency": "eur",
      "created": 1705600000,
      "hosted_invoice_url": "https://...",
      "invoice_pdf": "https://...",
      "payment_intent_id": "pi_123"
    }
  ],
  "transactions": [
    {
      "id": "pi_123",
      "status": "succeeded",
      "amount": 4800,
      "currency": "eur",
      "created": 1705600000,
      "description": "Pago mensual",
      "payment_method": "card",
      "invoice_id": "in_123",
      "charge_id": "ch_123"
    }
  ]
}
```

### Notas
- **Montos en centavos**.
- **Fechas en timestamp** (segundos). (El frontend puede tolerar ISO como fallback).
- El backend debe verificar que el `hiring_code` pertenece al cliente autenticado antes de retornar datos.
- Si no existe `subscription_id` en DB, el backend puede intentar resolver por metadata `hiring_code` o por email del cliente.

### Errores
- **401**: No autenticado o token inválido
- **403**: El `hiring_code` no pertenece al cliente autenticado
- **404**: Contrato no encontrado o sin datos de Stripe
- **500**: Stripe no configurado
- **502**: Error consultando Stripe

---

## 2) POST `/api/clientes/contracts/{code}/stripe/portal`

### Autenticación
- Header: `Authorization: Bearer <access_token>`
- El cliente debe estar autenticado
- El backend debe verificar que el `hiring_code` pertenece al cliente autenticado

### Respuesta
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

### Notas
- El portal se abre con `window.location.href = url`.
- `return_url` lo construye el backend con `settings.FRONTEND_URL` y debe volver a `/clientes/billing`.
- El backend debe crear la sesión del Billing Portal con permisos apropiados para clientes (no admin).

### Errores
- **401**: No autenticado o token inválido
- **403**: El `hiring_code` no pertenece al cliente autenticado
- **404**: Contrato no encontrado o sin datos de Stripe
- **500**: Stripe no configurado o error creando sesión

---

## Implementación en Frontend (Clientes)

### Ruta
- `GET /clientes/billing` (ver: `src/pages/ClientesBilling.tsx`)

### UI
Página de facturación con:
- Formulario para ingresar `hiring_code`
- Sección **"Suscripción & facturación"** con tabs:
  - **Suscripción**: status, periodo, cancelación, customer y método de pago.
  - **Transacciones**: lista de cobros (PaymentIntents/Charges).
  - **Facturas**: links a `hosted_invoice_url` y `invoice_pdf`.
- Botón **"Gestionar pago"** que abre Stripe Billing Portal.

### Estados esperables
- **200**: render normal.
- **401**: redirigir a login con `returnUrl=/clientes/billing`.
- **403**: mostrar error "Este código no pertenece a tu cuenta".
- **404**: contrato no existe *o* Stripe no tiene datos → UI informativa.
- **500**: "Stripe no está configurado" → UI informativa.
- **502**: error consultando Stripe → UI de error recuperable con botón "Reintentar".

---

## Seguridad

### Verificación de propiedad
El backend **debe** verificar que el `hiring_code` pertenece al cliente autenticado antes de retornar cualquier información. Esto puede hacerse:

1. **Por email**: Verificar que `contract.client_email` coincide con `current_user.email`.
2. **Por relación en BD**: Si existe una tabla de usuarios/contratos, verificar la relación.
3. **Por token claims**: Si el token JWT incluye `hiring_code` o `contract_id`, verificar coincidencia.

### Recomendación
Implementar verificación por email como método principal, con fallback a relación en BD si existe.
