# Fix: Registro de Pagos y Contratos en Historial

**Fecha**: 2025-01-XX  
**Problema**: El contrato `N6M34` fue pagado en Stripe pero no aparecía en el historial del contacto  
**Estado**: ✅ Solución implementada

---

## 📋 Problema Identificado

El contrato `N6M34` fue pagado en Stripe (primer pago) pero:
1. ❌ No se recogía la traza del pago en el admin
2. ❌ No aparecía en el histórico el contrato definitivo firmado
3. ❌ El `external_id` y `payment_method` no se guardaban correctamente

---

## ✅ Solución Implementada

### 1. Registro de Pago Completado en Historial

**Archivo**: `app/services/hiring_payment_service.py`

Se agregaron dos nuevos métodos:

#### `create_payment_completed_note()`
- Crea una nota en el historial del contacto cuando se completa un pago
- Incluye información del pago:
  - Código de contratación
  - Servicio
  - Importe
  - Método de pago
  - Payment Intent ID
  - Fecha de completación

**Implementación**:
```python
async def create_payment_completed_note(
    db: AsyncSession,
    hiring_code: str,
    payment_intent_id: str,
    payment_method: str,
    amount: float,
    service_name: str
) -> None:
    """
    Crea una nota en el historial del contacto cuando se completa un pago.
    
    Args:
        db: Sesión de base de datos
        hiring_code: Código de contratación
        payment_intent_id: ID del Payment Intent de Stripe
        payment_method: Método de pago (card, bank_transfer, etc.)
        amount: Importe del pago
        service_name: Nombre del servicio
    """
    # Obtener el hiring code para encontrar el contacto
    hiring = await get_hiring_by_code(db, hiring_code)
    if not hiring or not hiring.contact_id:
        logger.warning(f"No se encontró contacto para hiring_code {hiring_code}")
        return
    
    # Formatear importe
    amount_formatted = f"{amount:.2f}"
    
    # Crear contenido de la nota
    note_content = f"""💳 Pago completado
Código: {hiring_code}
Servicio: {service_name}
Importe: {amount_formatted} EUR
Método de pago: {payment_method}
Fecha: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
Payment Intent ID: {payment_intent_id}"""
    
    # Crear la nota en el CRM
    note_data = {
        "entity_type": "contacts",
        "entity_id": str(hiring.contact_id),
        "note_type": "system",
        "content": note_content,
        "params": {
            "hiring_code": hiring_code,
            "payment_intent_id": payment_intent_id,
            "payment_method": payment_method,
            "amount": amount,
            "type": "payment_completed"
        }
    }
    
    # Llamar al servicio de CRM para crear la nota
    await crm_service.create_note(db, note_data)
    logger.info(f"Nota de pago completado creada para {hiring_code}")
```

#### `create_final_contract_note()`
- Crea una nota en el historial del contacto cuando se sube el contrato definitivo
- Incluye información del contrato:
  - Código de contratación
  - Servicio
  - Importe
  - URL del contrato definitivo
  - Fecha de subida

**Implementación**:
```python
async def create_final_contract_note(
    db: AsyncSession,
    hiring_code: str,
    contract_url: str,
    amount: float,
    service_name: str
) -> None:
    """
    Crea una nota en el historial del contacto cuando se sube el contrato definitivo.
    
    Args:
        db: Sesión de base de datos
        hiring_code: Código de contratación
        contract_url: URL del contrato definitivo en Cloudinary
        amount: Importe del contrato
        service_name: Nombre del servicio
    """
    # Obtener el hiring code para encontrar el contacto
    hiring = await get_hiring_by_code(db, hiring_code)
    if not hiring or not hiring.contact_id:
        logger.warning(f"No se encontró contacto para hiring_code {hiring_code}")
        return
    
    # Formatear importe
    amount_formatted = f"{amount:.2f}"
    
    # Crear contenido de la nota
    note_content = f"""📋 Contrato definitivo firmado
Código: {hiring_code}
Servicio: {service_name}
Importe: {amount_formatted} EUR
Fecha: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
URL: {contract_url}"""
    
    # Crear la nota en el CRM
    note_data = {
        "entity_type": "contacts",
        "entity_id": str(hiring.contact_id),
        "note_type": "system",
        "content": note_content,
        "params": {
            "hiring_code": hiring_code,
            "contract_url": contract_url,
            "amount": amount,
            "type": "final_contract_uploaded"
        }
    }
    
    # Llamar al servicio de CRM para crear la nota
    await crm_service.create_note(db, note_data)
    logger.info(f"Nota de contrato definitivo creada para {hiring_code}")
```

### 2. Actualización del Webhook de Stripe

**Archivo**: `app/api/endpoints/hiring_webhooks.py`

