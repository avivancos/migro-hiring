# 🚀 Deploy en Render - Migro Hiring

Guía completa para desplegar la aplicación en Render.

## 📋 Prerrequisitos

- Cuenta en [Render](https://render.com)
- Repositorio GitHub: https://github.com/avivancos/migro-hiring
- Claves de Stripe (publishable key)

## 🎯 Opción 1: Deploy Automático con render.yaml

### Paso 1: Conectar Repositorio

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Blueprint"**
3. Conecta tu cuenta de GitHub
4. Selecciona el repositorio `avivancos/migro-hiring`
5. Render detectará automáticamente el archivo `render.yaml`

### Paso 2: Configurar Variables de Entorno

En el dashboard de Render, agrega estas variables:

```bash
VITE_API_BASE_URL=https://api.migro.es/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SCgH4Djtj7fY0Es...
VITE_APP_URL=https://migro-hiring.onrender.com
VITE_DEBUG_MODE=false
VITE_API_TIMEOUT=30000
```

### Paso 3: Deploy

1. Click en **"Apply"**
2. Render comenzará el build automáticamente
3. Espera 3-5 minutos
4. Tu app estará disponible en: `https://migro-hiring.onrender.com`

---

## 🎯 Opción 2: Deploy Manual (Static Site)

### Paso 1: Crear Nuevo Static Site

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Static Site"**
3. Conecta tu repositorio de GitHub

### Paso 2: Configurar Build

```yaml
Name: migro-hiring
Branch: main
Root Directory: (dejar vacío)
Build Command: npm install && npm run build
Publish Directory: dist
```

### Paso 3: Variables de Entorno

Agregar en la sección **"Environment"**:

| Variable | Valor |
|----------|-------|
| `NODE_VERSION` | `20` |
| `VITE_API_BASE_URL` | `https://api.migro.es/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_51SCgH4D...` |
| `VITE_APP_URL` | `https://migro-hiring.onrender.com` |
| `VITE_DEBUG_MODE` | `false` |
| `VITE_API_TIMEOUT` | `30000` |

### Paso 4: Headers y Rewrites

#### Headers (Security)

Agregar en **"Headers"**:

```
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; connect-src 'self' https://api.migro.es https://api.stripe.com; frame-src https://js.stripe.com https://verify.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:
```

#### Rewrites (SPA Routing)

Agregar en **"Rewrites"**:

```
/* → /index.html (200)
```

Esto es crucial para que React Router funcione correctamente.

---

## 🔧 Configuración Adicional

### Custom Domain (Opcional)

Si quieres usar `contratacion.migro.es`:

1. Ve a **"Settings"** → **"Custom Domain"**
2. Agrega: `contratacion.migro.es`
3. Configura el DNS en tu proveedor:
   ```
   Type: CNAME
   Name: contratacion
   Value: migro-hiring.onrender.com
   ```
4. Espera propagación DNS (5-60 minutos)
5. Actualiza `VITE_APP_URL` a `https://contratacion.migro.es`

### SSL/HTTPS

✅ Render proporciona SSL automático para:
- Subdominios `.onrender.com`
- Custom domains

No necesitas configurar nada adicional.

---

## 🐛 Troubleshooting

### Error: "Blocked request. This host is not allowed"

✅ **Ya solucionado** en `vite.config.ts` con:
```typescript
allowedHosts: [
  'localhost',
  '.onrender.com',
  '.vercel.app',
  '.netlify.app',
  'migro.es',
  'contratacion.migro.es',
]
```

### Error: Build fallido

**Síntoma:** Build falla con error de npm
**Solución:** 
```bash
# Verificar que package.json tiene scripts correctos
npm run build  # Debe funcionar localmente primero
```

### Error: 404 en rutas

**Síntoma:** Al navegar a `/contratacion/ABC123` da 404
**Solución:** Configurar rewrite rule:
```
/* → /index.html (200)
```

### Error: Variables de entorno no se aplican

**Síntoma:** La app no se conecta a la API
**Solución:** 
1. Verifica que las variables empiezan con `VITE_`
2. Redeploy después de cambiar variables
3. Limpia cache: Settings → "Clear Cache & Deploy"

### Error: CORS

**Síntoma:** Error de CORS en la consola
**Solución:** Tu backend (`api.migro.es`) debe permitir:
```python
# FastAPI
allow_origins=[
    "https://migro-hiring.onrender.com",
    "https://contratacion.migro.es",
]
```

---

## 📊 Monitoreo

### Logs

Ver logs en tiempo real:
1. Ve a tu servicio en Render
2. Click en **"Logs"**
3. Puedes ver errores de build y runtime

### Métricas

Render proporciona:
- ✅ Bandwidth usage
- ✅ Request count
- ✅ Deploy history

---

## 💰 Pricing

### Free Tier

- ✅ Static Sites son **GRATIS**
- ✅ 100 GB bandwidth/mes
- ✅ SSL incluido
- ✅ CDN global

### Paid Plans (si necesitas más)

- **Starter:** $7/mes (400 GB bandwidth)
- **Pro:** Custom pricing

Para Migro Hiring, el **Free Tier es suficiente** para empezar.

---

## 🔄 Actualizar Deploy

### Automático (Recomendado)

Cada vez que hagas `git push` a `main`:
1. Render detecta el cambio
2. Ejecuta build automáticamente
3. Despliega nueva versión
4. Zero downtime

### Manual

1. Ve a tu servicio
2. Click en **"Manual Deploy"** → **"Clear cache & deploy"**

---

## ✅ Checklist Post-Deploy

- [ ] ✅ App carga en `https://migro-hiring.onrender.com`
- [ ] ✅ Logo de Migro se muestra correctamente
- [ ] ✅ Formulario de hiring code funciona
- [ ] ✅ API se conecta correctamente (`api.migro.es`)
- [ ] ✅ Stripe KYC funciona (redirección)
- [ ] ✅ Stripe Payments funciona (tarjeta de prueba)
- [ ] ✅ Panel de admin funciona (Pomelo2005.1@)
- [ ] ✅ Rutas de React Router funcionan sin 404
- [ ] ✅ Responsive en móvil
- [ ] ✅ HTTPS activo (candado en navegador)

---

## 📞 Soporte

**Render Support:**
- 📚 Docs: https://render.com/docs
- 💬 Community: https://community.render.com
- 📧 Email: support@render.com

**Migro:**
- 📧 Email: hola@migro.es

---

## 🎉 ¡Listo!

Tu aplicación Migro Hiring está ahora en producción en Render.

**URL:** https://migro-hiring.onrender.com

---

**Última actualización:** 24 de Octubre de 2025

