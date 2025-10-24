#!/bin/sh
# Script para inicializar variables de entorno

set -e

echo "🔧 Inicializando variables de entorno..."

# Crear .env.local si no existe
if [ ! -f .env.local ]; then
    echo "📝 Creando .env.local desde .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local creado"
else
    echo "✅ .env.local ya existe"
fi

# Verificar variables requeridas
if [ -z "$VITE_API_BASE_URL" ]; then
    echo "⚠️  VITE_API_BASE_URL no está configurada, usando default"
fi

if [ -z "$VITE_STRIPE_PUBLISHABLE_KEY" ]; then
    echo "⚠️  VITE_STRIPE_PUBLISHABLE_KEY no está configurada"
fi

echo "✅ Inicialización completa"

