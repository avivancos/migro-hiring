/**
 * Script para guardar tokens de autenticación para tests
 * Ejecutar con: node scripts/save-test-tokens.js
 * 
 * Guarda los tokens en un archivo JSON que los tests pueden usar
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://api.migro.es/api';
const TEST_EMAIL = 'agusvc@gmail.com';
const TEST_PASSWORD = 'pomelo2005';
const TOKENS_FILE = path.join(__dirname, '..', '.test-tokens.json');

async function saveTestTokens() {
  console.log('🔐 Guardando tokens para tests...');
  console.log(`📧 Email: ${TEST_EMAIL}`);
  console.log(`📡 API: ${API_BASE_URL}\n`);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000,
      }
    );

    const data = response.data;
    const now = Date.now();

    const tokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in || 1209600, // 14 días
      refresh_expires_in: data.refresh_expires_in || 2592000, // 30 días
      saved_at: now,
      expires_at: now + (data.expires_in || 1209600) * 1000,
      refresh_expires_at: now + (data.refresh_expires_in || 2592000) * 1000,
      user: data.user || null,
    };

    // Guardar en archivo JSON
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf8');

    console.log('✅ Tokens guardados exitosamente');
    console.log(`📁 Archivo: ${TOKENS_FILE}`);
    console.log(`⏰ Expira en: ${new Date(tokens.expires_at).toLocaleString()}`);
    console.log(`👤 Usuario: ${tokens.user?.email || 'N/A'}\n`);

    // Verificar que el token funciona
    console.log('🔍 Verificando token...');
    try {
      const verifyResponse = await axios.get(
        `${API_BASE_URL}/users/me`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Accept': 'application/json',
          },
          timeout: 30000,
        }
      );
      console.log('✅ Token verificado correctamente');
      console.log(`   Usuario: ${verifyResponse.data.email || verifyResponse.data.full_name || 'N/A'}\n`);
    } catch (verifyError) {
      console.log('⚠️  Error al verificar token:', verifyError.response?.data || verifyError.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error guardando tokens:\n');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    process.exit(1);
  }
}

// Ejecutar
saveTestTokens();







