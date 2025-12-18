# 🔐 Configuración de Tokens: 14 Días de Expiración

## 📋 Resumen del Cambio

Los **access tokens** ahora tienen una duración de **14 días** (anteriormente 8 días). Los **refresh tokens** mantienen una duración de **30 días** para permitir renovaciones continuas.

### Valores Actualizados

- **Access Token**: 14 días = 1,209,600 segundos
- **Refresh Token**: 30 días = 2,592,000 segundos

---

## 🔄 Cambios en el Backend

### Configuración Actualizada

```python
# app/core/config.py
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 14  # 14 days
REFRESH_TOKEN_EXPIRE_DAYS: int = 30
```

### Respuesta del Endpoint de Login

El endpoint `/api/v1/auth/login` ahora retorna:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1209600,        // 14 días en segundos
  "refresh_expires_in": 2592000 // 30 días en segundos
}
```

---

## 📱 Implementación en el Frontend

### 1. TokenStorage - Gestión Centralizada

Se creó una clase `TokenStorage` en `src/utils/tokenStorage.ts` que centraliza el manejo de tokens:

#### Características Principales

- **Usa `expires_in` del servidor**: No hardcodea valores, usa los tiempos del response
- **Buffer de 2 minutos**: Refresca proactivamente antes de que expire
- **Gestión de expiración**: Verifica tanto access como refresh tokens
- **Compatibilidad**: Mantiene `admin_token` para compatibilidad con código existente

#### Métodos Principales

```typescript
// Guardar tokens después del login
TokenStorage.saveTokens(tokens: TokenData): void

// Verificar si el access token está expirado (con buffer de 2 min)
TokenStorage.isTokenExpired(): boolean

// Verificar si el refresh token está expirado
TokenStorage.isRefreshTokenExpired(): boolean

// Obtener tiempo restante hasta expiración
TokenStorage.getTimeUntilExpiration(): number

// Obtener tokens
TokenStorage.getAccessToken(): string | null
TokenStorage.getRefreshToken(): string | null

// Limpiar todos los tokens
TokenStorage.clearTokens(): void
```

### 2. Actualización de Servicios

#### authService.ts

Todos los métodos de login ahora usan `TokenStorage.saveTokens()`:

- ✅ `login()` - Login con email/password
- ✅ `register()` - Registro de nuevos usuarios
- ✅ `refreshToken()` - Refresh de tokens
- ✅ `loginWithGoogle()` - OAuth Google
- ✅ `loginWithFacebook()` - OAuth Facebook
- ✅ `loginWithApple()` - OAuth Apple
- ✅ `oauthLogin()` - OAuth genérico

Todos los métodos de logout usan `TokenStorage.clearTokens()`:

- ✅ `logout()` - Logout individual
- ✅ `logoutAll()` - Logout desde todos los dispositivos
- ✅ `deleteAccount()` - Eliminar cuenta

#### api.ts

El interceptor de Axios ahora usa `TokenStorage`:

- ✅ Verifica expiración usando `TokenStorage.isTokenExpired()`
- ✅ Refresca tokens usando `TokenStorage.saveTokens()`
- ✅ Limpia tokens usando `TokenStorage.clearTokens()`
- ✅ Mantiene compatibilidad con verificación JWT para tokens existentes

#### adminService.ts

Actualizado para usar `TokenStorage.saveTokens()` en el método `login()`.

#### AuthProvider.tsx

Actualizado para usar `TokenStorage.clearTokens()` en `clearAuth()`.

### 3. Hook de Refresh Proactivo

Se creó `src/hooks/useTokenRefresh.ts` que:

- Verifica cada 5 minutos si el token necesita refresh
- Refresca automáticamente si está próximo a expirar (buffer de 2 minutos)
- Se integra automáticamente en `App.tsx`

#### Uso

```typescript
// En App.tsx
function AppContent() {
  useTokenRefresh(); // Activa refresh automático
  // ...
}
```

---

## 🔄 Flujo de Refresh Automático

### 1. Refresh en Request Interceptor

Cuando se hace una petición HTTP:

1. Verifica si el token está expirado usando `TokenStorage.isTokenExpired()`
2. Si está expirado o próximo a expirar (buffer de 2 min), llama a `refreshTokenProactively()`
3. Guarda los nuevos tokens usando `TokenStorage.saveTokens()`
4. Continúa con la petición original

### 2. Refresh en Response Interceptor

Si se recibe un 401:

1. Intenta refrescar el token
2. Reintenta la petición original con el nuevo token
3. Si falla, limpia tokens y redirige al login

### 3. Refresh Proactivo con Hook

Cada 5 minutos:

1. Verifica si el token está próximo a expirar
2. Si es así, lo refresca automáticamente
3. Evita que el token expire durante sesiones largas

---

## 🔄 Endpoint de Refresh

### POST `/api/v1/auth/refresh`

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1209600,        // Nuevo access token: 14 días
  "refresh_expires_in": 2592000 // Nuevo refresh token: 30 días
}
```

