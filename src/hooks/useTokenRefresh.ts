/**
 * Hook para refrescar tokens automáticamente
 * Verifica cada 5 minutos si el token necesita refresh
 */

import { useEffect, useRef } from 'react';
import TokenStorage from '@/utils/tokenStorage';
import { authService } from '@/services/authService';

/**
 * Hook para refrescar tokens automáticamente
 * Verifica cada 5 minutos si el token necesita refresh
 */
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
      // IMPORTANTE: Solo limpiar si realmente está expirado (sin buffer)
      // El buffer solo aplica al access token, no al refresh token
      const refreshExpiresAt = localStorage.getItem('refresh_expires_at');
      if (refreshExpiresAt && Date.now() >= parseInt(refreshExpiresAt)) {
        // Refresh token realmente expirado, limpiar tokens
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
          // (el error ya fue manejado en authService)
          if (error instanceof Error && error.message !== 'No refresh token available') {
            console.error('❌ Error al refrescar token (useTokenRefresh):', error);
          }
          // El interceptor de axios manejará la redirección al login si es necesario
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



