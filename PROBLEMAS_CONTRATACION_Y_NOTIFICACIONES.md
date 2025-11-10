# 🔧 Problemas: Contratación y Notificaciones Chat

## 📋 Problema 1: Error 401 en Creación de Contratos

### **Error Reportado:**
```bash
curl -X POST "https://api.migro.es/api/admin/contracts/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "X-Admin-Password: Pomelo2005.1@" \
  -d '{...}'

Response 401: {
  "detail": "Contraseña de administrador incorrecta"
}
```

### **Análisis del Problema:**

1. **Discrepancia en la contraseña:**
   - El usuario está usando: `Pomelo2005.1@` (con @ al final)
   - La documentación muestra: `Pomelo2005.1` (sin @)
   - El backend probablemente espera: `Pomelo2005.1` (sin @)

2. **Doble autenticación:**
   - Se está enviando tanto `Authorization: Bearer` como `X-Admin-Password`
   - El endpoint `/api/admin/contracts/` probablemente solo requiere `X-Admin-Password`

3. **Endpoint diferente:**
   - El frontend usa: `/admin/hiring/create` (con Bearer token)
   - El usuario está probando: `/api/admin/contracts/` (con X-Admin-Password)
   - Pueden ser endpoints diferentes con autenticación diferente

### **Soluciones:**

#### **Opción 1: Corregir la contraseña (Recomendado)**

**Solución inmediata:** Usar la contraseña correcta sin el `@`:

```bash
curl -X POST "https://api.migro.es/api/admin/contracts/" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: Pomelo2005.1" \
  -d '{
    "user_id": "dbe1626c-1479-447e-a86f-790123223d87",
    "catalog_item_id": 2,
    "amount": 180,
    "currency": "EUR",
    "contract_template": null,
    "expires_in_days": 30,
    "description": null,
    "grade": null,
    "client_name": null,
    "client_email": null,
    "client_passport": null,
    "client_nie": null,
    "client_address": null,
    "client_city": null,
    "client_province": null,
    "client_postal_code": null,
    "service_name": "Renovación Estancia por Estudios",
    "service_description": "Prórroga anual para continuar tus estudios."
  }'
```

#### **Opción 2: Verificar la contraseña en el backend**

Si la contraseña correcta es `Pomelo2005.1@`, entonces el backend necesita ser actualizado para aceptarla.

**Archivo a revisar en el backend:**
```python
# Buscar en: app/api/v1/endpoints/admin_contracts.py
# O en: app/core/deps.py

ADMIN_PASSWORD = "Pomelo2005.1"  # ← Verificar si debe ser "Pomelo2005.1@" o "Pomelo2005.1"
```

#### **Opción 3: Usar el endpoint del frontend**

El frontend usa `/admin/hiring/create` con Bearer token. Si ese endpoint funciona, usarlo:

```bash
curl -X POST "https://api.migro.es/api/admin/hiring/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{...}'
```

**Nota:** El frontend (`src/services/adminService.ts`) usa este endpoint con Bearer token, no con `X-Admin-Password`.

---

## 📋 Problema 2: Notificaciones Push del Chat No Llegan

### **Problema Reportado:**
- ✅ Las notificaciones push funcionan cuando se prueban directamente desde Firebase
- ❌ Las notificaciones NO llegan cuando se usan mensajes del chat
- ✅ Los usuarios tienen tokens push registrados

### **Análisis del Problema:**

El problema está en el **BACKEND**, no en el frontend. Cuando se crea un mensaje de chat, el backend debería:

1. Guardar el mensaje en la base de datos
2. Obtener los tokens push de los usuarios destinatarios
3. Enviar notificaciones push a través de Firebase Cloud Messaging (FCM)

### **Soluciones:**

#### **1. Verificar que el backend envíe notificaciones**

**Archivos a revisar en el backend:**

```python
# Buscar en:
# - app/api/v1/endpoints/chat.py o messages.py
# - app/services/notification_service.py
# - app/services/firebase_service.py
```

**Código esperado:**

```python
# Cuando se crea un mensaje de chat
async def create_chat_message(message_data: MessageCreate, db: Session):
    # 1. Guardar mensaje
    message = ChatMessage(**message_data.dict())
    db.add(message)
    db.commit()
    
    # 2. Obtener destinatarios
    recipients = get_message_recipients(message.chat_id, message.sender_id)
    
    # 3. Enviar notificaciones push
    for recipient in recipients:
        push_tokens = get_user_push_tokens(recipient.id)
        for token in push_tokens:
            await send_push_notification(
                token=token,
                title="Nuevo mensaje",
                body=message.content[:100],
                data={"chat_id": message.chat_id, "message_id": message.id}
            )
    
    return message
```

#### **2. Verificar configuración de Firebase**

**Variables de entorno del backend:**

