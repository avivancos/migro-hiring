# 🔴 URGENTE - Corregir URLs de Contrato y Naming

## 🎯 Problema

El backend está devolviendo URLs de contrato incorrectas:

### **Actual (❌):**
```json
{
  "status": "succeeded",
  "payment_intent_id": "pi_test_simulated",
  "contract_url": "https://res.cloudinary.com/demo/raw/upload/v1/contracts/test_contract.pdf",
  "contract_id": 9999
}
```

**Problemas:**
1. ❌ `contract_url` apunta a `test_contract.pdf` (genérico)
2. ❌ `contract_id` siempre es `9999` (placeholder)
3. ❌ No usa el código de contratación en el nombre del archivo

---

## ✅ Solución

### **1. Endpoint `/hiring/{code}/confirm` (Confirmación de Pago)**

**Este endpoint NO debe devolver `contract_url` todavía**, porque el contrato definitivo aún no se ha subido.

**Cambio:**

```python
# ❌ INCORRECTO:
return {
    "status": "succeeded",
    "payment_intent_id": payment_intent_id,
    "contract_url": "https://res.cloudinary.com/.../test_contract.pdf",  # ❌
    "contract_id": 9999  # ❌
}

# ✅ CORRECTO:
return {
    "status": "succeeded",
    "payment_intent_id": payment_intent_id,
    "confirmed_at": datetime.utcnow().isoformat(),
    "test_mode": is_test_mode(hiring_code),  # true si empieza con TEST
    "message": "Pago confirmado exitosamente"
    # NO incluir contract_url todavía
}
```

---

### **2. Endpoint `/hiring/final-contract/upload` (Subida de Contrato Definitivo)**

**Este endpoint SÍ debe devolver el `contract_url` correcto** después de subir el PDF.

**Naming del archivo:**

```python
# Formato del nombre de archivo
filename = f"contrato_{hiring_code}_pago1_{payment_intent_id}.pdf"

# Ejemplos:
# - contrato_TEST1_pago1_pi_test_simulated.pdf
# - contrato_FKRGM_pago1_pi_3N...abc.pdf
# - contrato_LIVE1_pago1_pi_live_123456789.pdf
```

**Respuesta correcta:**

```python
# Subir a Cloudinary/S3 con el nombre correcto
upload_result = cloudinary.uploader.upload(
    contract_file,
    folder="migro/contracts",
    public_id=f"contrato_{hiring_code}_pago1_{payment_intent_id}",
    resource_type="raw"
)

# Guardar en la base de datos
contract_record = Contract(
    hiring_code=hiring_code,
    payment_intent_id=payment_intent_id,
    payment_number=1,  # Primer pago
    contract_url=upload_result['secure_url'],
    uploaded_at=datetime.utcnow()
)
db.add(contract_record)
db.commit()

# Respuesta
return {
    "status": "success",
    "message": "Contrato definitivo subido y enviado por email",
    "hiring_code": hiring_code,
    "contract_url": upload_result['secure_url'],  # ✅ URL REAL
    "contract_id": contract_record.id,  # ✅ ID REAL de la BD
    "sent_to": [client_email, "info@migro.es", "agustin@migro.es"],
    "timestamp": datetime.utcnow().isoformat()
}
```

---

## 📊 Flujo Correcto

### **Frontend:**

1. Usuario confirma pago → `POST /hiring/{code}/confirm`
   - Backend: Confirma el pago, NO devuelve `contract_url`

2. Frontend genera PDF definitivo → `POST /hiring/final-contract/upload`
   - Backend: Sube el PDF con nombre correcto, devuelve `contract_url` real

### **Backend:**

```python
# PASO 1: Confirmar pago (NO subir contrato todavía)
@router.post("/hiring/{hiring_code}/confirm")
async def confirm_payment(hiring_code: str, payment_intent_id: str):
    # Validar pago
    # Actualizar estado en BD
    return {
        "status": "succeeded",
        "payment_intent_id": payment_intent_id,
        "confirmed_at": datetime.utcnow().isoformat(),
        "test_mode": hiring_code.startswith('TEST')
    }

# PASO 2: Subir contrato definitivo
@router.post("/hiring/final-contract/upload")
async def upload_final_contract(
    contract: UploadFile,
    hiring_code: str,
    payment_intent_id: str,
    # ... otros campos
):
    # Nombre correcto del archivo
    filename = f"contrato_{hiring_code}_pago1_{payment_intent_id}.pdf"
    
    # Subir a Cloudinary/S3
    upload_result = upload_to_storage(contract, filename)
    
    # Guardar en BD
    contract_record = save_contract_to_db(hiring_code, upload_result['url'])
    
    # Enviar emails
    send_contract_emails(...)
    
    return {
        "status": "success",
        "contract_url": upload_result['url'],  # ✅ URL REAL
        "contract_id": contract_record.id  # ✅ ID REAL
    }
```

---

## 🧪 Testing

### **Paso 1: Confirmar Pago**
```bash
curl -X POST https://api.migro.es/api/hiring/TEST1/confirm \
  -H "Content-Type: application/json" \
  -d '{"payment_intent_id": "pi_test_simulated"}'

# ✅ Esperado:
{
  "status": "succeeded",
  "payment_intent_id": "pi_test_simulated",
  "confirmed_at": "2025-10-27T16:47:06.611199",
  "test_mode": true
  # ❌ NO debe tener "contract_url" aquí
}
```

### **Paso 2: Subir Contrato**
```bash
curl -X POST https://api.migro.es/api/hiring/final-contract/upload \
  -F "contract=@contrato.pdf" \
  -F "hiring_code=TEST1" \
  -F "payment_intent_id=pi_test_simulated" \
  # ... otros campos

# ✅ Esperado:
{
  "status": "success",
  "contract_url": "https://res.cloudinary.com/.../contrato_TEST1_pago1_pi_test_simulated.pdf",
  "contract_id": 42,  # ID real de la BD
  "sent_to": ["cliente@email.com", "info@migro.es", "agustin@migro.es"]
}
```

---

## 📋 Checklist

- [ ] Eliminar `contract_url` y `contract_id` de respuesta de `/hiring/{code}/confirm`
- [ ] Implementar naming correcto: `contrato_{hiring_code}_pago1_{payment_intent_id}.pdf`
- [ ] Subir archivo real a Cloudinary/S3 en `/hiring/final-contract/upload`
- [ ] Guardar registro en tabla `contracts` con URL real
- [ ] Devolver `contract_url` e `contract_id` reales en `/hiring/final-contract/upload`
- [ ] Testing con TEST1 y FKRGM

---

**Prioridad:** ALTA  
**Impacto:** Los contratos no se están guardando correctamente y los clientes reciben URLs de prueba.

---

¿Puedes implementar estos cambios en los endpoints de confirmación y subida de contratos?

Gracias! 🙏

