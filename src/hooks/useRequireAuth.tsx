// Hook para proteger rutas que requieren autenticación

import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { api } from '@/services/api';
import { AdminLogin } from '@/pages/AdminLogin';
import TokenStorage from '@/utils/tokenStorage';

/**
 * Hook para verificar autenticación validando el token contra el backend
 * Uso:
 * 
 * export function ProtectedPage() {
 *   const { isAuthenticated, isValidating, LoginComponent } = useRequireAuth();
 *   
 *   if (isValidating) {
 *     return <div>Verificando sesión...</div>;
 *   }
 *   
 *   if (!isAuthenticated) {
 *     return <LoginComponent />;
 *   }
 *   
 *   // Resto del componente
 * }
 */
export function useRequireAuth() {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
    console.log('🔐 Validando sesión contra el backend...');
    
    // 1. Verificación local rápida usando TokenStorage
    const accessToken = TokenStorage.getAccessToken();
    const localUser = adminService.getUser();
    
    if (!accessToken || !localUser) {
      console.log('❌ No hay token local o usuario');
      setIsAuthenticated(false);
      setIsValidating(false);
      return;
    }

    // 2. Verificar si el token está expirado y hay refresh token disponible
    const refreshToken = TokenStorage.getRefreshToken();
    if (TokenStorage.isTokenExpired() && refreshToken && !TokenStorage.isRefreshTokenExpired()) {
      console.log('🔄 Token expirado pero hay refresh token disponible, esperando refresh automático del interceptor...');
      // El interceptor de axios debería refrescar automáticamente
      // Esperar un momento y reintentar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      // 3. Validar token contra el backend
      // El interceptor de axios manejará el refresh automáticamente si es necesario
      console.log('📡 Verificando token con /users/me...');
      const response = await api.get('/users/me');
      const userData = response.data;
      
      console.log('✅ Token válido. Usuario:', userData);
      
      // Verificar que el usuario tenga permisos de admin
      const isAdmin = userData.is_superuser || 
                     userData.role === 'admin' || 
                     userData.role === 'superuser';
      
      if (!isAdmin) {
        console.log('❌ Usuario no tiene permisos de admin');
        adminService.logout();
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }
      
      // Actualizar usuario en localStorage si es necesario
      const mappedUser = {
        id: userData.id,
        email: userData.email,
        name: userData.full_name || userData.email,
        is_admin: isAdmin,
        is_superuser: userData.is_superuser,
        role: userData.role
      };
      
      localStorage.setItem('admin_user', JSON.stringify(mappedUser));
      setUser(mappedUser);
      setIsAuthenticated(true);
      
    } catch (error: any) {
      console.error('❌ Error validando sesión:', error);
      
      // Si es 401, verificar si hay refresh token disponible
      if (error.response?.status === 401) {
        const refreshToken = TokenStorage.getRefreshToken();
        if (refreshToken && !TokenStorage.isRefreshTokenExpired()) {
          // Hay refresh token disponible, el interceptor debería manejarlo
          // No limpiar la sesión todavía, esperar a que el refresh funcione
          console.log('⚠️ Error 401 pero hay refresh token disponible, esperando refresh automático');
          // Reintentar después de un breve delay para dar tiempo al refresh
          setTimeout(() => {
            validateSession();
          }, 1000);
          return;
        } else {
          // No hay refresh token o está expirado, limpiar sesión
          console.log('🔓 Token inválido o expirado y no hay refresh token disponible. Limpiando sesión...');
          adminService.logout();
          setIsAuthenticated(false);
        }
      } else {
        // Otro tipo de error, no limpiar sesión
        setIsAuthenticated(false);
      }
    } finally {
      setIsValidating(false);
    }
  };

  return {
    isAuthenticated,
    isValidating,
    user,
    LoginComponent: AdminLogin,
  };
}
