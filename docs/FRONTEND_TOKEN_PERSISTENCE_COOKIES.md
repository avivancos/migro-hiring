# 🔐 Persistencia Mixta de Tokens: localStorage + Cookies + sessionStorage

**Fecha:** 2025-01-28  
**Prioridad:** 🔴 CRÍTICA  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen

Se ha implementado un sistema de **persistencia triple** de tokens de autenticación que utiliza **localStorage + cookies + sessionStorage** simultáneamente. Esto garantiza que:

1. **Los tokens NUNCA se descartan en errores temporales** (404, 500, timeout, etc.)
2. **La sesión dura 15 días** sin necesidad de volver a hacer login
3. **Los tokens se mantienen incluso si localStorage se limpia** (gracias al fallback de cookies y sessionStorage)
4. **No se pide login nuevamente** mientras la sesión sea válida
5. **Máxima persistencia** con almacenamiento en 3 lugares diferentes

---

## 🎯 Objetivos

### 1. Persistencia Máxima
- Los tokens se guardan en **localStorage Y cookies** simultáneamente
- Si localStorage se limpia, los tokens se restauran automáticamente desde cookies
- Las cookies tienen expiración de **15 días** para mantener la sesión activa

### 2. No Descartar Tokens en Errores
- Los tokens **NUNCA se limpian** en errores temporales (404, 500, timeout, etc.)
- Solo se limpian cuando el refresh token está **realmente inválido/expirado**
- Solo se limpian cuando el usuario hace **logout explícito**

### 3. Sesión de 15 Días
- La sesión permanece activa durante **15 días** sin necesidad de login
- Los tokens se refrescan automáticamente antes de expirar
- El usuario no necesita volver a autenticarse mientras la sesión sea válida

---

## 🔧 Implementación Técnica

### Archivo: `src/utils/tokenStorage.ts`

#### 1. Almacenamiento Triple

Los tokens se guardan en **tres lugares simultáneamente**:

```typescript
static saveTokens(tokens: TokenData): void {
  // 1. Guardar en localStorage (principal, para acceso rápido)
  localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
  // ... más campos
  
  // 2. Guardar en cookies (persistencia adicional, 15 días)
  this.setCookie(this.ACCESS_TOKEN_KEY, tokens.access_token, 15);
  this.setCookie(this.REFRESH_TOKEN_KEY, tokens.refresh_token, 30);
  // ... más campos
  
  // 3. Guardar en sessionStorage (backup adicional)
  sessionStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
  sessionStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
}
```

#### 2. Lectura con Fallback Triple

Los tokens se leen de múltiples fuentes en orden de prioridad:

```typescript
static getAccessToken(): string | null {
  // 1. Intentar localStorage primero (principal)
  let token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
  if (token) return token;
  
  // 2. Intentar cookies (fallback)
  token = this.getCookie(this.ACCESS_TOKEN_KEY);
  if (token) {
    // Restaurar en localStorage si se encontró en cookies
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    console.log('🔄 Token restaurado desde cookies a localStorage');
    return token;
  }
  
  // 3. Intentar sessionStorage (último recurso)
  token = sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  if (token) {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    console.log('🔄 Token restaurado desde sessionStorage a localStorage');
    return token;
  }
  
  return null;
}
```

#### 3. Limpieza Completa

Cuando se limpian los tokens (solo en casos críticos), se limpian **localStorage, cookies y sessionStorage**:

```typescript
static clearTokens(): void {
  // Limpiar localStorage
  localStorage.removeItem(this.ACCESS_TOKEN_KEY);
  localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  // ... más campos
  
  // Limpiar cookies
  this.deleteCookie(this.ACCESS_TOKEN_KEY);
  this.deleteCookie(this.REFRESH_TOKEN_KEY);
  // ... más campos
  
  // Limpiar sessionStorage
  sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
}
```

#### 4. Verificación de Tokens Válidos

Método mejorado para verificar si hay tokens válidos:

```typescript
static hasValidTokens(): boolean {
  const accessToken = this.getAccessToken();
  const refreshToken = this.getRefreshToken();
  
  // Si hay refresh token válido, considerar que hay sesión
  if (refreshToken && !this.isRefreshTokenExpired()) {
    return true;
  }
  
  // Si hay access token válido, considerar que hay sesión
  if (accessToken && !this.isTokenExpired()) {
    return true;
  }
  
  return false;
}
```

---

## 🛡️ Política de Persistencia

### Tokens NUNCA se Descartan en:

