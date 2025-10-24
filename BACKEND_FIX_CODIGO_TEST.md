# 🔧 Backend: Solución para Código TEST1 No Encontrado

## 🎯 Problema Actual

El endpoint `/api/hiring/TEST1/kyc/complete` **SÍ EXISTE**, pero responde:

```json
{
  "detail": "Código de contratación no encontrado"
}
```

**Causa:** El código `TEST1` no existe en la base de datos del backend.

---

## ✅ Solución 1: Crear Código de Prueba en la Base de Datos (Recomendado para Testing)

### Opción A: Usando el Panel de Admin

1. Ve a tu panel de admin: `https://contratacion.migro.es/admin`
2. Ingresa con la contraseña: `Pomelo2005.1@`
3. Crea un nuevo código de contratación:
   - **Código:** `TEST1`
   - **Nombre:** `Usuario de Prueba`
   - **Email:** `test@ejemplo.com`
   - **Pasaporte/NIE:** `X1234567Z`
   - **Dirección:** `Calle Test 123`
   - **Ciudad:** `Madrid`
   - **Grado:** `A` (o `B` o `C` según quieras probar)

### Opción B: Directamente en la Base de Datos

```sql
-- PostgreSQL / MySQL
INSERT INTO hirings (
    hiring_code,
    user_name,
    user_email,
    user_document,
    user_address,
    user_city,
    grade,
    service_name,
    amount,
    status,
    created_at
) VALUES (
    'TEST1',
    'Usuario de Prueba',
    'test@ejemplo.com',
    'X1234567Z',
    'Calle Test 123',
    'Madrid',
    'A',
    'Visado de Estudiante (PRUEBA)',
    200.00,  -- Primer pago (grade A = 200€)
    'pending',
    NOW()
);
```

---

## ✅ Solución 2: Modificar el Backend para Aceptar Códigos TEST

Esto permite testing sin crear registros en la base de datos.

### Implementación en FastAPI

```python
# En el endpoint de KYC complete
@router.post("/hiring/{code}/kyc/complete")
async def complete_kyc_verification(
    code: str,
    request: CompleteKYCRequest
) -> dict:
    """
    Verifica el estado de una sesión de Stripe Identity.
    Acepta códigos de prueba (TEST*) sin verificar DB.
    """
    
    # ============================================
    # MODO DE PRUEBA: Códigos que empiezan con TEST
    # ============================================
    if code.startswith("TEST"):
        logger.info(f"🧪 Modo de prueba activado para código: {code}")
        
        # Verificar sesión en Stripe (opcional, depende si usas test keys)
        try:
            session = stripe.identity.VerificationSession.retrieve(
                request.session_id
            )
            logger.info(f"Stripe session status: {session.status}")
        except stripe.error.StripeError as e:
            logger.warning(f"No se pudo verificar en Stripe (modo test): {e}")
        
        # Responder éxito sin guardar en DB
        return {
            "status": "verified",
            "message": "KYC verification completed (TEST MODE)",
            "verification_id": request.session_id,
            "verified_at": datetime.utcnow().isoformat(),
            "test_mode": True
        }
    
    # ============================================
    # MODO PRODUCCIÓN: Buscar en base de datos
    # ============================================
    hiring = await db.query(Hiring).filter(
        Hiring.hiring_code == code
    ).first()
    
    if not hiring:
        raise HTTPException(
            status_code=404,
            detail="Código de contratación no encontrado"
        )
    
    # Verificar sesión en Stripe
    try:
        session = stripe.identity.VerificationSession.retrieve(
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
    
    # Verificar que la sesión esté completa
    if session.status != "verified":
        raise HTTPException(
            status_code=400,
            detail="Verification not complete yet",
            headers={"X-Verification-Status": session.status}
        )
    
    # Actualizar hiring en DB
    hiring.kyc_verified = True
    hiring.kyc_session_id = request.session_id
    hiring.kyc_verified_at = datetime.utcnow()
    await db.commit()
    
    return {
        "status": "verified",
        "message": "KYC verification completed",
        "verification_id": request.session_id,
        "verified_at": hiring.kyc_verified_at.isoformat(),
        "test_mode": False
    }
```

---

## ✅ Solución 3: Variable de Entorno para Modo Testing

La más flexible para diferentes entornos.

