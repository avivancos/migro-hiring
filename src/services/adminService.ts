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
          const userData = userResponse.data;
          console.log('✅ Usuario obtenido de API:', userData);
          
          // Mapear la respuesta de la API a la estructura esperada
          user = {
            id: userData.id,
            email: userData.email,
            name: userData.full_name || userData.email,
            is_admin: userData.is_superuser || userData.role === 'admin' || userData.role === 'superuser',
            role: userData.role || 'user'
          };
          console.log('✅ Usuario mapeado:', user);
        } catch (userError: any) {
          console.error('❌ Error obteniendo usuario:', userError);
          // Si falla, intentar decodificar el token JWT
          try {
            const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));
            user = {
              id: tokenPayload.sub || tokenPayload.user_id,
              email: tokenPayload.email || email,
              name: tokenPayload.name || tokenPayload.full_name || email,
              is_admin: tokenPayload.is_superuser || tokenPayload.is_admin || tokenPayload.role === 'admin' || tokenPayload.role === 'superuser',
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
    if (!token || !user) return false;
    
    // Verificar si es admin o superuser
    return user.is_admin || 
           user.is_superuser || 
           user.role === 'admin' || 
           user.role === 'superuser';
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

  // ===== USER MANAGEMENT =====

  /**
   * Get all users (admin only)
   * Returns paginated response with items, total, skip, and limit
   */
  async getAllUsers(params?: {
    skip?: number;
    limit?: number;
    // Búsqueda
    search?: string;
    q?: string; // Mantener para compatibilidad, pero usar search
    // Filtros básicos
    role?: string;
    is_active?: boolean;
    is_verified?: boolean;
    // Filtros adicionales
    nationality?: string;
    profession?: string;
    city?: string;
    is_lawyer?: boolean;
    lawyer_specialty?: string;
    // Filtros de fechas (ISO 8601)
    last_login_from?: string;
    last_login_to?: string;
    created_from?: string;
    created_to?: string;
    // Ordenamiento
    sort_by?: 'name' | 'email' | 'phone_number' | 'role' | 'is_active' | 'last_login' | 'created_at';
    sort_order?: 'asc' | 'desc';
  }): Promise<{
    items: any[];
    total: number;
    skip: number;
    limit: number;
  }> {
    try {
      // Preparar parámetros: usar search si está disponible, sino q (compatibilidad)
      const requestParams: any = { ...params };
      if (requestParams.search) {
        // Usar search (nuevo parámetro)
        delete requestParams.q;
      } else if (requestParams.q) {
        // Migrar q a search para compatibilidad
        requestParams.search = requestParams.q;
        delete requestParams.q;
      }
      
      const { data } = await api.get('/users/', { params: requestParams });
      
      console.log('📡 [adminService.getAllUsers] Respuesta completa del backend:', {
        data,
        hasItems: data?.items !== undefined,
        hasTotal: typeof data?.total === 'number',
        totalValue: data?.total,
        itemsLength: data?.items?.length,
        skipValue: data?.skip,
        limitValue: data?.limit,
      });
      
      // El backend ahora siempre devuelve formato paginado
      if (data.items && typeof data.total === 'number') {
        const result = {
          items: data.items,
          total: data.total,
          skip: data.skip !== undefined ? data.skip : (params?.skip || 0),
          limit: data.limit !== undefined ? data.limit : (params?.limit || 50),
        };
        console.log('✅ [adminService.getAllUsers] Retornando resultado paginado:', result);
        return result;
      }
      
      // Fallback: si aún devuelve array (compatibilidad)
      if (Array.isArray(data)) {
        return {
          items: data,
          total: data.length,
          skip: params?.skip || 0,
          limit: params?.limit || 50,
        };
      }
      
      // Fallback final
      return {
        items: [],
        total: 0,
        skip: params?.skip || 0,
        limit: params?.limit || 50,
      };
    } catch (error: any) {
      console.error('Error getting users:', error);
      if (error.response?.status === 404 || error.response?.status === 403) {
        return {
          items: [],
          total: 0,
          skip: params?.skip || 0,
          limit: params?.limit || 50,
        };
      }
      throw error;
    }
  },

  /**
   * Get user by ID from API
   */
  async getUserById(id: string): Promise<any> {
    if (!id || id === 'undefined') {
      throw new Error('User ID is required');
    }
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  /**
   * Get user by ID (alias for backward compatibility)
   * @deprecated Use getUserById instead to avoid confusion with getUser() without params
   */
  async getUserByIdFromApi(id: string): Promise<any> {
    return this.getUserById(id);
  },

  /**
   * Update user (campos básicos, sin rol)
   * NOTA: El rol debe actualizarse por separado usando updateUserRole()
   */
  async updateUser(id: string, userData: {
    email?: string | null;
    full_name?: string | null;
    phone_number?: string | null;
    avatar_url?: string | null;
    photo_avatar_url?: string | null;
    bio?: string | null;
    is_active?: boolean | null;
    is_verified?: boolean | null;
    // role NO debe incluirse aquí - usar updateUserRole() en su lugar
  }): Promise<any> {
    // Remover role si viene en userData (no debe estar aquí)
    const { role, ...dataWithoutRole } = userData as any;
    if (role !== undefined) {
      console.warn('⚠️ El campo "role" no debe incluirse en updateUser(). Usa updateUserRole() en su lugar.');
    }
    const { data } = await api.patch(`/users/${id}`, dataWithoutRole);
    return data;
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  /**
   * Update user role (admin only)
   */
  async updateUserRole(id: string, role: string): Promise<any> {
    const { data } = await api.patch(`/users/${id}/role`, { role });
    return data;
  },

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(id: string, isActive: boolean): Promise<any> {
    const { data } = await api.patch(`/users/${id}/status`, { is_active: isActive });
    return data;
  },

  /**
   * Reset user password (admin only)
   */
  async resetUserPassword(id: string): Promise<{ message: string }> {
    const { data } = await api.post(`/users/${id}/reset-password`);
    return data;
  },

  /**
   * Change user password directly (admin only)
   */
  async changeUserPassword(id: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await api.patch(`/users/${id}/password`, { password: newPassword });
    return data;
  },

  /**
   * Impersonate user (superuser only)
   */
  async impersonateUser(id: string): Promise<any> {
    const { data } = await api.post(`/users/${id}/impersonate`);
    return data;
  },

  /**
   * Export users (admin only)
   */
  async exportUsers(params: {
    format?: 'json' | 'csv';
    role?: string;
    is_active?: boolean;
    is_verified?: boolean;
    from_date?: string;
    to_date?: string;
    q?: string;
    skip?: number;
    limit?: number;
  }): Promise<any> {
    if (params.format === 'csv') {
      const response = await api.get('/users/export', {
        params,
        responseType: 'blob',
      });
      return response.data;
    } else {
      const { data } = await api.get('/users/export', { params });
      return data;
    }
  },

  /**
   * Get audit logs for users (admin only)
   */
  async getAuditLogs(params?: {
    user_id?: string;
    from_date?: string;
    to_date?: string;
    q?: string;
    skip?: number;
    limit?: number;
  }): Promise<any> {
    const { data } = await api.get('/users/audit-logs', { params });
    return data;
  },

  /**
   * Upload photo avatar for current user
   */
  async uploadPhotoAvatar(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('photo', file);
    
    const { data } = await api.post('/users/me/photo-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  /**
   * Create new user (admin only)
   */
  async createUser(userData: {
    email: string;
    full_name?: string;
    password: string;
    is_active?: boolean;
    is_verified?: boolean;
    role?: string;
  }): Promise<any> {
    const { data } = await api.post('/users/', userData);
    return data;
  },

  // ===== CALL TYPES =====

  /**
   * Obtener todos los tipos de llamadas
   */
  async getCallTypes(): Promise<any[]> {
    try {
      const { data } = await api.get('/admin/call-types');
      return Array.isArray(data) ? data : data.items || [];
    } catch (error: any) {
      console.error('Error getting call types:', error);
      throw error;
    }
  },

  /**
   * Crear un nuevo tipo de llamada
   */
  async createCallType(callType: {
    name: string;
    code: string;
    description?: string;
    is_active?: boolean;
    sort_order?: number;
  }): Promise<any> {
    try {
      const { data } = await api.post('/admin/call-types', callType);
      return data;
    } catch (error: any) {
      console.error('Error creating call type:', error);
      throw error;
    }
  },

  /**
   * Actualizar un tipo de llamada
   */
  async updateCallType(
    id: string,
    updates: {
      name?: string;
      code?: string;
      description?: string;
      is_active?: boolean;
      sort_order?: number;
    }
  ): Promise<any> {
    try {
      const { data } = await api.patch(`/admin/call-types/${id}`, updates);
      return data;
    } catch (error: any) {
      console.error('Error updating call type:', error);
      throw error;
    }
  },

  /**
   * Eliminar un tipo de llamada
   */
  async deleteCallType(id: string): Promise<void> {
    try {
      await api.delete(`/admin/call-types/${id}`);
    } catch (error: any) {
      console.error('Error deleting call type:', error);
      throw error;
    }
  },
};

