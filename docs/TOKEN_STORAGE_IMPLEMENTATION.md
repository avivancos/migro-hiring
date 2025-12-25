# 🔐 Implementación de TokenStorage

## 📋 Resumen

Se implementó un sistema centralizado de gestión de tokens (`TokenStorage`) que utiliza los valores de `expires_in` del servidor en lugar de valores hardcodeados, permitiendo una gestión más flexible y precisa de la expiración de tokens.

---

## 🎯 Objetivos

1. **Centralizar la gestión de tokens**: Un solo punto de control para guardar, verificar y limpiar tokens
2. **Usar valores del servidor**: No hardcodear tiempos de expiración, usar `expires_in` del response
3. **Refresh proactivo**: Refrescar tokens antes de que expiren (buffer de 2 minutos)
4. **Compatibilidad**: Mantener compatibilidad con código existente que usa `admin_token`

---

## 📁 Estructura de Archivos

### Nuevos Archivos

- `src/utils/tokenStorage.ts` - Clase TokenStorage
- `src/hooks/useTokenRefresh.ts` - Hook para refresh proactivo

### Archivos Modificados

- `src/services/authService.ts` - Usa TokenStorage en todos los métodos
- `src/services/api.ts` - Usa TokenStorage en interceptors
- `src/services/adminService.ts` - Usa TokenStorage en login
- `src/providers/AuthProvider.tsx` - Usa TokenStorage en clearAuth
- `src/App.tsx` - Integra useTokenRefresh hook

---

## 🔧 TokenStorage Class

### Ubicación

`src/utils/tokenStorage.ts`

### Responsabilidades

1. **Guardar tokens**: Almacena access_token, refresh_token y timestamps de expiración
2. **Verificar expiración**: Verifica si los tokens están expirados (con buffer)
3. **Obtener tokens**: Métodos para obtener access y refresh tokens
4. **Limpiar tokens**: Limpia todos los tokens del localStorage

### Métodos Públicos

```typescript
// Guardar tokens después del login o refresh
static saveTokens(tokens: TokenData): void

// Verificar si el access token está expirado (con buffer de 2 min)
static isTokenExpired(): boolean

// Verificar si el refresh token está expirado
static isRefreshTokenExpired(): boolean

// Obtener tiempo restante hasta expiración (en segundos)
static getTimeUntilExpiration(): number

// Obtener access token
static getAccessToken(): string | null

// Obtener refresh token
static getRefreshToken(): string | null

// Limpiar todos los tokens
static clearTokens(): void

// Verificar si hay tokens almacenados
static hasTokens(): boolean
```

### Almacenamiento

Los tokens se almacenan en localStorage con las siguientes claves:

- `access_token` - Token de acceso
- `refresh_token` - Token de refresh
- `token_expires_at` - Timestamp de expiración del access token (milisegundos)
- `refresh_expires_at` - Timestamp de expiración del refresh token (milisegundos)
- `admin_token` - Token de admin (compatibilidad)

### Buffer de Expiración

El método `isTokenExpired()` usa un buffer de **2 minutos**:

```typescript
const bufferTime = 2 * 60 * 1000; // 2 minutos en milisegundos
return Date.now() >= (parseInt(expiresAt) - bufferTime);
```

Esto significa que el token se considera "expirado" cuando quedan menos de 2 minutos, permitiendo un refresh proactivo.

---

## 🔄 Integración en Servicios

### authService.ts

**Antes:**
```typescript
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('refresh_token', data.refresh_token);
```

**Después:**
```typescript
TokenStorage.saveTokens({
  access_token: data.access_token,
  refresh_token: data.refresh_token,
  token_type: data.token_type || 'bearer',
  expires_in: data.expires_in || 1209600,
  refresh_expires_in: data.refresh_expires_in || 2592000,
});
```

### api.ts

**Antes:**
```typescript
let token = localStorage.getItem('access_token');
if (isTokenExpired(token)) {
  // refresh...
}
```

**Después:**
```typescript
let token = TokenStorage.getAccessToken();
if (TokenStorage.isTokenExpired()) {
  // refresh usando TokenStorage...
}
```

### refreshTokenProactively()