```python
import os

# En el archivo de configuración
ENABLE_TEST_CODES = os.getenv("ENABLE_TEST_CODES", "false").lower() == "true"

# En el endpoint
@router.post("/hiring/{code}/kyc/complete")
async def complete_kyc_verification(code: str, request: CompleteKYCRequest):
    
    # Permitir códigos TEST solo si la variable de entorno lo permite
    if code.startswith("TEST") and ENABLE_TEST_CODES:
        return {
            "status": "verified",
            "message": "KYC verification completed (TEST MODE)",
            "verification_id": request.session_id,
            "verified_at": datetime.utcnow().isoformat(),
            "test_mode": True
        }
    
    # Resto del código normal...
```

**.env del backend:**
```env
# Desarrollo
ENABLE_TEST_CODES=true

# Producción
ENABLE_TEST_CODES=false
```

---

## 🧪 Testing Después de la Solución

### Con Solución 1 (DB):
```bash
# El código TEST1 ahora existe en la base de datos
curl -X POST https://api.migro.es/api/hiring/TEST1/kyc/complete \
  -H "Content-Type: application/json" \
  -d '{"session_id": "vs_test_123456789"}'

# Respuesta esperada:
{
  "status": "verified",
  "message": "KYC verification completed",
  "verification_id": "vs_test_123456789",
  "verified_at": "2025-10-24T15:30:00Z"
}
```

### Con Solución 2 o 3 (Bypass):
```bash
# Funciona sin DB
curl -X POST https://api.migro.es/api/hiring/TEST1/kyc/complete \
  -H "Content-Type: application/json" \
  -d '{"session_id": "vs_test_123456789"}'

# Respuesta esperada:
{
  "status": "verified",
  "message": "KYC verification completed (TEST MODE)",
  "verification_id": "vs_test_123456789",
  "verified_at": "2025-10-24T15:30:00Z",
  "test_mode": true
}
```

---

## 📊 Comparación de Soluciones

| Aspecto | Solución 1 (DB) | Solución 2 (Código) | Solución 3 (Env Var) |
|---------|-----------------|---------------------|----------------------|
| **Complejidad** | 🟢 Baja | 🟡 Media | 🟡 Media |
| **Testing** | 🟡 Requiere DB | 🟢 Sin DB | 🟢 Sin DB |
| **Seguridad** | 🟢 Alta | 🟡 Expuesto | 🟢 Configurable |
| **Producción** | 🟢 Correcto | ⚠️ Riesgo | 🟢 Seguro |
| **Recomendado** | ✅ Testing local | ⚠️ Solo dev | ✅ Mejor opción |

---

## ⚠️ Estado Actual del Frontend

**El frontend ahora tiene bypass mejorado:**

```javascript
// Detecta específicamente "Código de contratación no encontrado"
// Y marca KYC como completo después de 2 segundos
```

**Logs que verás:**
```
⚠️ Código de contratación no encontrado en backend
⚠️ MODO DE PRUEBA: Asumiendo KYC completo
⚠️ ACCIÓN REQUERIDA: Crear código en backend o usar código real
```

**Esto permite testing del frontend mientras implementas la solución en el backend.**

---

## 🎯 Recomendación Final

**Para testing inmediato:**
- Usar **Solución 3** (Variable de entorno)
- Activar `ENABLE_TEST_CODES=true` en desarrollo
- Desactivar en producción

**Para producción:**
- Usar **Solución 1** (Base de datos)
- Crear códigos reales a través del panel de admin
- Nunca permitir códigos TEST en producción

---

## 📝 Checklist de Implementación

### Backend (Elige UNA solución)

- [ ] **Opción 1:** Crear registro TEST1 en base de datos
- [ ] **Opción 2:** Agregar `if code.startswith("TEST")` al endpoint
- [ ] **Opción 3:** Agregar variable `ENABLE_TEST_CODES` y validación

### Testing

- [ ] Probar con `TEST1` en `https://contratacion.migro.es/contratacion/TEST1`
- [ ] Verificar que KYC se completa correctamente
- [ ] Verificar logs en consola del navegador
- [ ] Confirmar que continúa al paso de pago

### Producción

- [ ] Si usaste Solución 2, **eliminarla** antes de producción
- [ ] Si usaste Solución 3, configurar `ENABLE_TEST_CODES=false`
- [ ] Crear códigos reales solo desde el panel de admin

---

**Última actualización:** 24 de Octubre de 2025 - Commit `37cb487`

