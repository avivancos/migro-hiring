# Render - Web Service con Docker (Nginx + Vite dist)

Guía para desplegar `migro-hiring` en Render usando el `Dockerfile` (Web Service, runtime Docker) sirviendo el build de Vite con Nginx y healthcheck `/healthz`.

## Archivos clave
- `Dockerfile`: build multi-stage (`node:20-alpine` → `nginx:alpine`), expone `PORT` dinámico (default `10000`).
- `docker/nginx.conf.template`: plantilla con `listen __PORT__`, fallback SPA y `/healthz` → `200 ok`.
- `docker/entrypoint.sh`: genera la conf final (`/etc/nginx/conf.d/default.conf`) inyectando `PORT` y ejecuta `nginx -g 'daemon off;'`.

## Configuración en Render (Web Service - Docker)
- `runtime: docker` (Render detecta el Dockerfile en la raíz).
- Health check path: `/healthz`.
- `PORT` lo inyecta Render automáticamente (10000); el entrypoint lo aplica en Nginx.
- Variables necesarias (se usan en build de Vite):
  - `VITE_API_BASE_URL=https://api.migro.es/api`
  - `VITE_APP_URL=https://contratacion.migro.es`
  - `VITE_STRIPE_PUBLISHABLE_KEY` (secreto)
  - `VITE_DEBUG_MODE=false`
  - `VITE_API_TIMEOUT=30000`
  - `NODE_VERSION=20` (opcional si quieres fijarlo también en el servicio)

> Render expone las env vars durante el build Docker, por lo que Vite recibe los valores en `npm run build`.

## Build y prueba local con Docker
```bash
# Build de imagen (usa defaults seguros para VITE_*)
docker build -t migro-hiring:render .

# Ejecutar imagen (mapea 8080 -> PORT interno 10000)
docker run --rm -p 8080:10000 \
  -e PORT=10000 \
  -e VITE_API_BASE_URL=https://api.migro.es/api \
  -e VITE_APP_URL=https://contratacion.migro.es \
  -e VITE_STRIPE_PUBLISHABLE_KEY=dummy_key \
  -e VITE_DEBUG_MODE=false \
  -e VITE_API_TIMEOUT=30000 \
  migro-hiring:render

# Verificar healthcheck
curl -f http://localhost:8080/healthz
```

## Detalles de la imagen
- Stage `builder`: `npm ci --legacy-peer-deps` + `npm run build` (usa env `VITE_*`).
- Stage `runtime`:
  - Copia `dist/` a `/usr/share/nginx/html`.
  - Genera conf desde `docker/nginx.conf.template` usando `PORT` (default `10000`).
  - `EXPOSE 10000`.

## Notas y troubleshooting
- Si `PORT` no es numérico, el entrypoint falla explícitamente (log en stderr) para evitar config inválida.
- `Content-Security-Policy` permite Stripe (`js.stripe.com` / `verify.stripe.com`).
- SPA routing: `try_files $uri $uri/ /index.html;` mantiene rutas internas.
- Healthcheck es `/healthz` (no `/health`); ajusta el servicio en Render si antes usabas otro path.
