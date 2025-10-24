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

// Request interceptor - Add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;
      
      // Token expired or unauthorized - NO redirigir a login en flujo de contratación
      if (status === 401) {
        // Solo limpiar tokens si estamos en rutas que requieren autenticación
        // El flujo de contratación NO requiere login
        const isHiringFlow = window.location.pathname.includes('/contratacion/') || 
                             window.location.pathname.includes('/hiring/');
        
        if (!isHiringFlow) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
        
        // Log pero NO redirigir - el componente manejará el error
        console.error('No autorizado:', error.response.data);
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

