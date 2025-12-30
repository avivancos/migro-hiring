# Instrucciones para Gestión del Backend

**Fecha:** 2025-01-28  
**Propósito:** Instrucciones para otro agente sobre cómo gestionar respuestas y errores del backend

---

## 📋 Contexto

El frontend está completamente funcional y sin errores de build. Ahora se requiere verificar y gestionar la integración con el backend, incluyendo:

1. Verificación de endpoints del backend
2. Manejo de respuestas del backend
3. Corrección de errores de integración
4. Validación de CORS y autenticación

---

## 🔧 Configuración del Backend

### URL Base de la API

**Producción:**
```
https://api.migro.es/api
```

**Desarrollo:**
```
http://localhost:8000/api
```

**Configuración:** `src/config/constants.ts`
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.migro.es/api';
```

**Variable de entorno:** `VITE_API_BASE_URL` (opcional, sobrescribe default)

---

## 📡 Endpoints Principales

### 1. Endpoints Públicos (Sin autenticación)

```
GET  /api/hiring/{code}                      # Obtener detalles de contratación
POST /api/hiring/{code}/confirm-data         # Confirmar datos
POST /api/hiring/{code}/contract/accept      # Aceptar contrato
POST /api/hiring/{code}/kyc/start            # Iniciar KYC
POST /api/hiring/{code}/kyc/complete         # Completar KYC
POST /api/hiring/{code}/payment              # Procesar pago
GET  /api/hiring/{code}/contract/download    # Descargar contrato
```

### 2. Endpoints de Autenticación

```
POST /api/auth/login                         # Login
POST /api/auth/register                      # Registro
POST /api/auth/refresh                       # Refresh token
```

### 3. Endpoints de Administración (Requieren JWT)

```
POST /api/admin/hiring/create                # Crear código de contratación
GET  /api/admin/hiring/list                  # Listar códigos
GET  /api/admin/users                        # Listar usuarios
GET  /api/admin/contracts                    # Listar contratos
... (muchos más)
```

### 4. Endpoints de CRM (Requieren JWT)

```
GET  /api/crm/contacts                       # Listar contactos
POST /api/crm/contacts                      # Crear contacto
GET  /api/crm/contacts/{id}                 # Detalle de contacto
PUT  /api/crm/contacts/{id}                  # Actualizar contacto
... (muchos más)
```

### 5. Endpoint de Pili (Servicio externo)

```
GET  /api/pili/health                        # Health check
POST /api/pili/chat                          # Chat básico
POST /api/pili/chat/messages                 # Chat con mensajes múltiples
```

**URL Base de Pili:**
- Producción: `https://pili.migro.es/api`
- Desarrollo: `http://localhost:8001/api`

---

## 🔍 Verificaciones Necesarias

### 1. Verificar CORS

**Problemas comunes:**
- CORS bloqueando requests desde el frontend
- Headers CORS incorrectos
- Métodos HTTP no permitidos

**Cómo verificar:**
```bash
# Desde el frontend, verificar en Network tab del navegador
# Buscar errores CORS en la consola
```

**Solución esperada:**
- Backend debe permitir origen del frontend
- Headers: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, etc.

---

### 2. Verificar Autenticación JWT

**Problemas comunes:**
- Token expirado
- Token inválido
- Token no enviado en headers

**Cómo verificar:**
```typescript
// Verificar en src/services/api.ts
// El interceptor debería agregar el token automáticamente
```

**Headers esperados:**
```
Authorization: Bearer {token}
```

---

### 3. Verificar Timeouts

**Configuración actual:**
```typescript
export const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000; // 30 segundos
```

**Problemas comunes:**
- Timeout muy corto para operaciones largas
- Backend no responde en tiempo esperado

**Solución:**
- Ajustar timeout según necesidad
- Verificar que el backend responda en tiempo razonable

---

### 4. Verificar Manejo de Errores

**Códigos de error comunes:**
- `400` - Bad Request (validación)
- `401` - Unauthorized (token inválido/expirado)
- `403` - Forbidden (sin permisos)
- `404` - Not Found
- `422` - Unprocessable Entity (validación de datos)
- `500` - Internal Server Error

**Manejo actual:**
- Ver `src/services/api.ts` - Interceptores de respuesta
- Ver `src/utils/errorHandler.ts` - Utilidades de manejo de errores

---

## 🐛 Errores Comunes y Soluciones

### Error 1: CORS bloqueando requests

