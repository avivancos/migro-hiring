# Rebuild y reinicio Docker (frontend)

## Objetivo
Forzar que el build de produccion tome los ultimos cambios del frontend.

## Accion ejecutada
- `docker compose --profile production up -d --build`

## Resultado
- Imagen reconstruida.
- Contenedor `migro-hiring-prod` en ejecucion.