```bash
# .env del backend
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_PRIVATE_KEY=tu-private-key
FIREBASE_CLIENT_EMAIL=tu-client-email
FIREBASE_DATABASE_URL=https://tu-proyecto.firebaseio.com
```

#### **3. Verificar que los tokens push estén registrados**

**Query para verificar tokens:**

```sql
-- Verificar que los usuarios tengan tokens push registrados
SELECT u.id, u.email, pt.token, pt.platform, pt.created_at
FROM users u
LEFT JOIN push_tokens pt ON pt.user_id = u.id
WHERE pt.token IS NOT NULL;
```

#### **4. Verificar logs del backend**

Buscar errores relacionados con Firebase:

```bash
# En los logs del backend buscar:
- "Firebase"
- "FCM"
- "push notification"
- "error sending notification"
```

#### **5. Código de ejemplo para enviar notificaciones**

**Si falta la implementación, agregar:**

```python
# app/services/firebase_service.py
from firebase_admin import messaging
import firebase_admin
from firebase_admin import credentials

def initialize_firebase():
    """Inicializar Firebase Admin SDK"""
    if not firebase_admin._apps:
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace('\\n', '\n'),
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        })
        firebase_admin.initialize_app(cred)

async def send_push_notification(
    token: str,
    title: str,
    body: str,
    data: dict = None
) -> bool:
    """Enviar notificación push a un dispositivo"""
    try:
        initialize_firebase()
        
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )
        
        response = messaging.send(message)
        logger.info(f"✅ Notificación enviada: {response}")
        return True
        
    except messaging.UnregisteredError:
        logger.warning(f"⚠️ Token no registrado: {token}")
        # Eliminar token inválido de la BD
        await delete_invalid_token(token)
        return False
    except Exception as e:
        logger.error(f"❌ Error enviando notificación: {e}")
        return False
```

#### **6. Verificar que se llame al servicio de notificaciones**

**En el endpoint de creación de mensajes:**

```python
# app/api/v1/endpoints/chat.py
from app.services.firebase_service import send_push_notification
from app.services.notification_service import get_user_push_tokens

@router.post("/messages")
async def create_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Crear mensaje
    message = create_chat_message(message_data, db, current_user.id)
    
    # Obtener destinatarios (excluyendo al remitente)
    chat = get_chat(message_data.chat_id, db)
    recipients = [u for u in chat.participants if u.id != current_user.id]
    
    # Enviar notificaciones push
    for recipient in recipients:
        tokens = get_user_push_tokens(recipient.id, db)
        for token in tokens:
            await send_push_notification(
                token=token.token,
                title=f"Nuevo mensaje de {current_user.name}",
                body=message.content[:100],
                data={
                    "type": "chat_message",
                    "chat_id": str(message.chat_id),
                    "message_id": str(message.id),
                    "sender_id": str(current_user.id),
                }
            )
    
    return message
```

---

## ✅ Checklist de Verificación

### **Para el Problema 1 (Contratación):**

- [ ] Verificar la contraseña correcta en el backend (`Pomelo2005.1` vs `Pomelo2005.1@`)
- [ ] Probar el endpoint con la contraseña correcta
- [ ] Verificar que el endpoint `/api/admin/contracts/` acepta `X-Admin-Password`
- [ ] Verificar logs del backend para ver qué contraseña espera

### **Para el Problema 2 (Notificaciones Chat):**

- [ ] Verificar que existe código para enviar notificaciones push en el backend
- [ ] Verificar que Firebase está configurado correctamente
- [ ] Verificar que los tokens push están registrados en la BD
- [ ] Verificar logs del backend para errores de Firebase
- [ ] Probar enviando un mensaje y verificar logs
- [ ] Verificar que el servicio de notificaciones se llama después de crear mensajes

---

## 🔍 Comandos Útiles para Debugging

### **Backend - Verificar contraseña admin:**

```bash
# Buscar en el código del backend:
grep -r "Pomelo2005" backend/
grep -r "ADMIN_PASSWORD" backend/
grep -r "verify_admin_password" backend/
```

### **Backend - Verificar notificaciones:**

```bash
# Buscar código de notificaciones:
grep -r "send_push_notification" backend/
grep -r "firebase" backend/
grep -r "FCM" backend/
grep -r "messaging.send" backend/
```

### **Backend - Ver logs:**

```bash
# Ver logs en tiempo real:
tail -f backend/logs/app.log | grep -i "notification\|firebase\|push"
```

---

## 📝 Notas Importantes

1. **Ambos problemas están en el BACKEND**, no en el frontend
2. El frontend solo hace las llamadas HTTP, la lógica de autenticación y notificaciones está en el backend
3. Para el problema de contratación, verificar la contraseña exacta que espera el backend
4. Para el problema de notificaciones, verificar que el código de envío existe y se ejecuta correctamente

---

*Última actualización: 2025-01-XX*

