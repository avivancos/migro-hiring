# Admin Contracts Stripe (API) — Summary + Billing Portal

## Objetivo
Exponer endpoints de **admin** para consultar el estado de Stripe asociado a un contrato por `hiring_code`, incluyendo **suscripción**, **cliente**, **facturas** y **transacciones**, y abrir el **Stripe Billing Portal** para actualizar datos de pago (cambio de tarjeta, descarga de facturas, administración de suscripción).

## Auth
- Header requerido: `X-Admin-Password`

> Nota: Estos endpoints son **admin**. El frontend no maneja tarjetas ni tokens: toda la gestión avanzada se hace en Stripe Billing Portal.

---

## 1) GET `/api/admin/contracts/{code}/stripe/summary`

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
- Si no existe `subscription_id` en DB, el backend puede intentar resolver por metadata `hiring_code` o por email del cliente (si está disponible).

---

## 2) POST `/api/admin/contracts/{code}/stripe/portal`

### Respuesta
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

### Notas
- El portal se abre con `window.location.href = url`.
- `return_url` lo construye el backend con `settings.FRONTEND_URL` y debe volver a `/admin/contracts/{code}`.

---

## Implementación en Frontend (Admin)

### Ruta
- `GET /admin/contracts/:code` (ver: `src/pages/admin/AdminContractDetail.tsx`)

### UI recomendada
Sección **“Suscripción & facturación (Stripe)”** con tabs:
- **Suscripción**: status, periodo, cancelación, customer y método de pago.
- **Transacciones**: lista de cobros (PaymentIntents/Charges) con links operativos al Dashboard de Stripe.
- **Facturas**: links a `hosted_invoice_url` y `invoice_pdf`.

### Estados esperables
- **200**: render normal.
- **404**: contrato no existe *o* Stripe no tiene datos → UI informativa.
- **500**: “Stripe no está configurado” → UI informativa.
- **502**: error consultando Stripe → UI de error recuperable con botón “Reintentar”.

