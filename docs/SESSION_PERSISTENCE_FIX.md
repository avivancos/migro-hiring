# Fix: Sesión se pierde constantemente - Persistencia de Tokens

## 📋 Resumen

Se corrigió el problema de pérdida constante de sesión mejorando la lógica de limpieza de tokens para que sea más conservadora y solo limpie tokens cuando realmente sea necesario.

## 🔍 Problema Detectado

La sesión se perdía constantemente porque:

1. **Limpieza agresiva de tokens**: El interceptor de axios limpiaba tokens incluso en errores temporales (red, timeout, errores 500, etc.)
2. **Refresh token expirado detectado incorrectamente**: El hook `useTokenRefresh` limpiaba tokens basándose en una verificación que podía ser incorrecta
3. **Falta de persistencia**: Los tokens se limpiaban demasiado pronto, incluso cuando el refresh token seguía siendo válido

## ✅ Solución Implementada

### 1. Manejo Conservador de Errores en Refresh (`src/services/api.ts`)

**Antes:**
```typescript
catch (refreshError) {
  console.error('❌ Error refrescando token:', refreshError);
  // Refresh falló, limpiar tokens
  TokenStorage.clearTokens();
  // ...
}
```

**Después:**
```typescript
catch (refreshError: any) {
  console.error('❌ Error refrescando token:', refreshError);
  
  // Solo limpiar tokens si:
  // 1. El refresh token está realmente expirado
  // 2. El servidor responde con 401/403 (no autorizado)
  // 3. Es un error 400 que indica token inválido
  // NO limpiar en errores temporales (red, timeout, 500, etc.)
  const shouldClearTokens = 
    TokenStorage.isRefreshTokenExpired() ||
    (refreshError.response?.status === 401) ||
    (refreshError.response?.status === 403) ||
    (refreshError.response?.status === 400 && 
     (refreshError.response?.data?.detail?.includes('token') || 
      refreshError.response?.data?.detail?.includes('invalid')));
  
  if (shouldClearTokens) {
    console.warn('⚠️ Limpiando tokens debido a error de refresh:', refreshError.response?.status || 'refresh token expirado');
    TokenStorage.clearTokens();
  } else {
    console.warn('⚠️ Error temporal al refrescar token, manteniendo tokens:', refreshError.message || refreshError.response?.status);
  }
  // ...
}
```

### 2. Verificación Mejorada en `useTokenRefresh` (`src/hooks/useTokenRefresh.ts`)

**Antes:**
```typescript
if (TokenStorage.isRefreshTokenExpired()) {
  console.warn('⚠️ Refresh token expirado, limpiando tokens');
  TokenStorage.clearTokens();
  return;
}
```

**Después:**
```typescript
// IMPORTANTE: Solo limpiar si realmente está expirado (sin buffer)
// El buffer solo aplica al access token, no al refresh token
const refreshExpiresAt = localStorage.getItem('refresh_expires_at');
if (refreshExpiresAt && Date.now() >= parseInt(refreshExpiresAt)) {
  // Refresh token realmente expirado, limpiar tokens
  console.warn('⚠️ Refresh token expirado, limpiando tokens');
  TokenStorage.clearTokens();
  return;
}
```

## 🎯 Comportamiento Actual

### Cuándo se limpian los tokens:

1. ✅ **Refresh token realmente expirado**: Cuando `Date.now() >= refresh_expires_at`
2. ✅ **Error 401 del servidor**: Cuando el servidor responde con 401 al intentar refrescar
3. ✅ **Error 403 del servidor**: Cuando el servidor responde con 403 al intentar refrescar
4. ✅ **Error 400 con mensaje de token inválido**: Cuando el servidor indica que el token es inválido

### Cuándo NO se limpian los tokens:

1. ❌ **Errores temporales de red**: Timeout, conexión perdida, etc.
2. ❌ **Errores del servidor (500+)**: Errores internos del servidor
3. ❌ **Errores 404**: Recurso no encontrado
4. ❌ **Errores 422**: Errores de validación
5. ❌ **Errores 429**: Rate limiting (demasiadas solicitudes)

## 📝 Flujo de Persistencia

```
Usuario hace login
  ↓
TokenStorage.saveTokens() → Guarda en localStorage
  ↓
Access token expira (o está próximo a expirar)
  ↓
Interceptor intenta refresh
  ↓
¿Refresh exitoso? → SÍ → TokenStorage.saveTokens() → Continúa sesión
  ↓ NO
¿Error temporal? → SÍ → Mantiene tokens → Reintenta más tarde
  ↓ NO
¿Refresh token expirado? → SÍ → Limpia tokens → Logout
  ↓ NO
¿Error 401/403/400 inválido? → SÍ → Limpia tokens → Logout
  ↓ NO
Mantiene tokens → Reintenta más tarde
```

## 🔄 Mejoras Adicionales

1. **Logging mejorado**: Ahora se loggea claramente cuándo y por qué se limpian los tokens
2. **Verificación directa**: Se verifica directamente el timestamp del refresh token en lugar de usar el método que podría tener problemas
3. **Manejo de errores temporales**: Los errores temporales no causan pérdida de sesión

## 📚 Referencias

- `src/services/api.ts` - Interceptor de axios corregido
- `src/hooks/useTokenRefresh.ts` - Hook corregido
- `src/utils/tokenStorage.ts` - Almacenamiento de tokens
- `src/providers/AuthProvider.tsx` - Provider de autenticación

## ⚠️ Notas Importantes

1. **localStorage es persistente**: Los tokens se guardan en `localStorage`, que persiste entre sesiones del navegador
2. **No se limpia automáticamente**: Los tokens solo se limpian cuando:
   - El usuario hace logout explícito
   - El refresh token está realmente expirado
   - El servidor indica que los tokens son inválidos
3. **Errores temporales no afectan**: Los errores de red o del servidor no causan pérdida de sesión











