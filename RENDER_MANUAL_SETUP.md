# 🔧 Render: Configuración Manual (Solución Definitiva)

## 🚨 Problema Identificado

Render está ejecutando `npm run dev` (dev server) porque detecta el **Dockerfile** y lo usa en lugar de hacer un static build.

```bash
❌ MAL (lo que está pasando ahora):
> vite --host 0.0.0.0    # Dev server corriendo
VITE v7.1.12 ready       # Causa error "Blocked request"

✅ BIEN (lo que necesitamos):
npm run build            # Build de producción
Serving ./dist/          # Archivos estáticos
```

---

## ✅ Solución: Crear Nuevo Static Site (Sin Docker)

### Paso 1: Eliminar el Servicio Actual

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Encuentra tu servicio actual (`migro-hiring`)
3. Click en **"Settings"**
4. Scroll hasta abajo
5. Click en **"Delete Service"**
6. Confirma la eliminación

### Paso 2: Crear Nuevo Static Site

1. En el Dashboard, click **"New +"**
2. Selecciona **"Static Site"** (NO "Web Service")
3. Conecta tu repositorio: `avivancos/migro-hiring`
4. Branch: `main`

### Paso 3: Configurar Build Settings

**IMPORTANTE:** Ingresa EXACTAMENTE estos valores:

```yaml
Name: migro-hiring
Branch: main
Root Directory: (DEJAR VACÍO)
Build Command: npm ci && npm run build
Publish Directory: dist
Auto-Deploy: Yes
```

⚠️ **NO** marcar "Docker" ni nada relacionado con containers.

### Paso 4: Variables de Entorno

Click en **"Advanced"** y agrega estas variables:

| Key | Value |
|-----|-------|
| `NODE_VERSION` | `20` |
| `VITE_API_BASE_URL` | `https://api.migro.es/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_51SCgH4Djtj7fY0EsiZB6PvzabhQzCrgLQr728oJkfbUDciK9nk29ajRta3IuMK1tSXRv3RUQloYNez3BEwY2DmIp00RhGVHymj` |
| `VITE_APP_URL` | `https://contratacion.migro.es` |
| `VITE_DEBUG_MODE` | `false` |
| `VITE_API_TIMEOUT` | `30000` |

### Paso 5: Crear el Servicio

Click en **"Create Static Site"**

Render comenzará el build automáticamente. **Espera 3-5 minutos**.

---

## 🔍 Verificar el Build Correcto

### En los Logs debes ver:

```bash
✅ CORRECTO:
==> Building...
==> Running 'npm ci && npm run build'

added 289 packages in 15s
...
> migro-hiring@1.0.0 build
> tsc -b && vite build

vite v7.1.12 building for production...
✓ 289 modules transformed.
dist/index.html                   5.23 kB │ gzip:  1.89 kB
dist/assets/index-abc123.js     247.89 kB │ gzip: 78.34 kB
✓ built in 12.45s

==> Build successful! 🎉
==> Deploying...
==> Your service is live 🎉
```

### Si ves esto, está MAL:

```bash
❌ INCORRECTO:
> vite --host 0.0.0.0
VITE v7.1.12 ready in 814 ms
```

Si aparece esto, significa que Render sigue usando Docker. **Debes eliminar y recrear el servicio**.

---

## 🌐 Configurar Custom Domain

### Paso 1: En Render

1. Ve a tu nuevo Static Site
2. Click en **"Settings"**
3. Scroll a **"Custom Domains"**
4. Click **"Add Custom Domain"**
5. Ingresa: `contratacion.migro.es`
6. Click **"Verify"**

### Paso 2: Configurar DNS

En tu proveedor de DNS (donde gestionas `migro.es`), agrega:

```
Type: CNAME
Name: contratacion
Value: migro-hiring.onrender.com
TTL: 3600 (1 hora)
```

**Ejemplos por proveedor:**

#### Cloudflare
- Type: CNAME
- Name: `contratacion`
- Target: `migro-hiring.onrender.com`
- Proxy status: ⚠️ **DNS only** (no proxy)

