# Frontend y API: puertos locales correctos

## Contexto
Se reporto que la API no responde en `http://localhost:5173`. Ese puerto corresponde al **frontend en modo desarrollo** (Vite), no a la API.

## Puertos correctos
- **API local (backend)**: `http://localhost:3000` (contenedor `migrofast-app-1`, puerto interno `8000`).
- **DB local**: `localhost:5432` (contenedor `migrofast-db-1`).
- **Frontend produccion**: `http://localhost:80` (contenedor `migro-hiring-prod`).
- **Frontend dev**: `http://localhost:5173` (Vite) si se levanta en ese puerto.
  - En este entorno hay un dev server en `5174` (contenedor `kind_pike`).

## Configuracion frontend
El frontend usa `VITE_API_BASE_URL` para apuntar a la API. En Docker se inyecta en build/entorno via `docker-compose.yml`.
El valor recomendado para local:

```
VITE_API_BASE_URL=http://localhost:3000/api
```

## Nota
Si se intenta consultar la API en `5173`, fallara porque no es el backend. Si se necesita proxy desde Vite, hay que configurarlo en `vite.config.ts`.
