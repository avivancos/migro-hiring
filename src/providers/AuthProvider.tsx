// AuthProvider - Sistema de autenticación unificado para Admin y CRM
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { api } from '@/services/api';
import TokenStorage from '@/utils/tokenStorage';
import type { User } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Rutas públicas que no requieren autenticación
  const isPublicRoute = useCallback((pathname: string): boolean => {
    const publicRoutes = [
      '/',
      '/contratacion/',
      '/hiring/',
      '/expirado',
      '/404',
      '/privacidad',
      '/privacy',
      '/borrador',
      '/colaboradores',
      '/closer',
      '/auth/login',
    ];
    
    return publicRoutes.some(route => 
      pathname === route || 
      pathname.startsWith(route)
    );
  }, []);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    
    const token = authService.getAccessToken();
    
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Validar token contra el backend
      const response = await api.get('/users/me');
      const userData = response.data;
      
      
      // Mapear a tipo User
      const mappedUser: User = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        avatar_url: userData.avatar_url,
        photo_avatar_url: userData.photo_avatar_url,
        bio: userData.bio,
        is_active: userData.is_active,
        is_verified: userData.is_verified,
        is_superuser: userData.is_superuser || userData.role === 'admin' || userData.role === 'superuser',
        role: userData.role,
        fcm_registered: userData.fcm_registered || false,
        last_login: userData.last_login,
        email_verified_at: userData.email_verified_at,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };
      
      
      setUser(mappedUser);
      
      // Calcular is_admin para localStorage
      const is_admin = mappedUser.is_superuser || mappedUser.role === 'admin' || mappedUser.role === 'superuser';
      
      
      // Guardar también en formato admin_user para compatibilidad
      localStorage.setItem('admin_user', JSON.stringify({
        id: mappedUser.id,
        email: mappedUser.email,
        name: mappedUser.full_name || mappedUser.email,
        is_admin: is_admin,
        is_superuser: mappedUser.is_superuser,
        role: mappedUser.role,
      }));
      
    } catch (error: any) {
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
          // No limpiar la sesión todavía - mantener el estado actual
          console.log('⚠️ Error 401/403 pero hay refresh token disponible, esperando refresh automático');
          // NO limpiar user aquí - mantener el estado anterior si existe
          // El interceptor de axios intentará refrescar el token automáticamente
        }
      } else {
        // Para otros errores (500, 404, timeout, etc.), mantener la sesión
        // Los tokens NO se descartan en errores temporales
        // Si hay tokens válidos, mantener el estado anterior del usuario si existe
        const existingUser = localStorage.getItem('admin_user');
        if (existingUser && TokenStorage.hasTokens()) {
          try {
            const parsedUser = JSON.parse(existingUser);
            // Restaurar usuario desde localStorage si hay tokens válidos
            // Esto evita que se pierda la sesión por errores temporales
            setUser({
              id: parsedUser.id,
              email: parsedUser.email,
              full_name: parsedUser.name || parsedUser.email,
              first_name: parsedUser.name?.split(' ')[0] || '',
              last_name: parsedUser.name?.split(' ').slice(1).join(' ') || '',
              phone_number: '',
              avatar_url: '',
              photo_avatar_url: '',
              bio: '',
              is_active: true,
              is_verified: true,
              is_superuser: parsedUser.is_superuser || false,
              role: parsedUser.role || 'user',
              fcm_registered: false,
              last_login: null,
              email_verified_at: null,
              created_at: '',
              updated_at: '',
            });
            console.log('✅ Restaurado usuario desde localStorage después de error temporal');
          } catch (e) {
            console.error('Error restaurando usuario desde localStorage:', e);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Inicializar base de datos local al montar
  useEffect(() => {
    // Inicializar base de datos SQLite en segundo plano
    import('@/services/localDatabase').then(({ localDatabase }) => {
      localDatabase.initialize().catch((error) => {
        console.error('Error inicializando base de datos local:', error);
      });
    });
  }, []);

  // Verificar autenticación al montar
  useEffect(() => {
    // No verificar autenticación en rutas públicas
    if (isPublicRoute(location.pathname)) {
      setIsLoading(false);
      return;
    }
    
    // Verificar si hay token antes de hacer la verificación
    const token = TokenStorage.getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    
    // Verificar autenticación solo una vez al montar
    // El interceptor de axios ya maneja el refresh de tokens proactivamente
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar - verificar una sola vez
  
  // Verificar autenticación cuando cambia la ruta si no hay usuario cargado
  useEffect(() => {
    // Si no hay usuario pero hay tokens y no está cargando, intentar cargar el usuario
    if (!user && !isLoading) {
      const token = TokenStorage.getAccessToken();
      if (token && !isPublicRoute(location.pathname)) {
        checkAuth();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const clearAuth = () => {
    TokenStorage.clearTokens();
    localStorage.removeItem('admin_user'); // Mantener admin_user por compatibilidad
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      
      // Obtener información del usuario
      const response = await api.get('/users/me');
      const userData = response.data;
      
      const mappedUser: User = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        avatar_url: userData.avatar_url,
        photo_avatar_url: userData.photo_avatar_url,
        bio: userData.bio,
        is_active: userData.is_active,
        is_verified: userData.is_verified,
        is_superuser: userData.is_superuser || userData.role === 'admin' || userData.role === 'superuser',
        role: userData.role,
        fcm_registered: userData.fcm_registered || false,
        last_login: userData.last_login,
        email_verified_at: userData.email_verified_at,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };
      
      setUser(mappedUser);
      
      // Guardar también en formato admin_user para compatibilidad
      // admin_token ya está guardado por TokenStorage.saveTokens()
      localStorage.setItem('admin_user', JSON.stringify({
        id: mappedUser.id,
        email: mappedUser.email,
        name: mappedUser.full_name || mappedUser.email,
        is_admin: mappedUser.is_superuser || mappedUser.role === 'admin' || mappedUser.role === 'superuser',
        is_superuser: mappedUser.is_superuser,
        role: mappedUser.role,
      }));
      
    } catch (error: any) {
      clearAuth();
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      clearAuth();
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const isAdmin = user ? (user.is_superuser || user.role === 'admin' || user.role === 'superuser') : false;
  
  // Si hay tokens válidos, considerar autenticado incluso si el usuario no está cargado todavía
  // Esto evita redirecciones prematuras al login durante la verificación inicial
  const hasValidTokens = TokenStorage.hasTokens() && 
                        TokenStorage.getAccessToken() && 
                        !TokenStorage.isRefreshTokenExpired();
  
  // Cambiar lógica: solo considerar autenticado si hay usuario cargado Y está activo
  // O si hay tokens válidos pero aún está cargando (para evitar redirección prematura)
  const isAuthenticated: boolean = Boolean((!!user && user.is_active) || (hasValidTokens && isLoading));

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

