# Ruta `/clientes` (portal cliente) — frontend

## Objetivo
`/clientes` es el **slug del portal cliente** (público), pensado para iniciar el flujo de contratación con un `hiring_code`.

## Rutas implementadas
- **`/clientes`**: landing del portal cliente.
- **`/clientes/:code`**: inicia el flujo de contratación reutilizando `HiringFlow`.

> Nota: seguimos soportando el flujo histórico en `/contratacion/:code` y `/hiring/:code`.

## Importante: CRM vs Portal cliente
- **CRM interno** (requiere sesión): `/crm/contacts` (y resto de `/crm/...`).
- **Portal cliente** (público): `/clientes` (y `/clientes/:code`).

Para evitar confusión en usuarios no autenticados, el botón de “Buscar Contactos” del home solo se muestra si hay sesión activa.

## Login de clientes (OTP)
En `/clientes` el login es **sin contraseña**:
- El usuario ingresa **email o teléfono**.
- Se solicita un código OTP al backend (`POST /auth/otp/request`).
- Se verifica el código (`POST /auth/otp/verify`) y se guardan tokens.

Backend: ver `docs/BACKEND_TELNYX_OTP_SMS_REQUIREMENTS.md` para implementar SMS con Telnyx (y email OTP).

## Detalles técnicos
- Se añadió `/clientes` a la lista de rutas públicas en `src/providers/AuthProvider.tsx` para evitar verificaciones de sesión innecesarias en el portal cliente.
- Se añadió título SEO para `/clientes` en `src/config/pageTitles.ts`.

## Problema original (histórico)
Se observó un “404” visual al navegar a rutas no registradas. El servidor devuelve `index.html` (SPA), por lo que el “404” era del **router** (React), no del servidor.

