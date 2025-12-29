# Fix: Error "No refresh token available" en useTokenRefresh

## 📋 Resumen

Se corrigió el hook `useTokenRefresh` para evitar errores cuando no hay refresh token disponible. El hook ahora verifica la disponibilidad de tokens antes de intentar refrescarlos.

## 🔍 Problema Detectado

El hook `useTokenRefresh` estaba intentando refrescar tokens incluso cuando:
- No hay tokens almacenados (usuario no autenticado)
- El refresh token está expirado
- Los tokens fueron limpiados

Esto generaba errores en consola:
```
❌ Error al refrescar token (useTokenRefresh): Error: No refresh token available
```

## ✅ Solución Implementada

### Cambios en `src/hooks/useTokenRefresh.ts`

Se agregaron verificaciones antes de intentar refrescar:

1. **Verificar si hay tokens disponibles**:
   ```typescript
   if (!TokenStorage.hasTokens()) {
     return; // No hay tokens, no intentar refrescar
   }
   ```

2. **Verificar si el refresh token está expirado**:
   ```typescript
   if (TokenStorage.isRefreshTokenExpired()) {
     console.warn('⚠️ Refresh token expirado, limpiando tokens');
     TokenStorage.clearTokens();
     return;
   }
   ```

3. **Mejorar manejo de errores**:
   ```typescript
   catch (error) {
     // Solo loggear error si no es porque no hay refresh token
     if (error instanceof Error && error.message !== 'No refresh token available') {
       console.error('❌ Error al refrescar token (useTokenRefresh):', error);
     }
   }
   ```

## 📝 Código Actualizado

```typescript
export function useTokenRefresh() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  useEffect(() => {
    const checkAndRefresh = async () => {
      // Verificar si hay tokens disponibles antes de intentar refrescar
      if (!TokenStorage.hasTokens()) {
        // No hay tokens, no intentar refrescar
        return;
      }

      // Verificar si el refresh token está expirado
      if (TokenStorage.isRefreshTokenExpired()) {
        // Refresh token expirado, limpiar tokens y no intentar refrescar
        console.warn('⚠️ Refresh token expirado, limpiando tokens');
        TokenStorage.clearTokens();
        return;
      }

      // Si el token está próximo a expirar (dentro de 2 minutos), refrescarlo
      if (TokenStorage.isTokenExpired()) {
        try {
          await authService.refreshToken();
          console.log('✅ Token refrescado exitosamente (useTokenRefresh)');
        } catch (error) {
          // Solo loggear error si no es porque no hay refresh token
          if (error instanceof Error && error.message !== 'No refresh token available') {
            console.error('❌ Error al refrescar token (useTokenRefresh):', error);
          }
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

## 🎯 Comportamiento Actual

1. **Usuario no autenticado**: El hook no intenta refrescar tokens
2. **Refresh token expirado**: Se limpian los tokens y no se intenta refrescar
3. **Token próximo a expirar**: Se intenta refrescar solo si hay refresh token válido
4. **Errores silenciosos**: Los errores de "No refresh token available" ya no se loggean

## 🔄 Flujo de Verificación

```
checkAndRefresh()
  ↓
¿Hay tokens? → NO → Return (no hacer nada)
  ↓ SÍ
¿Refresh token expirado? → SÍ → Limpiar tokens → Return
  ↓ NO
¿Access token expirado? → NO → Return
  ↓ SÍ
Intentar refresh → Éxito → ✅ Log
              → Error → ⚠️ Log (solo si no es "No refresh token available")
```

## 📚 Referencias

- `src/hooks/useTokenRefresh.ts` - Hook corregido
- `src/utils/tokenStorage.ts` - Utilidades de almacenamiento de tokens
- `src/services/authService.ts` - Servicio de autenticación












