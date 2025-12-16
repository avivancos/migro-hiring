// Axios instance with interceptors

import axios, { AxiosError } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@/config/constants';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - Add JWT token (except for login endpoint and admin password endpoints)
api.interceptors.request.use(
  (config) => {
    // No añadir token en endpoints de autenticación pública o health checks
    const publicEndpoints = [
      '/auth/login', 
      '/auth/register', 
      '/auth/refresh',
      '/ai/pili-openai/health' // Health check no requiere autenticación
    ];
    const isPublicEndpoint = config.url && publicEndpoints.some(endpoint => config.url!.includes(endpoint));
    
    // No añadir token si ya tiene X-Admin-Password (autenticación alternativa)
    const hasAdminPassword = config.headers && 'X-Admin-Password' in config.headers;
    
    if (!isPublicEndpoint && !hasAdminPassword) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Log para debugging de búsquedas con espacios
    if (config.url?.includes('/crm/contacts') && config.params?.search) {
      console.log('🔍 [api.ts] Búsqueda de contactos:', {
        url: config.url,
        search: config.params.search,
        searchType: typeof config.params.search,
        searchLength: config.params.search.length,
        fullParams: config.params
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`);
    
    // Log temporal para debug de calls
    if (response.config.url?.includes('/crm/calls') && response.config.method === 'get') {
      console.log('🔍 [api.ts] GET /crm/calls - Response data:', response.data);
      console.log('🔍 [api.ts] GET /crm/calls - Response data type:', typeof response.data);
      console.log('🔍 [api.ts] GET /crm/calls - Is array?:', Array.isArray(response.data));
      if (response.data && typeof response.data === 'object') {
        console.log('🔍 [api.ts] GET /crm/calls - Has items?:', 'items' in response.data);
        console.log('🔍 [api.ts] GET /crm/calls - Items value:', response.data.items);
        console.log('🔍 [api.ts] GET /crm/calls - Keys:', Object.keys(response.data));
      }
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Detailed error logging
    console.error('❌ API Error Details:');
    console.error('   URL:', error.config?.url);
    console.error('   Method:', error.config?.method);
    console.error('   Status:', error.response?.status);
    console.error('   Response Data:', error.response?.data);
    
    if (error.response) {
      const { status } = error.response;
      
      // Token expired or unauthorized - Intentar refresh token
      if (status === 401 && originalRequest && !originalRequest._retry) {
        // Verificar si es una ruta pública
        const isPublicRoute = window.location.pathname === '/' ||
                             window.location.pathname.includes('/contratacion/') || 
                             window.location.pathname.includes('/hiring/') ||
                             window.location.pathname === '/expirado' ||
                             window.location.pathname === '/404' ||
                             window.location.pathname === '/privacidad' ||
                             window.location.pathname === '/privacy';
        
        if (isPublicRoute) {
          return Promise.reject(error);
        }
        
        // Evitar múltiples llamadas de refresh simultáneas
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }
        
        originalRequest._retry = true;
        isRefreshing = true;
        
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No hay refresh token, limpiar y redirigir a login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          processQueue(new Error('No refresh token'), null);
          isRefreshing = false;
          
          // Solo redirigir si estamos en rutas de admin
          if (window.location.pathname.startsWith('/admin') || 
              window.location.pathname.startsWith('/crm') ||
              window.location.pathname.startsWith('/contrato')) {
            window.location.href = '/auth/login';
          }
          
          return Promise.reject(error);
        }
        
        try {
          // Intentar refrescar el token
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken },
            { timeout: API_TIMEOUT }
          );
          
          const { access_token, refresh_token: newRefreshToken } = response.data;
          
          // Guardar nuevos tokens
          localStorage.setItem('access_token', access_token);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
          localStorage.setItem('admin_token', access_token);
          
          // Actualizar header de la petición original
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          
          // Procesar cola de peticiones fallidas
          processQueue(null, access_token);
          isRefreshing = false;
          
          // Reintentar petición original
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh falló, limpiar tokens y redirigir
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Solo redirigir si estamos en rutas de admin
          if (window.location.pathname.startsWith('/admin') || 
              window.location.pathname.startsWith('/crm') ||
              window.location.pathname.startsWith('/contrato')) {
            window.location.href = '/auth/login';
          }
          
          return Promise.reject(refreshError);
        }
      }
      
      // Forbidden
      if (status === 403) {
        console.error('Acceso denegado');
      }
      
      // Not found
      if (status === 404) {
        console.error('Recurso no encontrado');
      }
      
      // Server error
      if (status >= 500) {
        console.error('Error del servidor');
      }
    } else if (error.request) {
      console.error('❌ No se recibió respuesta del servidor');
      console.error('   Request:', error.request);
    } else {
      console.error('❌ Error al configurar request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Handle API errors and return user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    
    if (axiosError.response) {
      const { status, data } = axiosError.response;
      
      // Return server error message if available
      if (data?.detail) {
        return data.detail;
      }
      
      // Default messages by status code
      switch (status) {
        case 400:
          return 'Solicitud inválida. Por favor verifica los datos.';
        case 401:
          return 'Código de contratación inválido o sin permisos.';
        case 403:
          return 'No tienes permisos para realizar esta acción.';
        case 404:
          return 'Código de contratación no encontrado o ha expirado.';
        case 409:
          return 'Conflicto con el estado actual.';
        case 410:
          return 'Este enlace ha expirado.';
        case 422:
          return 'Los datos proporcionados son inválidos.';
        case 429:
          return 'Demasiadas solicitudes. Por favor espera un momento.';
        case 500:
          return 'Error del servidor. Por favor intenta más tarde.';
        case 503:
          return 'Servicio temporalmente no disponible.';
        default:
          return 'Ha ocurrido un error inesperado.';
      }
    }
    
    if (axiosError.request) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
  }
  
  return 'Error desconocido. Por favor intenta nuevamente.';
}