#### `handle_payment_succeeded()`
- ✅ Ahora guarda el `payment_method` del evento de Stripe
- ✅ Crea automáticamente una nota en el historial cuando se completa el pago
- ✅ Guarda correctamente el `external_id` (payment_intent_id)

**Implementación**:
```python
async def handle_payment_succeeded(
    db: AsyncSession,
    payment_intent: dict
) -> None:
    """
    Maneja el evento payment_intent.succeeded de Stripe.
    
    Args:
        db: Sesión de base de datos
        payment_intent: Objeto Payment Intent de Stripe
    """
    hiring_code = payment_intent.get('metadata', {}).get('hiring_code')
    if not hiring_code:
        logger.warning("Payment Intent sin hiring_code en metadata")
        return
    
    payment_intent_id = payment_intent.get('id')
    payment_method_id = payment_intent.get('payment_method')
    
    # Obtener método de pago de Stripe
    payment_method = 'card'  # Default
    if payment_method_id:
        try:
            pm = stripe.PaymentMethod.retrieve(payment_method_id)
            payment_method = pm.type if hasattr(pm, 'type') else 'card'
        except Exception as e:
            logger.warning(f"Error obteniendo payment_method: {e}")
    
    # Obtener el pago de la base de datos
    payment = await get_payment_by_hiring_code(db, hiring_code)
    if not payment:
        logger.warning(f"No se encontró pago para {hiring_code}")
        return
    
    # Obtener información del hiring
    hiring = await get_hiring_by_code(db, hiring_code)
    if not hiring:
        logger.warning(f"No se encontró hiring_code {hiring_code}")
        return
    
    # Actualizar el pago
    await mark_payment_as_completed(
        db=db,
        payment_id=payment.id,
        external_id=payment_intent_id,
        payment_method=payment_method
    )
    
    # Crear nota en historial
    await create_payment_completed_note(
        db=db,
        hiring_code=hiring_code,
        payment_intent_id=payment_intent_id,
        payment_method=payment_method,
        amount=payment.amount / 100.0,  # Convertir de centavos a euros
        service_name=hiring.service_name or "Servicio de Contratación"
    )
    
    logger.info(f"Pago completado y nota creada para {hiring_code}")
```

#### `handle_subscription_first_payment()`
- ✅ También crea nota en historial para el primer pago de suscripciones

**Implementación**:
```python
async def handle_subscription_first_payment(
    db: AsyncSession,
    invoice: dict
) -> None:
    """
    Maneja el primer pago de una suscripción.
    
    Args:
        db: Sesión de base de datos
        invoice: Objeto Invoice de Stripe
    """
    subscription_id = invoice.get('subscription')
    payment_intent_id = invoice.get('payment_intent')
    
    if not subscription_id or not payment_intent_id:
        return
    
    # Obtener hiring por subscription_id
    hiring = await get_hiring_by_subscription_id(db, subscription_id)
    if not hiring:
        return
    
    # Obtener payment intent para método de pago
    try:
        pi = stripe.PaymentIntent.retrieve(payment_intent_id)
        payment_method_id = pi.get('payment_method')
        payment_method = 'card'
        if payment_method_id:
            pm = stripe.PaymentMethod.retrieve(payment_method_id)
            payment_method = pm.type if hasattr(pm, 'type') else 'card'
    except Exception as e:
        logger.warning(f"Error obteniendo payment_method: {e}")
        payment_method = 'card'
    
    # Obtener el pago
    payment = await get_payment_by_hiring_code(db, hiring.hiring_code)
    if payment:
        await mark_payment_as_completed(
            db=db,
            payment_id=payment.id,
            external_id=payment_intent_id,
            payment_method=payment_method
        )
        
        # Crear nota en historial
        await create_payment_completed_note(
            db=db,
            hiring_code=hiring.hiring_code,
            payment_intent_id=payment_intent_id,
            payment_method=payment_method,
            amount=payment.amount / 100.0,
            service_name=hiring.service_name or "Servicio de Contratación"
        )
```

### 3. Actualización del Endpoint de Contrato Definitivo

**Archivo**: `app/api/endpoints/hiring.py`

#### `upload_final_contract()`
- ✅ Crea automáticamente una nota en el historial cuando se sube el contrato definitivo
- ✅ Incluye la URL del contrato definitivo en la nota

**Implementación**:
```python
@router.post("/final-contract/upload")
async def upload_final_contract(
    hiring_code: str = Form(...),
    contract_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Sube el contrato definitivo firmado.
    """
    # ... código existente para subir a Cloudinary ...
    
    # Guardar URL en la base de datos
    hiring = await get_hiring_by_code(db, hiring_code)
    if hiring:
        hiring.final_contract_url = contract_url
        await db.commit()
    
    # Crear nota en historial
    await create_final_contract_note(
        db=db,
        hiring_code=hiring_code,
        contract_url=contract_url,
        amount=hiring.amount / 100.0 if hiring else 0.0,
        service_name=hiring.service_name if hiring else "Servicio de Contratación"
    )
    
    return {
        "status": "success",
        "contract_url": contract_url
    }
```

