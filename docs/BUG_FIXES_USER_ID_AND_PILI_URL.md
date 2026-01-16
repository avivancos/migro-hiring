# Corrección de Bugs: Comparación de IDs y URL de Pili

**Fecha:** 2026-01-15  
**Estado:** ✅ SOLUCIONADO

---

## 🐛 Bugs Identificados y Corregidos

### Bug 1: Comparación Case-Insensitive de IDs de Usuario

**Ubicación:** `src/pages/CRMContactDetail.tsx` (múltiples ubicaciones)

**Problema:**
Varias funciones estaban convirtiendo IDs a lowercase antes de comparar. Esto ocurría en 4 lugares diferentes:

1. **Línea 247-253:** Función `getUserName`
2. **Línea 891-894:** Expansión manual de `assigned_to` al actualizar oportunidad
3. **Línea 919-921:** Comparación de `assigned_to_id` con usuario actual
4. **Línea 1134-1135:** Comparación para mostrar botón de auto-asignación

Ejemplo del problema:
```typescript
const normalizedUserId = String(userId).trim().toLowerCase();
const user = users.find(u => {
  const normalizedUId = String(u.id).trim().toLowerCase();
  return normalizedUId === normalizedUserId;
});
```

**Impacto:**
- Los IDs de usuario son típicamente case-sensitive
- Convertirlos a lowercase puede causar que IDs diferentes sean tratados como iguales
- Esto puede llevar a que usuarios sean emparejados con registros incorrectos
- Ejemplo: `"User123"` y `"user123"` serían tratados como el mismo usuario

**Solución:**
Se eliminó la conversión a lowercase en todos los lugares, manteniendo solo el trim para eliminar espacios en blanco. Todos los casos ahora usan comparación case-sensitive:

```typescript
// Normalizar IDs para comparación (solo trim, mantener case-sensitive)
// Los IDs de usuario son case-sensitive, no deben convertirse a lowercase
const normalizedUserId = String(userId).trim();
const user = users.find(u => {
  const normalizedUId = String(u.id).trim();
  return normalizedUId === normalizedUserId;
});
```

**Lugares corregidos:**
- `getUserName()` - Línea 247-253
- Expansión manual de `assigned_to` - Línea 891-894
- Comparación para auto-asignación - Línea 919-921
- Botón de auto-asignación - Línea 1134-1135

**Resultado:**
- Los IDs ahora se comparan de forma case-sensitive
- Se mantiene la normalización de espacios en blanco con trim
- Se evita el emparejamiento incorrecto de usuarios

---

### Bug 2: Conversión Incorrecta de localhost a host.docker.internal para Pili

**Ubicación:** `docker/start-docker.ps1:53-60` y `docker-compose.yml:31`

**Problema:**
El script estaba convirtiendo `localhost` a `host.docker.internal` para `VITE_PILI_API_URL`:
```powershell
$dockerPiliUrl = $env:VITE_PILI_API_URL -replace 'localhost', 'host.docker.internal'
$env:DOCKER_PILI_API_URL = $dockerPiliUrl
```

Y en `docker-compose.yml` se usaba `DOCKER_PILI_API_URL`:
```yaml
- VITE_PILI_API_URL=${DOCKER_PILI_API_URL:-${VITE_PILI_API_URL:-http://localhost:8001/api}}
```

**Impacto:**
- `VITE_PILI_API_URL` se embebe en el JavaScript del frontend durante el build
- El JavaScript se ejecuta en el **navegador del usuario** (fuera de Docker)
- El navegador no puede resolver `host.docker.internal` (solo los contenedores Docker pueden)
- Esto causa que las conexiones del frontend a Pili fallen con errores de red:
  ```
  ERR_CONNECTION_REFUSED
  POST http://host.docker.internal:8001/api/pili/chat net::ERR_CONNECTION_REFUSED
  ```

**Causa Raíz:**
Este es el mismo problema que se corrigió anteriormente para `VITE_API_BASE_URL` (ver `docs/DOCKER_API_URL_BROWSER_FIX.md`). Las URLs que se usan en el navegador deben mantener `localhost`, no convertirse a `host.docker.internal`.

**Solución:**

1. **En `docker/start-docker.ps1`:**
   - Eliminada la conversión de `localhost` a `host.docker.internal`
   - Eliminada la variable `DOCKER_PILI_API_URL`
   - Agregados comentarios explicativos sobre por qué no se debe convertir

