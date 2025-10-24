# ✅ Checklist: Verificar Configuración de Render

## 🎯 Objetivo

Asegurar que Render use el **stage `runner`** (Nginx + archivos estáticos) del Dockerfile, NO el stage `development`.

---

## 📋 Checklist Pre-Deploy

### 1. ✅ Verificar Tipo de Servicio

En Render Dashboard → Tu servicio:

- [ ] **Tipo:** Debe ser **"Web Service"** con **"Docker"**
- [ ] **NO** debe ser "Static Site"

### 2. ✅ Verificar Configuración de Build

En **Settings** → **Build & Deploy**:

```yaml
✅ CORRECTO:
Build Command: (vacío o Docker)
Dockerfile Path: ./Dockerfile
Docker Context: ./
Docker Command: (vacío - usar CMD del Dockerfile)

❌ INCORRECTO:
Build Command: npm run dev
Start Command: npm run dev
```

**CRÍTICO:** Si ves `npm run dev` en cualquier lugar, **bórralo**.

### 3. ✅ Variables de Entorno

En **Environment** → Variables:

| Variable | Valor | ✅ |
|----------|-------|----|
| `VITE_API_BASE_URL` | `https://api.migro.es/api` | □ |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_51SCgH4D...` | □ |
| `VITE_APP_URL` | `https://contratacion.migro.es` | □ |
| `VITE_DEBUG_MODE` | `false` | □ |
| `VITE_API_TIMEOUT` | `30000` | □ |

### 4. ✅ Health Check

En **Settings** → **Health Check Path**:

- [ ] Path: `/`

---

## 🚀 Deploy y Verificación

### Paso 1: Trigger Manual Deploy

1. Ve a tu servicio en Render
2. Click **"Manual Deploy"**
3. Selecciona **"Clear build cache & deploy"**
4. Click **"Deploy"**

### Paso 2: Monitorear Logs

Mientras el build corre, verifica los logs:

#### ✅ Lo que DEBES ver:

```bash
==> Cloning from https://github.com/avivancos/migro-hiring
==> Checking out commit 42af585...

# Stage 1: Dependencies
#1 [deps 1/3] FROM node:20-alpine
#11 RUN npm cache clean --force && npm ci
✓ Dependencies cached

# Stage 2: Builder
#21 [builder 6/7] RUN rm -rf dist node_modules/.cache && npm run build

> migro-hiring@1.0.0 build
> tsc -b && vite build

vite v7.1.12 building for production...
transforming...
✓ 289 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   5.23 kB │ gzip:  1.89 kB
dist/assets/migro-logo-xxxxx.svg  2.45 kB
dist/assets/index-xxxxx.css      45.67 kB │ gzip: 12.34 kB
dist/assets/index-xxxxx.js      247.89 kB │ gzip: 78.34 kB
✓ built in 12.45s

✅ Build completado: dist/index.html

# Stage 3: Runner (Nginx)
#31 [runner 1/3] FROM nginx:alpine
#32 [runner 2/3] COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
#33 [runner 3/3] COPY --from=builder /app/dist /usr/share/nginx/html

==> Pushing image to registry...
==> Upload succeeded

==> Deploying...
==> Starting service...

==> Your service is live 🎉
==> https://contratacion.migro.es
```

#### ❌ Lo que NO debe aparecer:

```bash
❌ MAL:
==> Deploying...
> migro-hiring@1.0.0 dev
> vite --host 0.0.0.0

VITE v7.1.12 ready in 814 ms
➜  Local:   http://localhost:5173/
```

Si ves esto, **PARA EL DEPLOY** y sigue la sección "Solución de Emergencia" abajo.

---

## 🧪 Verificación Post-Deploy

Una vez que Render diga "Your service is live":

### 1. Verificar HTTP Headers

```bash
curl -I https://contratacion.migro.es
```

**Esperado:**
```
HTTP/2 200
server: nginx/1.25.4
content-type: text/html
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
x-xss-protection: 1; mode=block
```

✅ Si ves `server: nginx` → **Correcto**
❌ Si ves otra cosa → **Incorrecto**

### 2. Verificar que NO es Dev Server

```bash
curl https://contratacion.migro.es | grep -i "vite"
```

✅ Sin resultados → **Correcto** (archivos estáticos)
❌ Aparece "VITE ready" → **Incorrecto** (dev server corriendo)

### 3. Verificar Assets Compilados

```bash
curl https://contratacion.migro.es | grep "assets"
```

**Esperado:**
```html
<script type="module" crossorigin src="/assets/index-a1b2c3d4.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-e5f6g7h8.css">
```

✅ Si ves `/assets/index-xxxxx.js` → **Correcto**

### 4. Probar la Aplicación

- [ ] ✅ Home carga: https://contratacion.migro.es
- [ ] ✅ Logo de Migro visible
- [ ] ✅ Formulario de hiring code funciona
- [ ] ✅ Admin accesible: https://contratacion.migro.es/admin
- [ ] ✅ **NO** aparece error "Blocked request"
- [ ] ✅ API responde (prueba crear un código ficticio en admin)

---

## 🚨 Solución de Emergencia

Si después del deploy **sigue ejecutando `npm run dev`**:

### Opción A: Modificar Configuración

1. Ve a **Settings** → **Build & Deploy**
2. Busca cualquier campo que diga `npm run dev` y **bórralo**
3. Asegúrate de que:
   - **Docker Command:** (vacío)
   - **Start Command:** (vacío)
4. Click **"Save Changes"**
5. Haz **"Manual Deploy" → "Clear build cache & deploy"**

### Opción B: Recrear Servicio

Si la Opción A no funciona:

1. **Elimina el servicio actual**:
   - Settings → Scroll abajo → "Delete Service"

2. **Crea nuevo servicio**:
   - Dashboard → "New +" → "Web Service"
   - Connect repository: `avivancos/migro-hiring`
   - Branch: `main`
   - **Runtime:** Docker
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Command:** (DEJAR VACÍO)
   - Environment: Agregar todas las variables `VITE_*`
   - Click "Create Web Service"

---

## 🔍 Debug: Verificar qué Stage usa Render

Si no estás seguro qué stage está usando, revisa los logs:

```bash
# Busca esta línea en los logs:
[runner 3/3] COPY --from=builder /app/dist /usr/share/nginx/html
```

✅ Si aparece `[runner` → Usando stage correcto (nginx)
❌ Si NO aparece → No está llegando al stage runner

---

## 📊 Tabla Resumen

| Indicador | ✅ Correcto | ❌ Incorrecto |
|-----------|-------------|---------------|
| **Server header** | `nginx` | Otro |
| **Logs durante build** | `vite build` + `FROM nginx` | Solo `vite --host` |
| **Puerto** | 80 | 5173 |
| **Archivos servidos** | `/assets/index-xxx.js` | Sin `/assets/` |
| **curl respuesta** | HTML estático | Sin respuesta o error |
| **Error "Blocked request"** | No | Sí |

---

## 📞 Soporte

Si después de seguir todos estos pasos **sigue sin funcionar**:

1. Toma screenshots de:
   - Render Dashboard → Settings → Build & Deploy (toda la página)
   - Logs del último build (últimas 100 líneas)
   - Variables de entorno configuradas

2. Contacta:
   - 📧 Render Support: support@render.com
   - 💬 Migro: hola@migro.es

---

**Última actualización:** 24 de Octubre de 2025

