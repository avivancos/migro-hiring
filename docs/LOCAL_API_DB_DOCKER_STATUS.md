# Verificacion de contenedores locales API y DB

## Contexto
Se solicito confirmar si la DB y la API locales estaban levantadas en Docker.

## Verificacion realizada
Se reviso el estado con:
```
docker ps -a
```

## Estado observado
- API: `migrofast-app-1` **Up** (health: starting) en `http://localhost:3000`
- DB: `migrofast-db-1` **Up** (healthy) en `localhost:5432`
- Sidecar: `migrofast-telnyx-sidecar-1` **Up**

## Nota
Un `401` en `/auth/login` indica que la API respondio, pero las credenciales no fueron aceptadas.
