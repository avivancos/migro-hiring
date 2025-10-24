# 🚨 FIX: Error "Blocked request" en Render

## ❌ Problema

```
Blocked request. This host ("contratacion.migro.es") is not allowed.
To allow this host, add "contratacion.migro.es" to `server.allowedHosts` in vite.config.js.
```

## 🔍 Causa

**Render está ejecutando el servidor de DESARROLLO** (`npm run dev`) en lugar de servir los archivos estáticos compilados.

El error de "Blocked request" **SOLO aparece con el dev server**. Los archivos estáticos NO tienen este problema.

---

## ✅ Solución: Configurar como Static Site

### Paso 1: Verificar el Tipo de Servicio

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Encuentra tu servicio
3. **Verifica que sea "Static Site"**
   - ✅ Si dice **"Static Site"** → Continúa al Paso 2
   - ❌ Si dice **"Web Service"** → DEBES cambiar a Static Site

#### Si es Web Service (INCORRECTO):

**Opción A: Recrear como Static Site**
1. Elimina el servicio actual
2. Click **"New +"** → **"Static Site"**
3. Conecta el repositorio `avivancos/migro-hiring`
4. Configura según el Paso 2

**Opción B: Usar Blueprint**
1. Elimina el servicio actual
2. Click **"New +"** → **"Blueprint"**
3. Selecciona `avivancos/migro-hiring`
4. Render detectará `render.yaml` automáticamente
5. Click **"Apply"**

### Paso 2: Configuración Correcta del Static Site

#### Build Settings

```yaml
Name: migro-hiring
Branch: main
Root Directory: (dejar vacío o /)
Build Command: npm ci && npm run build
Publish Directory: dist
Auto-Deploy: Yes
```

⚠️ **IMPORTANTE:** 
- **Build Command** debe ser `npm ci && npm run build` o `npm install && npm run build`
- **NO** debe ser `npm start` o `npm run dev`

#### Variables de Entorno

**Agregar EXACTAMENTE estas variables:**

| Variable | Valor |
|----------|-------|
| `NODE_VERSION` | `20` |
| `VITE_API_BASE_URL` | `https://api.migro.es/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_51SCgH4Djtj7fY0EsiZB6PvzabhQzCrgLQr728oJkfbUDciK9nk29ajRta3IuMK1tSXRv3RUQloYNez3BEwY2DmIp00RhGVHymj` |
| `VITE_APP_URL` | `https://contratacion.migro.es` |
| `VITE_DEBUG_MODE` | `false` |
| `VITE_API_TIMEOUT` | `30000` |

⚠️ **CRÍTICO:** `VITE_APP_URL` debe ser **exactamente** `https://contratacion.migro.es`

### Paso 3: Rewrites/Redirects

En **Settings** → **Redirects/Rewrites**:

```
Source: /*
Destination: /index.html
Action: Rewrite
```

Esto permite que React Router funcione correctamente.

### Paso 4: Custom Domain

En **Settings** → **Custom Domain**:

1. Agrega: `contratacion.migro.es`
2. Configura el DNS CNAME:
   ```
   Type: CNAME
   Name: contratacion
   Value: migro-hiring.onrender.com
   TTL: 3600
   ```
3. Espera propagación DNS (5-60 minutos)

### Paso 5: Deploy

1. Click **"Manual Deploy"** → **"Clear build cache & deploy"**
2. Espera 3-5 minutos
3. Verifica que el build sea exitoso

---

## 🔍 Verificación del Build

### En los Logs de Render, debes ver:

```bash
✅ Correcto (Static Site):
==> Building...
==> Running 'npm ci && npm run build'
...
vite v5.x.x building for production...
✓ xx modules transformed.
dist/index.html                   x.xx kB
dist/assets/index-xxxxx.js       xxx.xx kB
Build completed successfully.

❌ Incorrecto (Dev Server):
==> Starting server...
==> Running 'npm run dev'
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
➜  Network: http://0.0.0.0:5173/
```

Si ves "Running 'npm run dev'" → **MAL**, estás ejecutando el dev server.

---

## 🎯 Diferencias Clave

| Aspecto | Static Site (✅ CORRECTO) | Web Service (❌ INCORRECTO) |
|---------|------------------------|---------------------------|
| **Build Command** | `npm run build` | `npm run start` o `npm run dev` |
| **Archivos** | HTML/CSS/JS estáticos | Node.js server corriendo |
| **Host Check** | No aplica | Causa error "Blocked request" |
| **Performance** | Rápido (CDN) | Lento (server rendering) |
| **Costo** | Gratis | Pago |

---

## 🧪 Prueba Final

Una vez deployado correctamente, ejecuta:

```bash
# 1. Verificar que responde 200
curl -I https://contratacion.migro.es
# Debe decir: HTTP/2 200

# 2. Verificar que NO es un dev server
curl https://contratacion.migro.es 2>&1 | grep -i "vite"
# NO debe aparecer "vite" en el HTML

# 3. Verificar que carga el JS compilado
curl https://contratacion.migro.es 2>&1 | grep "assets"
# Debe aparecer: <script type="module" crossorigin src="/assets/index-xxxxx.js">
```

---

## 🆘 Si Sigue Fallando

### Opción: Deploy Manual Local

Si Render sigue sin funcionar, puedes hacer build local y subir a otro hosting:

```bash
# 1. Build local
npm install
npm run build

# 2. Los archivos estarán en ./dist/
# 3. Sube ./dist/ a:
#    - Netlify (drag & drop)
#    - Vercel (vercel --prod)
#    - GitHub Pages
#    - Cloudflare Pages
```

### Netlify (Alternativa Rápida)

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd dist
netlify deploy --prod --dir .
```

---

## 📸 Screenshots Necesarios

Si sigue el problema, envíame screenshots de:

1. **Tipo de servicio:** Dashboard → Tu servicio → (arriba debe decir "Static Site" o "Web Service")
2. **Build Settings:** Settings → Build & Deploy
3. **Build Logs:** Logs → Últimas 50 líneas del build
4. **Variables de entorno:** Environment → Lista completa

---

**Última actualización:** 24 de Octubre de 2025

