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

if [ ! -f "$TEMPLATE" ]; then
  echo "[entrypoint] Plantilla de nginx no encontrada: $TEMPLATE" >&2
  exit 1
fi

echo "[entrypoint] Generando config de nginx en $TARGET con PORT=$PORT_VALUE"
sed "s/__PORT__/${PORT_VALUE}/g" "$TEMPLATE" > "$TARGET"

exec "$@"
