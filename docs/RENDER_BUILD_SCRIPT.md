# Script de Build para Render con Auto-Repair

## Descripción

Script de build automatizado para Render que incluye:
- ✅ Limpieza automática del entorno
- ✅ Auto-repair de errores comunes de TypeScript/build
- ✅ Reintentos automáticos con correcciones (hasta 3 intentos)
- ✅ Verificación de dependencias
- ✅ Preparación limpia para `npm start`

## Uso en Render

### Configuración Recomendada

En el dashboard de Render o en `render.yaml`:

**Build Command:**
```bash
chmod +x scripts/render-build.sh && bash scripts/render-build.sh
```

**Start Command:**
```bash
npm start
```

El script **NO** ejecuta `npm start` automáticamente - Render lo hace después del build exitoso.

## Uso Local (Testing)

### Linux/Mac/WSL/Git Bash
```bash
chmod +x scripts/render-build.sh
bash scripts/render-build.sh
```

### Windows (PowerShell)
```powershell
npm run build:render:win
```

O directamente:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/render-build.ps1
```

## Características del Script

### 1. 🧹 Limpieza Automática
- Elimina `dist/` anterior
- Limpia cachés de Vite (`node_modules/.vite`, `node_modules/.cache`)
- Elimina archivos temporales y logs

### 2. 🔧 Auto-Repair Inteligente
El script ejecuta automáticamente estos scripts de corrección:

| Script | Función |
|--------|---------|
| `remove-unused-imports.js` | Elimina imports no usados (TS6133) |
| `fix-icon-references.js` | Corrige referencias de iconos antiguos |
| `fix-icon-names.js` | Corrige nombres incorrectos de iconos |
| `fix-imports-and-references.js` | Limpia imports duplicados |

### 3. 🔄 Build con Reintentos
- **3 intentos máximo**
- Auto-repair automático entre intentos
- Logs detallados guardados en `build.log`
- Muestra últimos 50 errores si falla

### 4. ✅ Verificación Post-Build
- Verifica que `dist/` existe
- Verifica que `dist/index.html` existe
- Muestra tamaño del build final

## Flujo de Ejecución Detallado

```
┌─────────────────────────────────────┐
│  1. Limpiar Entorno                 │
│     - rm -rf dist                   │
│     - rm -rf node_modules/.vite     │
│     - rm -rf node_modules/.cache    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  2. Verificar Dependencias          │
│     - Si faltan → npm ci            │
│     - Verificar node_modules/.bin   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  3. Auto-Repair Proactivo           │
│     - Limpiar imports no usados     │
│     - Corregir referencias iconos   │
│     - Corregir nombres iconos       │
│     - Limpiar imports duplicados    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  4. Build con Reintentos            │
│     ┌───────────────────────────┐   │
│     │ Intento 1: npm run build  │   │
│     └───────────┬───────────────┘   │
│                 ↓                    │
│         ¿Falló? ──SÍ──→ Auto-Repair │
│                 │                    │
│                 NO                   │
│                 ↓                    │
│         [Hasta 3 intentos]           │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  5. Verificar Build                 │
│     - dist/ existe?                 │
│     - dist/index.html existe?       │
│     - Mostrar tamaño                │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  6. ✅ Build Exitoso                │
│     Listo para npm start            │
└─────────────────────────────────────┘
```

## Configuración en Render

### Opción 1: Static Site (Actual)

En `render.yaml`:

```yaml
services:
  - type: web
    name: migro-hiring
    runtime: static
    buildCommand: chmod +x scripts/render-build.sh && bash scripts/render-build.sh
    staticPublishPath: dist
```

### Opción 2: Web Service (Node.js)

En `render-build.yaml` (nuevo archivo):

```yaml
services:
  - type: web
    name: migro-hiring
    runtime: node
    buildCommand: chmod +x scripts/render-build.sh && bash scripts/render-build.sh
    startCommand: npm start
```

## Variables de Entorno Requeridas

Configurar en Render Dashboard:

```bash
# Node
NODE_VERSION=20

# Build variables
VITE_API_BASE_URL=https://api.migro.es/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_...  # Configurar manualmente
VITE_APP_URL=https://contratacion.migro.es
VITE_DEBUG_MODE=false
VITE_API_TIMEOUT=30000

# Runtime (solo para Web Service)
PORT=10000  # Render lo inyecta automáticamente
NODE_ENV=production
```

## Timeouts y Límites

- **Build timeout en Render**: 45 minutos (por defecto)
- **Cada intento de build**: ~2-5 minutos
- **Auto-repair**: ~10-30 segundos por script
- **Tiempo total máximo**: ~15-20 minutos (con 3 intentos)

Si tu build toma más de 20 minutos, considera optimizar:
- Reducir dependencias
- Usar build cache en Render
- Optimizar scripts de auto-repair

## Debugging en Render

### Ver Logs del Build

1. Ve al servicio en Render Dashboard
2. Sección "Logs" → "Build Logs"
3. Busca errores específicos o "BUILD FALLÓ"

### Ver build.log Localmente

Si el build falla, el script crea `build.log` con:
- Todos los errores de TypeScript
- Output completo del build
- Últimas 50 líneas al final

### Ejecutar Localmente

Para reproducir el mismo proceso que Render:

```bash
# Linux/Mac/WSL
bash scripts/render-build.sh

# Windows
npm run build:render:win
```

## Personalizar Auto-Repair

Para agregar nuevos scripts de auto-repair, edita `scripts/render-build.sh`:

```bash
# En la función auto_repair()
if [ -f "scripts/mi-nuevo-script.js" ]; then
    echo "  → Ejecutando mi nuevo script..."
    node scripts/mi-nuevo-script.js || true
fi
```

## Troubleshooting Común

### Error: "Permission denied"
```bash
# En Render, el chmod se ejecuta automáticamente en el buildCommand
# Si falla localmente:
chmod +x scripts/render-build.sh
```

### Error: "Command not found: bash"
Usar `sh` en lugar de `bash`:
```bash
sh scripts/render-build.sh
```

### Build sigue fallando después de 3 intentos

1. Revisa `build.log` para errores específicos
2. Ejecuta localmente para ver errores completos
3. Agrega nuevo script de auto-repair para tu error específico
4. Verifica que todas las dependencias estén en `package.json`

### Build muy lento

- Usa caché de dependencias en Render
- Reduce número de scripts de auto-repair si no son necesarios
- Optimiza `package.json` (elimina dependencias no usadas)

## Verificación Post-Deploy

Después del deploy, verificar:

1. **Health check**: `https://tu-app.onrender.com/healthz`
2. **Página principal**: `https://tu-app.onrender.com/`
3. **Rutas SPA**: Verificar que funcionan correctamente
4. **Console del navegador**: Sin errores de recursos faltantes

## Notas Importantes

- ✅ El script usa `set -e` pero los auto-repair usan `|| true` para no fallar
- ✅ El script es **idempotente** (puede ejecutarse múltiples veces)
- ✅ No modifica `package.json` ni archivos fuente (solo corrige)
- ✅ Los logs se guardan para debugging
- ✅ El script NO ejecuta `npm start` - Render lo hace automáticamente

## Mejoras Futuras

Posibles mejoras del script:
- [ ] Cache de dependencias entre builds
- [ ] Análisis de tamaño del bundle
- [ ] Validación de variables de entorno
- [ ] Notificaciones de build fallido
- [ ] Métricas de tiempo de build
