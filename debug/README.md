# 🐛 Script de Debug con Puppeteer

Este directorio contiene los logs generados por el script de crawler de Puppeteer que navega por toda la aplicación y genera un reporte completo de rutas, errores y logs de consola.

## 📋 Descripción

El script `debug-crawler.js` realiza las siguientes acciones:

1. **Login automático** con las credenciales configuradas
2. **Navegación exhaustiva** por todos los links encontrados
3. **Detección de rutas** con parámetros dinámicos (ej: `/crm/contacts/:id`)
4. **Captura de logs** de consola del navegador
5. **Detección de errores** HTTP, JavaScript y de página
6. **Generación de reporte** completo con todas las rutas encontradas

## 🚀 Uso

### Instalación

Primero, instala las dependencias (incluye Puppeteer):

```bash
npm install
```

### Ejecución

#### Desarrollo (localhost)

```bash
npm run debug:crawler
```

O directamente:

```bash
node debug-crawler.js http://localhost:5173
```

#### Producción

```bash
npm run debug:crawler:prod
```

O directamente:

```bash
node debug-crawler.js https://contratacion.migro.es
```

### URL personalizada

```bash
node debug-crawler.js https://tu-url.com
```

## 📁 Archivos Generados

Cada ejecución genera un archivo de log con timestamp en este directorio:

```
debug/crawler-2025-12-15T15-30-45.log
```

El formato del nombre es: `crawler-YYYY-MM-DDTHH-MM-SS.log`

## 📊 Contenido del Log

El archivo de log incluye:

1. **Estadísticas generales**
   - URLs visitadas
   - Rutas únicas encontradas
   - Errores encontrados
   - Logs de consola capturados

2. **Lista de rutas encontradas**
   - Todas las rutas únicas de la aplicación
   - Rutas con parámetros normalizadas (ej: `/crm/contacts/:id`)

3. **URLs visitadas**
   - Lista completa de todas las URLs visitadas durante el crawler

4. **Errores encontrados**
   - Errores HTTP (4xx, 5xx)
   - Errores de JavaScript
   - Errores de página
   - Requests fallidos

5. **Logs de consola**
   - Últimos 50 logs de consola (especialmente errores y warnings)
   - Incluye ubicación del error (archivo y línea)

## ⚙️ Configuración

Puedes modificar las siguientes constantes en `debug-crawler.js`:

```javascript
const BASE_URL = process.argv[2] || 'http://localhost:5173';
const LOGIN_EMAIL = 'agusvc@gmail.com';
const LOGIN_PASSWORD = 'pomelo2005';
const TIMEOUT = 30000; // 30 segundos por página
const NAVIGATION_TIMEOUT = 60000; // 60 segundos para navegación
```

## 🔍 Características

### Detección de Rutas con Parámetros

El script detecta automáticamente rutas con parámetros dinámicos:

- `/crm/contacts/123` → `/crm/contacts/:id`
- `/crm/contacts/123/edit` → `/crm/contacts/:id/edit`
- `/admin/users/456` → `/admin/users/:id`
- `/hiring/ABC12` → `/hiring/:code`

### Captura de Logs de Consola

El script captura todos los logs de la consola del navegador:
- `console.log()`
- `console.error()`
- `console.warn()`
- `console.info()`

### Detección de Errores

El script detecta:
- Errores HTTP (respuestas 4xx, 5xx)
- Errores de JavaScript (excepciones no capturadas)
- Errores de página (errores de renderizado)
- Requests fallidos (timeouts, conexión perdida)

### Navegación Inteligente

- Evita visitar URLs duplicadas
- Respeta límites de profundidad
- Maneja timeouts apropiadamente
- Espera a que las páginas carguen completamente

## 📝 Ejemplo de Salida

```
================================================================================
🚀 Iniciando crawler de debug
📅 Fecha: 15/12/2025 15:30:45
🌐 URL Base: http://localhost:5173
📧 Email: agusvc@gmail.com
📝 Archivo de log: debug/crawler-2025-12-15T15-30-45.log
================================================================================
ℹ️  🔐 Intentando hacer login...
✅ Login exitoso desde /admin
✅ Visitada: http://localhost:5173/admin/dashboard -> Ruta: /admin/dashboard
🔗 Encontrados 15 links en esta página
...
================================================================================
📊 REPORTE FINAL
================================================================================

📈 ESTADÍSTICAS:
   - URLs visitadas: 45
   - Rutas únicas encontradas: 32
   - Errores encontrados: 2
   - Logs de consola capturados: 156

🗺️  RUTAS ENCONTRADAS (32):
   1. /admin
   2. /admin/dashboard
   3. /admin/users
   4. /admin/users/:id
   ...
```

## 🐛 Troubleshooting

### El script no encuentra el formulario de login

El script intenta hacer login en múltiples rutas:
- `/login`
- `/admin`
- `/contrato/login`

Si ninguna funciona, verifica que la aplicación esté corriendo y que las credenciales sean correctas.

### Timeouts frecuentes

Aumenta los valores de timeout en el script:

```javascript
const TIMEOUT = 60000; // 60 segundos
const NAVIGATION_TIMEOUT = 120000; // 2 minutos
```

### El navegador no se cierra

El script está configurado para mostrar el navegador (`headless: false`) para facilitar el debug. Si quieres ejecutarlo en modo headless, cambia:

```javascript
browser = await puppeteer.launch({
  headless: true, // Cambiar a true
  ...
});
```

## 📚 Uso con el Agente

Una vez generado el log, puedes copiarlo y pegarlo al agente de IA para que analice los errores y proponga soluciones. El log contiene toda la información necesaria:

- Rutas que no funcionan
- Errores específicos con ubicación
- Logs de consola con contexto
- URLs problemáticas

## 🔒 Seguridad

⚠️ **IMPORTANTE**: Este script contiene credenciales hardcodeadas. No commitees el archivo `debug-crawler.js` con credenciales reales en producción. Considera usar variables de entorno:

```javascript
const LOGIN_EMAIL = process.env.DEBUG_EMAIL || 'agusvc@gmail.com';
const LOGIN_PASSWORD = process.env.DEBUG_PASSWORD || 'pomelo2005';
```





















