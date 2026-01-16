#!/bin/sh
set -eu

TEMPLATE="/etc/nginx/templates/default.conf.template"
TARGET="/etc/nginx/conf.d/default.conf"

# Validar puerto (solo números). Render inyecta PORT.
PORT_VALUE="${PORT:-10000}"
case "$PORT_VALUE" in
  ''|*[!0-9]*)
    echo "[entrypoint] Valor de PORT inválido: '$PORT_VALUE'" >&2
    exit 1
    ;;
esac

# Obtener URL base de la API desde variable de entorno (sin barra final)
# Si no está definida, usar valor por defecto para desarrollo
API_BASE_URL_VALUE="${VITE_API_BASE_URL:-http://localhost:8000/api}"
# Eliminar barra final si existe
API_BASE_URL_VALUE="${API_BASE_URL_VALUE%/}"

if [ ! -f "$TEMPLATE" ]; then
  echo "[entrypoint] Plantilla de nginx no encontrada: $TEMPLATE" >&2
  exit 1
fi

echo "[entrypoint] Generando config de nginx en $TARGET con PORT=$PORT_VALUE y API_BASE_URL=$API_BASE_URL_VALUE"
# Escapar caracteres especiales para sed en el contexto de reemplazo
# IMPORTANTE: El orden de escape es crítico:
# 1. Primero escapar \ (backslash) - debe ser primero porque es el carácter de escape
# 2. Luego escapar & (ampersand) - representa el texto completo coincidente en reemplazo
# 3. Luego escapar / (forward slash) - aunque usamos | como delimitador, es buena práctica
# 4. Finalmente escapar otros caracteres especiales de regex
# Usamos múltiples pasos de sed para asegurar el orden correcto de escape
API_BASE_URL_ESCAPED=$(printf '%s\n' "$API_BASE_URL_VALUE" | sed -e 's/\\/\\\\/g' -e 's/&/\\&/g' -e 's/\//\\\//g' -e 's/\[/\\[/g' -e 's/\]/\\]/g' -e 's/\./\\./g' -e 's/\*/\\*/g' -e 's/\^/\\^/g' -e 's/\$/\\$/g' -e 's/(/\\(/g' -e 's/)/\\)/g' -e 's/+/\\+/g' -e 's/?/\\?/g' -e 's/{/\\{/g' -e 's/}/\\}/g' -e 's/|/\\|/g')
# Reemplazar tanto el puerto como la URL de la API (ya escapada)
sed -e "s/__PORT__/${PORT_VALUE}/g" -e "s|__API_BASE_URL__|${API_BASE_URL_ESCAPED}|g" "$TEMPLATE" > "$TARGET"

exec "$@"
