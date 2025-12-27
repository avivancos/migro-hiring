# 🐛 Script de Debug con Puppeteer - Documentación Técnica

## 📋 Resumen

El script `debug-crawler.js` es una herramienta de debugging exhaustiva que utiliza Puppeteer para navegar automáticamente por toda la aplicación React, detectar rutas, capturar errores y generar logs detallados para análisis posterior.

## 🎯 Objetivos

1. **Mapeo completo de rutas**: Descubrir todas las rutas disponibles en la aplicación
2. **Detección de errores**: Identificar errores HTTP, JavaScript y de renderizado
3. **Captura de logs**: Registrar todos los logs de consola del navegador
4. **Generación de reportes**: Crear logs estructurados para análisis con IA

## 🏗️ Arquitectura

### Flujo de Ejecución

```
1. Inicialización
   ├── Crear directorio debug/
   ├── Generar archivo de log con timestamp
   └── Configurar logging

2. Inicio de Puppeteer
   ├── Lanzar navegador (headless: false para debug)
   ├── Configurar timeouts
   └── Configurar captura de logs de consola

3. Autenticación
   ├── Intentar login en /login
   ├── Intentar login en /admin
   └── Intentar login en /contrato/login

4. Navegación
   ├── Visitar rutas conocidas
   ├── Extraer links de cada página
   ├── Visitar links encontrados (con límite de profundidad)
   └── Detectar rutas con parámetros dinámicos

5. Generación de Reporte
   ├── Estadísticas generales
   ├── Lista de rutas encontradas
   ├── Lista de URLs visitadas
   ├── Errores encontrados
   └── Logs de consola (últimos 50)
```

## 🔧 Componentes Principales

### 1. Sistema de Logging

El script implementa un sistema de logging multi-nivel:

```javascript
log.file(message)    // Log general
log.error(message)   // Errores
log.success(message) // Éxitos
log.info(message)    // Información
log.separator()      // Separadores visuales
```

Todos los logs se escriben tanto en consola como en el archivo de log.

### 2. Captura de Logs de Consola

El script configura listeners para capturar todos los eventos de consola:

- `page.on('console')` - Captura console.log, console.error, etc.
- `page.on('pageerror')` - Captura errores de JavaScript no capturados
- `page.on('response')` - Captura respuestas HTTP con errores
- `page.on('requestfailed')` - Captura requests que fallan

### 3. Detección de Rutas con Parámetros

El script normaliza rutas con parámetros dinámicos usando patrones regex:

```javascript
const routePatterns = [
  { pattern: /\/contacts\/\d+/, replacement: '/contacts/:id' },
  { pattern: /\/leads\/\d+/, replacement: '/leads/:id' },
  { pattern: /\/users\/\d+/, replacement: '/users/:id' },
  { pattern: /\/hiring\/[A-Z0-9]{5}/, replacement: '/hiring/:code' },
];
```

### 4. Sistema de Visitas

El script mantiene un `Set` de URLs visitadas para evitar:
- Visitas duplicadas
- Loops infinitos
- Navegación innecesaria

### 5. Navegación con Profundidad Limitada

Para evitar navegación infinita, el script implementa un sistema de profundidad:

```javascript
async function visitUrl(url, depth = 0, maxDepth = 5)
```

- `depth`: Profundidad actual de navegación
- `maxDepth`: Máximo permitido (por defecto 5)

## 📊 Estructura del Log

### Encabezado

```
================================================================================
🚀 Iniciando crawler de debug
📅 Fecha: [timestamp]
🌐 URL Base: [URL]
📧 Email: [email]
📝 Archivo de log: [ruta del archivo]
================================================================================
```

### Durante la Ejecución

Cada acción se registra con timestamp:

```
[2025-12-15T15:30:45.123Z] ℹ️  🔐 Intentando hacer login...
[2025-12-15T15:30:47.456Z] ✅ Login exitoso desde /admin
[2025-12-15T15:30:50.789Z] 🔍 Visitando: http://localhost:5173/admin/dashboard
[2025-12-15T15:30:52.012Z] ✅ Visitada: http://localhost:5173/admin/dashboard -> Ruta: /admin/dashboard
```

### Reporte Final

