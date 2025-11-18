// Test script para verificar el login de admin con la API real
// Ejecutar con: node test_admin_login.js

const axios = require('axios');

const API_BASE_URL = 'https://api.migro.es/api';
const TEST_EMAIL = 'agusvc@gmail.com';
const TEST_PASSWORD = 'pomelo2005';

async function testAdminLogin() {
  console.log('🧪 Test de Login Admin - Migro API');
  console.log('=====================================\n');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  console.log(`📧 Email: ${TEST_EMAIL}`);
  console.log(`🔐 Password: ${'*'.repeat(TEST_PASSWORD.length)}\n`);

  try {
    console.log('⏳ Enviando solicitud de login...\n');
    
    const startTime = Date.now();
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
        timeout: 30000, // 30 segundos
      }
    );
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('✅ Login exitoso!\n');
    console.log('📊 Respuesta del servidor:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Tiempo de respuesta: ${duration}ms\n`);
    
    const data = response.data;
    console.log('🔑 Tokens recibidos:');
    console.log(`   Access Token: ${data.access_token ? data.access_token.substring(0, 50) + '...' : 'N/A'}`);
    console.log(`   Refresh Token: ${data.refresh_token ? data.refresh_token.substring(0, 50) + '...' : 'N/A'}`);
    console.log(`   Token Type: ${data.token_type || 'N/A'}\n`);
    
    if (data.user) {
      console.log('👤 Información del usuario:');
      console.log(`   ID: ${data.user.id || 'N/A'}`);
      console.log(`   Email: ${data.user.email || 'N/A'}`);
      console.log(`   Nombre: ${data.user.name || 'N/A'}`);
      console.log(`   Es Admin: ${data.user.is_admin ? '✅ Sí' : '❌ No'}`);
      console.log(`   Rol: ${data.user.role || 'N/A'}\n`);
      
      // Verificar permisos de admin
      if (data.user.is_admin || data.user.role === 'admin' || data.user.role === 'superuser') {
        console.log('✅ Usuario tiene permisos de administrador\n');
      } else {
        console.log('⚠️  Usuario NO tiene permisos de administrador\n');
      }
    }
    
    // Test adicional: Verificar que el token funciona
    console.log('🔍 Verificando token con endpoint /users/me...\n');
    try {
      const meResponse = await axios.get(
        `${API_BASE_URL}/users/me`,
        {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
            'Accept': 'application/json',
          },
          timeout: 30000,
        }
      );
      
      console.log('✅ Token verificado correctamente');
      console.log(`   Usuario actual: ${meResponse.data.email || meResponse.data.name || 'N/A'}\n`);
    } catch (tokenError) {
      console.log('❌ Error al verificar token:');
      if (tokenError.response) {
        console.log(`   Status: ${tokenError.response.status}`);
        console.log(`   Error: ${JSON.stringify(tokenError.response.data)}\n`);
      } else {
        console.log(`   Error: ${tokenError.message}\n`);
      }
    }
    
    console.log('✅ Test completado exitosamente\n');
    process.exit(0);
    
  } catch (error) {
    console.log('❌ Error en el login\n');
    
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.log('📊 Respuesta del servidor:');
      console.log(`   Status: ${error.response.status} ${error.response.statusText}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}\n`);
      
      if (error.response.status === 401) {
        console.log('❌ Credenciales incorrectas');
        console.log('   Verifica que el email y contraseña sean correctos\n');
      } else if (error.response.status === 403) {
        console.log('❌ Acceso denegado');
        console.log('   El usuario no tiene permisos de administrador\n');
      } else if (error.response.status === 404) {
        console.log('❌ Endpoint no encontrado');
        console.log('   Verifica que la URL del endpoint sea correcta\n');
      } else if (error.response.status >= 500) {
        console.log('❌ Error del servidor');
        console.log('   El servidor está experimentando problemas\n');
      }
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      console.log('❌ No se recibió respuesta del servidor');
      console.log(`   Request: ${JSON.stringify(error.request, null, 2)}\n`);
      console.log('   Verifica tu conexión a internet y que la API esté disponible\n');
    } else {
      // Algo pasó al configurar la solicitud
      console.log('❌ Error al configurar la solicitud:');
      console.log(`   ${error.message}\n`);
    }
    
    console.log('❌ Test fallido\n');
    process.exit(1);
  }
}

// Ejecutar el test
testAdminLogin();