**Antes:**
```typescript
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', newRefreshToken);
```

**Después:**
```typescript
TokenStorage.saveTokens({
  access_token: data.access_token,
  refresh_token: data.refresh_token || refreshToken,
  token_type: data.token_type || 'bearer',
  expires_in: data.expires_in || 1209600,
  refresh_expires_in: data.refresh_expires_in || 2592000,
});
```

---

## 🪝 Hook useTokenRefresh

### Ubicación

`src/hooks/useTokenRefresh.ts`

### Funcionalidad

Verifica cada 5 minutos si el token necesita refresh y lo refresca automáticamente si está próximo a expirar.

### Implementación

```typescript
export function useTokenRefresh() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const checkAndRefresh = async () => {
      if (TokenStorage.isTokenExpired()) {
        try {
          await authService.refreshToken();
          console.log('✅ Token refrescado exitosamente');
        } catch (error) {
          console.error('❌ Error al refrescar token:', error);
        }
      }
    };
    
    // Verificar inmediatamente
    checkAndRefresh();
    
    // Verificar cada 5 minutos
    intervalRef.current = setInterval(checkAndRefresh, 5 * 60 * 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
```

### Integración en App.tsx

```typescript
function AppContent() {
  useTokenRefresh(); // Activa refresh automático
  return <Routes>...</Routes>;
}
```

---

## 🔄 Flujo de Refresh

### 1. Refresh en Request Interceptor

```
Request → Verificar TokenStorage.isTokenExpired() 
        → Si expirado → refreshTokenProactively()
        → TokenStorage.saveTokens()
        → Continuar request
```

### 2. Refresh en Response Interceptor

```
401 Error → refreshTokenProactively()
          → TokenStorage.saveTokens()
          → Reintentar request
          → Si falla → TokenStorage.clearTokens() → Redirect login
```

### 3. Refresh Proactivo (Hook)

```
Cada 5 min → Verificar TokenStorage.isTokenExpired()
           → Si expirado → authService.refreshToken()
           → TokenStorage.saveTokens()
```

---

## ✅ Beneficios

1. **Centralización**: Un solo punto de control para tokens
2. **Flexibilidad**: Usa valores del servidor, no hardcodeados
3. **Precisión**: Verifica expiración usando timestamps exactos
4. **Proactividad**: Refresca antes de que expire
5. **Compatibilidad**: Mantiene `admin_token` para código existente
6. **Mantenibilidad**: Fácil de actualizar y depurar

---

## 🧪 Testing

### Verificar Guardado de Tokens

```typescript
// Después de login
const expiresAt = localStorage.getItem('token_expires_at');
const expectedExpiresAt = Date.now() + (1209600 * 1000); // 14 días
// Verificar que expiresAt está cerca de expectedExpiresAt
```

### Verificar Expiración

```typescript
// Simular expiración
localStorage.setItem('token_expires_at', String(Date.now() - 1000));
const isExpired = TokenStorage.isTokenExpired();
// Debe retornar true
```

### Verificar Refresh

```typescript
// Simular token próximo a expirar (menos de 2 minutos)
localStorage.setItem('token_expires_at', String(Date.now() + 60000)); // 1 minuto
const isExpired = TokenStorage.isTokenExpired();
// Debe retornar true (buffer de 2 minutos)
```

---

## 📝 Notas de Implementación

1. **Valores por defecto**: Si el servidor no envía `expires_in`, se usan valores por defecto (14 días para access, 30 días para refresh)
2. **Compatibilidad**: Se mantiene `admin_token` en localStorage para compatibilidad con código existente
3. **Buffer**: El buffer de 2 minutos es suficiente para refrescar antes de que expire, pero no tan agresivo como 5 minutos
4. **Limpieza**: `clearTokens()` limpia todos los tokens, incluyendo `admin_token` y `admin_user`

---

## 🔗 Referencias

- [Configuración de Tokens: 14 Días](./TOKEN_EXPIRATION_FIX.md)
- [Guía de Autenticación Frontend](./FRONTEND_AUTHENTICATION_GUIDE.md)

---

**Última actualización**: 2024-12-19
**Estado**: ✅ Implementado










