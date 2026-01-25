## Objetivo
Soportar **login OTP** (código de un solo uso) para autenticar usuarios con **email o teléfono**, devolviendo `TokenPair` estándar.

## Endpoints propuestos

### 1) POST `/api/auth/otp/request`
Solicita envío de OTP al canal correspondiente.

Body:
```json
{
  "identifier": "juan@migro.es"
}
```

Notas:
- `identifier` puede ser email o teléfono.
- Si es teléfono, idealmente aceptar E.164 (`+34...`) y/o normalizar.

Respuesta (sugerida):
```json
{ "message": "OTP enviado" }
```

### 2) POST `/api/auth/otp/verify`
Verifica OTP y emite tokens.

Body:
```json
{
  "identifier": "juan@migro.es",
  "code": "123456"
}
```

Respuesta:
```json
{
  "access_token": "....",
  "refresh_token": "....",
  "token_type": "bearer",
  "expires_in": 1209600,
  "refresh_expires_in": 2592000
}
```

## Reglas recomendadas (seguridad)
- **TTL OTP**: 5–10 minutos.
- **Intentos máximos**: 5 por OTP.
- **Rate limiting**: por IP + por usuario/identifier (p. ej. 3/min, 10/h).
- **Auditoría**: log de request/verify (sin guardar el código en claro).
- **No enumeración**: respuesta genérica aun si el usuario no existe.

## Compatibilidad frontend
El frontend actualmente llama:
- `POST /auth/otp/request`
- `POST /auth/otp/verify`

Si el backend expone bajo `/api/auth/...` (como el resto), mantener el `baseURL` actual lo resolverá. Si el prefijo cambia, actualizar rutas en `src/services/authService.ts`.