### 4. Endpoint Administrativo para Procesar Pagos Manualmente

**Archivo**: `app/api/endpoints/admin_contracts.py`

#### `POST /api/admin/contracts/{code}/process-payment`
- Permite procesar manualmente un pago que ya fue completado en Stripe pero no se registró
- Útil para casos como el contrato N6M34
- Funcionalidades:
  - Busca el payment intent en Stripe si no se proporciona
  - Actualiza el estado del pago
  - Guarda el `external_id` y `payment_method`
  - Crea la nota en el historial
  - Opcionalmente genera el contrato si no existe

**Implementación**:
```python
@router.post("/contracts/{code}/process-payment")
async def process_payment_manually(
    code: str,
    request: ProcessPaymentRequest = None,
    admin_password: str = Header(None, alias="X-Admin-Password"),
    db: AsyncSession = Depends(get_db)
):
    """
    Procesa manualmente un pago que ya fue completado en Stripe.
    Útil para casos donde el webhook no se ejecutó correctamente.
    """
    # Verificar autenticación admin
    if admin_password != os.getenv("ADMIN_PASSWORD"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Obtener hiring code
    hiring = await get_hiring_by_code(db, code)
    if not hiring:
        raise HTTPException(status_code=404, detail="Hiring code no encontrado")
    
    # Obtener payment
    payment = await get_payment_by_hiring_code(db, code)
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    payment_intent_id = None
    payment_method = 'card'
    
    # Si se proporciona payment_intent_id, usarlo
    if request and request.payment_intent_id:
        payment_intent_id = request.payment_intent_id
        payment_method = request.payment_method or 'card'
    else:
        # Buscar en Stripe
        try:
            # Buscar payment intents con metadata
            payment_intents = stripe.PaymentIntent.list(
                limit=100,
                metadata={'hiring_code': code}
            )
            
            # Buscar el primero que esté succeeded
            for pi in payment_intents.data:
                if pi.status == 'succeeded':
                    payment_intent_id = pi.id
                    # Obtener payment method
                    if pi.payment_method:
                        pm = stripe.PaymentMethod.retrieve(pi.payment_method)
                        payment_method = pm.type if hasattr(pm, 'type') else 'card'
                    break
        except Exception as e:
            logger.error(f"Error buscando payment intent: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"No se pudo encontrar payment intent: {str(e)}"
            )
    
    if not payment_intent_id:
        raise HTTPException(
            status_code=404,
            detail="No se encontró payment intent completado en Stripe"
        )
    
    # Actualizar pago
    await mark_payment_as_completed(
        db=db,
        payment_id=payment.id,
        external_id=payment_intent_id,
        payment_method=payment_method
    )
    
    # Crear nota en historial
    await create_payment_completed_note(
        db=db,
        hiring_code=code,
        payment_intent_id=payment_intent_id,
        payment_method=payment_method,
        amount=payment.amount / 100.0,
        service_name=hiring.service_name or "Servicio de Contratación"
    )
    
    # Opcionalmente generar contrato si no existe
    if request and request.generate_contract and not hiring.contract_url:
        # Generar contrato PDF
        contract_url = await generate_contract_pdf(db, code, payment_intent_id)
        hiring.contract_url = contract_url
        await db.commit()
    
    return {
        "status": "success",
        "message": f"Pago procesado correctamente para {code}",
        "payment_intent_id": payment_intent_id,
        "payment_method": payment_method
    }
```

**Schema**:
```python
class ProcessPaymentRequest(BaseModel):
    payment_intent_id: Optional[str] = None
    payment_method: Optional[str] = None
    generate_contract: Optional[bool] = False
```

**Uso**:
```bash
# Opción 1: Procesar automáticamente (busca en Stripe)
curl -X POST "https://api.migro.es/api/admin/contracts/N6M34/process-payment" \
  -H "X-Admin-Password: Pomelo2005.1"

# Opción 2: Procesar con payment_intent_id específico
curl -X POST "https://api.migro.es/api/admin/contracts/N6M34/process-payment" \
  -H "X-Admin-Password: Pomelo2005.1" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_intent_id": "pi_xxxxx",
    "payment_method": "card",
    "generate_contract": true
  }'
```

---

## 🔄 Flujo Actualizado

### Cuando se Completa un Pago en Stripe:

1. **Webhook recibe `payment_intent.succeeded`**
   - Extrae `hiring_code` del metadata
   - Busca el payment en la base de datos
   - Marca como completado con `external_id` y `payment_method`
   - ✅ **Crea nota en historial del contacto**
   - Genera contrato PDF (si aplica)
   - Envía email al cliente

