# 🐳 Render con Docker - Configuración Correcta

## ✅ Configuración Actualizada

He configurado el proyecto para que Render use Docker **correctamente** con build de producción.

---

## 🏗️ Arquitectura del Dockerfile

### Multi-Stage Build Optimizado

```dockerfile
Stage 1: deps       → Instala dependencias (con limpieza de cache)
Stage 2: builder    → Compila el código (build de producción)
Stage 3: runner     → Nginx sirviendo archivos estáticos ✅
Stage 4: development → Vite dev server (solo para local)
```

**Render usará:** Stage 3 `runner` (Nginx + archivos estáticos)

---

## 🔧 Cambios Realizados

### 1. Dockerfile Optimizado

```dockerfile
# Stage 1: Limpieza de cache en cada build
RUN npm cache clean --force && \
    npm ci --legacy-peer-deps --no-audit --no-fund

# Stage 2: Build con limpieza y verificación
RUN rm -rf dist node_modules/.cache && \
    npm run build && \
    echo "✅ Build completado"

# Stage 3: Runner (NGINX) - Este es el que usa Render
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
```

### 2. render.yaml Configurado

```yaml
services:
  - type: web
    name: migro-hiring
    runtime: docker          # ✅ Usar Docker
    dockerfilePath: ./Dockerfile
    dockerContext: ./
```

**Render automáticamente usará el último stage definido** (runner con Nginx).

---

## 🚀 Deploy en Render

### Método 1: Auto-Deploy (Recomendado)

1. Push al repositorio:
   ```bash
   git push
   ```

2. Render detecta el cambio y hace redeploy automáticamente

3. Verifica los logs:
   ```
   ✅ CORRECTO (ahora):
   Building Docker image...
   [builder] RUN npm run build
   vite v7.1.12 building for production...
   ✓ 289 modules transformed.
   dist/index.html
   [runner] FROM nginx:alpine
   Successfully built image
   ```

### Método 2: Manual Deploy

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona tu servicio `migro-hiring`
3. Click **"Manual Deploy"**
4. Selecciona **"Clear build cache & deploy"**
5. Espera 5-8 minutos (Docker build es más lento que static)

---

## 🔍 Verificación

### En los logs de Render, debes ver:

```bash
✅ Stage 1: Dependencies
#11 RUN npm cache clean --force && npm ci
✓ Dependencies installed

✅ Stage 2: Builder
#21 RUN rm -rf dist node_modules/.cache && npm run build
vite v7.1.12 building for production...
✓ 289 modules transformed.
✓ Build completado: dist/index.html

✅ Stage 3: Runner (Nginx)
#31 FROM nginx:alpine
#32 COPY --from=builder /app/dist /usr/share/nginx/html
✓ Image pushed to registry

==> Deploying...
==> Your service is live 🎉
```

### NO debe aparecer:

```bash
❌ INCORRECTO:
> vite --host 0.0.0.0
VITE v7.1.12 ready
```

Si ves esto, Render está usando el stage `development` equivocado.

---

## ⚙️ Variables de Entorno en Render

**CRÍTICO:** Configura estas variables en Render Dashboard:

| Variable | Valor | Dónde |
|----------|-------|-------|
| `VITE_API_BASE_URL` | `https://api.migro.es/api` | Render Dashboard |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_51SCgH4D...` | Render Dashboard |
| `VITE_APP_URL` | `https://contratacion.migro.es` | Render Dashboard |
| `VITE_DEBUG_MODE` | `false` | Render Dashboard |
| `VITE_API_TIMEOUT` | `30000` | Render Dashboard |

**Importante:** Estas variables deben ser **Build Arguments** en Docker, no runtime.

### Cómo Agregarlas:

1. Dashboard → Tu servicio → **"Environment"**
2. Click **"Add Environment Variable"**
3. Para cada variable:
   - Key: `VITE_xxx`
   - Value: (el valor correspondiente)
4. Click **"Save Changes"**
5. Render hará redeploy automáticamente

---

## 🧪 Probar Localmente con Docker

### Development (Vite dev server):

```bash
docker-compose up dev
```

Abre: http://localhost:5173

### Production (Nginx):

```bash
docker-compose up prod
```

Abre: http://localhost:80

Esto te permite probar exactamente lo que Render deployará.

---

## 📊 Comparación: Antes vs Ahora

| Aspecto | ❌ Antes | ✅ Ahora |
|---------|---------|----------|
| **Stage usado** | `development` | `runner` (nginx) |
| **Comando** | `npm run dev` | `nginx` |
| **Error "Blocked request"** | Sí | No |
| **Cache limpiado** | No | Sí (en cada build) |
| **Performance** | Lento | Rápido (static) |
| **Puerto** | 5173 | 80 |

---

## 🔐 Seguridad

### Headers de Nginx

El archivo `docker/nginx.conf` ya incluye:

- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Content-Security-Policy` configurado para Stripe
- ✅ Gzip compression
- ✅ SPA routing (`try_files $uri $uri/ /index.html`)

---

## 🐛 Troubleshooting

### Error: "Still using dev server"

**Causa:** Render está usando el stage `development`

**Solución:**
1. Verifica que `render.yaml` tiene `runtime: docker`
2. Elimina el servicio y recréalo
3. Asegúrate de que el Dockerfile está en la raíz

### Error: "Build failed"

**Causa:** Variables de entorno no configuradas

**Solución:**
1. Agrega todas las variables `VITE_*` en Render Dashboard
2. Redeploy con "Clear build cache & deploy"

### Error: "CORS"

**Causa:** Backend no permite el dominio

**Solución:**
Configura en tu backend FastAPI:
```python
allow_origins=[
    "https://contratacion.migro.es",
    "https://migro-hiring.onrender.com",
]
```

---

## 📈 Rendimiento

### Tiempos de Build

- **Static Site:** 2-3 minutos
- **Docker:** 5-8 minutos (más lento pero más control)

### Ventajas de Docker:

- ✅ Control total sobre el entorno
- ✅ Nginx configurado a medida
- ✅ Headers de seguridad custom
- ✅ Mismo build en local y producción

---

## 🎉 Resultado Final

Una vez deployado correctamente:

```bash
# Verificar que usa Nginx
curl -I https://contratacion.migro.es
# HTTP/2 200
# server: nginx

# Verificar archivos estáticos
curl https://contratacion.migro.es | grep "assets"
# <script type="module" crossorigin src="/assets/index-xxxxx.js">

# NO debe aparecer Vite dev
curl https://contratacion.migro.es | grep -i "vite ready"
# (sin resultados)
```

---

## 📞 Soporte

- 📚 Render Docker Docs: https://render.com/docs/docker
- 💬 Migro: hola@migro.es

---

**Última actualización:** 24 de Octubre de 2025

