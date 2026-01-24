# Frontend dev en Docker con hot reload (5173)

## Contexto
Se solicito levantar el frontend en modo desarrollo con hot reload en el puerto 5173, usando Docker.

## Cambios aplicados
Se agrego el servicio `dev` en `docker-compose.yml` con:
- Imagen `node:20-alpine`
- Volumen del codigo (`.:/app`) y `node_modules` persistente
- Puerto `5173:5173`
- Variables `VITE_*` con defaults locales

## Comando ejecutado
```bash
docker compose up -d dev
```

## Resultado esperado
- Frontend disponible en `http://localhost:5173`
- Hot reload activo con polling (configurado en `vite.config.ts`)

## Notas
Si el puerto 5173 estuviera ocupado, ajustar el mapeo en `docker-compose.yml`.
