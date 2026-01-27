# Limpieza de build (2026-01-27)

## Objetivo
Eliminar artefactos de build y caches para evitar datos stale.

## Accion ejecutada
Se limpio dentro de Docker usando el servicio `dev`:
- `docker-compose run --rm dev sh -c "rm -rf dist .vite node_modules/.vite node_modules/.cache"`

## Resultado
Build y caches locales eliminados.
