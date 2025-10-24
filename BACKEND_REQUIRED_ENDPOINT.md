# 🔌 Endpoint Requerido en Backend: KYC Complete

## ⚠️ URGENTE: Endpoint Faltante

El frontend está llamando a este endpoint que **NO EXISTE** en el backend:

```
POST /api/hiring/{code}/kyc/complete
```

**Resultado actual:** `404 Not Found`

---

## 📋 Especificación del Endpoint

### Request

```http
POST /api/hiring/TEST1/kyc/complete HTTP/1.1
Host: api.migro.es
Content-Type: application/json

{
  "session_id": "vs_1PqR8sT9uVwX2yZ3"
}
```

### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `code` | string | Código de contratación (ej: `TEST1`) |

### Body Parameters

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `session_id` | string | ✅ Sí | Session ID de Stripe Identity (ej: `vs_1PqR8sT9uVwX2yZ3`) |

---

## ✅ Response Esperada (200 OK)

Cuando la verificación está completa:

```json
{
  "status": "verified",
  "message": "KYC verification completed",
  "verification_id": "vs_1PqR8sT9uVwX2yZ3",
  "verified_at": "2025-10-24T14:30:00Z"
}
```

---

## ⏳ Response si Aún No Está Completo (400 Bad Request)

Si Stripe aún está procesando:

```json
{
  "detail": "Verification not complete yet",
  "status": "processing"
}
```

**Comportamiento del frontend:** Iniciará polling cada 3 segundos.

---

## ❌ Posibles Errores

### Session ID Inválido

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "detail": "Invalid session_id",
  "error": "Session not found in Stripe"
}
```

### Código de Contratación No Encontrado

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "detail": "Hiring code not found"
}
```

### Error de Stripe API

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "detail": "Stripe API error",
  "error": "Connection to Stripe failed"
}
```

---

## 🔧 Implementación en FastAPI (Python)

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import stripe

router = APIRouter()

class CompleteKYCRequest(BaseModel):
    session_id: str

@router.post("/hiring/{code}/kyc/complete")
async def complete_kyc_verification(
    code: str,
    request: CompleteKYCRequest
) -> dict:
    """
    Verifica el estado de una sesión de Stripe Identity
    y marca la verificación como completa.
    """
    
    # 1. Verificar que el código de contratación existe
    hiring = await get_hiring_by_code(code)
    if not hiring:
        raise HTTPException(status_code=404, detail="Hiring code not found")
    
    # 2. Consultar el estado de la sesión en Stripe
    try:
        verification_session = stripe.identity.VerificationSession.retrieve(
            request.session_id
        )
    except stripe.error.InvalidRequestError:
        raise HTTPException(
            status_code=400,
            detail="Invalid session_id"
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Stripe API error: {str(e)}"
        )
    
    # 3. Verificar el estado
    if verification_session.status != "verified":
        raise HTTPException(
            status_code=400,
            detail="Verification not complete yet",
            headers={"X-Verification-Status": verification_session.status}
        )
    
    # 4. Actualizar el estado de la contratación
    hiring.kyc_verified = True
    hiring.kyc_session_id = request.session_id
    hiring.kyc_verified_at = datetime.utcnow()
    await hiring.save()
    
    # 5. Responder éxito
    return {
        "status": "verified",
        "message": "KYC verification completed",
        "verification_id": request.session_id,
        "verified_at": hiring.kyc_verified_at.isoformat()
    }
```

---

## 🗄️ Actualizar Modelo de Base de Datos

Agrega estos campos al modelo `Hiring`:

```python
class Hiring(Base):
    __tablename__ = "hirings"
    
    # ... campos existentes ...
    
    # KYC fields
    kyc_verified: bool = Column(Boolean, default=False)
    kyc_session_id: str = Column(String, nullable=True)
    kyc_verified_at: datetime = Column(DateTime, nullable=True)
```

---

## 📊 Flujo Completo

```
1. Frontend: POST /kyc/start
   Backend → Stripe: Crear sesión
   Backend → Frontend: {session_id, url}

2. Frontend redirige a Stripe
   Usuario completa verificación

3. Stripe redirige a frontend con ?session_id=vs_XXX

4. Frontend: POST /kyc/complete {session_id}
   Backend → Stripe: Consultar estado
   Stripe → Backend: {status: "verified"}
   Backend → Frontend: {status: "verified"} ✅

5. Frontend permite continuar al pago
```

---

## 🧪 Testing con Stripe Test Mode

### Session IDs de prueba

Stripe devuelve session IDs como:
```
vs_test_1234567890abcdefgh
```

Para testing, puedes:

1. Usar Stripe CLI para simular webhooks
2. Consultar directamente con `stripe.identity.VerificationSession.retrieve()`
3. El frontend ya maneja el flujo completo

---

## 🚨 Solución Temporal Actual

**El frontend tiene un bypass temporal:**

- Si el endpoint devuelve `404`, asume que KYC está completo
- Esto permite testing del frontend sin backend
- **DEBES implementar el endpoint para producción**

**Logs en consola cuando se activa el bypass:**
```
⚠️ Endpoint /kyc/complete no implementado en backend (404)
⚠️ ASUMIENDO que KYC está completo porque Stripe redirigió con session_id
⚠️ NOTA: Implementa el endpoint en el backend para verificación real
```

---

## ✅ Checklist de Implementación

- [ ] Crear endpoint `POST /api/hiring/{code}/kyc/complete`
- [ ] Agregar campos KYC a modelo `Hiring`
- [ ] Migración de base de datos
- [ ] Integrar con Stripe Identity API
- [ ] Manejar estados: `requires_input`, `processing`, `verified`, `canceled`
- [ ] Logging de verificaciones
- [ ] Testing con códigos de prueba
- [ ] Remover bypass del frontend (o dejarlo como fallback)

---

## 📞 Preguntas Frecuentes

### ¿Por qué el frontend no llama directamente a Stripe?

El frontend solo puede usar la **publishable key** de Stripe, que no permite verificar el estado de una sesión. Solo el backend con la **secret key** puede hacerlo.

### ¿Qué datos guarda Stripe en la verificación?

Stripe guarda:
- Documento de identidad (tipo, número, país)
- Foto del documento
- Selfie del usuario
- Resultado de la verificación (pass/fail)
- Fecha de nacimiento
- Dirección (si se solicitó)

### ¿El frontend puede continuar sin este endpoint?

Sí, temporalmente. El bypass permite testing. Pero en producción **DEBES** implementarlo para:
- Validar que la verificación realmente se completó
- Guardar el resultado en tu base de datos
- Prevenir fraudes

---

**Última actualización:** 24 de Octubre de 2025 - Commit `c6c10a9`

