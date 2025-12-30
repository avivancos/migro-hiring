# 🔧 Fix: Sesión Expulsada Incorrectamente

**Fecha:** 2025-01-28  
**Prioridad:** 🔴 CRÍTICA  
**Estado:** ✅ CORREGIDO

---

## 📋 Problema

La sesión se estaba expulsando incorrectamente cada poco tiempo, incluso cuando había tokens válidos. Esto ocurría por varios motivos:

1. **`useAuth.ts`**: Limpiaba tokens cuando fallaba `getCurrentUser()`, incluso si era un error temporal
2. **`useTokenRefresh.ts`**: Usaba claves antiguas sin prefijo `migro_` para verificar expiración
3. **`authController.ts`**: Usaba claves antiguas y accedía directamente a localStorage en lugar de usar TokenStorage

---

## ✅ Correcciones Implementadas

### 1. `src/hooks/useAuth.ts`

**Antes:**
```typescript
} catch {
  // Token invalid, clear everything
  authService.logout();
  setAuthState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  });
}
```

**Después:**
```typescript
} catch (error: any) {
  // ⚠️ CRÍTICO: NO limpiar tokens en error
  // Puede ser error temporal de red o servidor
  // Solo limpiar si el refresh token está realmente expirado
  console.warn('⚠️ Error al obtener usuario, pero manteniendo sesión:', error);
  
  // Si hay tokens válidos, mantener el estado como autenticado
  const hasValidTokens = authService.isAuthenticated();
  
  if (hasValidTokens) {
    // Hay tokens válidos, mantener sesión aunque no se pudo obtener el usuario
    setAuthState({
      user: cachedUser, // Usar usuario cacheado si existe
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  } else {
    // No hay tokens válidos, limpiar sesión
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }
}
```

### 2. `src/hooks/useTokenRefresh.ts`

**Antes:**
```typescript
const refreshExpiresAt = localStorage.getItem('refresh_expires_at');
if (refreshExpiresAt && Date.now() >= parseInt(refreshExpiresAt)) {
  TokenStorage.clearTokens();
  return;
}
```

**Después:**
```typescript
// Usar TokenStorage.isRefreshTokenExpired() que lee de múltiples fuentes
if (TokenStorage.isRefreshTokenExpired()) {
  TokenStorage.clearTokens();
  return;
}
```

### 3. `src/controllers/authController.ts`

**Antes:**
```typescript
const accessToken = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');
const refreshExpiresAt = localStorage.getItem('refresh_expires_at');
```

**Después:**
```typescript
// ⚠️ CRÍTICO: Usar TokenStorage para leer tokens (lee de múltiples fuentes)
const accessToken = TokenStorage.getAccessToken();
const refreshToken = TokenStorage.getRefreshToken();
const isRefreshTokenExpired = TokenStorage.isRefreshTokenExpired();
```

---

## 🎯 Comportamiento Corregido

### Antes (Incorrecto)
- ❌ Limpiaba tokens cuando fallaba `getCurrentUser()` (incluso errores temporales)
- ❌ Usaba claves antiguas sin prefijo `migro_`
- ❌ Accedía directamente a localStorage en lugar de usar TokenStorage
- ❌ No verificaba si había tokens válidos antes de limpiar

### Después (Correcto)
- ✅ NO limpia tokens en errores temporales
- ✅ Usa TokenStorage que lee de múltiples fuentes (localStorage, cookies, sessionStorage)
- ✅ Verifica si hay tokens válidos antes de limpiar
- ✅ Mantiene sesión si hay refresh token válido aunque falle obtener el usuario

---

## 🔍 Verificación

Para verificar que el fix funciona:

1. **Hacer login** y verificar que los tokens se guardan en múltiples lugares
2. **Simular error temporal**: Desconectar internet y verificar que NO se limpia la sesión
3. **Verificar persistencia**: Cerrar y abrir el navegador, verificar que la sesión se mantiene
4. **Verificar refresh automático**: Esperar a que el token expire y verificar que se refresca automáticamente

---

## 📝 Notas Importantes

1. **Tokens se mantienen en errores temporales**: Errores 500, 502, 503, 504, timeout, etc. NO limpian tokens
2. **Solo se limpian cuando es necesario**: Refresh token expirado o logout explícito
3. **TokenStorage lee de múltiples fuentes**: localStorage → cookies → sessionStorage
4. **Verificación mejorada**: Usa `hasValidTokens()` para verificar si hay sesión válida

---

**Última actualización:** 2025-01-28

