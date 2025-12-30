# Persistencia de Tokens en Errores - Especificación

**Fecha:** 2025-01-28  
**Prioridad:** 🔴 CRÍTICA  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen

Se ha implementado una política estricta de **persistencia de tokens** que garantiza que los tokens de autenticación **NUNCA se descarten** por errores de respuesta del backend, excepto cuando el refresh token está realmente inválido o expirado.

---

## 🎯 Objetivo

**Garantizar que los errores de axios NO desliguen la sesión y que los tokens se mantengan siempre, excepto cuando el refresh token está realmente inválido/expirado.**

---

## ✅ Comportamiento Implementado

### 1. Tokens NUNCA se Descartan en Errores de Respuesta

Los tokens **NO se limpian** en los siguientes casos:

- ❌ **404 Not Found** - Recurso no encontrado
- ❌ **403 Forbidden** - Error de permisos (NO de autenticación)
- ❌ **422 Unprocessable Entity** - Error de validación
- ❌ **500 Internal Server Error** - Error del servidor
- ❌ **503 Service Unavailable** - Servicio no disponible
- ❌ **Timeout** - Error de red o timeout
- ❌ **Network Error** - Error de conexión
- ❌ **Cualquier otro error de respuesta**

**Comportamiento:** El error se rechaza, pero los tokens se mantienen y la sesión permanece activa.

---

### 2. Tokens SOLO se Descartan en Errores de Autenticación Reales

Los tokens **SÍ se limpian** SOLO en los siguientes casos:

- ✅ **Refresh token expirado** (verificado localmente)
- ✅ **No hay refresh token disponible**
- ✅ **Servidor responde 400/401/403 en `/auth/refresh`** Y el mensaje indica que el token es inválido/expirado
- ✅ **Usuario hace logout explícito**

**Comportamiento:** Se limpian los tokens y se redirige al login (solo en rutas protegidas).

---

## 🔧 Implementación en Frontend

### Archivo: `src/services/api.ts`

#### Interceptor de Respuesta

```typescript
api.interceptors.response.use(
  (response) => {
    // Respuestas exitosas
    return response;
  },
  async (error: AxiosError) => {
    // Manejo de errores
    
    // 401 - Intentar refresh token
    if (status === 401 && originalRequest && !originalRequest._retry) {
      // Verificar si tenemos refresh token válido
      const hasValidRefreshToken = TokenStorage.hasTokens() && 
                                   TokenStorage.getRefreshToken() && 
                                   !TokenStorage.isRefreshTokenExpired();
      
      if (!hasValidRefreshToken) {
        // No hay refresh token válido, rechazar sin limpiar
        return Promise.reject(error);
      }
      
      // Intentar refrescar token
      const newToken = await refreshTokenProactively();
      
      if (newToken) {
        // Token refrescado, reintentar request
        return api(originalRequest);
      } else {
        // Refresh falló - verificar si tokens todavía existen
        const stillHasTokens = TokenStorage.hasTokens() && 
                              TokenStorage.getRefreshToken() && 
                              !TokenStorage.isRefreshTokenExpired();
        
        if (!stillHasTokens) {
          // Tokens fueron limpiados por refreshTokenProactively()
          // Solo redirigir en rutas protegidas
          if (window.location.pathname.startsWith('/admin') || 
              window.location.pathname.startsWith('/crm')) {
            window.location.href = '/auth/login';
          }
        } else {
          // Tokens todavía existen, error temporal
          // NO limpiar, NO redirigir, solo rechazar error
          console.warn('⚠️ Error temporal, MANTENIENDO tokens y sesión');
        }
        
        return Promise.reject(error);
      }
    }
    
    // Para TODOS los demás errores (403, 404, 422, 500, etc.)
    // NUNCA limpiar tokens, solo rechazar error
    return Promise.reject(error);
  }
);
```

#### Función `refreshTokenProactively()`

