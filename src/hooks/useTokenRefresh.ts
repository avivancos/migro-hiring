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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const checkAndRefresh = async () => {
      // Si el token está próximo a expirar (dentro de 2 minutos), refrescarlo
      if (TokenStorage.isTokenExpired()) {
        try {
          await authService.refreshToken();
          console.log('✅ Token refrescado exitosamente (useTokenRefresh)');
        } catch (error) {
          console.error('❌ Error al refrescar token (useTokenRefresh):', error);
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



