// Manejo centralizado de errores de API
// Traducción de errores y mensajes user-friendly

import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Errores específicos del backend
    if (data?.detail) {
      return {
        message: data.detail,
        code: data.code,
        status,
        details: data,
      };
    }

    // Errores HTTP estándar
    switch (status) {
      case 400:
        return {
          message: 'Datos inválidos. Por favor, revisa la información ingresada.',
          code: 'BAD_REQUEST',
          status,
        };
      case 401:
        return {
          message: 'No autorizado. Por favor, inicia sesión nuevamente.',
          code: 'UNAUTHORIZED',
          status,
        };
      case 403:
        return {
          message: 'No tienes permisos para realizar esta acción.',
          code: 'FORBIDDEN',
          status,
        };
      case 404:
        return {
          message: 'Recurso no encontrado.',
          code: 'NOT_FOUND',
          status,
        };
      case 405:
        return {
          message: 'Método no permitido. El endpoint puede no estar implementado en el backend.',
          code: 'METHOD_NOT_ALLOWED',
          status,
        };
      case 409:
        return {
          message: 'Conflicto. El recurso ya existe o ha sido modificado.',
          code: 'CONFLICT',
          status,
        };
      case 422:
        return {
          message: data?.detail || 'Error de validación. Por favor, revisa los datos.',
          code: 'VALIDATION_ERROR',
          status,
          details: data,
        };
      case 429:
        return {
          message: 'Demasiadas solicitudes. Por favor, espera un momento.',
          code: 'RATE_LIMIT',
          status,
        };
      case 500:
      case 502:
      case 503:
        return {
          message: 'Error del servidor. Por favor, intenta más tarde.',
          code: 'SERVER_ERROR',
          status,
        };
      default:
        return {
          message: error.message || 'Error desconocido',
          code: 'UNKNOWN_ERROR',
          status,
        };
    }
  }

  // Error de red
  if (error instanceof Error) {
    if (error.message.includes('Network Error') || error.message.includes('timeout')) {
      return {
        message: 'Error de conexión. Verifica tu conexión a internet.',
        code: 'NETWORK_ERROR',
      };
    }
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    };
  }

  return {
    message: 'Error desconocido',
    code: 'UNKNOWN_ERROR',
  };
}

// Hook para mostrar errores al usuario
export function getErrorMessage(error: unknown): string {
  return handleApiError(error).message;
}

