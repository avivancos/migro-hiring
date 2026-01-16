# Dockerfile estándar para aplicación Vite + React
# Multi-stage build: builder + nginx

# ==========================================
# Stage 1: Build
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .

# Variables de entorno para build
# NOTA: Estas variables DEBEN ser proporcionadas en el build
# No hay valores por defecto para evitar hardcodes
ARG VITE_API_BASE_URL
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_APP_URL
ARG VITE_SHORT_URL_BASE
ARG VITE_PUBLIC_DOMAIN
ARG VITE_PILI_API_URL
ARG VITE_DEBUG_MODE=false
ARG VITE_API_TIMEOUT=30000

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_SHORT_URL_BASE=$VITE_SHORT_URL_BASE
ENV VITE_PUBLIC_DOMAIN=$VITE_PUBLIC_DOMAIN
ENV VITE_PILI_API_URL=$VITE_PILI_API_URL
ENV VITE_DEBUG_MODE=$VITE_DEBUG_MODE
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT

# Build de producción con auto-repair si hay scripts disponibles
# Ejecutar scripts de auto-repair primero (opcional, no fallan si no existen)
RUN node scripts/remove-unused-imports.js 2>/dev/null || true && \
    node scripts/fix-icon-references.js 2>/dev/null || true && \
    node scripts/fix-icon-names.js 2>/dev/null || true && \
    node scripts/fix-imports-and-references.js 2>/dev/null || true && \
    node scripts/fix-missing-icon-imports.js 2>/dev/null || true && \
    node scripts/fix-final-errors.js 2>/dev/null || true && \
    npm run build

# ==========================================
# Stage 2: Production
# ==========================================
FROM nginx:alpine

# Puerto por defecto para Render (se puede sobreescribir con PORT)
ENV PORT=10000

# Variable de entorno para el CSP de nginx (se pasa desde docker-compose)
# El entrypoint.sh la usará para reemplazar __API_BASE_URL__ en la plantilla
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copiar configuración de nginx (plantilla) y entrypoint
RUN mkdir -p /etc/nginx/templates
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copiar archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 10000

# Entrypoint genera la conf con el puerto actual y lanza nginx
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
