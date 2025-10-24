# 🚀 Guía de Deploy - Migro Hiring Frontend

Esta guía explica cómo desplegar la aplicación en diferentes plataformas.

---

## 📋 Pre-requisitos

- Build de producción exitoso (`npm run build`)
- Credenciales de Stripe (Live mode)
- Backend API desplegado y funcionando

---

## 🌐 Opción 1: Vercel (Recomendado)

### Ventajas
- Deploy automático desde Git
- Preview deployments
- Edge Network global
- SSL automático
- Rollbacks fáciles

### Paso a Paso

#### 1. Instalar Vercel CLI
```bash
npm i -g vercel
```

#### 2. Login
```bash
vercel login
```

#### 3. Configurar Proyecto
```bash
# Inicializar proyecto
vercel

# Responder preguntas:
# - Set up and deploy? Yes
# - Which scope? Tu cuenta
# - Link to existing project? No
# - Project name? migro-hiring
# - Directory? ./ (default)
# - Override settings? No
```

#### 4. Configurar Variables de Entorno

En [Vercel Dashboard](https://vercel.com/dashboard):
1. Ir al proyecto `migro-hiring`
2. **Settings** → **Environment Variables**
3. Añadir las siguientes variables:

```
VITE_API_BASE_URL = https://api.migro.es/api/v1
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_xxxxx (⚠️ LIVE KEY)
VITE_APP_URL = https://contratacion.migro.es
VITE_DEBUG_MODE = false
VITE_API_TIMEOUT = 30000
```

#### 5. Deploy a Producción
```bash
vercel --prod
```

#### 6. Configurar Dominio Personalizado

En Vercel Dashboard:
1. **Settings** → **Domains**
2. Añadir `contratacion.migro.es`
3. Configurar DNS según instrucciones de Vercel

**DNS Records:**
```
Type: CNAME
Name: contratacion
Value: cname.vercel-dns.com
```

#### 7. Deploy Automático desde Git

1. Conectar repositorio en Vercel Dashboard
2. **Settings** → **Git**
3. Cada push a `main` despliega automáticamente

### Comandos Útiles

```bash
# Deploy a producción
vercel --prod

# Ver logs
vercel logs

# Ver deployments
vercel ls

# Rollback
vercel rollback [deployment-url]

# Desplegar branch específico
vercel --prod --branch feature/new-feature
```

---

## 🔷 Opción 2: Netlify

### Ventajas
- Interfaz muy amigable
- Form handling integrado
- Netlify Functions (serverless)
- Split testing A/B

### Paso a Paso

#### 1. Instalar Netlify CLI
```bash
npm i -g netlify-cli
```

#### 2. Login
```bash
netlify login
```

#### 3. Deploy Manual

```bash
# Build primero
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

#### 4. O Conectar con Git

1. Ir a [Netlify App](https://app.netlify.com)
2. **Add new site** → **Import an existing project**
3. Conectar GitHub/GitLab/Bitbucket
4. Seleccionar repositorio

**Build Settings:**
```
Build command: npm run build
Publish directory: dist
```

#### 5. Configurar Variables de Entorno

En Netlify Dashboard:
1. **Site settings** → **Environment variables**
2. Añadir las mismas variables que Vercel

#### 6. Configurar Dominio

1. **Site settings** → **Domain management**
2. **Add custom domain**: `contratacion.migro.es`
3. Configurar DNS:

```
Type: CNAME
Name: contratacion
Value: [tu-sitio].netlify.app
```

### Comandos Útiles

```bash
# Deploy de prueba
netlify deploy

# Deploy a producción
netlify deploy --prod

# Ver logs
netlify logs

# Abrir dashboard
netlify open

# Ver status del sitio
netlify status
```

---

## 🐳 Opción 3: Docker en Servidor Propio

### Ventajas
- Control total
- Sin límites de uso
- Hosting privado

### Paso a Paso

#### 1. Build de Imagen

```bash
# Build
docker build -t migro-hiring:latest .

# Test local
docker run -p 80:80 migro-hiring:latest
```

#### 2. Push a Registry

```bash
# Tag
docker tag migro-hiring:latest registry.migro.es/migro-hiring:latest

# Push
docker push registry.migro.es/migro-hiring:latest
```

#### 3. Deploy en Servidor

En el servidor:

```bash
# Pull image
docker pull registry.migro.es/migro-hiring:latest

# Run con variables de entorno
docker run -d \
  -p 80:80 \
  -p 443:443 \
  --name migro-hiring \
  --restart unless-stopped \
  -e VITE_API_BASE_URL=https://api.migro.es/api/v1 \
  -e VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx \
  -e VITE_APP_URL=https://contratacion.migro.es \
  registry.migro.es/migro-hiring:latest
```

#### 4. Configurar Nginx Reverse Proxy (opcional)

```nginx
server {
    listen 80;
    server_name contratacion.migro.es;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name contratacion.migro.es;

    ssl_certificate /etc/letsencrypt/live/contratacion.migro.es/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/contratacion.migro.es/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 5. Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot

# Obtener certificado
sudo certbot certonly --standalone -d contratacion.migro.es

# Renovar automáticamente
sudo certbot renew --dry-run
```

---

## 🔍 Verificación Post-Deploy

### Checklist

- [ ] La aplicación carga correctamente
- [ ] El routing funciona (no hay 404 en refresh)
- [ ] Las variables de entorno están configuradas
- [ ] Stripe se conecta correctamente
- [ ] El API backend responde
- [ ] SSL/HTTPS está activo
- [ ] Los headers de seguridad están presentes
- [ ] La aplicación es responsive (mobile)
- [ ] El flujo completo funciona end-to-end

### Herramientas de Verificación

```bash
# Test de URL
curl -I https://contratacion.migro.es

# Test de headers
curl -I https://contratacion.migro.es | grep -i "content-security-policy"

# Test de SSL
openssl s_client -connect contratacion.migro.es:443 -servername contratacion.migro.es

# Lighthouse CI
npx lighthouse-ci https://contratacion.migro.es --view
```

### Métricas a Verificar

- **Lighthouse Score**: > 90
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.0s
- **Cumulative Layout Shift**: < 0.1

---

## 🔄 CI/CD Automático

### GitHub Actions

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PK }}
          VITE_APP_URL: ${{ secrets.APP_URL }}
      
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## ⚠️ Checklist de Seguridad

Antes de deploy a producción:

- [ ] Usar claves de Stripe LIVE (`pk_live_`, `sk_live_`)
- [ ] Rotar claves secretas (según `STRIPE_TESTING.md`)
- [ ] Habilitar HTTPS/SSL
- [ ] Configurar CSP headers
- [ ] Habilitar rate limiting en API
- [ ] Configurar monitoring y alertas
- [ ] Hacer backup de la configuración
- [ ] Probar en environment de staging primero
- [ ] Verificar CORS en el backend
- [ ] Revisar logs de errores

---

## 📊 Monitoring

### Sentry (Recomendado)

```bash
npm install @sentry/react @sentry/tracing
```

En `src/main.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://xxxxx@sentry.io/xxxxx",
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

---

## 🆘 Troubleshooting

### Build Fallido

```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Variables de Entorno No Funcionan

- Verificar que empiezan con `VITE_`
- Re-deploy después de cambiar variables
- Verificar que estén en el dashboard

### 404 en Refresh

- Verificar configuración de SPA routing
- En Vercel/Netlify debe haber redirect a `index.html`

---

## 📞 Soporte

Si tienes problemas con el deploy, contactar:

- **Email**: devops@migro.es
- **Slack**: #migro-deploy
- **Docs**: https://docs.migro.es/deploy

---

**Última actualización:** 23 de Octubre de 2025

