# Conexión Docker a API Localhost

**Fecha:** 2025-01-15  
**Problema:** Docker no puede acceder a `localhost` del host  
**Estado:** ✅ SOLUCIONADO

---

## 🔍 Problema Identificado

Cuando el frontend se ejecuta dentro de un contenedor Docker, `localhost` se refiere al propio contenedor, no al host donde está corriendo la API. Esto impide que el frontend en Docker se conecte a la API que está corriendo en `localhost:3000` del host.

### Síntomas

- El frontend en Docker no puede conectarse a la API
- Errores de conexión al intentar hacer peticiones
- La URL `http://localhost:3000/api` no funciona desde dentro del contenedor

---

## ✅ Solución Implementada

### 1. Script de Inicio Automático (`docker/start-docker.ps1`)

Se creó un script PowerShell que:
- Lee las variables de entorno desde `.env`
- Convierte automáticamente `localhost` a `host.docker.internal` para Docker
- Configura las variables `DOCKER_API_BASE_URL` y `DOCKER_PILI_API_URL`
- Inicia docker-compose con la configuración correcta

**Uso:**
```powershell
.\docker\start-docker.ps1
```

### 2. Configuración en `docker-compose.yml`

Se modificó el `docker-compose.yml` para:
- Usar `DOCKER_API_BASE_URL` si está definida (generada por el script)
- Fallback a `VITE_API_BASE_URL` si no existe
- Agregar `extra_hosts` para mapear `host.docker.internal` al host

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

### 3. Conversión Automática

El script convierte:
- `http://localhost:3000/api/` → `http://host.docker.internal:3000/api/`
- `http://localhost:8001/api` → `http://host.docker.internal:8001/api`

---

## 🔧 Configuración Requerida

### Archivo `.env`

Asegúrate de que tu `.env` tenga:

```env
VITE_API_BASE_URL=http://localhost:3000/api/
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_URL=http://localhost:5173
```

### Variables Opcionales

```env
VITE_SHORT_URL_BASE=http://localhost:5173
VITE_PUBLIC_DOMAIN=localhost:5173
VITE_PILI_API_URL=http://localhost:8001/api
VITE_DEBUG_MODE=false
VITE_API_TIMEOUT=30000
```

---

## 🚀 Uso

### Iniciar el Servicio

```powershell
# Opción 1: Usar el script (recomendado)
.\docker\start-docker.ps1

# Opción 2: Manual (configurar variables primero)
$env:DOCKER_API_BASE_URL = "http://host.docker.internal:3000/api"
docker-compose --profile production up -d prod
```

### Verificar Estado

```powershell
docker-compose ps prod
docker-compose logs prod -f
```

### Detener el Servicio

```powershell
docker-compose down prod
```

---

## 📋 Flujo de Configuración

1. **Script lee `.env`** → Obtiene `VITE_API_BASE_URL=http://localhost:3000/api/`
2. **Convierte localhost** → Genera `DOCKER_API_BASE_URL=http://host.docker.internal:3000/api/`
3. **Docker Compose usa** → `DOCKER_API_BASE_URL` para el build y runtime
4. **Frontend en Docker** → Se conecta a `host.docker.internal:3000` que apunta al host

---

## 🔍 Verificación

### 1. Verificar que el contenedor está corriendo

```powershell
docker-compose ps prod
```

Debería mostrar: `Up X seconds`

### 2. Verificar logs

```powershell
docker-compose logs prod --tail 20
```

Debería mostrar logs de nginx sin errores.

### 3. Probar la conexión

Abre `http://localhost:80` en el navegador y verifica que la aplicación carga correctamente.

### 4. Verificar conexión a la API

En las DevTools del navegador, verifica que las peticiones a la API se realizan correctamente a `http://host.docker.internal:3000/api/`.

---

## ⚠️ Notas Importantes

1. **Solo funciona en desarrollo local**: `host.docker.internal` solo funciona en Docker Desktop para Windows/Mac. En Linux, puede requerir configuración adicional.

2. **La API debe estar corriendo**: Asegúrate de que la API esté corriendo en `localhost:3000` antes de iniciar Docker.

3. **Puerto 80**: El servicio Docker expone el puerto 80. Si tienes otro servicio usando ese puerto, detén el otro servicio primero.

4. **Reconstruir después de cambios**: Si cambias variables en `.env`, necesitas reconstruir la imagen:

```powershell
docker-compose down prod
.\docker\start-docker.ps1
```

---

## 🐛 Troubleshooting

### El contenedor no puede conectarse a la API

1. Verifica que la API esté corriendo: `curl http://localhost:3000/api/health` (o el endpoint de health de tu API)
2. Verifica que `host.docker.internal` esté configurado: `docker run --rm alpine ping -c 1 host.docker.internal`
3. Revisa los logs: `docker-compose logs prod`

### El script no encuentra `.env`

Asegúrate de que el archivo `.env` esté en la raíz del proyecto.

### Variables no se cargan

El script carga variables desde `.env` al proceso actual. Si necesitas que persistan, agrégalas manualmente al sistema o usa `docker-compose` con `env_file`.

---

## 📚 Referencias

- [Docker Desktop Networking](https://docs.docker.com/desktop/networking/)
- [host.docker.internal](https://docs.docker.com/desktop/networking/#i-want-to-connect-from-a-container-to-a-service-on-the-host)
