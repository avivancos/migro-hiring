// Auth Controller - Controlador de autenticación
// Maneja la conexión con la API externa para autenticación y gestión de sesiones

import { authService } from '@/services/authService';
import { api } from '@/services/api';
import TokenStorage from '@/utils/tokenStorage';
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
   * Inicializar sesión desde TokenStorage (lee de múltiples fuentes)
   */
  initializeSession(): AuthSession {
    // ⚠️ CRÍTICO: Usar TokenStorage para leer tokens (lee de localStorage, cookies, sessionStorage)
    const accessToken = TokenStorage.getAccessToken();
    const refreshToken = TokenStorage.getRefreshToken();
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
        // ⚠️ CRÍTICO: NO limpiar sesión aquí, puede ser error temporal
        // Solo limpiar si realmente no hay tokens válidos
        if (!TokenStorage.hasValidTokens()) {
          this.clearSession();
        }
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
        isAdmin: user.is_superuser || user.role === 'admin',
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
    // ⚠️ CRÍTICO: Usar TokenStorage para leer tokens (lee de múltiples fuentes)
    const accessToken = TokenStorage.getAccessToken();
    const refreshToken = TokenStorage.getRefreshToken();

    // ⚠️ CRÍTICO: NO limpiar sesión si no hay access token pero hay refresh token válido
    // El refresh token puede usarse para obtener un nuevo access token
    if (!accessToken && (!refreshToken || TokenStorage.isRefreshTokenExpired())) {
      // Solo limpiar si realmente no hay tokens válidos
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
        accessToken: accessToken || TokenStorage.getAccessToken(), // Asegurar que tenemos el token
        refreshToken: refreshToken || TokenStorage.getRefreshToken(), // Asegurar que tenemos el refresh token
        isAuthenticated: true,
        isAdmin: user.is_superuser || user.role === 'admin',
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
      
      // Solo limpiar sesión si es un error de autenticación real (401/403) 
      // Y no hay refresh token disponible para recuperar la sesión
      // NO limpiar en errores temporales (500, 404, timeout, etc.)
      if (error.response?.status === 401 || error.response?.status === 403) {
        // ⚠️ CRÍTICO: Usar TokenStorage para verificar tokens (lee de múltiples fuentes)
        const refreshToken = TokenStorage.getRefreshToken();
        const isRefreshTokenExpired = TokenStorage.isRefreshTokenExpired();
        
        // Solo limpiar si realmente no hay forma de recuperar la sesión
        if (!refreshToken || isRefreshTokenExpired) {
          console.warn('⚠️ Error 401/403 y no hay refresh token disponible, limpiando sesión');
          this.clearSession();
        } else {
          // Hay refresh token disponible, el interceptor de axios debería manejarlo
          console.log('⚠️ Error 401/403 pero hay refresh token disponible, manteniendo sesión');
        }
      }
      // Para otros errores (500, 404, timeout, etc.), mantener la sesión
      // Los tokens no se descartan en errores temporales
      
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
    } catch (error: any) {
      console.error('Error refrescando token:', error);
      
      // CRÍTICO: Solo limpiar sesión si el refresh token está REALMENTE inválido/expirado
      // NO limpiar en errores temporales (red, timeout, 500, 503, etc.)
      // Verificar primero si el refresh token está expirado localmente
      const refreshTokenExpired = TokenStorage.isRefreshTokenExpired();
      const noRefreshToken = !TokenStorage.getRefreshToken();
      
      // Verificar si el error del servidor indica que el refresh token es inválido
      const serverSaysTokenInvalid = 
        (error.response?.status === 400 && 
         (error.response?.data?.detail?.toLowerCase().includes('token') || 
          error.response?.data?.detail?.toLowerCase().includes('invalid') ||
          error.response?.data?.detail?.toLowerCase().includes('expired'))) ||
        (error.response?.status === 401 && 
         (error.response?.data?.detail?.toLowerCase().includes('token') || 
          error.response?.data?.detail?.toLowerCase().includes('invalid') ||
          error.response?.data?.detail?.toLowerCase().includes('expired'))) ||
        (error.response?.status === 403 && 
         (error.response?.data?.detail?.toLowerCase().includes('token') || 
          error.response?.data?.detail?.toLowerCase().includes('invalid') ||
          error.response?.data?.detail?.toLowerCase().includes('expired'))) ||
        error.message?.includes('Refresh token expired') ||
        error.message?.includes('No refresh token available');
      
      const shouldClearSession = refreshTokenExpired || noRefreshToken || serverSaysTokenInvalid;
      
      if (shouldClearSession) {
        console.warn('⚠️ Error de autenticación al refrescar token, limpiando sesión:', {
          refreshTokenExpired,
          noRefreshToken,
          serverSaysTokenInvalid,
          status: error.response?.status,
          detail: error.response?.data?.detail
        });
        this.clearSession();
      } else {
        // Error temporal (red, timeout, 500, 503, etc.) - MANTENER sesión y tokens
        console.warn('⚠️ Error temporal al refrescar token, MANTENIENDO sesión y tokens:', {
          message: error.message,
          status: error.response?.status,
          code: error.code
        });
      }
      
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



