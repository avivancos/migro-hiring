# 🧪 Testing con Stripe - Migro Hiring

## ⚠️ IMPORTANTE: SEGURIDAD DE CLAVES

### 🔴 **NUNCA compartas o expongas:**
- ❌ `sk_live_*` - Clave secreta de producción
- ❌ `sk_test_*` - Clave secreta de testing

### ✅ **Seguro para frontend:**
- ✅ `pk_live_*` - Clave pública de producción
- ✅ `pk_test_*` - Clave pública de testing

---

## 🧪 Códigos de Testing - Stripe Identity (KYC)

### **Documentos de Prueba**

Stripe proporciona documentos de prueba para simular diferentes escenarios:

#### ✅ **Verificación Exitosa**

**Selfie + Documento:**
- Usa cualquier foto de prueba
- El sistema acepta imágenes en formato JPG/PNG

**Números de Documento de Prueba:**
```
DNI/Pasaporte: 000000000T (España)
NIE: X0000000T
```

#### ❌ **Verificación Fallida**

Para simular fallos, usa:
```
Documento: 999999999Z (falla intencionalmente)
```

#### ⏳ **Verificación Pendiente**

```
Documento: 111111111P (requiere revisión manual)
```

---

## 💳 Tarjetas de Prueba - Pagos

### **Tarjetas que SIEMPRE funcionan:**

```
Número: 4242 4242 4242 4242
CVV: Cualquier 3 dígitos
Fecha: Cualquier fecha futura
ZIP: Cualquier código postal
```

### **Otras tarjetas de prueba:**

| Tarjeta | Número | Resultado |
|---------|--------|-----------|
| Visa | `4242 4242 4242 4242` | ✅ Éxito |
| Visa (debit) | `4000 0566 5566 5556` | ✅ Éxito |
| Mastercard | `5555 5555 5555 4444` | ✅ Éxito |
| Amex | `3782 822463 10005` | ✅ Éxito |
| Requiere 3DS | `4000 0027 6000 3184` | ⚠️ Requiere autenticación |
| Declinada | `4000 0000 0000 0002` | ❌ Falla |
| Fondos insuficientes | `4000 0000 0000 9995` | ❌ Fondos insuficientes |

---

## 🔧 Configuración Actual

### **Frontend (.env.local)**
```bash
# SOLO clave pública (seguro para frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SCgH4Djtj7fY0EsiZB6PvzabhQzCrgLQr728oJkfbUDciK9nk29ajRta3IuMK1tSXRv3RUQloYNez3BEwY2DmIp00RhGVHymj
```

### **Backend (NUNCA en frontend)**
```bash
# Clave secreta SOLO en el backend
STRIPE_SECRET_KEY=sk_live_51SCgH4Djtj7fY0Es... (OCULTA)
```

---

## 📱 Flujo de Testing Completo

### **1. Iniciar proceso de contratación**
```
http://localhost:5173/AB12C
```
(Reemplaza `AB12C` con tu código de contratación)

### **2. Paso de KYC (Stripe Identity)**

1. Haz clic en "Iniciar Verificación"
2. **Opción A - Testing con documento real:**
   - Usa tu DNI/Pasaporte real
   - Toma selfie real
   - ✅ Se procesará correctamente

3. **Opción B - Testing con documento de prueba:**
   - Sube imagen de prueba del documento
   - Toma selfie de prueba
   - Usa número: `000000000T`

### **3. Paso de Pago**

Usa la tarjeta de prueba:
```
Número: 4242 4242 4242 4242
MM/YY: 12/25
CVV: 123
```

### **4. Verificar contrato**

Después del pago exitoso, deberías:
- ✅ Ver pantalla de confirmación
- ✅ Recibir email con el contrato
- ✅ Poder descargar el PDF

---

## 🔍 Verificar en Stripe Dashboard

1. Ve a: https://dashboard.stripe.com/identity/verifications
2. Verás todas las verificaciones de identidad
3. Revisa el estado: `verified`, `requires_input`, `canceled`

Para pagos:
1. Ve a: https://dashboard.stripe.com/payments
2. Verás todos los Payment Intents
3. Estado: `succeeded`, `requires_payment_method`, `canceled`

---

## 🐛 Debugging

### **Ver logs de Stripe en tiempo real:**

```bash
# Instalar Stripe CLI
stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe/hiring

# Ver eventos
stripe events tail
```

### **Simular webhook manualmente:**

```bash
stripe trigger identity.verification_session.verified
stripe trigger payment_intent.succeeded
```

---

## ⚠️ RECUERDA - Seguridad

### **Antes de ir a producción:**

1. ✅ **Rotar claves** si las compartiste
2. ✅ **Verificar** que `sk_live_*` NUNCA esté en el frontend
3. ✅ **Configurar webhooks** en Stripe Dashboard
4. ✅ **Probar** el flujo completo en modo test antes de live
5. ✅ **Habilitar HTTPS** en producción
6. ✅ **Configurar CSP** correctamente

### **Dashboard de Stripe:**
- Testing: https://dashboard.stripe.com/test/
- Producción: https://dashboard.stripe.com/

---

## 📚 Documentación Oficial

- **Stripe Identity**: https://stripe.com/docs/identity
- **Testing Identity**: https://stripe.com/docs/identity/test-mode
- **Tarjetas de prueba**: https://stripe.com/docs/testing
- **Webhooks**: https://stripe.com/docs/webhooks

---

## 🎯 Checklist de Testing

- [ ] KYC con documento válido
- [ ] KYC con documento de prueba
- [ ] Pago exitoso con `4242 4242 4242 4242`
- [ ] Pago fallido con tarjeta declinada
- [ ] Descargar contrato después del pago
- [ ] Verificar email de confirmación
- [ ] Probar en mobile
- [ ] Probar flujo completo end-to-end
- [ ] Verificar webhooks en Stripe Dashboard
- [ ] Probar con tarjeta que requiere 3DS

---

**Última actualización:** 23 de Octubre de 2025

