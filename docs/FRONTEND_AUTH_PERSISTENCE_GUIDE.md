# 🔐 Guía de Persistencia de Autenticación - Frontend

**Fecha:** 2025-01-28  
**Prioridad:** 🔴 CRÍTICA  
**Estado:** ✅ IMPLEMENTADO

---

## ⚠️ REGLAS CRÍTICAS DE AUTENTICACIÓN

### 🚫 NUNCA HACER

1. **❌ NO desechar tokens cuando hay errores**
   - Los errores HTTP (400, 500, etc.) NO invalidan la sesión
   - Solo los errores 401 específicos de token expirado requieren refresh
   - Los errores de red temporal NO deben limpiar tokens

2. **❌ NO pedir login nuevamente si hay tokens válidos**
   - Si existen tokens guardados (aunque haya errores), NO redirigir a login
   - Intentar refresh automático antes de pedir login
   - Solo pedir login si el refresh token está completamente expirado

3. **❌ NO usar solo localStorage o solo cookies**
   - Debe usarse almacenamiento MIXTO: localStorage + cookies + sessionStorage
   - Esto garantiza persistencia incluso si se limpia el storage

### ✅ SIEMPRE HACER

1. **✅ Guardar tokens en múltiples lugares**
   - localStorage (para acceso rápido desde JavaScript)
   - Cookies (para persistencia y envío automático, 15 días)
   - SessionStorage como backup (opcional)

2. **✅ Mantener sesión por 15 días**
   - La sesión debe durar 15 días sin pedir login
   - Usar refresh token automático antes de expiración
   - Renovar tokens proactivamente

3. **✅ Manejar errores sin perder sesión**
   - Errores 500, 502, 503, 504: NO limpiar tokens
   - Errores 400 (excepto auth): NO limpiar tokens
   - Solo limpiar tokens en 401 después de intentar refresh

---

## 📋 Configuración de Sesión

### Duración de Tokens

- **Access Token**: 14 días (configurado en backend, ajustar a 15 días si es necesario)
- **Refresh Token**: 30 días
- **Sesión Total**: 15 días sin pedir login (usando refresh automático)

### Almacenamiento TRIPLE Requerido

Los tokens DEBEN guardarse en múltiples lugares para máxima persistencia:

1. **localStorage** (principal): Para acceso rápido desde JavaScript
2. **Cookies** (persistencia): Para persistencia y envío automático (15 días)
3. **sessionStorage** (backup): Como backup adicional

### Nombres de Claves

Se usa prefijo `migro_` para evitar conflictos con otras aplicaciones:

- `migro_access_token`
- `migro_refresh_token`
- `migro_token_expires_at`
- `migro_refresh_expires_at`

---

## 🔧 Implementación

### TokenStorage Class

Ver `src/utils/tokenStorage.ts` para la implementación completa.

#### Características Principales

1. **Almacenamiento Triple**: localStorage + cookies + sessionStorage
2. **Fallback Automático**: Lee de múltiples fuentes en orden de prioridad
3. **Restauración Automática**: Si encuentra en cookies/sessionStorage, restaura en localStorage
4. **Buffer de Expiración**: 1 minuto (mínimo necesario)
5. **Método `hasValidTokens()`**: Verifica si hay tokens válidos en cualquier fuente

---

## 🔄 Manejo de Errores SIN Perder Sesión

### Errores que NO Invalidan Sesión

Los siguientes errores **NO deben limpiar tokens**:

- ❌ **400 Bad Request** (excepto errores específicos de auth)
- ❌ **403 Forbidden** (error de permisos, NO de autenticación)
- ❌ **404 Not Found** (recurso no encontrado)
- ❌ **422 Unprocessable Entity** (error de validación)
- ❌ **500 Internal Server Error** (error del servidor)
- ❌ **502 Bad Gateway** (error de gateway)
- ❌ **503 Service Unavailable** (servicio no disponible)
- ❌ **504 Gateway Timeout** (timeout de gateway)
- ❌ **Timeout** (error de red o timeout)
- ❌ **Network Error** (error de conexión)

**Comportamiento:** El error se rechaza, pero los tokens se mantienen y la sesión permanece activa.

### Errores que SÍ Invalidan Sesión

Los tokens **SÍ se limpian** SOLO en los siguientes casos:

- ✅ **Refresh token expirado** (verificado localmente)
- ✅ **No hay refresh token disponible**
- ✅ **Servidor responde 400/401/403 en `/auth/refresh`** Y el mensaje indica que el token es inválido/expirado
- ✅ **Usuario hace logout explícito**

**Comportamiento:** Se limpian los tokens de localStorage, cookies y sessionStorage, y se redirige al login (solo en rutas protegidas).

---

## 🔄 Refresh Proactivo para Sesión de 15 Días

### Hook para Refresh Automático

El hook `useTokenRefresh` verifica cada 5 minutos si el token necesita refresh:

