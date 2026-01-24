# Servicios locales levantados con API en 3000 (2026-01-24)

## Contexto
- Solicitud: usar `3000` como puerto default de la API y levantar servicios relacionados en Docker.

## Acciones
- `docker compose -f docker-compose.local.yml up -d db app`
- Verificado con `docker compose -f docker-compose.local.yml ps`

## Estado actual
- API: `http://localhost:3000` -> contenedor `app` (puerto interno 8000).
- DB: `localhost:5432` (PostgreSQL).
