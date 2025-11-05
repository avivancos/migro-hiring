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
  async login(email: string, password: string): Promise<{ success: boolean; token?: string; user?: any }> {
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      // Guardar tokens
      localStorage.setItem('admin_token', data.access_token);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));

      return { 
        success: true, 
        token: data.access_token,
        user: data.user 
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false };
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

