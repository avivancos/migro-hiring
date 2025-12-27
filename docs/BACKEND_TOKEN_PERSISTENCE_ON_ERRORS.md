# Fix: Tokens No Se Descartan en Errores Temporales

## 📋 Resumen

Se corrigió el problema donde los tokens se descartaban y la sesión se perdía cada vez que ocurría cualquier error, incluso errores temporales del servidor (500, 404, timeout, etc.). Ahora los tokens solo se limpian cuando realmente es necesario (errores de autenticación reales), no en errores temporales.

**Fecha**: 2025-01-XX  
**Ubicación**: `src/controllers/authController.ts`, `src/services/api.ts`, `src/providers/AuthProvider.tsx`

---

## 🔍 Problema Detectado

Los tokens se descartaban y la sesión se perdía en **cualquier error**, incluso cuando:
- Ocurrían errores temporales del servidor (500, 503, etc.)
- Había errores de red o timeout
- Ocurrían errores 404 (recurso no encontrado)
- Ocurrían errores de validación (422)

El comportamiento esperado es que los tokens **NO se descarten** en errores temporales, solo en errores de autenticación reales cuando el refresh token también está inválido o expirado.

---

## ✅ Solución Implementada

### 1. Corrección en `authController.ts`

#### `verifySession()` - Verificación Conservadora

**Antes:**
```typescript
catch (error: any) {
  console.error('Error verificando sesión:', error);
  
  // Si es 401, limpiar sesión
  if (error.response?.status === 401) {
    this.clearSession();
  }
  
  return this.session;
}
```

**Después:**
```typescript
catch (error: any) {
  console.error('Error verificando sesión:', error);
  
  // Solo limpiar sesión si es un error de autenticación real (401/403) 
  // Y no hay refresh token disponible para recuperar la sesión
  // NO limpiar en errores temporales (500, 404, timeout, etc.)
  if (error.response?.status === 401 || error.response?.status === 403) {
    // Verificar si hay refresh token disponible antes de limpiar
    const refreshToken = localStorage.getItem('refresh_token');
    const refreshExpiresAt = localStorage.getItem('refresh_expires_at');
    
    // Solo limpiar si realmente no hay forma de recuperar la sesión
    if (!refreshToken || (refreshExpiresAt && Date.now() >= parseInt(refreshExpiresAt))) {
      console.warn('⚠️ Error 401/403 y no hay refresh token disponible, limpiando sesión');
      this.clearSession();
    } else {
      // Hay refresh token disponible, el interceptor de axios debería manejarlo
      console.log('⚠️ Error 401/403 pero hay refresh token disponible, manteniendo sesión');
    }
  }
  // Para otros errores (500, 404, timeout, etc.), mantener la sesión
  // Los tokens no se descartan en errores temporales
  
  return this.session;
}
```

**Beneficio**: La sesión se mantiene en errores temporales y solo se limpia cuando realmente no hay forma de recuperarla.

#### `refreshAccessToken()` - Manejo Selectivo de Errores

**Antes:**
```typescript
catch (error) {
  console.error('Error refrescando token:', error);
  this.clearSession();
  return null;
}
```

**Después:**
```typescript
catch (error: any) {
  console.error('Error refrescando token:', error);
  
  // Solo limpiar sesión si es un error de autenticación real
  // NO limpiar en errores temporales (red, timeout, 500, etc.)
  const shouldClearSession = 
    error.response?.status === 401 ||
    error.response?.status === 403 ||
    (error.response?.status === 400 && 
     (error.response?.data?.detail?.includes('token') || 
      error.response?.data?.detail?.includes('invalid'))) ||
    error.message?.includes('Refresh token expired') ||
    error.message?.includes('No refresh token available');
  
  if (shouldClearSession) {
    console.warn('⚠️ Error de autenticación al refrescar token, limpiando sesión');
    this.clearSession();
  } else {
    // Error temporal, mantener sesión y tokens
    console.warn('⚠️ Error temporal al refrescar token, manteniendo sesión:', error.message || error.response?.status);
  }
  
  return null;
}
```

