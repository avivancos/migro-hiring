# 🔍 Diagnóstico Completo de Endpoints - Guía de Uso

**Fecha:** 2025-01-17  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen

Se ha creado un diagnóstico **MUY COMPLETO** que verifica **~135+ endpoints** usados en el frontend:

### Scripts Disponibles

1. **`scripts/diagnose-backend.sh`** - Diagnóstico básico (3 endpoints críticos)
   - Health check
   - Login
   - Refresh token

2. **`scripts/diagnose-backend-complete.sh`** - Diagnóstico completo (135+ endpoints) ⭐
   - TODOS los endpoints del CRM
   - TODOS los endpoints de Admin
   - TODOS los endpoints de Auth
   - TODOS los endpoints de Hiring
   - TODOS los endpoints de Expedientes
   - TODOS los endpoints de Pipelines
   - TODOS los endpoints de Conversations
   - TODOS los endpoints de Agent Journal

---

## 🚀 Uso del Diagnóstico Completo

### Ejecutar Todas las Categorías

```bash
# Verificar TODOS los endpoints (~135+)
DIAGNOSTIC_MODE=all ./scripts/diagnose-backend-complete.sh
```

### Ejecutar Categorías Específicas

```bash
# Solo CRM
DIAGNOSTIC_MODE=crm ./scripts/diagnose-backend-complete.sh

# Solo Admin
DIAGNOSTIC_MODE=admin ./scripts/diagnose-backend-complete.sh

# Solo Expedientes
DIAGNOSTIC_MODE=expedientes ./scripts/diagnose-backend-complete.sh

# Solo Pipelines
DIAGNOSTIC_MODE=pipelines ./scripts/diagnose-backend-complete.sh
```

### Con URL Personalizada

```bash
VITE_API_BASE_URL=https://api.migro.es/api DIAGNOSTIC_MODE=all ./scripts/diagnose-backend-complete.sh
```

---

## 📊 Endpoints Verificados por Categoría

### ✅ CRM (~80+ endpoints)

| Categoría | Endpoints | Estado |
|-----------|-----------|--------|
| **Leads** | 9 endpoints | ✅ Incluidos |
| **Contacts** | 10 endpoints | ✅ Incluidos |
| **Companies** | 5 endpoints | ✅ Incluidos |
| **Tasks** | 6 endpoints | ✅ Incluidos |
| **Notes** | 3 endpoints | ✅ Incluidos |
| **Calls** | 4 endpoints | ✅ Incluidos |
| **Pipelines** | 3 endpoints | ✅ Incluidos |
| **Task Templates** | 5 endpoints | ✅ Incluidos |
| **Custom Fields** | 5 endpoints | ✅ Incluidos |
| **Custom Field Values** | 4 endpoints | ✅ Incluidos |
| **Opportunities** | 6 endpoints | ✅ Incluidos |
| **Dashboard** | 2 endpoints | ✅ Incluidos |
| **Call Types** | 1 endpoint | ✅ Incluido |
| **Wizard** | 8 endpoints | ✅ Incluidos |

### ✅ Admin (~25+ endpoints)

| Categoría | Endpoints | Estado |
|-----------|-----------|--------|
| **Users** | 13 endpoints | ✅ Incluidos |
| **Hiring** | 2 endpoints | ✅ Incluidos |
| **Call Types** | 4 endpoints | ✅ Incluidos |

### ✅ Otros (~30+ endpoints)

| Categoría | Endpoints | Estado |
|-----------|-----------|--------|
| **Auth** | 4 endpoints | ✅ Incluidos |
| **Hiring (Público)** | 4 endpoints | ✅ Incluidos |
| **Expedientes** | 14 endpoints | ✅ Incluidos |
| **Pipelines** | 12 endpoints | ✅ Incluidos |
| **Conversations** | 2 endpoints | ✅ Incluidos |
| **Agent Journal** | 5 endpoints | ✅ Incluidos |

**TOTAL: ~135+ endpoints verificados** ✅

---

## 🔍 Cómo Funciona el Diagnóstico

### Lógica de Verificación

El diagnóstico verifica que cada endpoint:

1. **Responde** (no hay timeout o error de conexión)
2. **NO devuelve 500** (error crítico del servidor)
3. **Devuelve códigos apropiados** para endpoints protegidos:
   - `401` o `403` si requiere autenticación (OK)
   - `404` si no existe (OK, puede ser normal)
   - `422` si hay error de validación (OK para tests)

### Códigos de Error Detectados

- **500 Internal Server Error** → ❌ CRÍTICO (problema en el backend)
- **000 Timeout/Connection Error** → ❌ CRÍTICO (backend no accesible)
- **401/403/404/422** → ✅ OK (endpoint existe y maneja errores correctamente)

---

## 📝 Reportes Generados

### Archivos Generados

