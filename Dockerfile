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

# Build de producción
RUN npm run build

# ==========================================
# Stage 2: Production
# ==========================================
FROM nginx:alpine

# Copiar configuración de nginx
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