### Cuando se Sube el Contrato Definitivo:

1. **Frontend sube contrato definitivo**
   - Endpoint: `POST /api/hiring/final-contract/upload`
   - Sube PDF a Cloudinary
   - Guarda URL en `final_contract_url`
   - ✅ **Crea nota en historial del contacto**
   - Envía email con contrato definitivo

---

## 📝 Estructura de las Notas en Historial

### Nota de Pago Completado:
```
💳 Pago completado
Código: N6M34
Servicio: [Nombre del servicio]
Importe: 400.00 EUR
Método de pago: card
Fecha: 2025-01-XX XX:XX:XX
Payment Intent ID: pi_xxxxx
```

**Parámetros adicionales**:
```json
{
  "hiring_code": "N6M34",
  "payment_intent_id": "pi_xxxxx",
  "payment_method": "card",
  "amount": 400.00,
  "type": "payment_completed"
}
```

### Nota de Contrato Definitivo:
```
📋 Contrato definitivo firmado
Código: N6M34
Servicio: [Nombre del servicio]
Importe: 400.00 EUR
Fecha: 2025-01-XX XX:XX:XX
URL: https://res.cloudinary.com/...
```

**Parámetros adicionales**:
```json
{
  "hiring_code": "N6M34",
  "contract_url": "https://res.cloudinary.com/...",
  "amount": 400.00,
  "type": "final_contract_uploaded"
}
```

---

## 🛠️ Procesar Contrato N6M34 Manualmente

Para procesar el contrato N6M34 que ya fue pagado pero no se registró:

```bash
# Opción 1: Procesar automáticamente (busca en Stripe)
curl -X POST "https://api.migro.es/api/admin/contracts/N6M34/process-payment" \
  -H "X-Admin-Password: Pomelo2005.1"

# Opción 2: Procesar con payment_intent_id específico
curl -X POST "https://api.migro.es/api/admin/contracts/N6M34/process-payment" \
  -H "X-Admin-Password: Pomelo2005.1" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_intent_id": "pi_xxxxx",
    "payment_method": "card"
  }'
```

---

## ✅ Cambios en Base de Datos

No se requieren cambios en la base de datos. Los campos necesarios ya existen:
- `hiring_payments.external_id` - Para guardar payment_intent_id
- `hiring_payments.payment_method` - Para guardar método de pago
- `hiring_payments.final_contract_url` - Para guardar URL del contrato definitivo
- `crm_notes` - Para guardar las notas en el historial

---

## 🎯 Próximos Pasos

1. ✅ Procesar manualmente el contrato N6M34 usando el nuevo endpoint
2. ✅ Verificar que aparezca en el historial del contacto
3. ✅ Verificar que el `external_id` y `payment_method` estén guardados
4. ✅ Verificar que el contrato definitivo aparezca en el historial

---

## 📚 Archivos Modificados

1. `app/services/hiring_payment_service.py`
   - Agregado `create_payment_completed_note()`
   - Agregado `create_final_contract_note()`
   - Actualizado `mark_payment_as_completed()` para aceptar `payment_method`

2. `app/api/endpoints/hiring_webhooks.py`
   - Actualizado `handle_payment_succeeded()` para crear nota y guardar `payment_method`
   - Actualizado `handle_subscription_first_payment()` para crear nota

3. `app/api/endpoints/hiring.py`
   - Actualizado `upload_final_contract()` para crear nota en historial

4. `app/api/endpoints/admin_contracts.py`
   - Agregado endpoint `POST /api/admin/contracts/{code}/process-payment`

---

## 🔍 Verificación

Para verificar que todo funciona correctamente:

1. **Verificar nota de pago en historial**:
   ```sql
   SELECT * FROM crm_notes 
   WHERE params->>'hiring_code' = 'N6M34' 
   AND content LIKE '%Pago completado%'
   ORDER BY created_at DESC;
   ```

2. **Verificar nota de contrato definitivo**:
   ```sql
   SELECT * FROM crm_notes 
   WHERE params->>'hiring_code' = 'N6M34' 
   AND content LIKE '%Contrato definitivo%'
   ORDER BY created_at DESC;
   ```

3. **Verificar payment actualizado**:
   ```sql
   SELECT id, hiring_code, status, external_id, payment_method, completed_at
   FROM hiring_payments 
   WHERE hiring_code = 'N6M34';
   ```

---

## 📖 Referencias

- [CRM Notes API](../BACKEND_CRM_INTEGRATION.md)
- [Stripe Webhooks](../BACKEND_STRIPE_CHECKOUT_COMPLETE.md)
- [Admin Contracts Endpoints](../ADMIN_MODULE_BACKEND_INTEGRATION.md)














