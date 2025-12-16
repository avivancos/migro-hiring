// AuthProvider - Sistema de autenticación unificado para Admin y CRM
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '@/services/authService';
import { api } from '@/services/api';
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

  // Verificar autenticación al montar y cuando cambia la ruta
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
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
        is_superuser: userData.is_superuser || userData.role === 'admin',
        role: userData.role,
        fcm_registered: userData.fcm_registered || false,
        last_login: userData.last_login,
        email_verified_at: userData.email_verified_at,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };
      
      setUser(mappedUser);
      
      // Guardar también en formato admin_user para compatibilidad
      localStorage.setItem('admin_user', JSON.stringify({
        id: mappedUser.id,
        email: mappedUser.email,
        name: mappedUser.full_name || mappedUser.email,
        is_admin: mappedUser.is_superuser || mappedUser.role === 'admin',
        is_superuser: mappedUser.is_superuser,
        role: mappedUser.role,
      }));
      
    } catch (error: any) {
      console.error('Error verificando autenticación:', error);
      
      // Si es 401, limpiar tokens
      if (error.response?.status === 401) {
        clearAuth();
      }
      
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    try {
      const tokens = await authService.login(email, password);
      
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
        is_superuser: userData.is_superuser || userData.role === 'admin',
        role: userData.role,
        fcm_registered: userData.fcm_registered || false,
        last_login: userData.last_login,
        email_verified_at: userData.email_verified_at,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };
      
      setUser(mappedUser);
      
      // Guardar también en formato admin_user para compatibilidad
      localStorage.setItem('admin_token', tokens.access_token);
      localStorage.setItem('admin_user', JSON.stringify({
        id: mappedUser.id,
        email: mappedUser.email,
        name: mappedUser.full_name || mappedUser.email,
        is_admin: mappedUser.is_superuser || mappedUser.role === 'admin',
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

  const isAdmin = user ? (user.is_superuser || user.role === 'admin') : false;
  const isAuthenticated = !!user && user.is_active;

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