**Errores:**
- `400 Bad Request`: Token inválido o expirado
- `400 Bad Request`: Token type incorrecto
- `400 Bad Request`: Usuario no encontrado o inactivo

---

## ✅ Checklist de Implementación

- [x] Crear `TokenStorage` en `src/utils/tokenStorage.ts`
- [x] Actualizar `authService.ts` para usar `TokenStorage.saveTokens()`
- [x] Actualizar `api.ts` para usar `TokenStorage`
- [x] Actualizar `adminService.ts` para usar `TokenStorage`
- [x] Actualizar `AuthProvider.tsx` para usar `TokenStorage`
- [x] Crear hook `useTokenRefresh.ts`
- [x] Integrar `useTokenRefresh` en `App.tsx`
- [x] Actualizar documentación

---

## 🧪 Pruebas Recomendadas

1. **Login y almacenamiento**: Verificar que los tokens se guardan correctamente con `expires_in`
2. **Expiración**: Esperar o simular expiración y verificar refresh automático
3. **Refresh manual**: Llamar al endpoint de refresh y verificar nuevos tokens
4. **Refresh expirado**: Intentar refresh con token expirado y verificar redirección
5. **Sesión larga**: Dejar la aplicación abierta y verificar que no se desconecta
6. **Múltiples pestañas**: Verificar sincronización de tokens entre pestañas

---

## 📝 Notas Importantes

1. **No hardcodear valores**: Siempre usar `expires_in` del response del servidor
2. **Buffer de expiración**: Usar 2 minutos de buffer para refresh proactivo
3. **Manejo de errores**: Si el refresh falla, limpiar tokens y redirigir al login
4. **Seguridad**: Los tokens se revocan automáticamente al hacer refresh (el token anterior se marca como revocado)
5. **Múltiples pestañas**: Considerar usar eventos de storage para sincronizar tokens entre pestañas
6. **Compatibilidad**: Se mantiene `admin_token` y `admin_user` en localStorage para compatibilidad

---

## 🔍 Verificación

Para verificar que funciona correctamente:

1. Abre la consola del navegador (F12)
2. Busca mensajes que empiecen con `🔄 Token expirará en...` o `✅ Token refrescado exitosamente`
3. Verifica que el refresh solo ocurre cuando quedan menos de 2 minutos
4. Verifica que los tokens se guardan con `expires_in` del servidor

---

## 📊 Comportamiento Esperado

### Con tokens de 14 días

- El token se refrescará automáticamente cuando queden menos de 2 minutos
- El hook `useTokenRefresh` verificará cada 5 minutos
- Las peticiones HTTP verificarán antes de cada request

### Flujo de Sesión Larga

1. Usuario hace login → Token guardado con expiración de 14 días
2. Cada 5 minutos → Hook verifica si necesita refresh
3. Cada request → Interceptor verifica si necesita refresh
4. Si quedan < 2 minutos → Refresh automático
5. Nuevo token → Guardado con nueva expiración de 14 días
6. Proceso se repite → Sesión puede durar indefinidamente mientras el refresh token sea válido

---

## 🔗 Referencias

- [Guía de Autenticación Frontend](./FRONTEND_AUTHENTICATION_GUIDE.md)
- [Ajuste de Buffer de Expiración](./TOKEN_EXPIRATION_BUFFER_ADJUSTMENT.md)
- [Documentación API - Auth](./api/authentication.md)

---

## 📁 Archivos Modificados

- `src/utils/tokenStorage.ts` (nuevo)
- `src/services/authService.ts`
- `src/services/api.ts`
- `src/services/adminService.ts`
- `src/providers/AuthProvider.tsx`
- `src/hooks/useTokenRefresh.ts` (nuevo)
- `src/App.tsx`

---

**Última actualización**: 2024-12-19
**Versión API**: 1.0.0
**Estado**: ✅ Implementado
