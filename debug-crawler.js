/**
 * Script de Puppeteer para navegar por toda la aplicación
 * y generar un log completo de todas las rutas y errores encontrados
 * 
 * Uso: node debug-crawler.js [URL_BASE]
 * Ejemplo: node debug-crawler.js http://localhost:5173
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuración
const BASE_URL = process.argv[2] || 'http://localhost:5173';
const LOGIN_EMAIL = 'agusvc@gmail.com';
const LOGIN_PASSWORD = 'pomelo2005';
const TIMEOUT = 30000; // 30 segundos por página
const NAVIGATION_TIMEOUT = 60000; // 60 segundos para navegación

// Helper para esperar (reemplazo de waitForTimeout que fue deprecado)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Crear directorio debug si no existe
const DEBUG_DIR = path.join(__dirname, 'debug');
if (!fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
}

// Generar nombre de archivo con timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const logFile = path.join(DEBUG_DIR, `crawler-${timestamp}.log`);

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
const visitedUrls = new Set();
const routes = new Set();
const errors = [];
const consoleLogs = [];
let browser = null;
let page = null;

// Inicializar logging
log.separator();
log.file('🚀 Iniciando crawler de debug');
log.file(`📅 Fecha: ${new Date().toLocaleString('es-ES')}`);
log.file(`🌐 URL Base: ${BASE_URL}`);
log.file(`📧 Email: ${LOGIN_EMAIL}`);
log.file(`📝 Archivo de log: ${logFile}`);
log.separator();

/**
 * Capturar logs de la consola del navegador
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
  
  // Capturar errores de respuesta
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      const url = response.url();
      const errorMsg = `HTTP ${status}: ${url}`;
      errors.push(errorMsg);
      log.error(errorMsg);
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
    // Intentar primero en /auth/login
    log.info('🔄 Intentando login en /auth/login...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT });
    await wait(2000);
    
    // Verificar si hay campos de login
    let emailInput = await page.$('input[type="email"], input[id="email"]');
    let passwordInput = await page.$('input[type="password"], input[id="password"]');
    
    if (emailInput && passwordInput) {
      log.info('📝 Formulario de login encontrado en /auth/login');
      
      // Limpiar campos primero
      await emailInput.click({ clickCount: 3 });
      await emailInput.type(LOGIN_EMAIL, { delay: 100 });
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type(LOGIN_PASSWORD, { delay: 100 });
      
      // Hacer submit del formulario - disparar evento submit para que React lo capture
      const form = await emailInput.evaluateHandle(el => el.closest('form'));
      const formElement = await form.asElement();
      
      if (formElement) {
        const currentUrl = page.url();
        log.info('📤 Haciendo submit del formulario...');
        
        // Disparar evento submit que React capturará
        await page.evaluate((form) => {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }, formElement);
        
        // Esperar navegación
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT });
        } catch (e) {
          // Continuar aunque no haya navegación
        }
        
        // Esperar a que la URL cambie (polling adicional)
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
          await wait(2000); // Esperar un poco más si no cambió
        }
        await wait(3000); // Esperar a que cargue completamente
        log.success('✅ Login exitoso desde /auth/login');
        return true;
      }
    }
    
    // Si no funciona, intentar en /admin
    log.info('🔄 Intentando login en /admin...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT });
    await wait(2000);
    
    emailInput = await page.$('input[type="email"], input[id="email"]');
    passwordInput = await page.$('input[type="password"], input[id="password"]');
    
    if (emailInput && passwordInput) {
      log.info('📝 Formulario de login encontrado en /admin');
      
      // Limpiar campos primero
      await emailInput.click({ clickCount: 3 });
      await emailInput.type(LOGIN_EMAIL, { delay: 100 });
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type(LOGIN_PASSWORD, { delay: 100 });
      
      // Hacer submit del formulario - disparar evento submit para que React lo capture
      const form2 = await emailInput.evaluateHandle(el => el.closest('form'));
      const formElement2 = await form2.asElement();
      
      if (formElement2) {
        const currentUrl = page.url();
        log.info('📤 Haciendo submit del formulario...');
        
        // Disparar evento submit que React capturará
        await page.evaluate((form) => {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }, formElement2);
        
        // Esperar navegación
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT });
        } catch (e) {
          // Continuar aunque no haya navegación
        }
        
        // Esperar a que la URL cambie (polling adicional)
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
        log.success('✅ Login exitoso desde /admin');
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
 * Obtener todos los links de la página actual
 */