```powershell
# IMPORTANTE: NO convertir localhost a host.docker.internal para VITE_PILI_API_URL
# porque esta URL se usa en el navegador del usuario (fuera de Docker), no dentro del contenedor
# El navegador necesita usar localhost:8001 que está mapeado desde el host
# Solo se convierte para variables que se usan DENTRO del contenedor
if (-not $env:VITE_PILI_API_URL) {
    # Si no está definida, usar un valor por defecto para desarrollo
    $env:VITE_PILI_API_URL = "http://localhost:8001/api"
    Write-Host "🔧 VITE_PILI_API_URL no definida, usando valor por defecto: $env:VITE_PILI_API_URL" -ForegroundColor Yellow
} else {
    Write-Host "🔧 URL de Pili (usada por el navegador): $env:VITE_PILI_API_URL" -ForegroundColor Green
    Write-Host "ℹ️  NOTA: El navegador usa localhost porque corre fuera de Docker" -ForegroundColor Yellow
}
```

2. **En `docker-compose.yml`:**
   - Eliminada la referencia a `DOCKER_PILI_API_URL`
   - Usa directamente `VITE_PILI_API_URL` sin conversión

```yaml
# IMPORTANTE: VITE_PILI_API_URL se usa en el navegador, no dentro del contenedor
# Por lo tanto, NO debe usar DOCKER_PILI_API_URL (que sería host.docker.internal)
# El navegador necesita usar localhost:8001 que está mapeado desde el host
- VITE_PILI_API_URL=${VITE_PILI_API_URL:-http://localhost:8001/api}
```

**Resultado:**
- El frontend ahora puede conectarse correctamente a la API de Pili
- Las peticiones desde el navegador usan `localhost:8001` que está mapeado desde el host
- Se evitan errores de conexión `ERR_CONNECTION_REFUSED`

---

## 📋 Diferencias: Navegador vs Contenedor

### URLs para el Navegador (JavaScript del frontend)

Estas URLs se embeben durante el build y se ejecutan en el navegador del usuario:

- **VITE_API_BASE_URL**: `http://localhost:8000/api` (o `https://api.migro.es/api` en producción)
- **VITE_PILI_API_URL**: `http://localhost:8001/api` (o `https://pili.migro.es/api` en producción)

**Regla:** Estas URLs deben usar `localhost` cuando se ejecutan en desarrollo local, porque el navegador corre en el host, no dentro del contenedor.

### URLs para el Contenedor (scripts dentro del contenedor)

Si un script dentro del contenedor necesita conectarse al host, debe usar `host.docker.internal`:

- Ejemplo: Un script de backup que corre dentro del contenedor y necesita conectarse a un servicio en el host

**Regla:** Solo se usa `host.docker.internal` para scripts que se ejecutan **dentro** del contenedor, no para código JavaScript que se ejecuta en el navegador.

---

## 🔧 Verificación

### Verificar Bug 1 (Comparación de IDs)

1. Abrir `src/pages/CRMContactDetail.tsx`
2. Verificar que la función `getUserName` no usa `.toLowerCase()`
3. Verificar que los IDs se comparan de forma case-sensitive

### Verificar Bug 2 (URL de Pili)

1. **Verificar el script:**
   ```powershell
   Get-Content docker/start-docker.ps1 | Select-String -Pattern "PILI"
   ```
   Debe mostrar que NO se convierte `localhost` a `host.docker.internal`

2. **Verificar docker-compose.yml:**
   ```powershell
   Get-Content docker-compose.yml | Select-String -Pattern "PILI"
   ```
   No debe contener `DOCKER_PILI_API_URL`

3. **Reconstruir el contenedor:**
   ```powershell
   docker-compose --profile production down prod
   .\docker\start-docker.ps1
   ```

4. **Verificar en el navegador:**
   - Abrir `http://localhost:80` en el navegador
   - Abrir DevTools → Console
   - Verificar que las peticiones a Pili usan `http://localhost:8001/api` (no `host.docker.internal`)

---

## 📚 Referencias

- [Documentación Docker: Networking](https://docs.docker.com/network/)
- [host.docker.internal](https://docs.docker.com/desktop/networking/#i-want-to-connect-from-a-container-to-a-service-on-the-host)
- [DOCKER_API_URL_BROWSER_FIX.md](./DOCKER_API_URL_BROWSER_FIX.md) - Corrección similar para la API principal

---

## ✅ Checklist de Verificación

- [x] Bug 1: Eliminada conversión a lowercase en comparación de IDs
- [x] Bug 2: Eliminada conversión de localhost a host.docker.internal para Pili
- [x] Actualizado `docker-compose.yml` para no usar `DOCKER_PILI_API_URL`
- [x] Agregados comentarios explicativos en el código
- [x] Documentación creada

---

**Estado:** ✅ **Bugs corregidos**  
**Última actualización:** 15 de Enero de 2026  
**Versión:** 1.0.0
