// Auth Controller - Controlador de autenticación
// Maneja la conexión con la API externa para autenticación y gestión de sesiones

import { authService } from '@/services/authService';
import { api } from '@/services/api';
import type { User, TokenPair } from '@/types/auth';

export interface AuthSession {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

class AuthController {
  private session: AuthSession = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isAdmin: false,
  };

  /**
   * Inicializar sesión desde localStorage
   */
  initializeSession(): AuthSession {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const adminUserStr = localStorage.getItem('admin_user');

    if (accessToken && adminUserStr) {
      try {
        const adminUser = JSON.parse(adminUserStr);
        this.session = {
          user: adminUser as User,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isAdmin: adminUser.is_admin || adminUser.is_superuser || adminUser.role === 'admin',
        };
      } catch (error) {
        console.error('Error parsing admin_user from localStorage:', error);
        this.clearSession();
      }
    }

    return this.session;
  }

  /**
   * Login - Conecta con la API externa /auth/login
   */
  async login(email: string, password: string): Promise<AuthSession> {
    try {
      // Llamar a la API externa
      const tokens: TokenPair = await authService.login(email, password);

      // Obtener información del usuario desde la API
      const userResponse = await api.get<User>('/users/me');
      const user = userResponse.data;

      // Actualizar sesión
      this.session = {
        user,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        isAuthenticated: true,
        isAdmin: user.is_superuser || user.role === 'admin' || user.role === 'superuser',
      };

      // Guardar en localStorage para compatibilidad
      localStorage.setItem('admin_token', tokens.access_token);
      localStorage.setItem('admin_user', JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.full_name || user.email,
        is_admin: this.session.isAdmin,
        is_superuser: user.is_superuser,
        role: user.role,
      }));

      return this.session;
    } catch (error: any) {
      console.error('Error en login:', error);
      this.clearSession();
      throw error;
    }
  }

  /**
   * Logout - Limpia la sesión y notifica a la API
   */
  async logout(): Promise<void> {
    try {
      // Notificar a la API externa
      await authService.logout();
    } catch (error) {
      console.error('Error al hacer logout en la API:', error);
    } finally {
      // Limpiar sesión local
      this.clearSession();
    }
  }

  /**
   * Verificar sesión actual contra la API
   */
  async verifySession(): Promise<AuthSession> {
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      this.clearSession();
      return this.session;
    }

    try {
      // Verificar token contra la API
      const userResponse = await api.get<User>('/users/me');
      const user = userResponse.data;

      // Actualizar sesión
      this.session = {
        user,
        accessToken,
        refreshToken: localStorage.getItem('refresh_token'),
        isAuthenticated: true,
        isAdmin: user.is_superuser || user.role === 'admin' || user.role === 'superuser',
      };

      // Actualizar localStorage
      localStorage.setItem('admin_user', JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.full_name || user.email,
        is_admin: this.session.isAdmin,
        is_superuser: user.is_superuser,
        role: user.role,
      }));

      return this.session;
    } catch (error: any) {
      console.error('Error verificando sesión:', error);
      
      // Si es 401, limpiar sesión
      if (error.response?.status === 401) {
        this.clearSession();
      }
      
      return this.session;
    }
  }

  /**
   * Refrescar token de acceso
   */
  async refreshAccessToken(): Promise<string | null> {
    try {
      const tokens = await authService.refreshToken();
      
      // Actualizar sesión
      this.session.accessToken = tokens.access_token;
      this.session.refreshToken = tokens.refresh_token;
      
      // Actualizar localStorage
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
      localStorage.setItem('admin_token', tokens.access_token);
      
      return tokens.access_token;
    } catch (error) {
      console.error('Error refrescando token:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Obtener sesión actual
   */
  getSession(): AuthSession {
    return { ...this.session };
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.session.user;
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return this.session.isAuthenticated && !!this.session.accessToken;
  }

  /**
   * Verificar si es admin
   */
  isAdmin(): boolean {
    return this.session.isAdmin;
  }

  /**
   * Limpiar sesión local
   */
  private clearSession(): void {
    this.session = {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,
    };

    // Limpiar localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }
}

// Exportar instancia singleton
export const authController = new AuthController();



