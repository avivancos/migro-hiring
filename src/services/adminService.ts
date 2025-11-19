// Admin Service - Administrative endpoints

import { api } from './api';
import type { CreateHiringRequest, HiringCodeResponse } from '@/types/admin';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    is_admin: boolean;
    role: string;
  };
}

export const adminService = {
  /**
   * Admin login with email and password
   */
  async login(email: string, password: string): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      console.log('✅ Login response:', response);
      console.log('✅ Response data:', response.data);
      console.log('✅ Response status:', response.status);

      const data = response.data;

      // Validar que la respuesta tenga la estructura esperada
      if (!data) {
        console.error('❌ No hay datos en la respuesta');
        return {
          success: false,
          error: 'La respuesta del servidor no contiene datos'
        };
      }

      if (!data.access_token) {
        console.error('❌ No hay access_token en la respuesta:', data);
        return {
          success: false,
          error: 'La respuesta del servidor no contiene un token de acceso'
        };
      }

      // Guardar tokens primero
      localStorage.setItem('admin_token', data.access_token);
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      console.log('✅ Tokens guardados en localStorage');
      console.log('✅ Token:', data.access_token.substring(0, 20) + '...');

      // Si no viene el user en la respuesta, obtenerlo del endpoint /users/me
      let user = data.user;
      if (!user) {
        console.log('📡 Obteniendo información del usuario desde /users/me');
        try {
          // Usar el token recién guardado para obtener el usuario
          const userResponse = await api.get('/users/me');
          user = userResponse.data;
          console.log('✅ Usuario obtenido:', user);
        } catch (userError: any) {
          console.error('❌ Error obteniendo usuario:', userError);
          // Si falla, intentar decodificar el token JWT
          try {
            const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));
            user = {
              id: tokenPayload.sub,
              email: tokenPayload.email || email,
              name: tokenPayload.name || tokenPayload.email || email,
              is_admin: tokenPayload.is_admin || tokenPayload.role === 'admin',
              role: tokenPayload.role || 'user'
            };
            console.log('✅ Usuario obtenido del token JWT:', user);
          } catch (jwtError) {
            console.error('❌ Error decodificando token:', jwtError);
            return {
              success: false,
              error: 'No se pudo obtener la información del usuario'
            };
          }
        }
      }

      // Guardar usuario
      localStorage.setItem('admin_user', JSON.stringify(user));
      console.log('✅ User guardado:', user);

      return { 
        success: true, 
        token: data.access_token,
        user: user 
      };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Extraer mensaje de error más detallado
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        const status = error.response.status;
        const detail = error.response.data?.detail || error.response.data?.message;
        
        if (status === 401) {
          errorMessage = detail || 'Credenciales incorrectas. Verifica tu email y contraseña.';
        } else if (status === 403) {
          errorMessage = detail || 'No tienes permisos para acceder.';
        } else if (status === 404) {
          errorMessage = 'Usuario no encontrado.';
        } else if (status >= 500) {
          errorMessage = 'Error del servidor. Por favor intenta más tarde.';
        } else {
          errorMessage = detail || `Error ${status}: ${error.response.statusText}`;
        }
      } else if (error.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else {
        // Algo pasó al configurar la solicitud
        errorMessage = error.message || 'Error al configurar la solicitud de login.';
      }
      
      return { 
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Check if admin is logged in
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('admin_token');
    const user = this.getUser();
    return !!token && !!user && (user.is_admin || user.role === 'admin');
  },

  /**
   * Get current admin user
   */
  getUser(): any {
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Admin logout
   */
  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_user');
  },

  /**
   * Get current user from API
   */
  async getCurrentUser(): Promise<any> {
    const { data } = await api.get('/users/me');
    localStorage.setItem('admin_user', JSON.stringify(data));
    return data;
  },

  /**
   * Create hiring code
   */
  async createHiringCode(request: CreateHiringRequest): Promise<HiringCodeResponse> {
    const token = localStorage.getItem('admin_token');
    const { data } = await api.post<HiringCodeResponse>('/admin/hiring/create', request, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },

  /**
   * Get all hiring codes (optional - for future)
   */
  async getAllHiringCodes(): Promise<any[]> {
    const token = localStorage.getItem('admin_token');
    const { data } = await api.get('/admin/hiring/list', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  },
};

