// Authentication Service

import { api } from './api';
import type { User, LoginRequest, LoginResponse } from '@/types/user';

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    
    // Store token
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    
    return data;
  },

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>('/users/me');
    
    // Cache user data
    localStorage.setItem('user', JSON.stringify(data));
    
    return data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<LoginResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const { data } = await api.post<LoginResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    // Update stored token
    localStorage.setItem('access_token', data.access_token);

    return data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  /**
   * Get cached user data
   */
  getCachedUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};