**Beneficio**: Solo se limpia la sesión en errores de autenticación reales, no en errores temporales.

---

### 2. Corrección en `api.ts` - Interceptor de Respuesta

#### Manejo de Refresh Fallido

**Antes:**
```typescript
if (newToken) {
  // Actualizar header y reintentar
  return api(originalRequest);
} else {
  // Refresh falló, limpiar tokens y redirigir
  if (window.location.pathname.startsWith('/admin') || 
      window.location.pathname.startsWith('/crm') ||
      window.location.pathname.startsWith('/contrato')) {
    window.location.href = '/auth/login';
  }
  return Promise.reject(new Error('No se pudo refrescar el token'));
}
```

**Después:**
```typescript
if (newToken) {
  // Actualizar header y reintentar
  return api(originalRequest);
} else {
  // Refresh falló - verificar si los tokens todavía existen
  // Si existen, fue un error temporal y no debemos redirigir
  // Si no existen, refreshTokenProactively() ya los limpió (error de autenticación real)
  const stillHasTokens = TokenStorage.hasTokens() && 
                        TokenStorage.getRefreshToken() && 
                        !TokenStorage.isRefreshTokenExpired();
  
  if (!stillHasTokens) {
    // Los tokens fueron limpiados, significa error de autenticación real
    // Solo redirigir si estamos en rutas de admin
    if (window.location.pathname.startsWith('/admin') || 
        window.location.pathname.startsWith('/crm') ||
        window.location.pathname.startsWith('/contrato')) {
      window.location.href = '/auth/login';
    }
  } else {
    // Los tokens todavía existen, fue un error temporal
    // No redirigir, solo rechazar el error para que el componente lo maneje
    console.warn('⚠️ Error temporal al refrescar token, manteniendo sesión y rechazando request');
  }
  
  return Promise.reject(new Error('No se pudo refrescar el token'));
}
```

**Beneficio**: No se redirige al login cuando el error fue temporal y los tokens todavía son válidos.

---

### 3. Corrección en `AuthProvider.tsx` - Manejo de Errores en `checkAuth()`

**Antes:**
```typescript
catch (error: any) {
  console.error('Error verificando autenticación:', error);
  
  // Solo limpiar tokens si es 401 y no hay refresh token disponible
  if (error.response?.status === 401) {
    const refreshToken = TokenStorage.getRefreshToken();
    if (!refreshToken || TokenStorage.isRefreshTokenExpired()) {
      clearAuth();
    } else {
      console.log('⚠️ Error 401 pero hay refresh token disponible, esperando refresh automático');
    }
  }
  
  // No establecer user como null inmediatamente si hay refresh token
  // Dejar que el siguiente intento funcione
  if (error.response?.status !== 401 || !TokenStorage.getRefreshToken()) {
    setUser(null);
  }
}
```

**Después:**
```typescript
catch (error: any) {
  console.error('Error verificando autenticación:', error);
  
  // Solo limpiar tokens si es un error de autenticación (401/403) y no hay refresh token disponible
  // Si hay refresh token, el interceptor de axios debería manejarlo
  // NO limpiar en errores temporales (500, 404, timeout, etc.)
  if (error.response?.status === 401 || error.response?.status === 403) {
    const refreshToken = TokenStorage.getRefreshToken();
    if (!refreshToken || TokenStorage.isRefreshTokenExpired()) {
      // Solo limpiar si realmente no hay forma de refrescar
      clearAuth();
    } else {
      // Hay refresh token disponible, dejar que el interceptor lo maneje
      // No limpiar la sesión todavía
      console.log('⚠️ Error 401/403 pero hay refresh token disponible, esperando refresh automático');
    }
  }
  // Para otros errores (500, 404, timeout, etc.), mantener la sesión
  // Los tokens NO se descartan en errores temporales
}
```