async function getLinks() {
  try {
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors.map(a => {
        const href = a.getAttribute('href');
        if (!href) return null;
        
        // Convertir rutas relativas a absolutas
        if (href.startsWith('/')) {
          return href;
        } else if (href.startsWith('http')) {
          // Solo incluir si es de la misma base
          try {
            const url = new URL(href);
            const baseUrl = new URL(window.location.origin);
            if (url.origin === baseUrl.origin) {
              return url.pathname + url.search;
            }
          } catch (e) {
            return null;
          }
        }
        return null;
      }).filter(Boolean);
    });
    
    return [...new Set(links)]; // Eliminar duplicados
  } catch (error) {
    log.error(`Error obteniendo links: ${error.message}`);
    return [];
  }
}

/**
 * Obtener rutas con parámetros dinámicos desde los links
 */
function extractRoutes(url) {
  // Extraer rutas base sin parámetros
  const urlObj = new URL(url, BASE_URL);
  let route = urlObj.pathname;
  
  // Detectar rutas con parámetros dinámicos
  // Ejemplo: /crm/contacts/123 -> /crm/contacts/:id
  const routePatterns = [
    { pattern: /\/contacts\/\d+/, replacement: '/contacts/:id' },
    { pattern: /\/contacts\/\d+\/edit/, replacement: '/contacts/:id/edit' },
    { pattern: /\/leads\/\d+/, replacement: '/leads/:id' },
    { pattern: /\/users\/\d+/, replacement: '/users/:id' },
    { pattern: /\/tasks\/\d+/, replacement: '/tasks/:id' },
    { pattern: /\/conversations\/\d+/, replacement: '/conversations/:id' },
    { pattern: /\/hiring\/[A-Z0-9]{5}/, replacement: '/hiring/:code' },
    { pattern: /\/contratacion\/[A-Z0-9]{5}/, replacement: '/contratacion/:code' },
  ];
  
  for (const { pattern, replacement } of routePatterns) {
    if (pattern.test(route)) {
      route = route.replace(pattern, replacement);
      break;
    }
  }
  
  return route;
}

/**
 * Visitar una URL y extraer información
 */
async function visitUrl(url, depth = 0, maxDepth = 5) {
  if (depth > maxDepth) {
    return;
  }
  
  // Normalizar URL
  let normalizedUrl = url;
  if (url.startsWith('/')) {
    normalizedUrl = `${BASE_URL}${url}`;
  }
  
  // Evitar visitar URLs externas o ya visitadas
  if (!normalizedUrl.startsWith(BASE_URL) || visitedUrls.has(normalizedUrl)) {
    return;
  }
  
  visitedUrls.add(normalizedUrl);
  
  try {
    log.info(`🔍 Visitando: ${normalizedUrl} (profundidad: ${depth})`);
    
    await page.goto(normalizedUrl, { 
      waitUntil: 'networkidle2', 
      timeout: NAVIGATION_TIMEOUT 
    });
    
    // Esperar a que cargue completamente y a que se carguen datos dinámicos
    await wait(2000);
    
    // Esperar a que se carguen elementos dinámicos comunes (tablas, listas, etc.)
    try {
      await page.waitForSelector('body', { timeout: 5000 });
      // Esperar un poco más para que se carguen datos desde la API
      await wait(3000);
    } catch (e) {
      // Continuar aunque falle
    }
    
    // Extraer ruta
    const currentUrl = page.url();
    const route = extractRoutes(currentUrl);
    routes.add(route);
    
    log.success(`✅ Visitada: ${currentUrl} -> Ruta: ${route}`);
    
    // Obtener título de la página
    const title = await page.title();
    log.info(`📄 Título: ${title}`);
    
    // Verificar si hay errores visibles en la página
    const errorElements = await page.evaluate(() => {
      const errors = [];
      // Buscar elementos de error comunes
      document.querySelectorAll('[class*="error"], [class*="Error"], [role="alert"]').forEach(el => {
        const text = el.textContent?.trim();
        if (text) errors.push(text);
      });
      return errors;
    });
    
    if (errorElements.length > 0) {
      log.error(`⚠️  Errores encontrados en ${currentUrl}:`);
      errorElements.forEach(err => log.error(`   - ${err}`));
    }
    
    // Obtener links para seguir navegando (hacerlo dos veces para capturar links dinámicos)
    let links = await getLinks();
    await wait(2000); // Esperar más para links dinámicos
    const additionalLinks = await getLinks();
    links = [...new Set([...links, ...additionalLinks])]; // Combinar y eliminar duplicados
    log.info(`🔗 Encontrados ${links.length} links en esta página`);
    
    // Visitar links encontrados (solo si no excedemos la profundidad)
    if (depth < maxDepth) {
      for (const link of links) {
        if (link && !visitedUrls.has(`${BASE_URL}${link}`)) {
          await visitUrl(link, depth + 1, maxDepth);
          // Volver a la página anterior
          await page.goto(normalizedUrl, { waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT });
          await wait(1000);
        }
      }
    }
    
  } catch (error) {
    const errorMsg = `❌ Error visitando ${normalizedUrl}: ${error.message}`;
    errors.push(errorMsg);
    log.error(errorMsg);
  }
}

