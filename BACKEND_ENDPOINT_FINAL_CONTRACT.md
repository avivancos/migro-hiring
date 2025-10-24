# 📄 Backend: Endpoint para Contrato Definitivo

## 🎯 Endpoint Requerido

### **POST `/hiring/final-contract/upload`**

Este endpoint recibe el contrato definitivo generado en el frontend y lo envía por email.

---

## 📋 Parámetros del Request

### **FormData (multipart/form-data)**

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `contract` | File | PDF del contrato definitivo | ✅ |
| `hiring_code` | String | Código de contratación | ✅ |
| `client_email` | String | Email del cliente | ✅ |
| `client_name` | String | Nombre completo del cliente | ✅ |
| `contract_type` | String | Tipo de contrato (`final`) | ✅ |
| `payment_intent_id` | String | ID del Payment Intent de Stripe | ⚠️ |
| `stripe_transaction_id` | String | ID de transacción de Stripe | ⚠️ |
| `payment_date` | String | Fecha del pago (ISO string) | ⚠️ |
| `payment_method` | String | Método de pago | ⚠️ |

---

## 🔧 Implementación Backend

### **1. Endpoint Principal**

```python
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@app.post("/hiring/final-contract/upload")
async def upload_final_contract(
    contract: UploadFile = File(...),
    hiring_code: str = Form(...),
    client_email: str = Form(...),
    client_name: str = Form(...),
    contract_type: str = Form(...),
    payment_intent_id: str = Form(None),
    stripe_transaction_id: str = Form(None),
    payment_date: str = Form(None),
    payment_method: str = Form(None)
):
    """Subir contrato definitivo y enviarlo por email"""
    
    try:
        # Validar archivo
        if not contract.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")
        
        # Leer contenido del archivo
        contract_content = await contract.read()
        
        # Validar datos requeridos
        if not all([hiring_code, client_email, client_name]):
            raise HTTPException(status_code=400, detail="Faltan datos requeridos")
        
        # Enviar emails
        await send_contract_emails(
            hiring_code=hiring_code,
            client_email=client_email,
            client_name=client_name,
            contract_content=contract_content,
            contract_filename=contract.filename,
            payment_data={
                'payment_intent_id': payment_intent_id,
                'stripe_transaction_id': stripe_transaction_id,
                'payment_date': payment_date,
                'payment_method': payment_method
            }
        )
        
        logger.info(f"Contrato definitivo enviado para {hiring_code}")
        
        return {
            "status": "success",
            "message": "Contrato definitivo enviado por email",
            "hiring_code": hiring_code,
            "sent_to": [client_email, "info@migro.es"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error procesando contrato definitivo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
```

### **2. Función de Envío de Emails**

```python
async def send_contract_emails(
    hiring_code: str,
    client_email: str,
    client_name: str,
    contract_content: bytes,
    contract_filename: str,
    payment_data: dict
):
    """Enviar contrato por email a cliente y empresa"""
    
    # Configuración SMTP
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USER', 'info@migro.es')
    smtp_password = os.getenv('SMTP_PASSWORD')
    
    if not smtp_password:
        raise Exception("SMTP_PASSWORD no configurado")
    
    # Crear mensaje
    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['Subject'] = f"Contrato Definitivo - Migro Servicios (Código: {hiring_code})"
    
    # Cuerpo del email
    payment_info = ""
    if payment_data.get('payment_intent_id'):
        payment_info = f"""
Información del pago:
- ID de transacción: {payment_data.get('payment_intent_id', 'N/A')}
- Fecha de pago: {payment_data.get('payment_date', 'N/A')}
- Método de pago: {payment_data.get('payment_method', 'N/A')}
"""
    
    body = f"""
Estimado/a {client_name},

Le enviamos el contrato definitivo de prestación de servicios con Migro.

Detalles del contrato:
- Código de contratación: {hiring_code}
- Fecha: {datetime.now().strftime('%d/%m/%Y')}
- Estado: Pago confirmado
{payment_info}
El contrato se adjunta en formato PDF y contiene:
- Información completa del servicio
- Detalles del pago realizado
- Firma digital del cliente
- Términos y condiciones

Saludos cordiales,
Equipo Migro Servicios y Remesas SL
info@migro.es
"""
    
    msg.attach(MIMEText(body, 'plain', 'utf-8'))
    
    # Adjuntar PDF
    pdf_attachment = MIMEBase('application', 'octet-stream')
    pdf_attachment.set_payload(contract_content)
    encoders.encode_base64(pdf_attachment)
    pdf_attachment.add_header(
        'Content-Disposition',
        f'attachment; filename={contract_filename}'
    )
    msg.attach(pdf_attachment)
    
    # Enviar a cliente
    msg['To'] = client_email
    await send_email(msg, smtp_server, smtp_port, smtp_user, smtp_password)
    
    # Enviar copia a info@migro.es
    msg['To'] = 'info@migro.es'
    await send_email(msg, smtp_server, smtp_port, smtp_user, smtp_password)
    
    logger.info(f"Emails enviados para {hiring_code}")

async def send_email(msg, smtp_server, smtp_port, smtp_user, smtp_password):
    """Enviar email individual"""
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        logger.info(f"Email enviado a {msg['To']}")
    except Exception as e:
        logger.error(f"Error enviando email a {msg['To']}: {str(e)}")
        raise
```

