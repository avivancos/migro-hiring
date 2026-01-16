// Constants and configuration

// Helper para normalizar valores de entorno (tratar strings vacíos como undefined)
const normalizeEnvValue = (value: string | undefined): string | undefined => {
  return value && value.trim() !== '' ? value : undefined;
};

// Helper para validar variables requeridas en producción (lazy validation)
// Esta función solo se ejecuta cuando se evalúa, no durante la inicialización del módulo
const requireInProduction = (value: string | undefined, varName: string, defaultValue: string): string => {
  if (import.meta.env.PROD && !value) {
    throw new Error(`${varName} debe estar definida en producción`);
  }
  return value || defaultValue;
};

// Normalizar la URL de la API (eliminar barra final si existe)
const normalizeApiUrl = (url: string | undefined): string => {
  // Normalizar primero para tratar strings vacíos como undefined
  const normalized = normalizeEnvValue(url);
  if (!normalized) {
    throw new Error('VITE_API_BASE_URL no está definida. Por favor, configura esta variable de entorno.');
  }
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
};

// ============================================================================
// LAZY INITIALIZATION PATTERN
// ============================================================================
// Las constantes se evalúan solo cuando se acceden por primera vez (lazy),
// no durante la inicialización del módulo. Esto permite que la aplicación
// se cargue incluso si faltan variables de entorno, y los errores solo
// ocurren cuando se intenta usar el valor.
//
// Usamos funciones getter que se evalúan lazy y las exportamos como
// constantes usando Object.defineProperty con getters. Esto permite
// mantener la misma API de importación mientras se evalúan lazy.
// ============================================================================

// Cache para valores ya evaluados (memoization)
let _apiBaseUrl: string | null = null;
let _appUrl: string | null = null;
let _publicAppUrl: string | null = null;
let _shortUrlBase: string | null = null;
let _publicDomain: string | null = null;
let _piliApiBaseUrl: string | null = null;

// Funciones getter lazy que se evalúan solo cuando se acceden
const getApiBaseUrl = (): string => {
  if (_apiBaseUrl === null) {
    const rawApiUrl = import.meta.env.VITE_API_BASE_URL;
    _apiBaseUrl = normalizeApiUrl(rawApiUrl);
    
    // Log de depuración en desarrollo para verificar qué URL se está usando
    if (import.meta.env.DEV) {
      console.log('🔧 [Config] API Base URL configurada:', {
        raw: rawApiUrl,
        normalized: _apiBaseUrl,
        fromEnv: !!rawApiUrl,
      });
    }
  }
  return _apiBaseUrl;
};

const getAppUrl = (): string => {
  if (_appUrl === null) {
    const rawAppUrlForApp = normalizeEnvValue(import.meta.env.VITE_APP_URL);
    _appUrl = requireInProduction(rawAppUrlForApp, 'VITE_APP_URL', 'http://localhost:5173');
  }
  return _appUrl;
};

const getPublicAppUrl = (): string => {
  if (_publicAppUrl === null) {
    const rawAppUrl = normalizeEnvValue(import.meta.env.VITE_APP_URL);
    _publicAppUrl = requireInProduction(rawAppUrl, 'VITE_APP_URL', 'http://localhost:5173');
  }
  return _publicAppUrl;
};

const getShortUrlBase = (): string => {
  if (_shortUrlBase === null) {
    const rawShortUrlBase = normalizeEnvValue(import.meta.env.VITE_SHORT_URL_BASE);
    _shortUrlBase = requireInProduction(rawShortUrlBase, 'VITE_SHORT_URL_BASE', 'http://localhost:5173');
  }
  return _shortUrlBase;
};

const getPublicDomain = (): string => {
  if (_publicDomain === null) {
    const rawPublicDomain = normalizeEnvValue(import.meta.env.VITE_PUBLIC_DOMAIN);
    _publicDomain = requireInProduction(rawPublicDomain, 'VITE_PUBLIC_DOMAIN', 'localhost:5173');
  }
  return _publicDomain;
};

const getPiliApiBaseUrl = (): string => {
  if (_piliApiBaseUrl === null) {
    const rawPiliApiUrl = normalizeEnvValue(import.meta.env.VITE_PILI_API_URL);
    _piliApiBaseUrl = requireInProduction(rawPiliApiUrl, 'VITE_PILI_API_URL', 'http://localhost:8001/api');
  }
  return _piliApiBaseUrl;
};

// Crear objeto temporal para definir getters
const lazyConfig: {
  API_BASE_URL: string;
  APP_URL: string;
  PUBLIC_APP_URL: string;
  SHORT_URL_BASE: string;
  PUBLIC_DOMAIN: string;
  PILI_API_BASE_URL: string;
} = {} as any;

// Definir getters en el objeto usando Object.defineProperty
Object.defineProperty(lazyConfig, 'API_BASE_URL', {
  get: getApiBaseUrl,
  enumerable: true,
  configurable: true,
});

Object.defineProperty(lazyConfig, 'APP_URL', {
  get: getAppUrl,
  enumerable: true,
  configurable: true,
});

Object.defineProperty(lazyConfig, 'PUBLIC_APP_URL', {
  get: getPublicAppUrl,
  enumerable: true,
  configurable: true,
});

Object.defineProperty(lazyConfig, 'SHORT_URL_BASE', {
  get: getShortUrlBase,
  enumerable: true,
  configurable: true,
});

Object.defineProperty(lazyConfig, 'PUBLIC_DOMAIN', {
  get: getPublicDomain,
  enumerable: true,
  configurable: true,
});

Object.defineProperty(lazyConfig, 'PILI_API_BASE_URL', {
  get: getPiliApiBaseUrl,
  enumerable: true,
  configurable: true,
});

// Exportar el objeto con getters para uso lazy (RECOMENDADO)
// Las propiedades de este objeto se evalúan solo cuando se acceden,
// no durante la inicialización del módulo. Esto permite que la aplicación
// se cargue incluso si faltan variables de entorno.
export const config = lazyConfig;

// NOTA: Las exportaciones individuales han sido eliminadas para forzar evaluación lazy.
// Todas las referencias han sido actualizadas para usar `config.*` en lugar de constantes directas.
// Esto asegura que la validación solo ocurra cuando se accede a los valores, no durante la inicialización.

// Stripe Publishable Key - REQUERIDA como variable de entorno
// No hay fallback para evitar hardcodes de claves
// También normalizar para manejar strings vacíos
// IMPORTANTE: Permitir undefined para no crashear la app al inicio
// La validación se hace cuando se intenta usar Stripe (lazy validation)
const rawStripeKey = normalizeEnvValue(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
export const STRIPE_PUBLISHABLE_KEY: string | undefined = rawStripeKey;

export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;
export const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

export const HIRING_STEPS = [
  { id: 1, name: 'Detalles', description: 'Información del servicio' },
  { id: 2, name: 'Confirmar', description: 'Datos personales' },
  { id: 3, name: 'Firma', description: 'Firma del contrato' },
  { id: 4, name: 'Pago', description: 'Pago inicial' },
  { id: 5, name: 'Finalizado', description: 'Confirmación' },
] as const;

export const COLORS = {
  primary: '#16a34a', // green-600 - Logo/Marca
  secondary: '#22c55e', // green-500 - Acento
  emphasis: '#111827', // gray-900 - Énfasis/CTAs
  error: '#ef4444',
  gray: '#6b7280',
  background: '#f9fafb',
} as const;
