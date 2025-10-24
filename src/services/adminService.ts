// Admin Service - Administrative endpoints

import { api } from './api';
import type { CreateHiringRequest, HiringCodeResponse } from '@/types/admin';

export const adminService = {
  /**
   * Admin login
   */
  async login(password: string): Promise<{ success: boolean; token?: string }> {
    // For now, hardcoded password validation
    // In production, this should be a proper API call
    const ADMIN_PASSWORD = 'Pomelo2005.1@';
    
    if (password === ADMIN_PASSWORD) {
      // Generate a simple token (in production, this comes from backend)
      const token = btoa(`admin:${Date.now()}`);
      localStorage.setItem('admin_token', token);
      return { success: true, token };
    }
    
    return { success: false };
  },

  /**
   * Check if admin is logged in
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('admin_token');
    return !!token;
  },

  /**
   * Admin logout
   */
  logout(): void {
    localStorage.removeItem('admin_token');
  },

  /**
   * Create hiring code
   */
  async createHiringCode(request: CreateHiringRequest): Promise<HiringCodeResponse> {
    const { data } = await api.post<HiringCodeResponse>('/admin/hiring/create', request, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1',
      },
    });
    return data;
  },

  /**
   * Get all hiring codes (optional - for future)
   */
  async getAllHiringCodes(): Promise<any[]> {
    const { data } = await api.get('/admin/hiring/list', {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1',
      },
    });
    return data;
  },
};