```
================================================================================
📊 REPORTE FINAL
================================================================================

📈 ESTADÍSTICAS:
   - URLs visitadas: [número]
   - Rutas únicas encontradas: [número]
   - Errores encontrados: [número]
   - Logs de consola capturados: [número]

🗺️  RUTAS ENCONTRADAS ([número]):
   1. /ruta1
   2. /ruta2
   ...

🌐 URLs VISITADAS ([número]):
   1. http://...
   2. http://...
   ...

❌ ERRORES ENCONTRADOS ([número]):
   1. [descripción del error]
   2. [descripción del error]
   ...

📝 LOGS DE CONSOLA (últimos 50):
   1. [ERROR] [mensaje] (ubicación)
   2. [WARNING] [mensaje] (ubicación)
   ...
```

## 🔍 Rutas Conocidas

El script visita las siguientes rutas conocidas de la aplicación:

### Admin Routes
- `/admin`
- `/admin/dashboard`
- `/admin/users`
- `/admin/users/create`
- `/admin/audit-logs`
- `/admin/pili`
- `/admin/conversations`

### CRM Routes
- `/crm`
- `/crm/contacts`
- `/crm/leads`
- `/crm/calendar`
- `/crm/actions`
- `/crm/expedientes`
- `/crm/call`
- `/crm/settings`
- `/crm/settings/task-templates`
- `/crm/settings/custom-fields`

### Contrato Routes
- `/contrato`
- `/contrato/login`
- `/contrato/dashboard`

### Public Routes
- `/`
- `/privacidad`
- `/privacy`
- `/borrador`
- `/colaboradores`
- `/closer`

## 🐛 Manejo de Errores

### Errores de Navegación

Si una URL no se puede visitar, el script:
1. Registra el error en el log
2. Lo agrega a la lista de errores
3. Continúa con la siguiente URL

### Errores de Login

Si el login falla, el script:
1. Intenta múltiples rutas de login
2. Si todas fallan, continúa sin autenticación
3. Registra el fallo en el log

### Timeouts

El script maneja timeouts de dos formas:
- **TIMEOUT**: Tiempo máximo para operaciones individuales (30s)
- **NAVIGATION_TIMEOUT**: Tiempo máximo para navegación (60s)

Si se excede un timeout, el script registra el error y continúa.

## 📝 Mejoras Futuras

### Posibles Extensiones

1. **Screenshots automáticos**: Capturar screenshots de páginas con errores
2. **Performance metrics**: Medir tiempos de carga de cada página
3. **Accessibility testing**: Integrar tests de accesibilidad
4. **Visual regression**: Comparar screenshots entre versiones
5. **API monitoring**: Monitorear llamadas a la API durante la navegación
6. **Export a JSON**: Generar reporte en formato JSON para procesamiento automatizado

### Optimizaciones

1. **Paralelización**: Visitar múltiples páginas en paralelo (con cuidado)
2. **Caching**: Cachear resultados de navegación para evitar re-visitas
3. **Selective crawling**: Permitir especificar qué rutas visitar
4. **Resume capability**: Poder reanudar un crawl interrumpido

## 🔒 Consideraciones de Seguridad

### Credenciales

⚠️ **IMPORTANTE**: El script contiene credenciales hardcodeadas. Para producción:

1. Usar variables de entorno:
```javascript
const LOGIN_EMAIL = process.env.DEBUG_EMAIL;
const LOGIN_PASSWORD = process.env.DEBUG_PASSWORD;
```

2. No commiteear el archivo con credenciales reales
3. Usar credenciales de test/staging cuando sea posible

### Información Sensible

El log puede contener información sensible:
- URLs internas
- Errores que revelan estructura
- Logs de consola con datos

Asegúrate de revisar los logs antes de compartirlos.

## 📚 Referencias

- [Puppeteer Documentation](https://pptr.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Node.js File System](https://nodejs.org/api/fs.html)

## 🤝 Contribuciones

Para mejorar el script:

1. Agregar nuevas rutas conocidas en `visitKnownRoutes()`
2. Agregar nuevos patrones de rutas en `extractRoutes()`
3. Mejorar el manejo de errores específicos
4. Agregar nuevas métricas al reporte



