```typescript
// hooks/useTokenRefresh.ts
export function useTokenRefresh() {
  useEffect(() => {
    const checkAndRefresh = async () => {
      // Solo refrescar si el token está próximo a expirar
      if (TokenStorage.isTokenExpired() && !TokenStorage.isRefreshTokenExpired()) {
        try {
          await refreshAccessToken();
          console.log('✅ Token refreshed successfully');
        } catch (error) {
          // ⚠️ CRÍTICO: NO limpiar tokens en error de refresh
          // Puede ser error temporal de red
          console.warn('⚠️ Failed to refresh token (will retry):', error);
        }
      }
    };
    
    // Verificar inmediatamente al montar
    checkAndRefresh();
    
    // Verificar cada 5 minutos para mantener sesión activa
    const interval = setInterval(checkAndRefresh, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
}
```

---

## 🛡️ Protección de Rutas SIN Pedir Login Innecesariamente

### Componente ProtectedRoute Mejorado

El componente `ProtectedRoute` debe usar `hasValidTokens()` para verificar autenticación:

```typescript
// components/ProtectedRoute.tsx
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
}) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // ⚠️ CRÍTICO: Verificar si hay tokens válidos en cualquier fuente
      if (!TokenStorage.hasValidTokens()) {
        setLoading(false);
        return;
      }

      // Si el access token está expirado pero hay refresh token válido
      if (TokenStorage.isTokenExpired() && !TokenStorage.isRefreshTokenExpired()) {
        try {
          // Intentar refresh antes de verificar usuario
          await refreshAccessToken();
        } catch (error) {
          // Si el refresh falla pero el refresh token no está expirado,
          // puede ser error temporal - NO redirigir a login todavía
          console.warn('Refresh failed but refresh token still valid, continuing...');
        }
      }

      try {
        // Intentar obtener usuario actual
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err: any) {
        // ⚠️ CRÍTICO: NO limpiar tokens en error
        // Puede ser error temporal de red o servidor
        console.error('Error al verificar autenticación:', err);
        
        // Solo redirigir a login si es 401 Y el refresh token está expirado
        if (err.response?.status === 401 && TokenStorage.isRefreshTokenExpired()) {
          TokenStorage.clearTokens();
        } else {
          // Para otros errores, mantener tokens y continuar
          // El usuario puede estar offline o el servidor puede estar temporalmente caído
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Mostrar loading
  if (loading) {
    return <LoadingSpinner />;
  }

  // ⚠️ CRÍTICO: Solo redirigir a login si NO hay tokens válidos
  // NO redirigir solo por errores de red o servidor
  if (requireAuth && !user && !TokenStorage.hasValidTokens()) {
    return <Navigate to="/login" replace />;
  }

  // Si hay tokens pero no se pudo obtener usuario (error temporal),
  // permitir acceso pero mostrar advertencia opcional
  return <>{children}</>;
};
```

---

## ✅ Checklist de Implementación

- [x] Implementar almacenamiento TRIPLE (localStorage + cookies + sessionStorage)
- [x] Usar prefijo `migro_` para nombres de claves
- [x] NO limpiar tokens en errores 400, 500, 502, 503, 504
- [x] Solo limpiar tokens en 401 después de verificar refresh token expirado
- [x] Implementar refresh proactivo cada 5 minutos
- [x] Verificar tokens desde múltiples fuentes al iniciar
- [x] NO redirigir a login si hay tokens válidos aunque haya errores
- [x] Mantener sesión activa por 15 días usando refresh automático
- [x] Manejar errores de red sin perder sesión
- [x] Implementar método `hasValidTokens()` mejorado
- [x] Buffer de expiración de 1 minuto (mínimo necesario)

---

## 🧪 Pruebas Requeridas

1. **Error 500**: Verificar que NO se limpian tokens
2. **Error de red**: Verificar que NO se limpian tokens
3. **Error 401 con refresh válido**: Verificar refresh automático
4. **Error 401 con refresh expirado**: Verificar redirección a login
5. **Sesión de 15 días**: Dejar app abierta y verificar que no pide login
6. **Múltiples pestañas**: Verificar sincronización de tokens
7. **Limpiar localStorage**: Verificar que tokens se restauran desde cookies
8. **Limpiar cookies**: Verificar que tokens se restauran desde localStorage
9. **Limpiar sessionStorage**: Verificar que tokens se restauran desde localStorage/cookies

---

## 📝 Notas Importantes

1. **Persistencia es CRÍTICA**: Los tokens deben sobrevivir a limpiezas parciales del navegador
2. **Errores NO invalidan sesión**: Solo la expiración real del refresh token invalida la sesión
3. **Refresh proactivo**: Mantener sesión activa renovando antes de expiración
4. **Múltiples fuentes**: Siempre intentar restaurar desde múltiples lugares
5. **15 días de sesión**: Usar refresh automático para extender sesión hasta 15 días
6. **Buffer mínimo**: Usar buffer de 1 minuto (no más) para evitar refresh prematuro

---

## 📚 Referencias

- `src/utils/tokenStorage.ts` - Implementación de TokenStorage con almacenamiento triple
- `src/services/api.ts` - Interceptores de axios (no limpian tokens en errores)
- `docs/TOKEN_PERSISTENCE_ON_ERRORS.md` - Política de persistencia en errores
- `docs/FRONTEND_TOKEN_PERSISTENCE_COOKIES.md` - Documentación técnica detallada

---

**Última actualización:** 2025-01-28  
**Versión API:** 1.0.0  
**Duración de Sesión:** 15 días (usando refresh automático)

