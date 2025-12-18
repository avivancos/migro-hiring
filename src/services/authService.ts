// Auth Service - Autenticación completa
import { api } from './api';
import TokenStorage from '@/utils/tokenStorage';
import type {
  LoginRequest,
  UserRegister,
  TokenPair,
  OAuthTokenResponse,
  OAuthLoginRequest,
  GoogleLoginRequest,
  AppleLoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  User,
  UserWithTokenResponse,
  MessageResponse,
} from '@/types/auth';

export const authService = {
  /**
   * Login con email y contraseña
   */
  async login(email: string, password: string): Promise<TokenPair> {
    const { data } = await api.post<TokenPair>('/auth/login', {
      email,
      password,
    } as LoginRequest);
    
    // Guardar tokens usando TokenStorage (usa expires_in del servidor)
    TokenStorage.saveTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in || 1209600, // 14 días por defecto si no viene
      refresh_expires_in: data.refresh_expires_in || 2592000, // 30 días por defecto
    });
    
    return data;
  },

  /**
   * Registrar nuevo usuario
   */
  async register(userData: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
  }): Promise<UserWithTokenResponse> {
    const { data } = await api.post<UserWithTokenResponse>('/auth/register', {
      ...userData,
      accept_terms: true,
    } as UserRegister);
    
    // Guardar tokens usando TokenStorage
    if (data.tokens) {
      TokenStorage.saveTokens({
        access_token: data.tokens.access_token,
        refresh_token: data.tokens.refresh_token,
        token_type: data.tokens.token_type || 'bearer',
        expires_in: data.tokens.expires_in || 1209600,
        refresh_expires_in: data.tokens.refresh_expires_in || 2592000,
      });
    }
    
    return data;
  },

  /**
   * Refrescar access token
   */
  async refreshToken(): Promise<TokenPair> {
    const refreshToken = TokenStorage.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    if (TokenStorage.isRefreshTokenExpired()) {
      throw new Error('Refresh token expired');
    }

    const { data } = await api.post<TokenPair>('/auth/refresh', {
      refresh_token: refreshToken,
    } as RefreshTokenRequest);
    
    // Actualizar tokens usando TokenStorage
    TokenStorage.saveTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in || 1209600,
      refresh_expires_in: data.refresh_expires_in || 2592000,
    });
    
    return data;
  },

  /**
   * Logout (individual)
   */
  async logout(): Promise<MessageResponse> {
    const refreshToken = TokenStorage.getRefreshToken();
    
    if (refreshToken) {
      try {
        await api.post<MessageResponse>('/auth/logout', {
          refresh_token: refreshToken,
        } as LogoutRequest);
      } catch (error) {
        console.error('Error al hacer logout en el servidor:', error);
      }
    }
    
    // Limpiar tokens locales usando TokenStorage
    TokenStorage.clearTokens();
    
    return { message: 'Successfully logged out' };
  },

  /**
   * Logout desde todos los dispositivos
   */
  async logoutAll(): Promise<MessageResponse> {
    const { data } = await api.post<MessageResponse>('/auth/logout/all');
    
    // Limpiar tokens locales usando TokenStorage
    TokenStorage.clearTokens();
    
    return data;
  },

  /**
   * Login con Google OAuth
   */
  async loginWithGoogle(request: GoogleLoginRequest): Promise<OAuthTokenResponse> {
    const { data } = await api.post<OAuthTokenResponse>('/auth/google/login', request);
    
    // Guardar tokens usando TokenStorage
    TokenStorage.saveTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in || 1209600,
      refresh_expires_in: data.refresh_expires_in || 2592000,
    });
    
    return data;
  },

  /**
   * Login con Facebook OAuth
   */
  async loginWithFacebook(code: string): Promise<OAuthTokenResponse> {
    const { data } = await api.post<OAuthTokenResponse>('/auth/facebook/login', { code });
    
    // Guardar tokens usando TokenStorage
    TokenStorage.saveTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in || 1209600,
      refresh_expires_in: data.refresh_expires_in || 2592000,
    });
    
    return data;
  },

  /**
   * Login con Apple OAuth
   */
  async loginWithApple(request: AppleLoginRequest): Promise<OAuthTokenResponse> {
    const { data } = await api.post<OAuthTokenResponse>('/auth/apple/login', request);
    
    // Guardar tokens usando TokenStorage
    TokenStorage.saveTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in || 1209600,
      refresh_expires_in: data.refresh_expires_in || 2592000,
    });
    
    return data;
  },

  /**
   * Login genérico OAuth
   */
  async oauthLogin(request: OAuthLoginRequest): Promise<OAuthTokenResponse> {
    const { data } = await api.post<OAuthTokenResponse>('/auth/oauth/login', request);
    
    // Guardar tokens usando TokenStorage
    TokenStorage.saveTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in || 1209600,
      refresh_expires_in: data.refresh_expires_in || 2592000,
    });
    
    return data;
  },

  /**
   * Eliminar cuenta
   */
  async deleteAccount(): Promise<MessageResponse> {
    const { data } = await api.delete<MessageResponse>('/auth/delete-account');
    
    // Limpiar tokens usando TokenStorage
    TokenStorage.clearTokens();
    
    return data;
  },

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return TokenStorage.hasTokens() && !TokenStorage.isTokenExpired();
  },

  /**
   * Obtener token de acceso
   */
  getAccessToken(): string | null {
    return TokenStorage.getAccessToken();
  },

  /**
   * Obtener token de refresh
   */
  getRefreshToken(): string | null {
    return TokenStorage.getRefreshToken();
  },

  /**
   * Obtener token de acceso (alias para compatibilidad)
   */
  getToken(): string | null {
    return this.getAccessToken();
  },

  /**
   * Obtener usuario cacheado del localStorage
   */
  getCachedUser(): User | null {
    try {
      const adminUserStr = localStorage.getItem('admin_user');
      if (adminUserStr) {
        const adminUser = JSON.parse(adminUserStr);
        // Mapear a tipo User
        return {
          id: adminUser.id,
          email: adminUser.email,
          full_name: adminUser.name || adminUser.email,
          first_name: adminUser.name?.split(' ')[0] || '',
          last_name: adminUser.name?.split(' ').slice(1).join(' ') || '',
          phone_number: adminUser.phone_number,
          avatar_url: adminUser.avatar_url,
          photo_avatar_url: adminUser.photo_avatar_url,
          bio: adminUser.bio,
          is_active: adminUser.is_active ?? true,
          is_verified: adminUser.is_verified ?? false,
          is_superuser: adminUser.is_superuser || adminUser.is_admin || false,
          role: adminUser.role || 'user',
          fcm_registered: adminUser.fcm_registered || false,
          last_login: adminUser.last_login,
          email_verified_at: adminUser.email_verified_at,
          created_at: adminUser.created_at,
          updated_at: adminUser.updated_at,
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error parsing cached user:', error);
      return null;
    }
  },

  /**
   * Obtener usuario actual desde la API
   */
  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>('/users/me');
    
    // Cachear usuario en formato admin_user para compatibilidad
    localStorage.setItem('admin_user', JSON.stringify({
      id: data.id,
      email: data.email,
      name: data.full_name || data.email,
      is_admin: data.is_superuser || data.role === 'admin',
      is_superuser: data.is_superuser,
      role: data.role,
    }));
    
    return data;
  },
};
