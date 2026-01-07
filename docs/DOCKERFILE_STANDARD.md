# Dockerfile Estándar - Simplificado

## Cambios Realizados

Se simplificó el Dockerfile para que sea más estándar y directo, eliminando verificaciones innecesarias y manteniendo solo lo esencial.

## Estructura del Dockerfile

### Stage 1: Builder (Build)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build
```

**Características**:
- ✅ Usa `node:20-alpine` (imagen estándar y ligera)
- ✅ Copia dependencias primero (mejor cache de Docker)
- ✅ Usa `npm ci` para instalación reproducible
- ✅ Build estándar con `npm run build`

### Stage 2: Production (Nginx)
```dockerfile
FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Características**:
- ✅ Usa `nginx:alpine` (imagen estándar y ligera)
- ✅ Copia configuración de nginx
- ✅ Copia archivos compilados del stage builder
- ✅ Comando estándar de nginx

## Eliminaciones

Se eliminaron las siguientes partes que no son estándar:

1. ❌ `npm cache clean --force` (innecesario, npm ci ya limpia)
2. ❌ Verificaciones de TypeScript y Vite (innecesarias)
3. ❌ `rm -rf dist node_modules/.cache` (innecesario, build limpia)
4. ❌ Echo statements de verificación (innecesarios)
5. ❌ Health check en Dockerfile (se puede configurar en render.yaml si es necesario)

## Variables de Entorno

Las variables de entorno se mantienen como ARG/ENV estándar:

```dockerfile
ARG VITE_API_BASE_URL=https://api.migro.es/api
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_APP_URL=https://contratacion.migro.es
ARG VITE_DEBUG_MODE=false
ARG VITE_API_TIMEOUT=30000

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_DEBUG_MODE=$VITE_DEBUG_MODE
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT
```

## Uso

### Build Local
```bash
docker build -t migro-hiring .
```

### Build con Variables de Entorno
```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.migro.es/api \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx \
  -t migro-hiring .
```

### Run Local
```bash
docker run -p 80:80 migro-hiring
```

## Ventajas de esta Versión

1. **Más Simple**: Menos líneas, más fácil de entender
2. **Estándar**: Sigue las mejores prácticas de Docker
3. **Mantenible**: Fácil de actualizar y modificar
4. **Rápido**: Sin verificaciones innecesarias que ralentizan el build
5. **Compatible**: Funciona con cualquier plataforma (Render, Docker Hub, etc.)

## Comparación

### Antes (68 líneas)
- Verificaciones innecesarias
- Comandos de limpieza redundantes
- Echo statements de debug
- Health check en Dockerfile

### Después (42 líneas)
- Solo lo esencial
- Comandos estándar
- Sin verificaciones innecesarias
- Más fácil de mantener

## Notas

- El Dockerfile sigue siendo multi-stage para optimizar el tamaño final
- La configuración de nginx se mantiene en `docker/nginx.conf`
- Compatible con Render, Docker Hub, y otras plataformas
- Si necesitas health check, configúralo en `render.yaml` o en la plataforma de despliegue

## Fecha

${new Date().toISOString().split('T')[0]}
