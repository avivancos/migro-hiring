# Frontend Docker: verificacion y reinicio del contenedor

## Contexto
Se reporto que el contenedor Docker del frontend no estaba corriendo. En este repo el frontend en Docker corresponde al servicio `prod` definido en `docker-compose.yml`, con nombre de contenedor `migro-hiring-prod`.

## Verificacion realizada
- `docker ps -a` para ver contenedores y estados.
- `docker compose --profile production ps` para confirmar el servicio `prod`.
- `docker logs --tail 80 migro-hiring-prod` para revisar que nginx estuviera activo.

## Accion aplicada
Se recreo y levanto el contenedor de produccion:

```bash
docker compose --profile production up -d
```

Resultado esperado:
- `migro-hiring-prod` queda **Up** y escuchando en `http://localhost:80`.
- Build de nginx activo (log de entrypoint y workers iniciados).

## Nota sobre contenedor huerfano
Al levantar el compose, se detecto un contenedor huerfano `migro-hiring-dev`. El servicio de desarrollo fue eliminado del `docker-compose.yml`. Si se requiere limpieza:

```bash
docker compose --profile production up -d --remove-orphans
```

## Estado
Frontend Docker **operativo** en `migro-hiring-prod`.
