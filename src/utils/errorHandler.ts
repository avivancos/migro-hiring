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
        // Para errores 500, intentar extraer mensaje específico del backend
        if (data?.detail) {
          // Si es un error de Pydantic u otro error específico, mostrar solo la parte relevante
          const detailStr = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
          
          // Detectar errores de Pydantic comunes
          if (detailStr.includes('is not fully defined')) {
            return {
              message: 'Error de configuración en el servidor. Por favor, contacta al administrador.',
              code: 'PYDANTIC_ERROR',
              status,
              details: data,
            };
          }
          
          // Mostrar mensaje del backend si está disponible
          return {
            message: detailStr.length > 200 ? detailStr.substring(0, 200) + '...' : detailStr,
            code: 'SERVER_ERROR',
            status,
            details: data,
          };
        }
        return {
          message: 'Error del servidor. Por favor, intenta más tarde.',
          code: 'SERVER_ERROR',
          status,
        };
      case 503:
        // Error 503 generalmente indica servicio no disponible o en mantenimiento
        // Mostrar mensaje específico del backend si está disponible
        if (data?.detail) {
          const detailStr = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
          return {
            message: detailStr,
            code: 'SERVICE_UNAVAILABLE',
            status,
            details: data,
          };
        }
        return {
          message: 'Servicio temporalmente no disponible. Por favor, intenta más tarde.',
          code: 'SERVICE_UNAVAILABLE',
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

