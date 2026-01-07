# Configuración de Render con Node (Sin Docker)

## Cambios Realizados

### 1. Actualización de render.yaml

**Archivo**: `render.yaml`

Se cambió de configuración Docker a Static Site puro usando Node + Vite:

```yaml
services:
  - type: web
    name: migro-hiring
    runtime: static  # Cambiado de 'docker' a 'static'
    buildCommand: npm ci --legacy-peer-deps && npm run build
    staticPublishPath: dist
```

**Beneficios**:
- ✅ Más simple y rápido
- ✅ Sin necesidad de Docker
- ✅ Build estándar de Vite
- ✅ Mejor para debugging

### 2. Corrección del Error de Activity

**Problema**: Error silencioso en producción:
```
Uncaught TypeError: Cannot set properties of undefined (setting 'Activity')
```

**Solución**: Cambiar la importación de `Activity` de `lucide-react` a una forma más segura:

**Antes**:
```typescript
import { Activity } from 'lucide-react';
```

**Después**:
```typescript
import * as LucideIcons from 'lucide-react';
const { Activity } = LucideIcons;
```

**Archivos modificados**:
- `src/pages/CRMDashboardPage.tsx`
- `src/pages/CRMOpportunityDetail.tsx`
- `src/pages/CRMContactDetail.tsx`
- `src/pages/admin/AdminPili.tsx`

### 3. Configuración de Rutas SPA

Se agregaron rewrites para que todas las rutas redirijan a `index.html`:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

### 4. Headers de Seguridad

Se configuraron headers de seguridad en `render.yaml`:

```yaml
headers:
  - path: /*
    name: X-Frame-Options
    value: SAMEORIGIN
  - path: /*
    name: X-Content-Type-Options
    value: nosniff
  - path: /*
    name: Content-Security-Policy
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; ..."
```

## Verificación de Build

Para verificar que la build es limpia:

```bash
npm run build
```

**Resultado esperado**:
- ✅ Build completado sin errores de TypeScript
- ✅ Sin errores de compilación
- ⚠️ Warning de chunk circular (no crítico, no afecta funcionalidad)

## Despliegue en Render

### Opción 1: Usar Blueprint (Recomendado)

1. Push los cambios al repositorio
2. Render detectará automáticamente `render.yaml`
3. El servicio se actualizará automáticamente

### Opción 2: Configuración Manual

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona el servicio `migro-hiring`
3. En **Settings** → **Build & Deploy**:
   - **Build Command**: `npm ci --legacy-peer-deps && npm run build`
   - **Publish Directory**: `dist`
4. Guarda los cambios
5. Click en **Manual Deploy** → **Deploy latest commit**

## Variables de Entorno Requeridas

Asegúrate de tener estas variables configuradas en Render:

| Variable | Valor |
|----------|-------|
| `NODE_VERSION` | `20` |
| `VITE_API_BASE_URL` | `https://api.migro.es/api` |
| `VITE_APP_URL` | `https://contratacion.migro.es` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | (configurar manualmente) |
| `VITE_DEBUG_MODE` | `false` |
| `VITE_API_TIMEOUT` | `30000` |

## Ventajas de esta Configuración

1. **Más Simple**: No requiere Docker, solo Node
2. **Más Rápido**: Build más rápido sin Docker
3. **Mejor Debugging**: Logs más claros y directos
4. **Estándar**: Usa la configuración estándar de Vite
5. **Menos Errores**: Evita problemas de compatibilidad con Docker

## Troubleshooting

### Si la pantalla sigue en blanco:

1. Verifica los logs de Render en la sección "Build Logs"
2. Revisa la consola del navegador para errores
3. Verifica que todas las variables de entorno estén configuradas
4. Asegúrate de que el build se complete exitosamente

### Si hay errores de importación:

1. Verifica que todas las importaciones de `Activity` usen la forma segura
2. Ejecuta `npm run build` localmente para verificar errores
3. Revisa que no haya importaciones directas de `Activity` de `lucide-react`

## Fecha

${new Date().toISOString().split('T')[0]}
