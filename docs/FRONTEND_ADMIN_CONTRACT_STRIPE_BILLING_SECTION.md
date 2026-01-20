## Seccion Stripe en detalle de contrato (admin)

### Objetivo
Agregar una seccion en `AdminContractDetail` para consultar la suscripcion activa por hiring code,
actualizar datos de pago y descargar facturas, con listado de transacciones desde Stripe.

### Ubicacion UI
- Pantalla: `src/pages/admin/AdminContractDetail.tsx`
- Columna izquierda, debajo de "Informacion de Pago".
- Visible cuando `payment_type === 'subscription'` o existe `subscription_id`.

### Comportamiento
- Carga resumen Stripe por hiring code.
- Boton "Actualizar datos de pago" abre el Billing Portal (Stripe).
- Boton "Recargar" fuerza reconsulta.
- Muestra:
  - Suscripcion (id, estado, periodo, cancelacion).
  - Cliente Stripe y metodo de pago por defecto.
  - Facturas con links a `hosted_invoice_url` y `invoice_pdf`.
  - Transacciones con links a Stripe Dashboard (payment/invoice).

### Endpoints requeridos (backend)
1) `GET /admin/contracts/{code}/stripe/summary`
   - Headers: `X-Admin-Password`
   - Response esperado (resumen):
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

2) `POST /admin/contracts/{code}/stripe/portal`
   - Headers: `X-Admin-Password`
   - Response:
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

### Notas tecnicas
- Montos esperados en centavos.
- Fechas pueden ser timestamps (segundos) o ISO; el frontend normaliza.
- La seccion usa links directos al Dashboard para soporte operativo rapido.
