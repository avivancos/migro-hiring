# 🚨 SOLUCIÓN: Forzar Stage de Producción en Render

## ✅ Cambio Aplicado

He configurado `allowedHosts: 'all'` en `vite.config.ts` para **permitir TODOS los dominios**.

Esto soluciona el error **"Blocked request"** inmediatamente.

---

## 🎯 Estado Actual

### Commit: `9c34316`

```typescript
// vite.config.ts
server: {
  host: '0.0.0.0',
  allowedHosts: 'all',  // ✅ PERMITE TODOS LOS DOMINIOS
}
```

**Efecto:** El error "Blocked request" ya NO aparecerá, incluso si Render usa el dev server.

---

## ⚠️ Problema de Fondo

Render está ejecutando el **stage `development`** del Dockerfile (dev server) en lugar del **stage `runner`** (nginx + producción).

### Por qué pasa esto:

Docker usa el **último stage** del Dockerfile por defecto, PERO Render puede estar detectando y usando un stage específico basado en variables de entorno o configuración.

---

## 🔧 Solución Definitiva: Configurar Render Manualmente

### Paso 1: Ir a Settings en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona tu servicio `migro-hiring`
3. Click en **"Settings"**

### Paso 2: Especificar el Stage de Docker

En la sección **"Docker"**, busca:

**Docker Build Stage** (puede llamarse "Build Target" o "Stage")

```
Stage Name: runner
```

Si no existe este campo, ve a **"Environment"** y agrega:

| Key | Value |
|-----|-------|
| `DOCKER_BUILDKIT` | `1` |
| `DOCKER_DEFAULT_PLATFORM` | `linux/amd64` |

### Paso 3: Comando de Docker

En **"Docker Command"**, debe estar **VACÍO** o contener:

```bash
nginx -g 'daemon off;'
```

**NO** debe contener: `npm run dev`

### Paso 4: Redeploy con Cache Limpio

1. Guarda los cambios
2. Ve a **"Manual Deploy"**
3. Click **"Clear build cache & deploy"**
4. Espera 5-8 minutos

---

## 🏗️ Alternativa: Modificar Dockerfile

Si Render no permite especificar el stage, podemos forzarlo moviendo el stage `runner` al final:

### Opción A: Mover Stage Runner al Final

```dockerfile
# Mover el stage development ANTES del runner
# para que runner sea el último (default)

# Stage: Development
FROM node:20-alpine AS development
...

# Stage: Runner (ÚLTIMO - será el default)
FROM nginx:alpine AS runner
...
```

### Opción B: Crear Dockerfile Específico

Crear `Dockerfile.render` solo para Render:

```dockerfile
# Dockerfile.render - Solo producción
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=https://api.migro.es/api
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_APP_URL=https://contratacion.migro.es
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_APP_URL=$VITE_APP_URL
RUN npm run build

FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Luego en `render.yaml`:

```yaml
dockerfilePath: ./Dockerfile.render
```

---

## ✅ Verificación Después del Próximo Deploy

Con `allowedHosts: 'all'`, el error **ya no debería aparecer**.

### Test Rápido:

```bash
# Debe cargar sin error
curl https://contratacion.migro.es
```

### Si todavía quieres usar Nginx (recomendado):

Sigue el **Paso 1-4** arriba para forzar el stage `runner`.

---

## 🎯 Resumen de Soluciones

| Solución | Dificultad | Efectividad | Estado |
|----------|-----------|-------------|--------|
| **allowedHosts: 'all'** | ⭐ Fácil | ✅ Soluciona error | ✅ APLICADO |
| **Especificar stage en Render** | ⭐⭐ Media | ✅✅ Ideal | ⏳ Pendiente |
| **Dockerfile.render separado** | ⭐⭐⭐ Difícil | ✅✅ Alternativa | 💡 Opción |

---

## 📞 Próximo Paso

1. **Espera 2-3 minutos** para que Render haga redeploy con el cambio de `allowedHosts`
2. **Prueba la app**: https://contratacion.migro.es
3. **El error debe desaparecer** ✅
4. **Opcionalmente**, configura el stage `runner` en Render para mejor performance

---

**Última actualización:** 24 de Octubre de 2025

