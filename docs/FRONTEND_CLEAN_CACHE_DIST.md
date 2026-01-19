# Limpieza de cache y dist

## Objetivo
Eliminar artefactos locales de build y caches para evitar datos stale.

## Accion ejecutada
- Se elimino `dist` y caches de Vite/Node usando Docker:
  - `dist`
  - `.vite`
  - `node_modules/.vite`
  - `node_modules/.cache`

## Nota
La limpieza se ejecuto dentro de un contenedor con volumen montado al repo.