1. **`backend-error-report-complete-YYYYMMDD-HHMMSS.json`**
   - Reporte JSON estructurado con todos los errores
   - Incluye detalles de cada endpoint con problema
   - Incluye sugerencias específicas por código de error

2. **`backend-error-report-complete-YYYYMMDD-HHMMSS.txt`** (si jq está disponible)
   - Reporte legible en texto plano
   - Formato fácil de leer
   - Incluye sugerencias para el equipo de backend

### Contenido del Reporte

```json
{
  "timestamp": "2025-01-17T15:30:00Z",
  "api_base_url": "https://api.migro.es/api",
  "mode": "all",
  "summary": {
    "total_checked": 135,
    "total_errors": 2,
    "total_warnings": 5,
    "passed": 128,
    "failed": 2
  },
  "endpoints": {
    "/api/crm/leads": {
      "status_code": 500,
      "expected_status": "401|403|404|422",
      "description": "Listar leads",
      "response_body": "{...}",
      "timestamp": "..."
    }
  },
  "suggestions": [...]
}
```

---

## 🔧 Integración en CI/CD

### Usar en GitHub Actions

El script completo está diseñado para ejecutarse en CI/CD:

```yaml
- name: Diagnóstico completo del backend
  run: |
    chmod +x scripts/diagnose-backend-complete.sh
    DIAGNOSTIC_MODE=all ./scripts/diagnose-backend-complete.sh
  env:
    VITE_API_BASE_URL: https://api.migro.es/api
  continue-on-error: true  # No fallar el CI si hay errores
  
- name: Subir reportes
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: backend-diagnosis-complete
    path: backend-error-report-complete-*.json
```

### Tiempo Estimado

- **Modo rápido** (solo auth): ~5 segundos
- **Modo completo** (todos los endpoints): ~2-5 minutos (dependiendo de latencia)

---

## 📊 Interpretación de Resultados

### Si Todos los Endpoints Pasan ✅

```
Total de endpoints verificados: 135
✅ Pasaron: 135
❌ Fallaron: 0
⚠️  Advertencias: 0
```

**Significado:** Todos los endpoints responden correctamente. El backend está funcionando bien.

---

### Si Hay Errores 500 ❌

```
Total de endpoints verificados: 135
✅ Pasaron: 130
❌ Fallaron: 5
⚠️  Advertencias: 2
```

**Significado:** 5 endpoints devuelven error 500. Esto indica:
- Problemas con la base de datos
- Endpoints no implementados correctamente
- Errores en el código del backend

**Acción:** Revisar el reporte JSON para ver qué endpoints fallan y seguir las sugerencias.

---

### Si Hay Errores 404 ⚠️

```
⚠️  Endpoint: /api/crm/new-endpoint - Status: 404
```

**Significado:** El endpoint no existe. Esto puede ser normal si:
- El endpoint aún no está implementado
- La ruta es incorrecta
- El endpoint fue eliminado

**Acción:** Verificar si el endpoint debería existir según la documentación.

---

## 🎯 Ejemplos de Uso

### Ejemplo 1: Diagnóstico Rápido

```bash
# Solo verificar endpoints críticos
./scripts/diagnose-backend.sh
```

### Ejemplo 2: Diagnóstico Completo de CRM

```bash
# Verificar solo endpoints de CRM
DIAGNOSTIC_MODE=crm ./scripts/diagnose-backend-complete.sh
```

### Ejemplo 3: Diagnóstico Completo de Todo

```bash
# Verificar TODOS los endpoints
DIAGNOSTIC_MODE=all ./scripts/diagnose-backend-complete.sh
```

### Ejemplo 4: Con Variables de Entorno

```bash
# Diagnóstico completo con URL personalizada
VITE_API_BASE_URL=http://localhost:3000/api \
DIAGNOSTIC_MODE=all \
./scripts/diagnose-backend-complete.sh
```

---

## 💡 Recomendaciones

1. **En CI/CD:** Usar modo `all` para detectar problemas antes del deploy
2. **En desarrollo local:** Usar modo `crm` o `admin` para verificar módulos específicos
3. **En staging:** Ejecutar diagnóstico completo antes de producción
4. **Después de cambios del backend:** Ejecutar diagnóstico completo para verificar compatibilidad

---

## 📚 Archivos Relacionados

- `scripts/diagnose-backend.sh` - Diagnóstico básico
- `scripts/diagnose-backend-complete.sh` - Diagnóstico completo ⭐
- `scripts/diagnose-backend.ps1` - Versión PowerShell (básico)
- `docs/ENDPOINTS_INVENTARIO_COMPLETO.md` - Inventario completo de endpoints
- `docs/DIAGNOSTICO_ERROR_AUTH_LOCAL.md` - Guía de diagnóstico de errores

---

**Última actualización:** 2025-01-17
