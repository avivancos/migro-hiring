# 🔍 Diagnóstico Automático del Backend en CI/CD

**Fecha:** 2025-01-17  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen

Se ha integrado un sistema automático de diagnóstico del backend en el pipeline de CI/CD que:

1. ✅ Verifica la salud del backend automáticamente
2. ✅ Detecta errores en endpoints críticos (auth/login, auth/refresh, health)
3. ✅ Genera reportes estructurados con sugerencias específicas
4. ✅ Proporciona recomendaciones basadas en códigos de error HTTP

---

## 🔄 Workflows Integrados

### 1. Workflow Principal: `.github/workflows/ci.yml`

**Job:** `backend-diagnosis` (opcional)

- Se ejecuta automáticamente en cada push/PR
- **No falla el CI completo** si el backend no está disponible (`continue-on-error: true`)
- Genera reportes JSON y TXT con errores detectados
- Sube artefactos con los reportes

**Cuándo se ejecuta:**
- Push a `main` o `develop`
- Pull Requests a `main` o `develop`

---

### 2. Workflow Dedicado: `.github/workflows/backend-diagnosis.yml`

**Job:** `diagnose`

Ejecuta diagnóstico completo del backend con:

- ✅ Verificación de health check
- ✅ Verificación de endpoint de login
- ✅ Verificación de endpoint de refresh token
- ✅ Generación de reportes detallados

**Triggers:**
- **Manual** (`workflow_dispatch`) - Permite especificar URL de API
- **Programado** - Diariamente a las 2:00 AM UTC
- **Push** - Cuando cambian archivos relacionados con diagnóstico

**Características:**
- Publica reportes en GitHub Actions Summary si hay errores
- Comenta en PRs si detecta problemas críticos
- Almacena reportes por 30 días

---

## 📊 Formato de Reportes

### Reporte JSON (`backend-error-report-YYYYMMDD-HHMMSS.json`)

```json
{
  "timestamp": "2025-01-17T15:30:00Z",
  "api_base_url": "https://api.migro.es/api",
  "summary": {
    "total_errors": 1,
    "total_warnings": 0
  },
  "endpoints": {
    "https://api.migro.es/api/auth/refresh": {
      "status_code": 500,
      "expected_status": "400|401",
      "description": "Refresh token endpoint",
      "response_body": "{\"detail\": \"Internal server error\"}",
      "timestamp": "2025-01-17T15:30:00Z"
    }
  },
  "suggestions": [
    {
      "code": 500,
      "endpoint": "https://api.migro.es/api/auth/refresh",
      "severity": "critical",
      "title": "Error Interno del Servidor",
      "description": "...",
      "suggestions": [...],
      "backend_checks": [...],
      "common_causes": [...]
    }
  ]
}
```

### Reporte Legible (`backend-error-report-YYYYMMDD-HHMMSS.txt`)

Incluye:
- Resumen de errores
- Detalles de endpoints con problemas
- Sugerencias específicas para cada código de error
- Lista de verificaciones para el equipo de backend

---

## 💡 Sugerencias por Código de Error

El sistema genera sugerencias automáticas basadas en el código HTTP:

### 401 Unauthorized
- Verificar autenticación JWT
- Revisar configuración de JWT_SECRET
- Comprobar que el usuario existe y está activo

### 403 Forbidden
- Verificar permisos del usuario
- Revisar roles en la base de datos
- Comprobar decoradores de autorización

### 404 Not Found
- Verificar que la ruta existe
- Comprobar registro de rutas en el router
- Revisar prefijos de API

### 422 Unprocessable Entity
- Revisar schemas de validación
- Verificar campos requeridos
- Comprobar formatos de datos

### 500 Internal Server Error ⚠️ CRÍTICO
- Revisar logs del backend inmediatamente
- Verificar conexión a base de datos
- Comprobar variables de entorno
- Ejecutar migraciones si faltan
- Verificar que las tablas existen

**Causas comunes:**
- `socket.gaierror: Name or service not known` → Problema de conexión a BD
- `relation "users" does not exist` → Tabla faltante en BD
- Variable de entorno faltante o incorrecta

### 502/503/504 Service Unavailable
- Verificar que el backend está corriendo
- Revisar recursos del servidor
- Comprobar configuración del proxy/load balancer

