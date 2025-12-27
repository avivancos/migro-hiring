/**
 * Script de Puppeteer para debug específico del módulo de contratos
 * 
 * Uso: node debug-contracts.js [URL_BASE]
 * Ejemplo: node debug-contracts.js http://localhost:5173
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuración
const BASE_URL = process.argv[2] || 'http://localhost:5173';
const LOGIN_EMAIL = 'agusvc@gmail.com';
const LOGIN_PASSWORD = 'pomelo2005';
const TIMEOUT = 30000;
const NAVIGATION_TIMEOUT = 60000;

// Helper para esperar
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Crear directorio debug si no existe
const DEBUG_DIR = path.join(__dirname, 'debug');
if (!fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
}

// Generar nombre de archivo con timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const logFile = path.join(DEBUG_DIR, `contracts-debug-${timestamp}.log`);

// Utilidades de logging
const log = {
  file: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    console.log(message);
  },
  error: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ❌ ERROR: ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    console.error(`❌ ${message}`);
  },
  success: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ✅ ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    console.log(`✅ ${message}`);
  },
  info: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ℹ️  ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    console.log(`ℹ️  ${message}`);
  },
  separator: () => {
    const separator = '='.repeat(80);
    fs.appendFileSync(logFile, `${separator}\n`);
    console.log(separator);
  }
};

// Estado global
const errors = [];
const apiErrors = [];
const consoleLogs = [];
let browser = null;
let page = null;

// Inicializar logging
log.separator();
log.file('🚀 Iniciando debug del módulo de contratos');
log.file(`📅 Fecha: ${new Date().toLocaleString('es-ES')}`);
log.file(`🌐 URL Base: ${BASE_URL}`);
log.file(`📝 Archivo de log: ${logFile}`);
log.separator();

/**
 * Capturar logs de la consola del navegador y requests API
 */
function setupConsoleLogging(page) {
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();
    
    const logEntry = {
      type,
      text,
      location: location ? `${location.url}:${location.lineNumber}` : 'unknown',
      timestamp: new Date().toISOString()
    };
    
    consoleLogs.push(logEntry);
    
    // Log solo errores y warnings en tiempo real
    if (type === 'error') {
      log.error(`CONSOLE ERROR: ${text} (${logEntry.location})`);
    } else if (type === 'warning') {
      log.info(`CONSOLE WARNING: ${text}`);
    }
  });
  
  // Capturar errores de página
  page.on('pageerror', (error) => {
    const errorMsg = `PAGE ERROR: ${error.message}\n${error.stack}`;
    errors.push(errorMsg);
    log.error(errorMsg);
  });
  
  // Capturar respuestas de API
  page.on('response', async (response) => {
    const status = response.status();
    const url = response.url();
    const method = response.request().method();
    
    // Capturar específicamente requests a contratos
    if (url.includes('/admin/contracts') || url.includes('/hiring')) {
      log.info(`📡 API ${method} ${url} → ${status}`);
      
      if (status >= 400) {
        let errorDetails = `HTTP ${status}`;
        try {
          const text = await response.text();
          errorDetails = `${errorDetails}: ${text.substring(0, 500)}`;
        } catch (e) {
          errorDetails = `${errorDetails}: No se pudo leer respuesta`;
        }
        
        const apiError = {
          url,
          method,
          status,
          details: errorDetails,
          timestamp: new Date().toISOString()
        };
        
        apiErrors.push(apiError);
        log.error(`❌ API ERROR: ${errorDetails}`);
      }
    }
  });
  
  // Capturar requests fallidos
  page.on('requestfailed', (request) => {
    const url = request.url();
    const failure = request.failure();
    const errorMsg = `REQUEST FAILED: ${url} - ${failure?.errorText || 'Unknown error'}`;
    errors.push(errorMsg);
    log.error(errorMsg);
  });
}

/**
 * Intentar hacer login
 */
