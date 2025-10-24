# Dockerfile para Migro Hiring Frontend
# Multi-stage build para optimizar tamaño y performance

# ==========================================
# Stage 1: Dependencies (instalación)
# ==========================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# ==========================================
# Stage 2: Builder (compilación)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Variables de entorno para build (pueden ser sobrescritas)
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ARG VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
ARG VITE_APP_URL=http://localhost:5173

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_APP_URL=$VITE_APP_URL

# Build de producción
RUN npm run build

# ==========================================
# Stage 3: Runner (producción con nginx)
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

# ==========================================
# Stage: Development (para desarrollo local)
# ==========================================
FROM node:20-alpine AS development

WORKDIR /app

# Instalar dependencias de desarrollo
RUN apk add --no-cache git

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar todas las dependencias (incluidas dev)
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Exponer puerto de Vite
EXPOSE 5173

# Comando de desarrollo con hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

