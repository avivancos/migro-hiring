# 💳 Backend: Implementación de Suscripciones Stripe para Pagos Aplazados

**Fecha**: 2025-01-21  
**Endpoint**: `POST /hiring/{code}/checkout`  
**Problema**: Cuando `payment_type = 'subscription'`, debe crear una Stripe Subscription con 10 pagos mensuales, no un Checkout Session de pago único

---

## 📋 Resumen

Cuando un hiring code tiene `payment_type = 'subscription'`, el backend debe crear una **Stripe Subscription** en lugar de un **Checkout Session** normal. La suscripción debe configurarse para:
- 10 pagos mensuales automáticos
- Primer pago inmediato
- 9 pagos adicionales cada mes

---

## 🎯 Estructura de Pagos Aplazados

### Grado A o B
- **Total**: 480 € (48000 centavos)
- **Pago mensual**: 48 € (4800 centavos)
- **Número de pagos**: 10

### Grado C
- **Total**: 680 € (68000 centavos)
- **Pago mensual**: 68 € (6800 centavos)
- **Número de pagos**: 10

---

## 🔧 Implementación Backend

### Detección del Tipo de Pago

```python
# Obtener el hiring code
hiring = get_hiring_by_code(hiring_code)

# Determinar tipo de pago
payment_type = hiring.payment_type or 'one_time'
is_subscription = payment_type == 'subscription'
```

### Cálculo del Pago Mensual

```python
def calculate_monthly_payment(grade: str, payment_type: str) -> int:
    """
    Calcula el pago mensual para suscripciones.
    
    Returns:
        Monto mensual en centavos
    """
    if payment_type != 'subscription':
        return None
    
    if grade == 'C':
        return 6800  # 68 EUR
    else:  # A, B, T
        return 4800  # 48 EUR para A y B, ajustar para T si es necesario
```

### Creación de Stripe Subscription (NUEVO)

Cuando `payment_type = 'subscription'`, usar este código:

```python
import stripe

def create_stripe_subscription(hiring_code: str, hiring: Hiring):
    """
    Crea una Stripe Subscription para pagos aplazados (10 pagos mensuales).
    """
    # Calcular pago mensual según el grade
    monthly_amount = calculate_monthly_payment(hiring.grade, 'subscription')
    total_amount = monthly_amount * 10
    
    # Crear o obtener customer en Stripe
    customer = stripe.Customer.create(
        email=hiring.client_email,
        name=hiring.client_name,
        metadata={
            'hiring_code': hiring_code,
            'client_email': hiring.client_email,
        }
    )
    
    # Crear Checkout Session para suscripción
    checkout_session = stripe.checkout.Session.create(
        customer=customer.id,
        payment_method_types=['card'],
        mode='subscription',  # ⭐ IMPORTANTE: mode='subscription' no 'payment'
        line_items=[{
            'price_data': {
                'currency': 'eur',
                'product_data': {
                    'name': hiring.service_name or 'Servicio de Migro',
                    'description': hiring.service_description or 'Tramitación de expediente',
                },
                'unit_amount': monthly_amount,  # Monto mensual en centavos
                'recurring': {
                    'interval': 'month',
                    'interval_count': 1,
                },
            },
            'quantity': 1,
        }],
        subscription_data={
            'metadata': {
                'hiring_code': hiring_code,
                'client_email': hiring.client_email,
                'grade': hiring.grade,
                'total_amount': str(total_amount),
                'monthly_amount': str(monthly_amount),
                'number_of_payments': '10',
            },
            # Configurar para que se cobre exactamente 10 veces
            # Nota: Stripe no tiene una opción nativa para "10 pagos", 
            # pero podemos usar billing_cycle_anchor y cancel_at_period_end
            # O mejor: crear la suscripción y cancelarla después del período 10
        },
        success_url=f'https://contratacion.migro.es/contratacion/{hiring_code}?step=5&payment=success&session_id={{CHECKOUT_SESSION_ID}}',
        cancel_url=f'https://contratacion.migro.es/contratacion/{hiring_code}?step=4&payment=cancelled',
        metadata={
            'hiring_code': hiring_code,
            'payment_type': 'subscription',
            'total_amount': str(total_amount),
            'monthly_amount': str(monthly_amount),
            'installments': '10',
        },
    )
    
    # Guardar información de la suscripción
    hiring.subscription_id = checkout_session.subscription  # Se obtiene después del pago
    hiring.save()
    
    return {
        'checkout_url': checkout_session.url,
        'session_id': checkout_session.id,
        'amount': monthly_amount,  # Pago mensual
        'total_amount': total_amount,  # Total de los 10 pagos
        'payment_type': 'subscription',
        'installments': 10,
        'currency': 'eur',
    }
```