**Beneficio**: El usuario no se establece como `null` en errores temporales, manteniendo la sesión activa.

---

## 📝 Cuándo Se Limpian Los Tokens

Los tokens **SÍ se limpian** cuando:

1. ✅ **Error 401/403 al refrescar token**: Cuando el servidor responde con 401 o 403 al intentar refrescar
2. ✅ **Error 400 con mensaje de token inválido**: Cuando el servidor indica que el token es inválido
3. ✅ **Refresh token realmente expirado**: Cuando `Date.now() >= refresh_expires_at`
4. ✅ **No hay refresh token disponible**: Cuando no existe refresh token en localStorage
5. ✅ **Logout explícito del usuario**: Cuando el usuario hace logout manualmente

Los tokens **NO se limpian** cuando:

1. ❌ **Errores temporales del servidor**: Errores 500, 503, etc.
2. ❌ **Errores de red**: Timeout, conexión perdida, etc.
3. ❌ **Errores 404**: Recurso no encontrado
4. ❌ **Errores 422**: Errores de validación
5. ❌ **Errores 429**: Rate limiting (demasiadas solicitudes)
6. ❌ **Cualquier error que no sea de autenticación**: Mientras el refresh token siga siendo válido

---

## 🔄 Flujo de Persistencia de Tokens

```
Usuario hace login
  ↓
TokenStorage.saveTokens() → Guarda en localStorage
  ↓
Ocurre un error en una petición API
  ↓
¿Es error 401/403? → SÍ → ¿Hay refresh token disponible? → SÍ → Intentar refresh
  ↓                                          ↓
  NO                                       NO
  ↓                                          ↓
Mantener tokens                          Limpiar tokens
Mantener sesión                          Logout

Si es error temporal (500, 404, timeout, etc.)
  ↓
Mantener tokens
Mantener sesión
Rechazar error para que el componente lo maneje
```

---

## 📚 Archivos Modificados

- `src/controllers/authController.ts`
  - `verifySession()`: Manejo conservador de errores
  - `refreshAccessToken()`: Limpieza selectiva de sesión

- `src/services/api.ts`
  - Interceptor de respuesta: Verificación de tokens antes de redirigir

- `src/providers/AuthProvider.tsx`
  - `checkAuth()`: No establece usuario como null en errores temporales

---

## ⚠️ Notas Importantes

1. **Persistencia de tokens**: Los tokens se mantienen en `localStorage` incluso cuando ocurren errores temporales
2. **Refresh automático**: El interceptor de axios intenta refrescar automáticamente cuando es necesario
3. **Manejo de errores**: Los errores temporales se rechazan normalmente para que los componentes los manejen, pero no causan pérdida de sesión
4. **Logging**: Se añadieron logs claros para distinguir entre errores de autenticación y errores temporales

---

## 🧪 Testing

Para verificar que los cambios funcionan correctamente:

1. **Error temporal del servidor (500)**:
   - Hacer login
   - Simular un error 500 en una petición
   - Verificar que la sesión se mantiene
   - Verificar que los tokens no se limpian

2. **Error de red (timeout)**:
   - Hacer login
   - Simular un timeout
   - Verificar que la sesión se mantiene
   - Verificar que los tokens no se limpian

3. **Error 401 con refresh token válido**:
   - Hacer login
   - Simular un 401 cuando el refresh token es válido
   - Verificar que se intenta refrescar automáticamente
   - Verificar que la sesión se mantiene si el refresh es exitoso

4. **Error 401 sin refresh token**:
   - Hacer login
   - Eliminar el refresh token
   - Simular un 401
   - Verificar que la sesión se limpia

---

## 📖 Referencias

- `docs/SESSION_PERSISTENCE_FIX.md` - Fix anterior relacionado con persistencia de sesión
- `docs/TOKEN_STORAGE_FIX.md` - Fix anterior relacionado con almacenamiento de tokens
- `src/utils/tokenStorage.ts` - Utilidad para manejo de tokens