```typescript
const refreshTokenProactively = async (): Promise<string | null> => {
  // ...
  
  try {
    // Intentar refrescar token
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, ...);
    // Guardar nuevos tokens
    TokenStorage.saveTokens({...});
    return data.access_token;
  } catch (refreshError: any) {
    // CRÍTICO: Solo limpiar tokens si el refresh token está REALMENTE inválido
    
    const refreshTokenExpired = TokenStorage.isRefreshTokenExpired();
    const noRefreshToken = !TokenStorage.getRefreshToken();
    
    // Verificar si el servidor dice que el token es inválido
    const serverSaysTokenInvalid = 
      (refreshError.response?.status === 400 && 
       refreshError.response?.data?.detail?.toLowerCase().includes('token')) ||
      (refreshError.response?.status === 401 && 
       refreshError.response?.data?.detail?.toLowerCase().includes('token'));
    
    const shouldClearTokens = refreshTokenExpired || noRefreshToken || serverSaysTokenInvalid;
    
    if (shouldClearTokens) {
      // Solo limpiar si realmente es inválido
      TokenStorage.clearTokens();
    } else {
      // Error temporal - MANTENER tokens
      console.warn('⚠️ Error temporal, MANTENIENDO tokens');
    }
    
    return null;
  }
};
```

---

## 📋 Requisitos para el Backend

### 1. Endpoint `/auth/refresh` - Respuestas Claras

El backend **DEBE** responder con mensajes claros cuando el refresh token es inválido:

#### ✅ Respuesta Correcta (Token Inválido)
```json
{
  "detail": "Invalid refresh token"
}
```
o
```json
{
  "detail": "Refresh token expired"
}
```
o
```json
{
  "detail": "Token is invalid or expired"
}
```

**Comportamiento del frontend:** Limpia tokens y redirige al login.

#### ✅ Respuesta Correcta (Error Temporal)
```json
{
  "detail": "Internal server error"
}
```
o
```json
{
  "detail": "Service temporarily unavailable"
}
```

**Comportamiento del frontend:** Mantiene tokens y rechaza el error.

---

### 2. Endpoints Protegidos - Códigos de Estado Correctos

El backend **DEBE** usar los códigos de estado correctos:

#### ✅ 401 Unauthorized
**Usar SOLO cuando:**
- El access token está expirado
- El access token es inválido
- No se proporcionó token

**NO usar para:**
- Errores de permisos (usar 403)
- Errores de validación (usar 422)
- Errores del servidor (usar 500+)

#### ✅ 403 Forbidden
**Usar cuando:**
- El usuario está autenticado pero no tiene permisos para el recurso
- El token es válido pero el usuario no tiene acceso

**Comportamiento del frontend:** NO limpia tokens, solo rechaza el error.

#### ✅ 404 Not Found
**Usar cuando:**
- El recurso no existe
- La ruta no existe

**Comportamiento del frontend:** NO limpia tokens, solo rechaza el error.

#### ✅ 422 Unprocessable Entity
**Usar cuando:**
- Los datos enviados son inválidos
- Faltan campos requeridos
- Validación falla

**Comportamiento del frontend:** NO limpia tokens, solo rechaza el error.

#### ✅ 500+ Server Error
**Usar cuando:**
- Error interno del servidor
- Error de base de datos
- Error de servicio externo

**Comportamiento del frontend:** NO limpia tokens, solo rechaza el error.

---

### 3. Endpoints Públicos - NO Requieren Autenticación

Los siguientes endpoints **NO deben requerir autenticación**:

- `GET /api/hiring/{code}`
- `POST /api/hiring/{code}/confirm-data`
- `GET /api/hiring/{code}/contract/download`
- `GET /api/hiring/{code}/final-contract/download`

**Comportamiento del frontend:** Si estos endpoints devuelven 401, se rechaza el error sin intentar refresh.

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: Tokens se Descartan en Errores 404

**Causa:** El backend devuelve 404 pero el frontend lo interpreta como error de autenticación.