### Alternativa: Usar Stripe Billing Portal para Cancelación Automática

Si Stripe no permite limitar a exactamente 10 pagos en una suscripción, una alternativa es:

1. Crear la suscripción normal con pagos mensuales
2. Configurar un webhook que cancele la suscripción después del pago 10
3. O usar `cancel_at_period_end` después de contar 10 períodos

### Webhook para Cancelar después de 10 Pagos

```python
@router.post('/webhooks/stripe')
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, stripe_webhook_secret
        )
    except ValueError:
        return {"error": "Invalid payload"}, 400
    except stripe.error.SignatureVerificationError:
        return {"error": "Invalid signature"}, 400
    
    # Manejar invoice.payment_succeeded
    if event['type'] == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        subscription_id = invoice['subscription']
        
        # Obtener hiring por subscription_id
        hiring = get_hiring_by_subscription_id(subscription_id)
        
        if hiring:
            # Contar cuántos pagos se han realizado
            invoices = stripe.Invoice.list(subscription=subscription_id, limit=100)
            paid_invoices = [inv for inv in invoices.data if inv.status == 'paid']
            
            # Si ya se pagaron 10, cancelar la suscripción
            if len(paid_invoices) >= 10:
                stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
                logger.info(f"Suscripción {subscription_id} configurada para cancelarse después del período actual (10 pagos completados)")
    
    return {"status": "success"}
```

---

## 📡 Response del Endpoint

### Para `payment_type = 'subscription'`

```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "session_id": "cs_test_...",
  "amount": 4800,  // Pago mensual en centavos (48 EUR)
  "total_amount": 48000,  // Total de los 10 pagos (480 EUR)
  "payment_type": "subscription",
  "installments": 10,
  "currency": "eur"
}
```

### Para `payment_type = 'one_time'`

```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "session_id": "cs_test_...",
  "amount": 20000,  // Primer pago (50% del total)
  "total_amount": 40000,  // Total del servicio
  "payment_type": "first",
  "installments": null,
  "currency": "eur"
}
```

---

## 🔄 Flujo Completo

### 1. Cliente accede a `/contratacion/{code}`

### 2. Frontend detecta `payment_type = 'subscription'`

### 3. Frontend llama a `/hiring/{code}/checkout`

### 4. Backend crea Stripe Subscription Checkout Session

### 5. Cliente completa el pago en Stripe

### 6. Stripe redirige a `success_url` con `session_id`

### 7. Frontend valida el pago y muestra confirmación

### 8. Stripe cobra automáticamente cada mes (9 pagos adicionales)

### 9. Webhook cancela la suscripción después del pago 10

---

## ⚠️ Consideraciones Importantes

1. **Cancelación automática**: Asegurarse de cancelar la suscripción después de 10 pagos
2. **Webhooks**: Configurar webhooks de Stripe para manejar eventos de suscripción
3. **Fallos de pago**: Manejar qué pasa si un pago mensual falla
4. **Metadata**: Guardar información relevante en metadata de Stripe para tracking
5. **Testing**: Usar modo test de Stripe para probar las suscripciones

---

## 🧪 Testing

### Modo Test de Stripe

```python
# Usar tarjetas de prueba de Stripe
# Tarjeta de éxito: 4242 4242 4242 4242
# Tarjeta de rechazo: 4000 0000 0000 0002

# Para testing de suscripciones, usar períodos de prueba más cortos
# O configurar intervalos de días en lugar de meses para pruebas
```

---

## 📚 Referencias

- [Stripe Subscriptions Documentation](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Checkout Sessions - Subscription Mode](https://stripe.com/docs/payments/checkout/subscriptions)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

**Última actualización**: 2025-01-21

