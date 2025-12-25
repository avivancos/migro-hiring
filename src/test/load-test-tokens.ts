/**
 * Cargar tokens desde .test-tokens.json al inicio de los tests
 * Este archivo se ejecuta antes de cada suite de tests
 * 
 * Los tokens se guardan en una variable global que luego se carga en localStorage
 * en el setup.ts para que estén disponibles en los tests
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Cargar tokens desde archivo si existe
const tokensFile = resolve(process.cwd(), '.test-tokens.json');

if (existsSync(tokensFile)) {
  try {
    const tokens = JSON.parse(readFileSync(tokensFile, 'utf8'));
    
    // Verificar si los tokens todavía son válidos
    const now = Date.now();
    const buffer = 5 * 60 * 1000; // 5 minutos de buffer
    
    if (tokens.expires_at && now < (tokens.expires_at - buffer)) {
      // Guardar en variable global para que el setup.ts pueda cargarlos
      (global as any).__TEST_TOKENS__ = tokens;
      console.log('✅ Tokens de test cargados desde archivo (válidos hasta:', new Date(tokens.expires_at).toLocaleString(), ')');
    } else {
      console.warn('⚠️ Tokens guardados expirados. Ejecuta: npm run test:tokens');
    }
  } catch (error) {
    console.warn('⚠️ No se pudieron cargar tokens desde archivo:', error);
  }
} else {
  console.warn('⚠️ Archivo .test-tokens.json no encontrado. Ejecuta: npm run test:tokens');
}
