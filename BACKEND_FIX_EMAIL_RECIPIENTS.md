# 🔴 ACTUALIZACIÓN - Agregar agustin@migro.es a los Emails de Contrato

## 🎯 Problema

El endpoint `/hiring/final-contract/upload` actualmente envía el contrato definitivo a:
1. ✅ Email del cliente
2. ✅ `info@migro.es`

Pero **FALTA**:
3. ❌ `agustin@migro.es`

---

## ✅ Solución

Modificar la función `send_contract_emails()` para enviar a **3 destinatarios**.

---

## 🔧 Cambios Requeridos

### **Ubicar la función:**

Archivo: Probablemente en `app/api/endpoints/hiring.py` o similar.

```python
async def send_contract_emails(
    hiring_code: str,
    client_email: str,
    client_name: str,
    contract_content: bytes,
    contract_filename: str,
    payment_data: dict
):
```

---

### **Código Actual (❌ INCORRECTO):**

```python
# Enviar a cliente
msg['To'] = client_email
await send_email(msg, smtp_server, smtp_port, smtp_user, smtp_password)

# Enviar copia a info@migro.es
msg['To'] = 'info@migro.es'
await send_email(msg, smtp_server, smtp_port, smtp_user, smtp_password)

logger.info(f"Emails enviados para {hiring_code}")
```

---

### **Código Correcto (✅):**

```python
# Lista de destinatarios
recipients = [
    client_email,           # Cliente
    'info@migro.es',        # Soporte general
    'agustin@migro.es'      # Administrador
]

# Enviar a todos los destinatarios
for recipient in recipients:
    msg['To'] = recipient
    try:
        await send_email(msg, smtp_server, smtp_port, smtp_user, smtp_password)
        logger.info(f"✅ Email enviado a {recipient}")
    except Exception as e:
        logger.error(f"❌ Error enviando email a {recipient}: {str(e)}")
        # No hacer raise para que continúe enviando a los demás
        continue

logger.info(f"Proceso de envío completado para {hiring_code}")
```

---

## 📊 Resumen de Destinatarios

### **Antes (❌):**
```json
{
  "sent_to": [
    "cliente@ejemplo.com",
    "info@migro.es"
  ]
}
```

### **Después (✅):**
```json
{
  "sent_to": [
    "cliente@ejemplo.com",
    "info@migro.es",
    "agustin@migro.es"
  ]
}
```

---

## 🧪 Testing

Después del cambio, verificar en los logs del backend:

```bash
✅ Email enviado a cliente@ejemplo.com
✅ Email enviado a info@migro.es
✅ Email enviado a agustin@migro.es
Proceso de envío completado para TEST1
```

---

## ⚠️ Importante

### **Manejo de Errores:**

Si falla el envío a un destinatario (ej: `agustin@migro.es` no existe), el sistema debe:
1. ✅ Logear el error
2. ✅ Continuar enviando a los demás destinatarios
3. ✅ NO hacer `raise` que detendría todo el proceso
4. ✅ Retornar `status: "success"` si al menos el cliente recibió el email

### **Respuesta del Endpoint:**

También actualizar la respuesta del endpoint para reflejar los 3 destinatarios:

```python
return {
    "status": "success",
    "message": "Contrato definitivo enviado por email",
    "hiring_code": hiring_code,
    "sent_to": recipients,  # ✅ Ahora son 3 emails
    "timestamp": datetime.utcnow().isoformat()
}
```

---

## 📋 Checklist

- [ ] Modificar `send_contract_emails()` para incluir `agustin@migro.es`
- [ ] Implementar manejo de errores por destinatario (no hacer raise)
- [ ] Actualizar respuesta del endpoint con la lista completa
- [ ] Verificar en logs que se envían los 3 emails
- [ ] Testing con código TEST1

---

**Prioridad:** MEDIA  
**Impacto:** Los emails se están enviando correctamente, solo falta agregar un destinatario adicional.

---

¿Puedes agregar `agustin@migro.es` a la lista de destinatarios del contrato definitivo?

Gracias! 🙏

