# Backend: OTP (email/SMS) para Portal Cliente + Telnyx (requisitos técnicos)

## Objetivo
Implementar autenticación **OTP** (one-time password) para clientes en el portal `/clientes`, donde el cliente **no usa contraseña**:

- Input: **email o teléfono**
- Acción: **enviar código OTP** por **Email** o **SMS**
- Acción: **verificar OTP** y emitir **JWT tokens**

El frontend ya consume:
- `POST /auth/otp/request`
- `POST /auth/otp/verify`

## Endpoints (contrato propuesto)

### 1) `POST /auth/otp/request`
Body:
```json
{ "identifier": "cliente@email.com" }
```
o:
```json
{ "identifier": "+34600111222" }
```

Respuesta 200:
```json
{ "message": "otp_sent" }
```

Errores esperados:
- 400: identifier inválido
- 404: usuario no existe (si aplica)
- 429: rate limit (recomendado)

### 2) `POST /auth/otp/verify`
Body:
```json
{ "identifier": "cliente@email.com", "code": "123456" }
```

Respuesta 200 (igual a login normal):
```json
{
  "access_token": "…",
  "refresh_token": "…",
  "token_type": "bearer",
  "expires_in": 1209600,
  "refresh_expires_in": 2592000
}
```

Errores esperados:
- 400: código inválido/expirado
- 429: demasiados intentos

## Reglas / Seguridad recomendada
- **TTL** de OTP: 5–10 minutos.
- **Longitud**: 6 dígitos numéricos.
- **Rate limit**:
  - request: 3–5 envíos por 15 min por identifier + IP
  - verify: 5–10 intentos por 15 min por identifier + IP
- **No filtrar existencia de usuario** en mensajes (evitar enumeración).
- **Auditoría**: log de request/verify (sin guardar el código en claro).

## Envío SMS: Telnyx (backend)

### Credenciales/Config
Definir variables de entorno:
- `TELNYX_API_KEY`
- `TELNYX_FROM_NUMBER` (E.164, ej `+34...`) **o** `TELNYX_MESSAGING_PROFILE_ID`
- `TELNYX_SENDER_ID` (opcional, según país/regulación)
- `OTP_MESSAGE_TEMPLATE` (opcional)

### Requisitos de formato
- Teléfono debe normalizarse a **E.164** (`+34...`).
- Contenido recomendado:
  - “Migro: tu código es 123456. Expira en 10 minutos.”

### Implementación (alto nivel)
- `request`:
  - detectar si identifier es email o teléfono
  - generar OTP + persistir hash (DB/Redis) con TTL
  - si teléfono → llamar Telnyx Messages API
  - si email → enviar email (SMTP/Sendgrid/etc.)
- `verify`:
  - validar OTP (hash + TTL + rate limit)
  - emitir tokens JWT (access + refresh)

## Preguntas que el backend debe confirmar (para cerrar implementación)
- **¿El OTP es para “clientes” (rol user) o también para staff?**
- **¿Cuál es el “from” real** permitido por Telnyx (número / messaging profile) para España?
- **¿Proveedor email** actual (SMTP/Sendgrid) para OTP por correo?
- **¿Dónde guardar OTP** (DB vs Redis) y TTL exacto?
- **¿Política de rate limit** y mensajes de error deseados?
- **¿Se necesita UI de “Crear cuenta”** o solo OTP a usuarios existentes?