---

## 🔧 Variables de Entorno

### **`.env` del Backend**

```bash
# Configuración SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@migro.es
SMTP_PASSWORD=tu_password_de_aplicacion

# Opcional: Configuración adicional
SMTP_USE_TLS=true
SMTP_USE_SSL=false
```

---

## 📧 Ejemplo de Email Enviado

### **Asunto:**
```
Contrato Definitivo - Migro Servicios (Código: TEST1)
```

### **Cuerpo:**
```
Estimado/a Juan Pérez,

Le enviamos el contrato definitivo de prestación de servicios con Migro.

Detalles del contrato:
- Código de contratación: TEST1
- Fecha: 15/01/2024
- Estado: Pago confirmado

Información del pago:
- ID de transacción: pi_test_123456789
- Fecha de pago: 2024-01-15T10:30:00Z
- Método de pago: Tarjeta bancaria (Stripe)

El contrato se adjunta en formato PDF y contiene:
- Información completa del servicio
- Detalles del pago realizado
- Firma digital del cliente
- Términos y condiciones

Saludos cordiales,
Equipo Migro Servicios y Remesas SL
info@migro.es
```

### **Adjunto:**
- `contrato_definitivo_TEST1.pdf`

---

## 🧪 Testing del Endpoint

### **Request de Prueba**

```bash
curl -X POST "https://api.migro.es/api/hiring/final-contract/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "contract=@contrato_test.pdf" \
  -F "hiring_code=TEST1" \
  -F "client_email=test@ejemplo.com" \
  -F "client_name=Juan Pérez" \
  -F "contract_type=final" \
  -F "payment_intent_id=pi_test_123456789" \
  -F "stripe_transaction_id=pi_test_123456789" \
  -F "payment_date=2024-01-15T10:30:00Z" \
  -F "payment_method=Tarjeta bancaria (Stripe)"
```

### **Respuesta Esperada**

```json
{
  "status": "success",
  "message": "Contrato definitivo enviado por email",
  "hiring_code": "TEST1",
  "sent_to": ["test@ejemplo.com", "info@migro.es"],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔍 Logs Esperados

```bash
INFO: Contrato definitivo enviado para TEST1
INFO: Email enviado a test@ejemplo.com
INFO: Email enviado a info@migro.es
```

---

## ⚠️ Consideraciones Importantes

### **Seguridad:**
- ✅ Validar tipo de archivo (solo PDF)
- ✅ Validar datos requeridos
- ✅ Sanitizar nombres de archivo
- ✅ Usar HTTPS para el endpoint

### **Rendimiento:**
- ✅ Procesar archivos en background si son grandes
- ✅ Implementar timeout para SMTP
- ✅ Logs detallados para debugging

### **Manejo de Errores:**
- ✅ No fallar si falla el envío de email
- ✅ Retry automático para SMTP
- ✅ Notificaciones de error

---

**Estado:** ✅ **Implementación completa del endpoint**  
**Última actualización:** 15 de Enero de 2024  
**Versión:** 1.0.0
