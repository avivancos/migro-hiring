## Objetivo
Agregar un **login OTP** (código de un solo uso) para el panel de administración/CRM, permitiendo acceso con **email o teléfono** + **código**.

## UX / Flujo
Ruta: `GET /auth/login-otp`

1) **Solicitar código**
- Input: **Email o teléfono**
- Acción: **Enviar código**
- Resultado: pasa a step “verificar” y muestra mensaje informativo.

2) **Verificar código**
- Input: **Código OTP**
- Acción: **Acceder**
- Resultado: si es válido, se guardan tokens y se navega a `returnUrl` o `/admin/dashboard`.

Extras:
- Botón **Reenviar código**
- Botón **Volver a login con contraseña** (`/auth/login`)

## Integración (frontend)
- Página: `src/pages/AdminLoginOtp.tsx`
- Ruta registrada en: `src/App.tsx`
- Título SEO: `src/config/pageTitles.ts`
- Rutas públicas (no forzar checkAuth): `src/providers/AuthProvider.tsx`

## Servicios
Se agregaron métodos en `authService` (frontend):
- `authService.requestOtp(identifier)`
- `authService.verifyOtp(identifier, code)` → retorna `TokenPair` y guarda tokens en `TokenStorage`.

AuthProvider expone:
- `requestOtp(identifier)`
- `loginOtp(identifier, code)`

## Notas
- El campo **identifier** se normaliza de forma ligera (trim; si parece teléfono, se remueven espacios/guiones/paréntesis). La normalización “real” (E.164, validación) debe vivir en backend.

