# Corrección: URL de API para Navegador en Docker

**Fecha:** 2026-01-15  
**Problema:** El frontend en Docker no puede conectarse a la API  
**Estado:** ✅ SOLUCIONADO

---

## 🔍 Problema Identificado

El frontend compilado en Docker no podía conectarse a la API con el error:
```
ERR_CONNECTION_TIMED_OUT
POST http://host.docker.internal:3000/api/auth/login net::ERR_CONNECTION_TIMED_OUT
```

### Causa Raíz

El script `docker/start-docker.ps1` estaba convirtiendo automáticamente `localhost` a `host.docker.internal` para `VITE_API_BASE_URL`, pero esta URL se usa en el **navegador del usuario** (fuera de Docker), no dentro del contenedor.

**Problema:**
- `host.docker.internal` solo existe dentro de la red de Docker
- El navegador del usuario (que corre en el host) no puede resolver `host.docker.internal`
- Esto causa un `ERR_CONNECTION_TIMED_OUT`

---

## ✅ Solución Implementada

### Corrección en `docker/start-docker.ps1`

Se modificó el script para que **NO convierta** `localhost` a `host.docker.internal` para `VITE_API_BASE_URL`, porque esta URL se usa en el navegador, no dentro del contenedor.

**Antes:**
```powershell
# Convertir localhost a host.docker.internal para Docker
$dockerApiUrl = $apiBaseUrl -replace 'localhost', 'host.docker.internal'
$env:DOCKER_API_BASE_URL = $dockerApiUrl
```

**Después:**
```powershell
# IMPORTANTE: NO convertir localhost a host.docker.internal para VITE_API_BASE_URL
# porque esta URL se usa en el navegador del usuario (fuera de Docker), no dentro del contenedor
# El navegador necesita usar localhost:3000 que está mapeado desde el host
$env:DOCKER_API_BASE_URL = $apiBaseUrl
```

---

## 🔧 Configuración Correcta

### Variables de Entorno

El archivo `.env` debe tener:
```env
VITE_API_BASE_URL=http://localhost:3000/api/
```

### Flujo de Configuración

1. **Script lee `.env`** → `VITE_API_BASE_URL=http://localhost:3000/api/`
2. **Script mantiene `localhost`** → `DOCKER_API_BASE_URL=http://localhost:3000/api/`
3. **Build de Docker usa** → `DOCKER_API_BASE_URL` para compilar el frontend
4. **Frontend compilado tiene** → `http://localhost:3000/api/` embebido en el código JS
5. **Navegador del usuario** → Se conecta a `localhost:3000` (que está mapeado desde el host)

---

## 🚀 Uso

### Reconstruir el Contenedor

Después de corregir el script, es necesario reconstruir el contenedor:

```powershell
# Detener el contenedor actual
docker-compose --profile production down prod

# Reconstruir con la configuración correcta
.\docker\start-docker.ps1
```

### Verificar la Configuración

1. **Verificar que el contenedor está corriendo:**
   ```powershell
   docker ps | Select-String "migro-hiring-prod"
   ```

2. **Verificar logs del entrypoint:**
   ```powershell
   docker logs migro-hiring-prod --tail 20 | Select-String "API|PORT"
   ```

3. **Verificar que el navegador puede conectarse:**
   - Abrir `http://localhost:80` en el navegador
   - Abrir DevTools → Console
   - Verificar que las peticiones a la API usan `http://localhost:3000/api/` (no `host.docker.internal`)

---

## 📋 Diferencias: Navegador vs Contenedor

### URLs para el Navegador (JavaScript del frontend)

- **VITE_API_BASE_URL**: Usa `localhost:3000` porque el navegador corre en el host
- **VITE_PILI_API_URL**: Puede usar `localhost:8001` (si Pili corre en el host)

### URLs para el Contenedor (scripts dentro del contenedor)

- Si un script dentro del contenedor necesita conectarse al host, debe usar `host.docker.internal:3000`
- Esto solo aplica a scripts que se ejecutan **dentro** del contenedor, no al código JavaScript que se ejecuta en el navegador

---

## ⚠️ Notas Importantes

1. **Build Time vs Runtime:**
   - `VITE_API_BASE_URL` se inyecta durante el **build** del frontend
   - Cambiar esta variable requiere **reconstruir** el contenedor (no solo reiniciarlo)

2. **Puerto 3000 del Host:**
   - El backend debe estar corriendo en `localhost:3000` del host
   - Este puerto está mapeado desde Docker: `0.0.0.0:3000->8000/tcp`

3. **Navegador vs Contenedor:**
   - El **navegador** del usuario corre en el host → usa `localhost:3000`
   - Los **scripts dentro del contenedor** → usan `host.docker.internal:3000`

---

## 🐛 Troubleshooting

### El frontend todavía usa `host.docker.internal`

**Síntoma:** En las DevTools del navegador, las peticiones van a `http://host.docker.internal:3000/api/`

**Solución:**
1. Detener el contenedor: `docker-compose --profile production down prod`
2. Eliminar la imagen: `docker rmi migro-hiring-prod` (opcional, para forzar rebuild)
3. Reconstruir: `.\docker\start-docker.ps1`

### La API no responde desde el navegador

**Verificar:**
1. ¿Está el backend corriendo? `curl http://localhost:3000/api/health`
2. ¿Está el puerto 3000 escuchando? `netstat -ano | Select-String ":3000"`
3. ¿Hay problemas de CORS? Verificar headers en Network tab de DevTools

---

## 📚 Referencias

- [Documentación Docker: Networking](https://docs.docker.com/network/)
- [host.docker.internal](https://docs.docker.com/desktop/networking/#i-want-to-connect-from-a-container-to-a-service-on-the-host)
- [Vite: Variables de Entorno](https://vitejs.dev/guide/env-and-mode.html)

---

**Estado:** ✅ **Problema solucionado**  
**Última actualización:** 15 de Enero de 2026  
**Versión:** 1.0.0
