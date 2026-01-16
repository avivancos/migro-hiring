/**
 * Helper para autenticación en tests
 * Guarda tokens automáticamente para reutilizarlos en ejecuciones posteriores
 * 
 * Los tokens se guardan en un archivo .test-tokens.json en la raíz del proyecto
 * Ejecutar: node scripts/save-test-tokens.js para guardar tokens manualmente
 */

import axios from 'axios';
import TokenStorage from '@/utils/tokenStorage';
import { config } from '@/config/constants';

const TEST_EMAIL = 'agusvc@gmail.com';
const TEST_PASSWORD = 'pomelo2005';

// En tests, los tokens se guardan en localStorage con la clave 'test_tokens'
// El script save-test-tokens.js guarda los tokens en .test-tokens.json
// Los tests pueden leerlos desde localStorage si fueron cargados previamente

interface SavedTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  saved_at: number;
  expires_at: number;
  refresh_expires_at: number;
  user?: any;
}

/**
 * Obtener tokens guardados del localStorage (para tests)
 * Los tokens deben ser guardados previamente con el script save-test-tokens.js
 */
function getSavedTokens(): SavedTokens | null {
  try {
    // En tests, leer desde localStorage
    const saved = localStorage.getItem('test_tokens');
    if (!saved) {
      // Intentar leer desde archivo si estamos en Node.js (setup global)
      if (typeof process !== 'undefined' && process.env) {
        try {
          // Solo funciona si el script save-test-tokens.js ya guardó los tokens
          // y fueron cargados en el setup global
          return null; // Por ahora, requerimos que se carguen manualmente
        } catch {
          return null;
        }
      }
      return null;
    }
    
    const tokens: SavedTokens = JSON.parse(saved);
    
    // Verificar si los tokens todavía son válidos (con buffer de 5 minutos)
    const now = Date.now();
    const buffer = 5 * 60 * 1000; // 5 minutos
    
    if (tokens.expires_at && now >= (tokens.expires_at - buffer)) {
      console.log('⚠️ Tokens guardados expirados, necesitamos nuevos tokens');
      return null;
    }
    
    return tokens;
  } catch (error) {
    console.error('Error leyendo tokens guardados:', error);
    return null;
  }
}

/**
 * Guardar tokens en localStorage (para tests)
 */
function saveTokens(tokens: SavedTokens): void {
  try {
    localStorage.setItem('test_tokens', JSON.stringify(tokens));
    console.log('✅ Tokens guardados para tests');
  } catch (error) {
    console.error('Error guardando tokens:', error);
  }
}

/**
 * Hacer login y obtener tokens
 */
async function loginAndGetTokens(): Promise<SavedTokens> {
  console.log('🔐 Haciendo login para tests...');
  
  try {
    const response = await axios.post(
      `${config.API_BASE_URL}/auth/login`,
      {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000, // 30 segundos
      }
    );
    
    const data = response.data;
    const now = Date.now();
    
    const tokens: SavedTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || data.refresh_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in || 1209600, // 14 días por defecto
      refresh_expires_in: data.refresh_expires_in || 2592000, // 30 días por defecto
      saved_at: now,
      expires_at: now + (data.expires_in || 1209600) * 1000,
      refresh_expires_at: now + (data.refresh_expires_in || 2592000) * 1000,
    };
    
    console.log('✅ Login exitoso, tokens obtenidos');
    return tokens;
  } catch (error: any) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    throw new Error(`Error al hacer login: ${error.response?.data?.detail || error.message}`);
  }
}

/**
 * Obtener tokens válidos (de cache o haciendo login)
 */
export async function getTestTokens(): Promise<SavedTokens> {
  // Intentar obtener tokens guardados
  const saved = getSavedTokens();
  if (saved) {
    console.log('✅ Usando tokens guardados (válidos)');
    return saved;
  }
  
  // Si no hay tokens válidos, hacer login
  console.log('🔄 No hay tokens válidos, haciendo login...');
  const tokens = await loginAndGetTokens();
  saveTokens(tokens);
  return tokens;
}

/**
 * Configurar tokens en TokenStorage para usar en tests
 */
export async function setupTestAuth(): Promise<void> {
  try {
    const tokens = await getTestTokens();
    
    // Guardar en TokenStorage (sistema de tokens de la app)
    TokenStorage.saveTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      refresh_expires_in: tokens.refresh_expires_in,
    });
    
    // También guardar en localStorage para compatibilidad
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('admin_token', tokens.access_token);
    
    console.log('✅ Autenticación configurada para tests');
  } catch (error) {
    console.error('❌ Error configurando autenticación:', error);
    throw error;
  }
}

/**
 * Limpiar tokens de tests
 */
export function clearTestTokens(): void {
  localStorage.removeItem('test_tokens');
  TokenStorage.clearTokens();
  console.log('🧹 Tokens de tests limpiados');
}