**Síntoma:**
```
Access to fetch at 'https://api.migro.es/api/...' from origin 'https://contratacion.migro.es' 
has been blocked by CORS policy
```

**Solución:**
- Verificar configuración CORS en el backend
- Agregar origen del frontend a allowed origins
- Verificar headers CORS en respuesta del backend

---

### Error 2: Token expirado

**Síntoma:**
```
401 Unauthorized
```

**Solución:**
- El frontend debería refrescar el token automáticamente
- Verificar que el endpoint `/api/auth/refresh` funcione
- Verificar lógica de refresh en `src/services/api.ts`

---

### Error 3: Timeout

**Síntoma:**
```
timeout of 30000ms exceeded
```

**Solución:**
- Aumentar timeout si la operación es legítimamente larga
- Verificar que el backend responda en tiempo razonable
- Considerar operaciones asíncronas para procesos largos

---

### Error 4: 422 Validation Error

**Síntoma:**
```
422 Unprocessable Entity
{
  "detail": [
    {
      "loc": ["body", "field"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Solución:**
- Verificar que el frontend envíe todos los campos requeridos
- Validar datos antes de enviar al backend
- Mostrar errores de validación al usuario

---

## 🧪 Testing de Integración

### 1. Test de Health Check

```bash
# Verificar que el backend responda
curl https://api.migro.es/api/health
```

### 2. Test de Endpoint Público

```bash
# Test de endpoint público de contratación
curl https://api.migro.es/api/hiring/{code}
```

### 3. Test de Autenticación

```bash
# Login
curl -X POST https://api.migro.es/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'
```

### 4. Test de Endpoint Protegido

```bash
# Con token JWT
curl https://api.migro.es/api/admin/users \
  -H "Authorization: Bearer {token}"
```

---

## 📝 Checklist de Verificación

- [ ] Backend responde a health check
- [ ] CORS configurado correctamente
- [ ] Endpoints públicos funcionan sin autenticación
- [ ] Endpoints protegidos requieren JWT válido
- [ ] Refresh token funciona correctamente
- [ ] Manejo de errores muestra mensajes claros
- [ ] Timeouts configurados apropiadamente
- [ ] Validación de datos funciona correctamente
- [ ] Respuestas del backend tienen formato esperado
- [ ] Integración con Pili funciona (si aplica)

---

## 🔄 Flujo de Trabajo Recomendado

1. **Verificar estado del backend:**
   - Health check
   - Verificar logs del backend
   - Verificar configuración de CORS

2. **Probar endpoints críticos:**
   - Login/autenticación
   - Endpoints públicos principales
   - Endpoints protegidos principales

3. **Identificar errores:**
   - Revisar Network tab del navegador
   - Revisar logs del backend
   - Revisar errores en consola del frontend

4. **Corregir errores:**
   - Ajustar configuración del backend si es necesario
   - Ajustar manejo de errores en el frontend si es necesario
   - Documentar cambios realizados

5. **Validar correcciones:**
   - Probar nuevamente endpoints afectados
   - Verificar que no se rompieron otras funcionalidades
   - Documentar soluciones

---

## 📚 Archivos Relevantes del Frontend

### Configuración
- `src/config/constants.ts` - URLs y constantes
- `src/services/api.ts` - Instancia de axios e interceptores
- `src/utils/errorHandler.ts` - Manejo de errores
- `src/utils/jwt.ts` - Utilidades JWT
- `src/utils/tokenStorage.ts` - Almacenamiento de tokens

### Servicios
- `src/services/adminService.ts` - Servicios de administración
- `src/services/crmService.ts` - Servicios de CRM
- `src/services/contractsService.ts` - Servicios de contratos
- `src/services/hiringService.ts` - Servicios de contratación
- `src/services/piliService.ts` - Servicios de Pili

### Controladores
- `src/controllers/authController.ts` - Controlador de autenticación

---

## 🚨 Prioridades

1. **Alta:** Endpoints críticos de contratación (`/api/hiring/*`)
2. **Alta:** Autenticación y autorización
3. **Media:** Endpoints de CRM
4. **Media:** Endpoints de administración
5. **Baja:** Endpoints de Pili (servicio externo)

---

## 📞 Información de Contacto/Referencia

- Documentación de API: Ver documentación del backend
- Logs del backend: Verificar logs del servidor
- Configuración: Ver archivos de configuración del backend

---

**Última actualización:** 2025-01-28