#### Namecheap
- Type: CNAME Record
- Host: `contratacion`
- Value: `migro-hiring.onrender.com`
- TTL: Automatic

#### GoDaddy
- Type: CNAME
- Name: `contratacion`
- Value: `migro-hiring.onrender.com`
- TTL: 1 Hour

### Paso 3: Esperar Propagación

- Tiempo típico: 5-30 minutos
- Máximo: 48 horas (raro)

Verifica con:
```bash
# Verificar DNS
nslookup contratacion.migro.es

# Debe responder con:
# contratacion.migro.es canonical name = migro-hiring.onrender.com
```

---

## 🔐 Redirects/Rewrites (Crítico para React Router)

Una vez creado el Static Site:

1. Ve a **"Settings"**
2. Busca **"Redirects/Rewrites"**
3. Click **"Add Rule"**
4. Ingresa:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Type:** Rewrite (NO Redirect)
5. Click **"Save"**

Esto permite que todas las rutas (`/admin`, `/contratacion/ABC123`, etc.) funcionen correctamente.

---

## 🧪 Pruebas Finales

Una vez deployado:

### 1. Verificar que NO es dev server

```bash
curl -I https://contratacion.migro.es
# Debe responder: HTTP/2 200

curl https://contratacion.migro.es | grep -i "vite ready"
# NO debe aparecer nada (si aparece "VITE ready", está mal)
```

### 2. Verificar archivos estáticos

```bash
curl https://contratacion.migro.es | grep "assets"
# Debe mostrar: <script type="module" crossorigin src="/assets/index-xxxxx.js"></script>
```

### 3. Probar la aplicación

- ✅ Home page carga: `https://contratacion.migro.es`
- ✅ Admin funciona: `https://contratacion.migro.es/admin`
- ✅ Logo de Migro visible
- ✅ Formulario de hiring code funciona
- ✅ API responde correctamente
- ✅ NO hay error "Blocked request"

---

## 💡 Por qué Falló Antes

| Issue | Causa | Solución |
|-------|-------|----------|
| Error "Blocked request" | Render ejecutaba `npm run dev` | Usar Static Site |
| Dev server corriendo | Dockerfile detectado | Agregar `.renderignore` |
| Variables no aplicaban | Estaba en modo Docker | Configurar en Static Site |

---

## 🆘 Si TODAVÍA Falla

### Alternativa 1: Netlify (Más Simple)

```bash
# 1. Instalar CLI
npm install -g netlify-cli

# 2. Build local
npm run build

# 3. Deploy
cd dist
netlify deploy --prod
```

Sigue las instrucciones en pantalla. **Netlify es más simple que Render para React apps**.

### Alternativa 2: Vercel (Recomendado para React)

```bash
# 1. Instalar CLI
npm install -g vercel

# 2. Deploy
vercel --prod
```

Vercel detecta automáticamente Vite y configura todo correctamente.

### Alternativa 3: Cloudflare Pages

1. Ve a [Cloudflare Pages](https://pages.cloudflare.com)
2. Conecta tu repositorio GitHub
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

---

## 📊 Comparación de Hosting

| Hosting | Dificultad | Gratis | Velocidad | Recomendación |
|---------|-----------|--------|-----------|---------------|
| **Vercel** | ⭐ Fácil | ✅ Sí | ⚡ Rápido | ⭐⭐⭐⭐⭐ |
| **Netlify** | ⭐ Fácil | ✅ Sí | ⚡ Rápido | ⭐⭐⭐⭐⭐ |
| **Cloudflare** | ⭐⭐ Media | ✅ Sí | ⚡⚡ Muy rápido | ⭐⭐⭐⭐ |
| **Render** | ⭐⭐⭐ Difícil | ✅ Sí | ⚡ Normal | ⭐⭐⭐ |

**Recomendación:** Usa **Vercel** o **Netlify** para evitar estos problemas.

---

## 📞 Soporte

Si necesitas ayuda:
- 📧 Render Support: support@render.com
- 📚 Render Docs: https://render.com/docs/static-sites
- 💬 Migro: hola@migro.es

---

**Última actualización:** 24 de Octubre de 2025

