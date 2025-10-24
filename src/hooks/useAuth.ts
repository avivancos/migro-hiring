// Authentication hook

import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import type { LoginRequest, AuthState } from '@/types/user';
import { getErrorMessage } from '@/services/api';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      const cachedUser = authService.getCachedUser();

      if (token) {
        if (cachedUser) {
          setAuthState({
            user: cachedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Fetch user if not cached
          try {
            const user = await authService.getCurrentUser();
            setAuthState({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            // Token invalid, clear everything
            authService.logout();
            setAuthState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      } else {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      const loginResponse = await authService.login(credentials);
      const user = await authService.getCurrentUser();

      setAuthState({
        user,
        token: loginResponse.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw new Error(getErrorMessage(error));
    }
  };

  const logout = () => {
    authService.logout();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const user = await authService.getCurrentUser();
      setAuthState((prev) => ({ ...prev, user }));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    logout,
    refreshUser,
  };
}