async function login() {
  log.info('🔐 Intentando hacer login...');
  
  try {
    log.info('🔄 Intentando login en /auth/login...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT });
    await wait(2000);
    
    const emailInput = await page.$('input[type="email"], input[id="email"]');
    const passwordInput = await page.$('input[type="password"], input[id="password"]');
    
    if (emailInput && passwordInput) {
      log.info('📝 Formulario de login encontrado');
      
      await emailInput.click({ clickCount: 3 });
      await emailInput.type(LOGIN_EMAIL, { delay: 100 });
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type(LOGIN_PASSWORD, { delay: 100 });
      
      const form = await emailInput.evaluateHandle(el => el.closest('form'));
      const formElement = await form.asElement();
      
      if (formElement) {
        const currentUrl = page.url();
        log.info('📤 Haciendo submit del formulario...');
        
        await page.evaluate((form) => {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }, formElement);
        
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT });
        } catch (e) {
          // Continuar aunque no haya navegación
        }
        
        let urlChanged = false;
        for (let i = 0; i < 20; i++) {
          await wait(500);
          const newUrl = page.url();
          if (newUrl !== currentUrl) {
            urlChanged = true;
            break;
          }
        }
        if (!urlChanged) {
          await wait(2000);
        }
        await wait(3000);
        log.success('✅ Login exitoso');
        return true;
      }
    }
    
    log.error('❌ No se pudo encontrar el formulario de login');
    return false;
  } catch (error) {
    log.error(`❌ Error durante login: ${error.message}`);
    return false;
  }
}

/**
 * Probar la ruta de contratos
 */
async function testContractsRoute() {
  log.separator();
  log.info('🔍 Probando ruta /admin/contracts');
  log.separator();
  
  try {
    const url = `${BASE_URL}/admin/contracts`;
    log.info(`📍 Navegando a: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: NAVIGATION_TIMEOUT 
    });
    
    await wait(5000); // Esperar a que cargue completamente
    
    const currentUrl = page.url();
    log.info(`📍 URL actual: ${currentUrl}`);
    
    // Verificar si hay redirección
    if (currentUrl.includes('/auth/login')) {
      log.error('❌ Redirigido a login - No hay sesión activa');
      return false;
    }
    
    // Obtener título
    const title = await page.title();
    log.info(`📄 Título de la página: ${title}`);
    
    // Buscar elementos de la página de contratos
    const pageContent = await page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      const hasLoading = bodyText.includes('Cargando') || bodyText.includes('Loading');
      const hasError = bodyText.includes('Error') || bodyText.includes('error');
      const hasEmpty = bodyText.includes('No hay contratos') || bodyText.includes('vacío');
      const hasTable = !!document.querySelector('table');
      const hasCards = !!document.querySelector('[class*="card"]');
      const hasSearch = !!document.querySelector('input[type="search"], input[placeholder*="buscar" i]');
      
      return {
        hasLoading,
        hasError,
        hasEmpty,
        hasTable,
        hasCards,
        hasSearch,
        bodyText: bodyText.substring(0, 500)
      };
    });
    
    log.info('📊 Análisis de la página:');
    log.info(`   - Tiene loading: ${pageContent.hasLoading}`);
    log.info(`   - Tiene error: ${pageContent.hasError}`);
    log.info(`   - Tiene empty state: ${pageContent.hasEmpty}`);
    log.info(`   - Tiene tabla: ${pageContent.hasTable}`);
    log.info(`   - Tiene cards: ${pageContent.hasCards}`);
    log.info(`   - Tiene búsqueda: ${pageContent.hasSearch}`);
    
    // Esperar más tiempo para ver si se cargan datos
    log.info('⏳ Esperando 10 segundos más para ver si se cargan datos...');
    await wait(10000);
    
    // Verificar de nuevo
    const finalContent = await page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      return {
        text: bodyText.substring(0, 1000),
        errorElements: Array.from(document.querySelectorAll('[class*="error"], [role="alert"]')).map(el => el.textContent?.trim()).filter(Boolean)
      };
    });
    
    if (finalContent.errorElements.length > 0) {
      log.error('❌ Errores encontrados en la página:');
      finalContent.errorElements.forEach(err => log.error(`   - ${err}`));
    }
    
    log.info('📝 Contenido de la página (primeros 1000 caracteres):');
    log.info(finalContent.text);
    
    // Hacer screenshot
    const screenshotPath = path.join(DEBUG_DIR, `contracts-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log.success(`📸 Screenshot guardado en: ${screenshotPath}`);
    
    return true;
  } catch (error) {
    log.error(`❌ Error probando ruta de contratos: ${error.message}`);
    log.error(error.stack);
    return false;
  }
}

/**
 * Probar endpoint de API directamente
 */
async function testAPIEndpoint() {
  log.separator();
  log.info('🔍 Probando endpoint de API directamente');
  log.separator();
  
  try {
    // Intentar hacer request a la API desde el navegador
    const apiResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/admin/contracts/?skip=0&limit=20', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': 'Pomelo2005.1',
          },
        });
        
        const status = response.status;
        let data = null;
        let errorText = null;
        
        try {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch (e) {
            errorText = text;
          }
        } catch (e) {
          errorText = 'No se pudo leer respuesta';
        }
        
        return {
          status,
          ok: response.ok,
          data,
          errorText,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        return {
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    log.info('📡 Resultado del request API:');
    log.info(`   Status: ${apiResult.status}`);
    log.info(`   OK: ${apiResult.ok}`);
    
    if (apiResult.data) {
      log.info(`   Data: ${JSON.stringify(apiResult.data, null, 2).substring(0, 500)}`);
    }
    
    if (apiResult.errorText) {
      log.error(`   Error: ${apiResult.errorText}`);
    }
    
    if (apiResult.error) {
      log.error(`   Exception: ${apiResult.error}`);
      log.error(`   Stack: ${apiResult.stack}`);
    }
    
    return apiResult.ok;
  } catch (error) {
    log.error(`❌ Error probando API: ${error.message}`);
    return false;
  }
}

