# Dockerfile para Migro Hiring Frontend
# Multi-stage build para optimizar tamaño y performance

# ==========================================
# Stage 1: Builder (compilación)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias primero (para mejor cache)
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm cache clean --force && \
    npm ci --legacy-peer-deps --no-audit --no-fund

# Copiar código fuente
COPY . .

# Variables de entorno para build (pueden ser sobrescritas)
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

# Build de producción con limpieza
RUN rm -rf dist node_modules/.cache && \
    npm run build && \
    echo "✅ Build completado: $(ls -lh dist/index.html)"

# ==========================================
# Stage 2: Runner (producción con nginx)
# ==========================================
FROM nginx:alpine AS runner

# Copiar configuración custom de nginx
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]

# NOTA: Stage "development" eliminado
# Para desarrollo local, usar: npm run dev directamente
# Docker se usa solo para producción con Nginx

