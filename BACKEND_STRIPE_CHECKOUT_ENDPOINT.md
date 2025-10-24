# 🛒 Backend: Stripe Checkout Endpoint

## 🎯 Endpoint Requerido

### **POST `/hiring/{hiring_code}/checkout`**

Este endpoint crea una sesión de Stripe Checkout para procesar el pago.

---

## 📋 Request

### **URL Parameters:**
- `hiring_code` (string) - Código de contratación

### **Body:** 
```json
{}
```

### **Headers:**
```
Content-Type: application/json
```

---

## ✅ Response

### **200 OK:**
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/cs_test_123456789"
}
```

---

## 🔧 Implementación Backend

```python
import stripe
from fastapi import HTTPException

stripe.api_key = "sk_live_..." # Tu clave secreta de Stripe

@app.post("/hiring/{hiring_code}/checkout")
async def create_checkout_session(hiring_code: str):
    """Crear sesión de Stripe Checkout"""
    
    try:
        # Obtener datos del hiring
        hiring = await get_hiring_by_code(hiring_code)
        if not hiring:
            raise HTTPException(status_code=404, detail="Código no encontrado")
        
        # Crear sesión de checkout
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': hiring.service_name,
                    },
                    'unit_amount': hiring.amount, # En centavos
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'https://contratacion.migro.es/contratacion/{hiring_code}?step=5&payment=success',
            cancel_url=f'https://contratacion.migro.es/contratacion/{hiring_code}?step=4&payment=cancelled',
            metadata={
                'hiring_code': hiring_code,
                'user_email': hiring.user_email,
            }
        )
        
        return {
            "checkout_url": checkout_session.url
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Error de Stripe: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
```

---

## 🧪 Testing

```bash
curl -X POST "https://api.migro.es/api/hiring/LIVE1/checkout" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

**Estado:** ⚠️ **Endpoint requerido para Stripe Checkout**  
**Última actualización:** 15 de Enero de 2024