/**
 * Visitar rutas conocidas de la aplicación
 */
async function visitKnownRoutes() {
  const knownRoutes = [
    // Admin routes
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/users/create',
    '/admin/audit-logs',
    '/admin/pili',
    '/admin/conversations',
    
    // CRM routes
    '/crm',
    '/crm/contacts',
    '/crm/leads',
    '/crm/calendar',
    '/crm/actions',
    '/crm/expedientes',
    '/crm/call',
    '/crm/settings',
    '/crm/settings/task-templates',
    '/crm/settings/custom-fields',
    
    // Contrato routes
    '/contrato',
    '/contrato/login',
    '/contrato/dashboard',
    
    // Public routes
    '/',
    '/privacidad',
    '/privacy',
    '/borrador',
    '/colaboradores',
    '/closer',
  ];
  
  log.separator();
  log.info('🗺️  Visitando rutas conocidas de la aplicación...');
  log.separator();
  
  for (const route of knownRoutes) {
    await visitUrl(route, 0, 2);
    await wait(1000);
  }
}

/**
 * Generar reporte final
 */
function generateReport() {
  log.separator();
  log.file('📊 REPORTE FINAL');
  log.separator();
  
  log.file(`\n📈 ESTADÍSTICAS:`);
  log.file(`   - URLs visitadas: ${visitedUrls.size}`);
  log.file(`   - Rutas únicas encontradas: ${routes.size}`);
  log.file(`   - Errores encontrados: ${errors.length}`);
  log.file(`   - Logs de consola capturados: ${consoleLogs.length}`);
  
  log.file(`\n🗺️  RUTAS ENCONTRADAS (${routes.size}):`);
  const sortedRoutes = Array.from(routes).sort();
  sortedRoutes.forEach((route, index) => {
    log.file(`   ${index + 1}. ${route}`);
  });
  
  log.file(`\n🌐 URLs VISITADAS (${visitedUrls.size}):`);
  Array.from(visitedUrls).sort().forEach((url, index) => {
    log.file(`   ${index + 1}. ${url}`);
  });
  
  if (errors.length > 0) {
    log.file(`\n❌ ERRORES ENCONTRADOS (${errors.length}):`);
    errors.forEach((error, index) => {
      log.file(`   ${index + 1}. ${error}`);
    });
  }
  
  if (consoleLogs.length > 0) {
    log.file(`\n📝 LOGS DE CONSOLA (últimos 50):`);
    const recentLogs = consoleLogs.slice(-50);
    recentLogs.forEach((logEntry, index) => {
      if (logEntry.type === 'error' || logEntry.type === 'warning') {
        log.file(`   ${index + 1}. [${logEntry.type.toUpperCase()}] ${logEntry.text}`);
        log.file(`      Ubicación: ${logEntry.location}`);
      }
    });
  }
  
  log.separator();
  log.success('✅ Crawler completado');
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
      headless: false, // Mostrar navegador para debug
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
    page.setDefaultTimeout(TIMEOUT);
    
    // Configurar logging de consola
    setupConsoleLogging(page);
    
    // Hacer login
    const loginSuccess = await login();
    if (!loginSuccess) {
      log.error('❌ No se pudo hacer login. Continuando sin autenticación...');
    }
    
    await wait(3000);
    
    // Visitar rutas conocidas
    await visitKnownRoutes();
    
    // Navegar desde la página actual
    log.separator();
    log.info('🔍 Navegando desde la página actual...');
    log.separator();
    
    const currentUrl = page.url();
    await visitUrl(currentUrl.replace(BASE_URL, ''), 0, 3);
    
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

