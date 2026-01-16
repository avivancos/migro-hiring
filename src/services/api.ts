// Axios instance with interceptors

import axios, { AxiosError } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@/config/constants';
import { isTokenExpired, isTokenExpiringSoon, getTokenTimeRemaining } from '@/utils/jwt';
import TokenStorage from '@/utils/tokenStorage';
import { performanceTracingService } from './performanceTracingService';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - Add JWT token and check expiration proactively
api.interceptors.request.use(
  async (config) => {
    // Iniciar medición de performance para llamadas API
    if (config.url) {
      const markName = performanceTracingService.start(
        config.url,
        'api',
        {
          method: config.method?.toUpperCase(),
          url: config.url,
          endpoint: config.url.replace(API_BASE_URL, ''),
        }
      );
      (config as any).__perfMarkName = markName;
    }

    // No añadir token en endpoints de autenticación pública o health checks
    const publicEndpoints = [
      '/auth/login', 
      '/auth/register', 
      '/auth/refresh',
      // Pili LLM deshabilitado - movido a repositorio externo
      // '/ai/pili-openai/health', // Health check no requiere autenticación
      '/pipelines/admin/approve-hiring-code' // Endpoint público de aprobación con token
    ];
    
    // Endpoints públicos de contratación (no requieren autenticación)
    // IMPORTANTE: Solo aplicar a rutas que NO sean /admin/hiring/
    const isPublicHiringEndpoint = config.url?.includes('/hiring/') && 
                                    !config.url?.includes('/admin/hiring/');
    
    // Endpoint GET de anexos es público (no requiere autenticación)
    // POST, PATCH, DELETE sí requieren autenticación JWT con permisos de admin
    const isAnnexesGetEndpoint = config.method?.toLowerCase() === 'get' && 
                                  config.url?.includes('/admin/hiring/') && 
                                  config.url?.includes('/annexes') &&
                                  !config.url?.includes('/annexes/'); // Excluir GET de anexo específico si existe
    
    const isPublicEndpoint = (config.url && publicEndpoints.some(endpoint => config.url!.includes(endpoint))) || 
                            isPublicHiringEndpoint ||
                            isAnnexesGetEndpoint;
    
    // No añadir token si ya tiene X-Admin-Password (autenticación alternativa)
    const hasAdminPassword = config.headers && 'X-Admin-Password' in config.headers;
    
    // Log de depuración para endpoints de anexos
    if (config.url?.includes('/annexes')) {
      console.log('🔍 [api.ts] Endpoint de anexos:', {
        url: config.url,
        method: config.method,
        isAnnexesGetEndpoint,
        isPublicEndpoint,
        hasAdminPassword,
      });
    }
    
    if (!isPublicEndpoint && !hasAdminPassword) {
      let token = TokenStorage.getAccessToken();
      
      // Log de depuración para endpoints de anexos
      if (config.url?.includes('/annexes')) {
        console.log('🔍 [api.ts] Token para anexos:', {
          hasToken: !!token,
          tokenLength: token?.length,
        });
      }
      
      if (token) {
        // Usar TokenStorage como fuente de verdad (usa expires_in del servidor con buffer de 2 min)
        // TokenStorage.isTokenExpired() ya incluye el buffer de 2 minutos para refresh proactivo
        const tokenExpired = TokenStorage.isTokenExpired();
        
        // Solo verificar JWT como fallback si TokenStorage no tiene información de expiración
        // (esto puede pasar si el token fue guardado antes de implementar TokenStorage)
        let jwtExpired = false;
        if (tokenExpired) {
          // Si TokenStorage dice que está expirado, verificar también el JWT para confirmar
          jwtExpired = isTokenExpired(token);
        }
        
        // Si TokenStorage dice que está expirado Y el JWT confirma, refrescar
        // Esto evita refreshes innecesarios cuando hay discrepancias menores
        if (tokenExpired && jwtExpired) {
          console.warn('⚠️ Token expirado (confirmado por TokenStorage y JWT), intentando refrescar...');
          const newToken = await refreshTokenProactively();
          if (newToken) {
            token = newToken;
          } else {
            // Si no se pudo refrescar, solo redirigir si realmente no hay refresh token
            const refreshToken = TokenStorage.getRefreshToken();
            if (!refreshToken || TokenStorage.isRefreshTokenExpired()) {
              if (window.location.pathname.startsWith('/admin') || 
                  window.location.pathname.startsWith('/crm') ||
                  window.location.pathname.startsWith('/contrato')) {
                window.location.href = '/auth/login';
              }
            }
            return Promise.reject(new Error('Token expirado y no se pudo refrescar'));
          }
        } else if (tokenExpired && !jwtExpired) {
          // TokenStorage dice expirado pero JWT dice válido - puede ser un problema de sincronización
          // Intentar refrescar de todas formas para estar seguros
          console.warn('⚠️ TokenStorage indica expiración pero JWT es válido, refrescando preventivamente...');
          const newToken = await refreshTokenProactively();
          if (newToken) {
            token = newToken;
          }
        } else if (!tokenExpired && isTokenExpiringSoon(token, 2)) {
          // TokenStorage dice que no está expirado pero JWT indica que expirará pronto
          // Refrescar proactivamente
          const timeRemaining = getTokenTimeRemaining(token);
          if (timeRemaining !== null) {
            const minutesRemaining = Math.floor(timeRemaining / 60);
            const secondsRemaining = timeRemaining % 60;
            if (minutesRemaining > 0) {
              console.log(`🔄 Token expirará en ${minutesRemaining} min ${secondsRemaining} seg, refrescando proactivamente...`);
            } else {
              console.log(`🔄 Token expirará en ${secondsRemaining} segundos, refrescando proactivamente...`);
            }
          }
          const newToken = await refreshTokenProactively();
          if (newToken) {
            token = newToken;
          }
        }
        
        config.headers.Authorization = `Bearer ${token}`;
        
        // Log de depuración para endpoints de anexos
        if (config.url?.includes('/annexes')) {
          console.log('✅ [api.ts] Token JWT agregado para anexos');
        }
      } else {
        // Log de depuración si no hay token
        if (config.url?.includes('/annexes')) {
          console.warn('⚠️ [api.ts] No hay token disponible para endpoint de anexos');
        }
      }
    } else {
      // Log de depuración si es endpoint público
      if (config.url?.includes('/annexes')) {
        console.log('ℹ️ [api.ts] Endpoint de anexos es público, no se agrega token');
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

/**
 * Refresca el token de acceso proactivamente
 * @returns Promise con el nuevo token o null si falla
 */
const refreshTokenProactively = async (): Promise<string | null> => {
  // Evitar múltiples llamadas de refresh simultáneas
  if (isRefreshing) {
    return new Promise((resolve) => {
      failedQueue.push({ 
        resolve: (token) => resolve(token || null), 
        reject: () => resolve(null) 
      });
    });
  }

  const refreshToken = TokenStorage.getRefreshToken();
  
  if (!refreshToken) {
    console.warn('⚠️ No hay refresh token disponible');
    return null;
  }

  if (TokenStorage.isRefreshTokenExpired()) {
    console.warn('⚠️ Refresh token expirado');
    TokenStorage.clearTokens();
    return null;
  }

  isRefreshing = true;

  try {
    console.log('🔄 Refrescando token proactivamente...');
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { timeout: API_TIMEOUT }
    );
    
    const data = response.data;
    
    // Guardar nuevos tokens usando TokenStorage (usa expires_in del servidor)
    TokenStorage.saveTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Usar el nuevo o mantener el anterior
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in || 1209600, // 14 días por defecto
      refresh_expires_in: data.refresh_expires_in || 2592000, // 30 días por defecto
    });
    
    console.log('✅ Token refrescado exitosamente');
    
    // Procesar cola de peticiones en espera
    processQueue(null, data.access_token);
    isRefreshing = false;
    
    return data.access_token;
  } catch (refreshError: any) {
    console.error('❌ Error refrescando token:', refreshError);
    
    // CRÍTICO: Solo limpiar tokens si el refresh token está REALMENTE inválido/expirado
    // NO limpiar en errores temporales (red, timeout, 500, 503, etc.)
    // NO limpiar en errores 401/403 del servidor si el refresh token todavía es válido
    // Solo limpiar si:
    // 1. El refresh token está realmente expirado (verificado localmente)
    // 2. El servidor responde con 400/401/403 Y el mensaje indica que el refresh token es inválido/expirado
    // 3. NO hay refresh token disponible
    
    const refreshTokenExpired = TokenStorage.isRefreshTokenExpired();
    const noRefreshToken = !TokenStorage.getRefreshToken();
    
    // Verificar si el error del servidor indica que el refresh token es inválido
    const serverSaysTokenInvalid = 
      (refreshError.response?.status === 400 && 
       (refreshError.response?.data?.detail?.toLowerCase().includes('token') || 
        refreshError.response?.data?.detail?.toLowerCase().includes('invalid') ||
        refreshError.response?.data?.detail?.toLowerCase().includes('expired'))) ||
      (refreshError.response?.status === 401 && 
       (refreshError.response?.data?.detail?.toLowerCase().includes('token') || 
        refreshError.response?.data?.detail?.toLowerCase().includes('invalid') ||
        refreshError.response?.data?.detail?.toLowerCase().includes('expired'))) ||
      (refreshError.response?.status === 403 && 
       (refreshError.response?.data?.detail?.toLowerCase().includes('token') || 
        refreshError.response?.data?.detail?.toLowerCase().includes('invalid') ||
        refreshError.response?.data?.detail?.toLowerCase().includes('expired')));
    
    const shouldClearTokens = refreshTokenExpired || noRefreshToken || serverSaysTokenInvalid;
    
    if (shouldClearTokens) {
      console.warn('⚠️ Limpiando tokens debido a refresh token inválido/expirado:', {
        refreshTokenExpired,
        noRefreshToken,
        serverSaysTokenInvalid,
        status: refreshError.response?.status,
        detail: refreshError.response?.data?.detail
      });
      TokenStorage.clearTokens();
    } else {
      // Error temporal (red, timeout, 500, 503, etc.) - MANTENER tokens
      console.warn('⚠️ Error temporal al refrescar token, MANTENIENDO tokens:', {
        message: refreshError.message,
        status: refreshError.response?.status,
        code: refreshError.code,
        detail: refreshError.response?.data?.detail
      });
    }
    
    processQueue(refreshError, null);
    isRefreshing = false;
    
    return null;
  }
};

api.interceptors.response.use(
  (response) => {
    // Finalizar medición de performance
    const markName = (response.config as any).__perfMarkName;
    if (markName) {
      performanceTracingService.end(markName, 'success', {
        status: response.status,
        statusText: response.statusText,
      });
    }

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
    
    // Finalizar medición de performance con error
    const markName = (originalRequest as any)?.__perfMarkName;
    if (markName) {
      performanceTracingService.end(markName, 'error', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        error: error.message,
      });
    }
    
    // Detailed error logging
    console.error('❌ API Error Details:');
    console.error('   URL:', error.config?.url);
    console.error('   Method:', error.config?.method);
    console.error('   Status:', error.response?.status);
    console.error('   Response Data:', error.response?.data);
    
    if (error.response) {
      const { status } = error.response;
      
      // Token expired or unauthorized - Intentar refresh token
      // IMPORTANTE: Solo intentar refresh si es un 401 y tenemos tokens válidos
      // NO limpiar tokens por errores 401 que no sean de autenticación (ej: permisos)
      if (status === 401 && originalRequest && !originalRequest._retry) {
        // Verificar si es una ruta pública del frontend
        const isPublicFrontendRoute = window.location.pathname === '/' ||
                             window.location.pathname.includes('/contratacion/') || 
                             window.location.pathname.includes('/hiring/') ||
                             window.location.pathname === '/expirado' ||
                             window.location.pathname === '/404' ||
                             window.location.pathname === '/privacidad' ||
                             window.location.pathname === '/privacy';
        
        // Verificar si es un endpoint público de la API
        const publicApiEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/hiring/']; // Pili deshabilitado
        const isPublicApiEndpoint = originalRequest.url && publicApiEndpoints.some(endpoint => originalRequest.url!.includes(endpoint));
        
        if (isPublicFrontendRoute || isPublicApiEndpoint) {
          // En rutas públicas, simplemente rechazar el error sin intentar refresh
          return Promise.reject(error);
        }
        
        // Verificar si tenemos tokens válidos antes de intentar refresh
        // Si no hay tokens o están expirados, rechazar directamente sin limpiar
        const hasValidRefreshToken = TokenStorage.hasTokens() && 
                                     TokenStorage.getRefreshToken() && 
                                     !TokenStorage.isRefreshTokenExpired();
        
        if (!hasValidRefreshToken) {
          // No hay refresh token válido, rechazar error sin limpiar (ya no hay nada que limpiar)
          console.warn('⚠️ No hay refresh token válido, rechazando request sin limpiar tokens');
          return Promise.reject(error);
        }
        
        // Marcar que este request ya se está reintentando
        originalRequest._retry = true;
        
        try {
          // Intentar refrescar el token usando la función reutilizable
          // Esta función maneja internamente el flag isRefreshing y la cola
          // IMPORTANTE: refreshTokenProactively() solo limpia tokens si el refresh token está realmente inválido
          const newToken = await refreshTokenProactively();
          
          if (newToken) {
            // Actualizar header de la petición original
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Reintentar petición original
            return api(originalRequest);
          } else {
            // Refresh falló - verificar si los tokens todavía existen
            // Si existen, fue un error temporal y NO debemos limpiar ni redirigir
            // Si no existen, refreshTokenProactively() ya los limpió (error de autenticación real)
            const stillHasTokens = TokenStorage.hasTokens() && 
                                  TokenStorage.getRefreshToken() && 
                                  !TokenStorage.isRefreshTokenExpired();
            
            if (!stillHasTokens) {
              // Los tokens fueron limpiados por refreshTokenProactively() porque el refresh token está realmente inválido
              // Solo redirigir si estamos en rutas de admin
              if (window.location.pathname.startsWith('/admin') || 
                  window.location.pathname.startsWith('/crm') ||
                  window.location.pathname.startsWith('/contrato')) {
                window.location.href = '/auth/login';
              }
            } else {
              // Los tokens todavía existen, fue un error temporal (red, timeout, 500, etc.)
              // NO limpiar tokens, NO redirigir, solo rechazar el error para que el componente lo maneje
              console.warn('⚠️ Error temporal al refrescar token, MANTENIENDO tokens y sesión. Rechazando request.');
            }
            
            return Promise.reject(new Error('No se pudo refrescar el token'));
          }
        } catch (refreshError) {
          // Error al intentar refrescar - verificar si los tokens todavía existen
          // IMPORTANTE: NUNCA limpiar tokens aquí, solo verificar si refreshTokenProactively() los limpió
          const stillHasTokens = TokenStorage.hasTokens() && 
                                TokenStorage.getRefreshToken() && 
                                !TokenStorage.isRefreshTokenExpired();
          
          if (!stillHasTokens) {
            // Los tokens fueron limpiados por refreshTokenProactively() porque el refresh token está realmente inválido
            // Solo redirigir si estamos en rutas de admin
            if (window.location.pathname.startsWith('/admin') || 
                window.location.pathname.startsWith('/crm') ||
                window.location.pathname.startsWith('/contrato')) {
              window.location.href = '/auth/login';
            }
          } else {
            // Los tokens todavía existen, fue un error temporal (red, timeout, 500, etc.)
            // NO limpiar tokens, NO redirigir, solo rechazar el error
            console.warn('⚠️ Error temporal al refrescar token, MANTENIENDO tokens y sesión. Rechazando request.');
          }
          
          return Promise.reject(refreshError);
        }
      }
      
      // IMPORTANTE: Para TODOS los demás errores (403, 404, 422, 500, timeout, etc.)
      // NUNCA limpiar tokens ni redirigir - solo rechazar el error
      // Los tokens solo se limpian cuando el refresh token está realmente inválido/expirado
      
      // IMPORTANTE: Para TODOS los demás errores (403, 404, 422, 500, etc.)
      // NUNCA limpiar tokens ni redirigir - solo rechazar el error
      // Los tokens solo se limpian cuando el refresh token está realmente inválido/expirado
      
      // Forbidden (403) - Error de permisos, NO de autenticación
      // NO limpiar tokens, solo rechazar error
      if (status === 403) {
        console.error('❌ Acceso denegado (403) - MANTENIENDO tokens y sesión');
      }
      
      // Not found (404) - Recurso no encontrado
      // NO limpiar tokens, solo rechazar error
      if (status === 404) {
        console.error('❌ Recurso no encontrado (404) - MANTENIENDO tokens y sesión');
      }
      
      // Validation error (422) - Error de validación
      // NO limpiar tokens, solo rechazar error
      if (status === 422) {
        console.error('❌ Error de validación (422) - MANTENIENDO tokens y sesión');
      }
      
      // Server error (500+) - Error del servidor
      // NO limpiar tokens, solo rechazar error
      if (status >= 500) {
        console.error('❌ Error del servidor (500+) - MANTENIENDO tokens y sesión');
      }
    } else if (error.request) {
      // Error de red o timeout - NO limpiar tokens
      console.error('❌ No se recibió respuesta del servidor (timeout/red) - MANTENIENDO tokens y sesión');
      console.error('   Request:', error.request);
    } else {
      // Error al configurar request - NO limpiar tokens
      console.error('❌ Error al configurar request - MANTENIENDO tokens y sesión:', error.message);
    }
    
    // IMPORTANTE: Rechazar el error sin limpiar tokens
    // Los tokens solo se limpian cuando el refresh token está realmente inválido/expirado
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
        // Para errores 500, intentar extraer mensaje específico del backend
        if (data?.detail) {
          const detailStr = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
          
          // Detectar errores de Pydantic comunes
          if (detailStr.includes('is not fully defined')) {
            return 'Error de configuración en el servidor. Por favor, contacta al administrador.';
          }
          
          // Mostrar mensaje del backend si está disponible (limitado a 200 caracteres)
          return detailStr.length > 200 ? detailStr.substring(0, 200) + '...' : detailStr;
        }
        return 'Error del servidor. Por favor intenta más tarde.';
      case 503:
        // Error 503 generalmente indica servicio no disponible o en mantenimiento
        // Mostrar mensaje específico del backend si está disponible
        if (data?.detail) {
          const detailStr = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
          return detailStr;
        }
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

