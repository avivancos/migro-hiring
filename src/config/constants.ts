// Constants and configuration

// SIEMPRE USA API DE PRODUCCIÓN
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.migro.es/api';
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51SCgH4Djtj7fY0EsiZB6PvzabhQzCrgLQr728oJkfbUDciK9nk29ajRta3IuMK1tSXRv3RUQloYNez3BEwY2DmIp00RhGVHymj';
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;
export const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

export const HIRING_STEPS = [
  { id: 1, name: 'Detalles', description: 'Información del servicio' },
  { id: 2, name: 'Confirmar', description: 'Datos personales' },
  { id: 3, name: 'Verificación', description: 'KYC Identity' },
  { id: 4, name: 'Pago', description: 'Stripe' },
  { id: 5, name: 'Contrato', description: 'Descarga' },
] as const;

export const COLORS = {
  primary: '#16a34a', // green-600 - Logo/Marca
  secondary: '#22c55e', // green-500 - Acento
  emphasis: '#111827', // gray-900 - Énfasis/CTAs
  error: '#ef4444',
  gray: '#6b7280',
  background: '#f9fafb',
} as const;

