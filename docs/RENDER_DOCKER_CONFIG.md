# Configuración de Render con Docker

## Valores para Render Dashboard

### Dockerfile Path
```
./Dockerfile
```
*(Ruta relativa desde la raíz del repositorio)*

### Docker Build Context Directory
```
.
```
*(Raíz del repositorio - punto)*

### Docker Command (Opcional)
```
(Dejar vacío - el Dockerfile ya tiene CMD configurado)
```

O si necesitas sobreescribir:
```
nginx -g "daemon off;"
```

### Pre-Deploy Command (Opcional)
```
echo "Verificando build..." && test -d /usr/share/nginx/html && echo "Build OK" || echo "Build falló"
```

O simplemente dejar vacío si el Dockerfile maneja todo.

## Variables de Entorno Requeridas

Configurar en Render Dashboard:

### Build Args (durante docker build)
Estas se pasan como `--build-arg`:

- `VITE_API_BASE_URL` = `https://api.migro.es/api`
- `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_...` (configurar manualmente)
- `VITE_APP_URL` = `https://contratacion.migro.es`
- `VITE_DEBUG_MODE` = `false`
- `VITE_API_TIMEOUT` = `30000`

### Runtime Env Vars (durante ejecución)
- `PORT` = `10000` (Render lo inyecta automáticamente, pero está bien especificarlo)

## Configuración en render.yaml

Si usas render.yaml para deploy:

```yaml
services:
  - type: web
    name: migro-hiring
    dockerfilePath: ./Dockerfile
    dockerContext: .
    dockerCommand: ""  # Opcional, usar CMD del Dockerfile
    envVars:
      - key: PORT
        value: "10000"
    buildCommand: ""  # No usar si usas Docker
```

## Alternativa: Usar Build Script en Docker

Si prefieres usar el script de auto-repair dentro de Docker, el Dockerfile ya está configurado. 

El Dockerfile actual:
1. Instala dependencias con `npm ci`
2. Copia código fuente
3. Ejecuta `npm run build` (que puede usar el script de auto-repair si lo configuras)
4. Sirve con nginx

## Verificación Post-Deploy

Después del deploy:
1. Health check: `https://tu-app.onrender.com/healthz`
2. Página principal: `https://tu-app.onrender.com/`

## Notas Importantes

- ✅ El Dockerfile usa **multi-stage build** (más eficiente)
- ✅ El puerto está configurado para Render (10000)
- ✅ Nginx sirve los archivos estáticos con cache optimizado
- ✅ El entrypoint.sh maneja el puerto dinámicamente
- ✅ Build context debe ser la raíz del repo (`.`)
