// Constants and configuration

// Helper para normalizar valores de entorno (tratar strings vacíos como undefined)
const normalizeEnvValue = (value: string | undefined): string | undefined => {
  return value && value.trim() !== '' ? value : undefined;
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

// URL base de la API - REQUERIDA como variable de entorno
// No hay fallback de producción para evitar hardcodes
const rawApiUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = normalizeApiUrl(rawApiUrl);

// Log de depuración en desarrollo para verificar qué URL se está usando
if (import.meta.env.DEV) {
  console.log('🔧 [Config] API Base URL configurada:', {
    raw: rawApiUrl,
    normalized: API_BASE_URL,
    fromEnv: !!rawApiUrl,
  });
}

// Stripe Publishable Key - REQUERIDA como variable de entorno
// No hay fallback para evitar hardcodes de claves
// También normalizar para manejar strings vacíos
const rawStripeKey = normalizeEnvValue(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
export const STRIPE_PUBLISHABLE_KEY = rawStripeKey;
if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error('VITE_STRIPE_PUBLISHABLE_KEY no está definida. Por favor, configura esta variable de entorno.');
}

// URL de la aplicación
// Usa la misma normalización para manejar strings vacíos
const rawAppUrlForApp = normalizeEnvValue(import.meta.env.VITE_APP_URL);
export const APP_URL = rawAppUrlForApp || 'http://localhost:5173';
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;
export const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

// URLs públicas de la aplicación
// Usa variables de entorno, con fallback solo para desarrollo local
// Maneja strings vacíos como undefined para evitar errores en builds de Docker
const rawAppUrl = normalizeEnvValue(import.meta.env.VITE_APP_URL);
export const PUBLIC_APP_URL = rawAppUrl || 
  (import.meta.env.PROD 
    ? (() => { throw new Error('VITE_APP_URL debe estar definida en producción'); })()
    : 'http://localhost:5173');

// URL corta para compartir contratos (migro.es/c/CODE)
const rawShortUrlBase = normalizeEnvValue(import.meta.env.VITE_SHORT_URL_BASE);
export const SHORT_URL_BASE = rawShortUrlBase || 
  (import.meta.env.PROD 
    ? (() => { throw new Error('VITE_SHORT_URL_BASE debe estar definida en producción'); })()
    : 'http://localhost:5173');

// Dominio público para footers y referencias (sin protocolo)
const rawPublicDomain = normalizeEnvValue(import.meta.env.VITE_PUBLIC_DOMAIN);
export const PUBLIC_DOMAIN = rawPublicDomain || 
  (import.meta.env.PROD 
    ? (() => { throw new Error('VITE_PUBLIC_DOMAIN debe estar definida en producción'); })()
    : 'localhost:5173');

// API de Pili - Servicio externo
const rawPiliApiUrl = normalizeEnvValue(import.meta.env.VITE_PILI_API_URL);
export const PILI_API_BASE_URL = rawPiliApiUrl || 
  (import.meta.env.PROD 
    ? (() => { throw new Error('VITE_PILI_API_URL debe estar definida en producción'); })()
    : 'http://localhost:8001/api');

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