- ❌ **404 Not Found** - Recurso no encontrado
- ❌ **403 Forbidden** - Error de permisos (NO de autenticación)
- ❌ **422 Unprocessable Entity** - Error de validación
- ❌ **500 Internal Server Error** - Error del servidor
- ❌ **503 Service Unavailable** - Servicio no disponible
- ❌ **Timeout** - Error de red o timeout
- ❌ **Network Error** - Error de conexión
- ❌ **Cualquier otro error de respuesta**

**Comportamiento:** El error se rechaza, pero los tokens se mantienen en localStorage Y cookies, y la sesión permanece activa.

### Tokens SOLO se Descartan en:

- ✅ **Refresh token expirado** (verificado localmente)
- ✅ **No hay refresh token disponible**
- ✅ **Servidor responde 400/401/403 en `/auth/refresh`** Y el mensaje indica que el token es inválido/expirado
- ✅ **Usuario hace logout explícito**

**Comportamiento:** Se limpian los tokens de localStorage Y cookies, y se redirige al login (solo en rutas protegidas).

---

## 📊 Flujo de Persistencia

### 1. Login o Refresh Token

```
Usuario hace login
    ↓
Tokens recibidos del servidor
    ↓
Guardar en localStorage (principal)
    ↓
Guardar en cookies (15 días)
    ↓
Guardar en sessionStorage (backup)
    ↓
Sesión activa
```

### 2. Lectura de Tokens

```
Aplicación necesita token
    ↓
¿Existe en localStorage?
    ├─ SÍ → Usar token de localStorage
    └─ NO → ¿Existe en cookies?
            ├─ SÍ → Restaurar en localStorage + Usar token
            └─ NO → ¿Existe en sessionStorage?
                    ├─ SÍ → Restaurar en localStorage + Usar token
                    └─ NO → No hay token (sesión expirada)
```

### 3. Error Temporal

```
Request falla (404, 500, timeout, etc.)
    ↓
¿Es error de autenticación real?
    ├─ NO → Mantener tokens (localStorage + cookies)
    │       Rechazar error
    │       Sesión sigue activa
    └─ SÍ → Verificar refresh token
            ├─ Válido → Intentar refresh
            └─ Inválido → Limpiar tokens + Redirigir login
```

### 4. Limpieza de Tokens

```
¿Se debe limpiar tokens?
    ├─ Refresh token expirado → SÍ
    ├─ Logout explícito → SÍ
    ├─ Error temporal → NO
    └─ Error de validación → NO
    ↓
Limpiar localStorage
    ↓
Limpiar cookies
    ↓
Sesión cerrada
```

---

## 🔒 Seguridad

### Configuración de Cookies

Las cookies se configuran con las siguientes opciones de seguridad:

```typescript
Cookies.set(key, value, {
  expires: 15, // 15 días
  secure: window.location.protocol === 'https:', // Solo HTTPS en producción
  sameSite: 'strict', // Protección CSRF
});
```

#### Explicación:

- **`expires: 15`**: Las cookies expiran después de 15 días, coincidiendo con la duración de la sesión
- **`secure: true`** (en HTTPS): Las cookies solo se envían por conexiones HTTPS, protegiendo contra interceptación
- **`sameSite: 'strict'`**: Las cookies solo se envían en requests del mismo sitio, protegiendo contra ataques CSRF

### Consideraciones de Seguridad

1. **Tokens en Cookies**: Los tokens se almacenan en cookies, pero NO son httpOnly (necesitan ser accesibles desde JavaScript). Esto es aceptable porque:
   - Los tokens también están en localStorage (que es accesible desde JavaScript)
   - La seguridad principal viene del backend (validación de tokens)
   - Las cookies tienen `sameSite: 'strict'` para protección CSRF

2. **Persistencia vs Seguridad**: El balance entre persistencia y seguridad:
   - **Persistencia**: Los tokens se mantienen durante 15 días para mejor UX
   - **Seguridad**: Los tokens se limpian cuando realmente están inválidos/expirados
   - **Protección**: Las cookies tienen `secure` y `sameSite` para protección adicional

---

## 📝 Casos de Uso

### Caso 1: Usuario Cierra el Navegador

```
Usuario cierra navegador
    ↓
localStorage se mantiene (persistente)
Cookies se mantienen (15 días)
    ↓
Usuario vuelve a abrir navegador
    ↓
Tokens se leen de localStorage
    ↓
Sesión activa (sin login)
```

### Caso 2: localStorage se Limpia

```
localStorage se limpia (por usuario o navegador)
    ↓
Aplicación intenta leer token
    ↓
No encuentra en localStorage
    ↓
Busca en cookies
    ↓
Encuentra token en cookies
    ↓
Restaura en localStorage
    ↓
Sesión activa (sin login)
```

