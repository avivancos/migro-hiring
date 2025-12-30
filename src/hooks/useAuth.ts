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
          } catch (error: any) {
            // ⚠️ CRÍTICO: NO limpiar tokens en error
            // Puede ser error temporal de red o servidor
            // Solo limpiar si el refresh token está realmente expirado
            console.warn('⚠️ Error al obtener usuario, pero manteniendo sesión:', error);
            
            // Si hay tokens válidos, mantener el estado como autenticado
            // El usuario puede estar offline o el servidor puede estar temporalmente caído
            const hasValidTokens = authService.isAuthenticated();
            
            if (hasValidTokens) {
              // Hay tokens válidos, mantener sesión aunque no se pudo obtener el usuario
              setAuthState({
                user: cachedUser, // Usar usuario cacheado si existe
                token,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              // No hay tokens válidos, limpiar sesión
              setAuthState({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
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

      const loginResponse = await authService.login(credentials.email, credentials.password);
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