**Solución Backend:**
- Asegurar que 404 se use solo para recursos no encontrados
- NO usar 404 para errores de autenticación (usar 401)

**Solución Frontend:**
- ✅ Ya implementado: Los errores 404 NO limpian tokens

---

### Problema 2: Tokens se Descartan en Errores 500

**Causa:** El backend devuelve 500 pero el frontend intenta refrescar token.

**Solución Backend:**
- Asegurar que 500 se use solo para errores del servidor
- NO usar 500 para errores de autenticación (usar 401)

**Solución Frontend:**
- ✅ Ya implementado: Los errores 500 NO limpian tokens

---

### Problema 3: Tokens se Descartan en Errores de Validación (422)

**Causa:** El backend devuelve 422 pero el frontend lo interpreta como error de autenticación.

**Solución Backend:**
- Asegurar que 422 se use solo para errores de validación
- NO usar 422 para errores de autenticación (usar 401)

**Solución Frontend:**
- ✅ Ya implementado: Los errores 422 NO limpian tokens

---

### Problema 4: Tokens se Descartan en Timeouts

**Causa:** El request hace timeout pero el frontend intenta refrescar token.

**Solución Frontend:**
- ✅ Ya implementado: Los timeouts NO limpian tokens
- Solo se limpian si el refresh token está realmente expirado

---

### Problema 5: 401 en Endpoints Públicos

**Causa:** El backend requiere autenticación en endpoints que deberían ser públicos.

**Solución Backend:**
- Marcar endpoints de `/hiring/*` como públicos
- NO requerir autenticación en estos endpoints

**Solución Frontend:**
- ✅ Ya implementado: Los endpoints públicos no intentan refresh token

---

## 📝 Checklist de Verificación Backend

- [ ] Endpoint `/auth/refresh` responde con mensajes claros cuando el token es inválido
- [ ] Endpoint `/auth/refresh` NO limpia tokens en errores temporales (500, timeout, etc.)
- [ ] Endpoints protegidos usan 401 SOLO para errores de autenticación
- [ ] Endpoints protegidos usan 403 para errores de permisos (NO de autenticación)
- [ ] Endpoints protegidos usan 404 para recursos no encontrados (NO de autenticación)
- [ ] Endpoints protegidos usan 422 para errores de validación (NO de autenticación)
- [ ] Endpoints protegidos usan 500+ para errores del servidor (NO de autenticación)
- [ ] Endpoints de `/hiring/*` NO requieren autenticación
- [ ] El backend NO devuelve 401 en errores que no sean de autenticación

---

## 🔍 Testing

### Test 1: Error 404 NO Descartar Tokens

```bash
# Con token válido, hacer request a endpoint que no existe
GET /api/crm/nonexistent
# Esperado: 404, tokens se mantienen
```

### Test 2: Error 500 NO Descartar Tokens

```bash
# Con token válido, hacer request que cause error 500
GET /api/crm/endpoint-that-crashes
# Esperado: 500, tokens se mantienen
```

### Test 3: Error 422 NO Descartar Tokens

```bash
# Con token válido, enviar datos inválidos
POST /api/crm/leads
{ "invalid": "data" }
# Esperado: 422, tokens se mantienen
```

### Test 4: Error 401 con Refresh Token Válido

```bash
# Con access token expirado pero refresh token válido
GET /api/crm/leads
# Esperado: 401 → refresh token → 200, tokens se mantienen
```

### Test 5: Error 401 con Refresh Token Inválido

```bash
# Con refresh token expirado
GET /api/crm/leads
# Esperado: 401 → refresh falla → tokens se limpian → redirect a login
```

---

## 📚 Referencias

- `src/services/api.ts` - Interceptores de axios
- `src/utils/tokenStorage.ts` - Gestión de tokens
- `src/controllers/authController.ts` - Controlador de autenticación
- `docs/BACKEND_ENDPOINTS_ERRORS_SOLUTION.md` - Errores de endpoints

---

**Última actualización:** 2025-01-28