/**
 * Generar reporte final
 */
function generateReport() {
  log.separator();
  log.file('📊 REPORTE FINAL - MÓDULO DE CONTRATOS');
  log.separator();
  
  log.file(`\n📈 ESTADÍSTICAS:`);
  log.file(`   - Errores encontrados: ${errors.length}`);
  log.file(`   - Errores de API: ${apiErrors.length}`);
  log.file(`   - Logs de consola capturados: ${consoleLogs.length}`);
  
  if (apiErrors.length > 0) {
    log.file(`\n❌ ERRORES DE API (${apiErrors.length}):`);
    apiErrors.forEach((error, index) => {
      log.file(`   ${index + 1}. ${error.method} ${error.url}`);
      log.file(`      Status: ${error.status}`);
      log.file(`      Details: ${error.details}`);
      log.file(`      Time: ${error.timestamp}`);
    });
  }
  
  if (errors.length > 0) {
    log.file(`\n❌ ERRORES GENERALES (${errors.length}):`);
    errors.forEach((error, index) => {
      log.file(`   ${index + 1}. ${error}`);
    });
  }
  
  if (consoleLogs.length > 0) {
    log.file(`\n📝 LOGS DE CONSOLA (últimos 50):`);
    const recentLogs = consoleLogs.slice(-50).filter(log => log.type === 'error' || log.type === 'warning');
    recentLogs.forEach((logEntry, index) => {
      log.file(`   ${index + 1}. [${logEntry.type.toUpperCase()}] ${logEntry.text}`);
      log.file(`      Ubicación: ${logEntry.location}`);
    });
  }
  
  log.separator();
  log.success('✅ Debug de contratos completado');
  log.file(`📝 Log completo guardado en: ${logFile}`);
  log.separator();
}

/**
 * Función principal
 */
async function main() {
  try {
    // Inicializar Puppeteer
    log.info('🚀 Iniciando navegador...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
    page.setDefaultTimeout(TIMEOUT);
    
    // Configurar logging
    setupConsoleLogging(page);
    
    // Hacer login
    const loginSuccess = await login();
    if (!loginSuccess) {
      log.error('❌ No se pudo hacer login. Continuando sin autenticación...');
    }
    
    await wait(3000);
    
    // Probar ruta de contratos
    await testContractsRoute();
    
    // Probar endpoint de API
    await testAPIEndpoint();
    
    // Generar reporte
    generateReport();
    
  } catch (error) {
    log.error(`❌ Error fatal: ${error.message}`);
    log.error(error.stack);
  } finally {
    if (browser) {
      await browser.close();
      log.info('🔒 Navegador cerrado');
    }
  }
}

// Ejecutar
main().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});


















