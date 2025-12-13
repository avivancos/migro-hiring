// Hook para proteger rutas que requieren autenticación

import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { api } from '@/services/api';
import { AdminLogin } from '@/pages/AdminLogin';

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
    
    // 1. Verificación local rápida
    const hasLocalToken = !!localStorage.getItem('access_token');
    const localUser = adminService.getUser();
    
    if (!hasLocalToken || !localUser) {
      console.log('❌ No hay token local o usuario');
      setIsAuthenticated(false);
      setIsValidating(false);
      return;
    }

    try {
      // 2. Validar token contra el backend
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
      
      // Si es 401, el token es inválido o expiró
      if (error.response?.status === 401) {
        console.log('🔓 Token inválido o expirado. Limpiando sesión...');
        adminService.logout();
      }
      
      setIsAuthenticated(false);
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