---

## 🔧 Scripts de Diagnóstico

### `scripts/diagnose-backend.sh`

Script principal de diagnóstico para Linux/Unix/CI.

**Uso:**
```bash
./scripts/diagnose-backend.sh
```

**Variables de entorno:**
- `VITE_API_BASE_URL` - URL base de la API (default: `http://localhost:3000/api`)
- `BACKEND_ERROR_REPORT` - Nombre del archivo de reporte (opcional)

**Genera:**
- Reporte JSON con errores detectados
- Reporte TXT legible con sugerencias
- Exit code 1 si hay errores, 0 si todo está bien

---

### `scripts/diagnose-backend.ps1`

Script de diagnóstico para PowerShell/Windows.

**Uso:**
```powershell
.\scripts\diagnose-backend.ps1
```

Funcionalidad equivalente al script bash.

---

### `scripts/generate-backend-report.sh`

Utilidades para generar reportes (usado internamente por `diagnose-backend.sh`).

---

## 📦 Artefactos Generados

En cada ejecución de CI/CD, se generan los siguientes artefactos:

| Artefacto | Descripción | Retención |
|-----------|-------------|-----------|
| `backend-diagnosis-results` | Reportes JSON y TXT completos | 30 días |
| GitHub Actions Summary | Resumen publicado si hay errores | Siempre visible |

---

## 🔍 Cómo Interpretar los Reportes

### Si el Reporte Muestra Errores:

1. **Revisar la sección "SUGERENCIAS":**
   - Cada error incluye sugerencias específicas
   - Sigue las "Verificaciones del Backend" en orden
   - Revisa "Causas Comunes" para problemas conocidos

2. **Revisar Logs del Backend:**
   ```bash
   docker-compose logs --tail=100 backend | grep -i error
   ```

3. **Verificar Conexión a Base de Datos:**
   ```bash
   docker-compose exec backend python -c "from app.database import engine; engine.connect()"
   ```

4. **Consultar Documentación:**
   - `docs/DIAGNOSTICO_ERROR_AUTH_LOCAL.md` - Guía completa de diagnóstico
   - Logs de errores específicos en el reporte

---

## 🚀 Ejecutar Diagnóstico Manualmente

### En CI/CD (GitHub Actions):

1. Ir a **Actions** → **Backend Diagnosis**
2. Click en **Run workflow**
3. Opcionalmente especificar URL de API
4. Revisar resultados en la pestaña de artefactos

### Localmente:

```bash
# Linux/Mac
./scripts/diagnose-backend.sh

# Windows
.\scripts\diagnose-backend.ps1

# Con URL personalizada
VITE_API_BASE_URL=https://api.ejemplo.com/api ./scripts/diagnose-backend.sh
```

---

## 📝 Integración con Backend

### Para el Equipo de Backend:

Cuando recibáis un reporte con errores:

1. **Revisar el código de error HTTP:**
   - 500 → Problema crítico, revisar logs inmediatamente
   - 401/403 → Problema de autenticación/autorización
   - 404 → Endpoint no encontrado o ruta incorrecta

2. **Seguir las sugerencias del reporte:**
   - Cada código tiene sugerencias específicas
   - Las "Verificaciones del Backend" son comandos que podéis ejecutar

3. **Revisar las "Causas Comunes":**
   - Lista de problemas conocidos con soluciones

4. **Consultar logs completos:**
   - Los reportes incluyen timestamps para correlacionar con logs

---

## 🔄 Próximas Mejoras

- [ ] Agregar más endpoints al diagnóstico
- [ ] Integrar con sistema de alertas (Slack, email)
- [ ] Agregar métricas históricas de salud del backend
- [ ] Dashboard de estado del backend
- [ ] Diagnóstico de performance (tiempos de respuesta)

---

## 📚 Documentación Relacionada

- [Diagnóstico Local de Errores](./DIAGNOSTICO_ERROR_AUTH_LOCAL.md)
- [Requisitos Backend - Tokens](./BACKEND_TOKEN_PERSISTENCE_REQUIREMENTS.md)
- [Integración Backend](./BACKEND_CRM_INTEGRATION.md)

---

**Última actualización:** 2025-01-17
