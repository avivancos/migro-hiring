// Constants and configuration

// Normalizar la URL de la API (eliminar barra final si existe)
const normalizeApiUrl = (url: string | undefined): string => {
  if (!url) return 'https://api.migro.es/api';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

// SIEMPRE USA API DE PRODUCCIÓN
// En desarrollo, usar VITE_API_BASE_URL del .env
// En producción, usar el fallback o la variable de entorno
const rawApiUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = normalizeApiUrl(rawApiUrl);

// Log de depuración en desarrollo para verificar qué URL se está usando
if (import.meta.env.DEV) {
  console.log('🔧 [Config] API Base URL configurada:', {
    raw: rawApiUrl,
    normalized: API_BASE_URL,
    fromEnv: !!rawApiUrl,
    fallback: !rawApiUrl,
  });
}
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51SCgH4Djtj7fY0EsiZB6PvzabhQzCrgLQr728oJkfbUDciK9nk29ajRta3IuMK1tSXRv3RUQloYNez3BEwY2DmIp00RhGVHymj';
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;
export const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

// URLs públicas de la aplicación
// En desarrollo: usar localhost
// En producción: usar dominios reales
export const PUBLIC_APP_URL = import.meta.env.VITE_APP_URL || 
  (import.meta.env.PROD 
    ? 'https://contratacion.migro.es' 
    : 'http://localhost:5173');

// URL corta para compartir contratos (migro.es/c/CODE)
export const SHORT_URL_BASE = import.meta.env.VITE_SHORT_URL_BASE || 
  (import.meta.env.PROD 
    ? 'https://migro.es' 
    : 'http://localhost:5173');

// Dominio público para footers y referencias (sin protocolo)
export const PUBLIC_DOMAIN = import.meta.env.VITE_PUBLIC_DOMAIN || 
  (import.meta.env.PROD 
    ? 'contratacion.migro.es' 
    : 'localhost:5173');

// API de Pili - Servicio externo
// En producción: https://pili.migro.es/api
// En desarrollo: http://localhost:8001/api
export const PILI_API_BASE_URL = import.meta.env.VITE_PILI_API_URL || 
  (import.meta.env.PROD 
    ? 'https://pili.migro.es/api' 
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