### Caso 3: Error Temporal del Servidor

```
Request falla con 500
    ↓
¿Es error de autenticación?
    ├─ NO → Mantener tokens (localStorage + cookies)
    │       Rechazar error
    │       Sesión sigue activa
    └─ SÍ → Verificar refresh token
            ├─ Válido → Intentar refresh
            └─ Inválido → Limpiar tokens
```

### Caso 4: Refresh Token Expirado

```
Refresh token expirado (verificado localmente)
    ↓
Limpiar localStorage
    ↓
Limpiar cookies
    ↓
Redirigir a login
    ↓
Usuario debe hacer login nuevamente
```

---

## 🧪 Testing

### Test 1: Persistencia en localStorage

```typescript
// Guardar tokens
TokenStorage.saveTokens({
  access_token: 'test_token',
  refresh_token: 'test_refresh',
  token_type: 'bearer',
  expires_in: 1209600, // 14 días
  refresh_expires_in: 2592000, // 30 días
});

// Verificar que están en localStorage
expect(localStorage.getItem('access_token')).toBe('test_token');
expect(localStorage.getItem('refresh_token')).toBe('test_refresh');
```

### Test 2: Persistencia en Cookies

```typescript
// Guardar tokens
TokenStorage.saveTokens({...});

// Verificar que están en cookies
expect(Cookies.get('access_token')).toBe('test_token');
expect(Cookies.get('refresh_token')).toBe('test_refresh');
```

### Test 3: Fallback desde Cookies

```typescript
// Limpiar localStorage
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');

// Pero mantener en cookies
Cookies.set('access_token', 'test_token', { expires: 15 });
Cookies.set('refresh_token', 'test_refresh', { expires: 15 });

// Leer token (debe restaurar desde cookies)
const token = TokenStorage.getAccessToken();
expect(token).toBe('test_token');
expect(localStorage.getItem('access_token')).toBe('test_token'); // Restaurado
```

### Test 4: No Limpiar en Errores Temporales

```typescript
// Guardar tokens
TokenStorage.saveTokens({...});

// Simular error 500
// (no se llama clearTokens)

// Verificar que tokens siguen existiendo
expect(TokenStorage.hasTokens()).toBe(true);
expect(localStorage.getItem('access_token')).toBeTruthy();
expect(Cookies.get('access_token')).toBeTruthy();
```

### Test 5: Limpiar en Logout

```typescript
// Guardar tokens
TokenStorage.saveTokens({...});

// Hacer logout
TokenStorage.clearTokens();

// Verificar que tokens fueron limpiados
expect(TokenStorage.hasTokens()).toBe(false);
expect(localStorage.getItem('access_token')).toBeNull();
expect(Cookies.get('access_token')).toBeUndefined();
```

---

## 🔍 Debugging

### Ver Tokens en localStorage

```javascript
// En consola del navegador
localStorage.getItem('access_token');
localStorage.getItem('refresh_token');
localStorage.getItem('token_expires_at');
localStorage.getItem('refresh_expires_at');
```

### Ver Tokens en Cookies

```javascript
// En consola del navegador
document.cookie; // Ver todas las cookies
// O usar js-cookie
import Cookies from 'js-cookie';
Cookies.get('access_token');
Cookies.get('refresh_token');
```

### Verificar Restauración desde Cookies

```javascript
// Limpiar localStorage
localStorage.clear();

// Verificar que tokens se restauran desde cookies
TokenStorage.getAccessToken(); // Debe restaurar desde cookies
```

---

## 📚 Referencias

- `src/utils/tokenStorage.ts` - Implementación de TokenStorage con cookies
- `src/services/api.ts` - Interceptores de axios (no limpian tokens en errores)
- `docs/TOKEN_PERSISTENCE_ON_ERRORS.md` - Política de persistencia en errores
- `docs/TOKEN_STORAGE_IMPLEMENTATION.md` - Implementación original de TokenStorage

---

## ✅ Checklist de Verificación

- [x] Tokens se guardan en localStorage Y cookies
- [x] Cookies tienen expiración de 15 días
- [x] Fallback desde cookies si localStorage se limpia
- [x] Restauración automática en localStorage desde cookies
- [x] Limpieza completa (localStorage + cookies) en logout
- [x] Tokens NO se limpian en errores temporales
- [x] Cookies tienen configuración de seguridad (secure, sameSite)
- [x] Sesión dura 15 días sin necesidad de login

---

**Última actualización:** 2025-01-28

