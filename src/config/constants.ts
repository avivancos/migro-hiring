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
// IMPORTANTE: Permitir undefined para no crashear la app al inicio
// La validación se hace cuando se intenta usar Stripe (lazy validation)
const rawStripeKey = normalizeEnvValue(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
export const STRIPE_PUBLISHABLE_KEY: string | undefined = rawStripeKey;

// URL de la aplicación
// Usa la misma normalización para manejar strings vacíos
// IMPORTANTE: Mismo comportamiento que PUBLIC_APP_URL para consistencia
// Fallback solo en desarrollo, error en producción si no está definida
const rawAppUrlForApp = normalizeEnvValue(import.meta.env.VITE_APP_URL);
export const APP_URL = requireInProduction(rawAppUrlForApp, 'VITE_APP_URL', 'http://localhost:5173');

export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;
export const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

// URLs públicas de la aplicación
// Usa variables de entorno, con fallback solo para desarrollo local
// Maneja strings vacíos como undefined para evitar errores en builds de Docker
// IMPORTANTE: Mismo comportamiento que APP_URL para consistencia
const rawAppUrl = normalizeEnvValue(import.meta.env.VITE_APP_URL);
export const PUBLIC_APP_URL = requireInProduction(rawAppUrl, 'VITE_APP_URL', 'http://localhost:5173');

// URL corta para compartir contratos (migro.es/c/CODE)
const rawShortUrlBase = normalizeEnvValue(import.meta.env.VITE_SHORT_URL_BASE);
export const SHORT_URL_BASE = requireInProduction(rawShortUrlBase, 'VITE_SHORT_URL_BASE', 'http://localhost:5173');

// Dominio público para footers y referencias (sin protocolo)
const rawPublicDomain = normalizeEnvValue(import.meta.env.VITE_PUBLIC_DOMAIN);
export const PUBLIC_DOMAIN = requireInProduction(rawPublicDomain, 'VITE_PUBLIC_DOMAIN', 'localhost:5173');

// API de Pili - Servicio externo
const rawPiliApiUrl = normalizeEnvValue(import.meta.env.VITE_PILI_API_URL);
export const PILI_API_BASE_URL = requireInProduction(rawPiliApiUrl, 'VITE_PILI_API_URL', 'http://localhost:8001/api');

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

