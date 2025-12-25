# Errores de Endpoints del Backend - Soluciones Requeridas

**Fecha:** 2025-01-28  
**Prioridad:** 🔴 ALTA  
**Total de endpoints testeados:** 147  
**Endpoints con errores:** 143 (97.28%)  
**Endpoints exitosos:** 4 (2.72%)

---

## ⚠️ IMPORTANTE: Persistencia de Tokens

**CRÍTICO:** El frontend está configurado para **NUNCA descartar tokens** por errores de respuesta del backend. Los tokens solo se limpian cuando el refresh token está realmente inválido/expirado.

**Ver documentación completa:** `docs/TOKEN_PERSISTENCE_ON_ERRORS.md`

**Resumen:**
- ❌ Los errores 404, 422, 500, timeout, etc. **NO limpian tokens**
- ❌ Los errores 401 que NO son de autenticación (ej: permisos) **NO limpian tokens**
- ✅ Solo se limpian tokens cuando el refresh token está realmente inválido/expirado
- ✅ El backend debe usar códigos de estado correctos (401 solo para autenticación, 403 para permisos)

---

## 📊 Resumen Ejecutivo

Se han testeado **147 endpoints** del backend y se encontraron **143 errores** que requieren atención. Los errores se agrupan en las siguientes categorías:

- **401 Unauthorized:** 102 endpoints (70.07%) - Requieren autenticación
- **404 Not Found:** 33 endpoints (22.60%) - Endpoints no implementados o rutas incorrectas
- **405 Method Not Allowed:** 5 endpoints (3.42%) - Métodos HTTP no permitidos
- **422 Unprocessable Entity:** 2 endpoints (1.37%) - Errores de validación
- **400 Bad Request:** 1 endpoint (0.68%) - Error en refresh token

---

## 🔴 PRIORIDAD ALTA - Errores Críticos

### 1. Endpoints No Implementados (404)

Los siguientes endpoints devuelven **404 Not Found** y necesitan ser implementados o corregidas sus rutas:

#### CRM - Companies
- `GET /api/crm/companies` - **No implementado**
- `GET /api/crm/companies/{id}` - **No implementado**

**Solución requerida:**
```python
# Implementar endpoints de companies en el backend
@router.get("/companies")
@router.get("/companies/{company_id}")
```

#### CRM - Dashboard
- `GET /api/crm/dashboard/stats` - **No implementado**
- `GET /api/crm/dashboard/pipeline-stats` - **No implementado**

**Solución requerida:**
```python
# Implementar endpoints de dashboard
@router.get("/dashboard/stats")
@router.get("/dashboard/pipeline-stats")
```

#### Admin - Call Types
- `GET /api/admin/call-types` - **No implementado**
- `POST /api/admin/call-types` - **No implementado**
- `PATCH /api/admin/call-types/{id}` - **No implementado**
- `DELETE /api/admin/call-types/{id}` - **No implementado**

**Solución requerida:**
```python
# Implementar CRUD completo de call-types
@router.get("/admin/call-types")
@router.post("/admin/call-types")
@router.patch("/admin/call-types/{call_type_id}")
@router.delete("/admin/call-types/{call_type_id}")
```

#### CRM - Call Types
- `GET /api/crm/call-types` - **No implementado**

**Solución requerida:**
```python
# Implementar endpoint de call-types para CRM
@router.get("/crm/call-types")
```

#### Admin - Hiring List
- `GET /api/admin/hiring/list` - **No implementado**

**Solución requerida:**
```python
# Implementar endpoint para listar hiring codes
@router.get("/admin/hiring/list")
```

#### CRM - Opportunities
- `POST /api/crm/opportunities/{id}/first-call-attempt` - **No implementado**

**Solución requerida:**
```python
# Implementar endpoint para registrar intento de primera llamada
@router.post("/crm/opportunities/{opportunity_id}/first-call-attempt")
```

#### Expedientes - Archivos
- `POST /api/expedientes/{id}/archivos` - **No implementado**
- `PATCH /api/expedientes/{id}/archivos/{archivo_id}` - **No implementado**

**Solución requerida:**
```python
# Implementar endpoints de archivos de expedientes
@router.post("/expedientes/{expediente_id}/archivos")
@router.patch("/expedientes/{expediente_id}/archivos/{archivo_id}")
```

#### CRM - Pipelines
- `GET /api/crm/pipelines/{id}` - **No implementado**
- `GET /api/crm/pipelines/{id}/stages` - **No implementado**

**Solución requerida:**
```python
# Implementar endpoints de pipelines
@router.get("/crm/pipelines/{pipeline_id}")
@router.get("/crm/pipelines/{pipeline_id}/stages")
```

#### CRM - Tasks, Notes, Calls (por ID)
- `GET /api/crm/tasks/{id}` - **No implementado**
- `PUT /api/crm/tasks/{id}` - **No implementado**
- `DELETE /api/crm/tasks/{id}` - **No implementado**
- `GET /api/crm/notes/{id}` - **No implementado**
- `PUT /api/crm/notes/{id}` - **No implementado**
- `DELETE /api/crm/notes/{id}` - **No implementado**
- `GET /api/crm/calls/{id}` - **No implementado**
- `PUT /api/crm/calls/{id}` - **No implementado**
- `DELETE /api/crm/calls/{id}` - **No implementado**

**Solución requerida:**
```python
# Implementar endpoints de detalle, actualización y eliminación
@router.get("/crm/tasks/{task_id}")
@router.put("/crm/tasks/{task_id}")
@router.delete("/crm/tasks/{task_id}")

@router.get("/crm/notes/{note_id}")
@router.put("/crm/notes/{note_id}")
@router.delete("/crm/notes/{note_id}")

@router.get("/crm/calls/{call_id}")
@router.put("/crm/calls/{call_id}")
@router.delete("/crm/calls/{call_id}")
```

#### CRM - Users
- `GET /api/crm/users/{id}` - **No implementado**

**Solución requerida:**
```python
# Implementar endpoint de detalle de usuario CRM
@router.get("/crm/users/{user_id}")
```

---

### 2. Métodos HTTP No Permitidos (405)

Los siguientes endpoints devuelven **405 Method Not Allowed** y requieren que se permita el método HTTP correcto:

#### POST /users/
- **Endpoint:** `POST /api/users/`
- **Error:** Method Not Allowed
- **Solución:** Permitir método POST en el router de usuarios

```python
# Actualizar router para permitir POST
@router.post("/users/")  # Asegurar que existe
```

#### GET /crm/task-templates/{id}
- **Endpoint:** `GET /api/crm/task-templates/{id}`
- **Error:** Method Not Allowed
- **Solución:** Implementar método GET para obtener template por ID

```python
@router.get("/crm/task-templates/{template_id}")
```

#### DELETE /crm/task-templates/{id}
- **Endpoint:** `DELETE /api/crm/task-templates/{id}`
- **Error:** Method Not Allowed
- **Solución:** Permitir método DELETE

```python
@router.delete("/crm/task-templates/{template_id}")
```

#### PATCH /crm/opportunities/{id}
- **Endpoint:** `PATCH /api/crm/opportunities/{id}`
- **Error:** Method Not Allowed
- **Solución:** Permitir método PATCH (o cambiar a PUT si es el método esperado)

```python
@router.patch("/crm/opportunities/{opportunity_id}")
# O si se usa PUT:
@router.put("/crm/opportunities/{opportunity_id}")
```

#### GET /conversations/{id}/export
- **Endpoint:** `GET /api/conversations/{id}/export?format=json`
- **Error:** Method Not Allowed
- **Solución:** Permitir método GET o cambiar a POST según la implementación

```python
# Opción 1: Permitir GET
@router.get("/conversations/{conversation_id}/export")

# Opción 2: Si debe ser POST, actualizar frontend
@router.post("/conversations/{conversation_id}/export")
```

---

### 3. Errores de Validación (422)

Los siguientes endpoints devuelven **422 Unprocessable Entity** por campos requeridos faltantes:

#### POST /admin/contracts/
- **Endpoint:** `POST /api/admin/contracts/`
- **Error:** Campo `contract_template` es requerido
- **Request enviado:**
```json
{
  "service_name": "Test",
  "amount": 10000
}
```
- **Solución:** Hacer el campo `contract_template` opcional o proporcionar un valor por defecto

```python
# Opción 1: Hacer opcional
class ContractCreateRequest(BaseModel):
    service_name: str
    amount: int
    contract_template: Optional[str] = None  # Hacer opcional

# Opción 2: Proporcionar valor por defecto en el backend
if not request.contract_template:
    request.contract_template = "default_template"
```

#### POST /admin/hiring/create
- **Endpoint:** `POST /api/admin/hiring/create`
- **Error:** Campo `contract_template` es requerido
- **Request enviado:**
```json
{
  "service_name": "Test",
  "amount": 10000
}
```
- **Solución:** Misma que arriba - hacer `contract_template` opcional o con valor por defecto

---

## 🟡 PRIORIDAD MEDIA - Autenticación

### 4. Endpoints que Requieren Autenticación (401)

**102 endpoints** devuelven **401 Unauthorized** porque requieren autenticación JWT. Esto es **esperado** para endpoints protegidos, pero se debe verificar que:

1. ✅ Los endpoints públicos NO requieren autenticación
2. ✅ Los endpoints protegidos SÍ requieren autenticación y funcionan correctamente con token válido

#### Endpoints Públicos (NO deberían requerir autenticación)

Estos endpoints deberían ser públicos según el frontend:

- `GET /api/hiring/{code}` - **Debería ser público**
- `POST /api/hiring/{code}/confirm-data` - **Debería ser público**
- `GET /api/hiring/{code}/contract/download` - **Debería ser público**
- `GET /api/hiring/{code}/final-contract/download` - **Debería ser público**

**Solución:** Verificar que estos endpoints estén marcados como públicos en el router:

```python
# Asegurar que estos endpoints NO requieren autenticación
@router.get("/hiring/{code}", dependencies=[Depends(PublicEndpoint)])
@router.post("/hiring/{code}/confirm-data", dependencies=[Depends(PublicEndpoint)])
@router.get("/hiring/{code}/contract/download", dependencies=[Depends(PublicEndpoint)])
@router.get("/hiring/{code}/final-contract/download", dependencies=[Depends(PublicEndpoint)])
```

#### Endpoints Protegidos (SÍ requieren autenticación - Comportamiento esperado)

Los siguientes endpoints **correctamente** requieren autenticación:

**Users:**
- `GET /api/users/me`
- `GET /api/users/`
- `GET /api/users/{id}`
- `PATCH /api/users/{id}`
- `DELETE /api/users/{id}`
- `PATCH /api/users/{id}/role`
- `PATCH /api/users/{id}/status`
- `POST /api/users/{id}/reset-password`
- `PATCH /api/users/{id}/password`
- `POST /api/users/{id}/impersonate`
- `GET /api/users/export`
- `GET /api/users/audit-logs`
- `POST /api/users/me/photo-avatar`

**CRM - Leads:**
- `GET /api/crm/leads`
- `GET /api/crm/leads/count`
- `GET /api/crm/leads/{id}`
- `GET /api/crm/leads/new`
- `POST /api/crm/leads`
- `PUT /api/crm/leads/{id}`
- `DELETE /api/crm/leads/{id}`
- `POST /api/crm/leads/{id}/convert`
- `POST /api/crm/leads/{id}/mark-initial-contact-completed`

**CRM - Contacts:**
- `GET /api/crm/contacts`
- `GET /api/crm/contacts/count`
- `GET /api/crm/contacts/{id}`
- `POST /api/crm/contacts`
- `PUT /api/crm/contacts/{id}`
- `DELETE /api/crm/contacts/{id}`
- `GET /api/crm/contacts/{id}/leads`
- `GET /api/crm/contacts/{id}/tasks`
- `GET /api/crm/contacts/{id}/calls`
- `GET /api/crm/contacts/{id}/notes`

**CRM - Tasks:**
- `GET /api/crm/tasks`
- `GET /api/crm/tasks/calendar`
- `POST /api/crm/tasks`
- `PUT /api/crm/tasks/{id}/complete`

**CRM - Notes:**
- `GET /api/crm/notes`
- `POST /api/crm/notes`

**CRM - Calls:**
- `GET /api/crm/calls`
- `GET /api/crm/calls/calendar`
- `POST /api/crm/calls`

**CRM - Pipelines:**
- `GET /api/crm/pipelines`

**CRM - Task Templates:**
- `GET /api/crm/task-templates`
- `POST /api/crm/task-templates`
- `PUT /api/crm/task-templates/{id}`
- `PUT /api/crm/task-templates/order`

**CRM - Custom Fields:**
- `GET /api/crm/custom-fields`
- `GET /api/crm/custom-fields/{id}`
- `POST /api/crm/custom-fields`
- `PUT /api/crm/custom-fields/{id}`
- `DELETE /api/crm/custom-fields/{id}`

**CRM - Custom Field Values:**
- `GET /api/crm/custom-field-values`
- `POST /api/crm/custom-field-values`
- `PUT /api/crm/custom-field-values/{id}`
- `DELETE /api/crm/custom-field-values/{id}`

**CRM - Opportunities:**
- `GET /api/crm/opportunities`
- `GET /api/crm/opportunities/{id}`
- `POST /api/crm/opportunities/{id}/assign`

**CRM - Wizard:**
- `POST /api/crm/calls/{id}/wizard/start`
- `GET /api/crm/calls/{id}/wizard`
- `GET /api/crm/calls/{id}/wizard/next-step`
- `GET /api/crm/calls/{id}/wizard/guidance`
- `POST /api/crm/calls/{id}/wizard/step`
- `POST /api/crm/calls/{id}/wizard/complete`
- `POST /api/crm/calls/{id}/wizard/pause`
- `POST /api/crm/calls/{id}/wizard/resume`

**Pipelines:**
- `GET /api/pipelines/stages/{entity_type}/{entity_id}`
- `POST /api/pipelines/stages`
- `PATCH /api/pipelines/stages/{stage_id}/next-action`
- `GET /api/pipelines/stages/{entity_type}/{entity_id}/status`
- `POST /api/pipelines/actions`
- `GET /api/pipelines/actions/{entity_type}/{entity_id}`
- `POST /api/pipelines/actions/{action_id}/validate`
- `GET /api/pipelines/action-types`
- `POST /api/pipelines/calls/{call_id}/analyze`
- `GET /api/pipelines/calls/{call_id}/next-action`

**Expedientes:**
- `POST /api/expedientes/`
- `GET /api/expedientes/{id}`
- `GET /api/expedientes/user/{user_id}`
- `PUT /api/expedientes/{id}`
- `DELETE /api/expedientes/{id}`
- `GET /api/expedientes/`
- `POST /api/expedientes/{id}/seleccionar-formulario`
- `GET /api/expedientes/{id}/completitud`
- `GET /api/expedientes/{id}/checklist`
- `GET /api/expedientes/{id}/historial`
- `POST /api/expedientes/{id}/cambiar-estado`
- `GET /api/expedientes/{id}/estadisticas`
- `GET /api/expedientes/buscar`

**Conversations:**
- `GET /api/conversations/`
- `GET /api/conversations/{id}`
- `POST /api/conversations/`
- `PUT /api/conversations/{id}`
- `POST /api/conversations/{id}/messages`
- `POST /api/conversations/{id}/read`
- `DELETE /api/conversations/{id}`
- `GET /api/conversations/admin/all`
- `GET /api/conversations/{id}/messages`
- `DELETE /api/conversations/{id}/messages/{message_id}`
- `PATCH /api/conversations/{id}/assign-lawyer`

**CRM - Users:**
- `GET /api/crm/users`

**Nota:** Estos endpoints están funcionando correctamente al requerir autenticación. El error 401 es esperado cuando no se envía un token válido.

---

## 🟢 PRIORIDAD BAJA - Errores Menores

### 5. Error en Refresh Token (400)

#### POST /auth/refresh
- **Endpoint:** `POST /api/auth/refresh`
- **Error:** 400 Bad Request - "Invalid refresh token"
- **Causa:** Se envió un token de prueba inválido
- **Solución:** Este error es esperado con un token inválido. Verificar que el endpoint funcione correctamente con tokens válidos.

---

## ✅ Endpoints Funcionando Correctamente

Los siguientes endpoints están funcionando correctamente:

1. ✅ `GET /api/admin/contracts/` - 200 OK
2. ✅ `GET /api/pili/health` - 200 OK (Servicio externo)
3. ✅ `POST /api/pili/chat` - 200 OK (Servicio externo)
4. ✅ `POST /api/pili/chat/messages` - 200 OK (Servicio externo)

---

## 📋 Checklist de Soluciones

### Implementaciones Requeridas

- [ ] Implementar `GET /api/crm/companies`
- [ ] Implementar `GET /api/crm/companies/{id}`
- [ ] Implementar `GET /api/crm/dashboard/stats`
- [ ] Implementar `GET /api/crm/dashboard/pipeline-stats`
- [ ] Implementar CRUD completo de `/api/admin/call-types`
- [ ] Implementar `GET /api/crm/call-types`
- [ ] Implementar `GET /api/admin/hiring/list`
- [ ] Implementar `POST /api/crm/opportunities/{id}/first-call-attempt`
- [ ] Implementar endpoints de archivos de expedientes
- [ ] Implementar `GET /api/crm/pipelines/{id}`
- [ ] Implementar `GET /api/crm/pipelines/{id}/stages`
- [ ] Implementar endpoints de detalle/actualización/eliminación de tasks, notes, calls
- [ ] Implementar `GET /api/crm/users/{id}`

### Correcciones de Métodos HTTP

- [ ] Permitir `POST /api/users/`
- [ ] Permitir `GET /api/crm/task-templates/{id}`
- [ ] Permitir `DELETE /api/crm/task-templates/{id}`
- [ ] Permitir `PATCH /api/crm/opportunities/{id}` (o cambiar frontend a PUT)
- [ ] Permitir `GET /api/conversations/{id}/export` (o cambiar frontend a POST)

### Correcciones de Validación

- [ ] Hacer `contract_template` opcional en `POST /api/admin/contracts/`
- [ ] Hacer `contract_template` opcional en `POST /api/admin/hiring/create`

### Verificaciones de Autenticación

- [ ] Verificar que endpoints de `/hiring/*` sean públicos
- [ ] Verificar que todos los demás endpoints protegidos funcionen con token válido

---

## 🔧 Instrucciones de Implementación

### Para Endpoints No Implementados

1. **Crear el router/endpoint en el backend:**
```python
@router.get("/crm/companies")
async def get_companies(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    # Implementar lógica
    pass
```

2. **Asegurar que el endpoint esté registrado en el router principal:**
```python
app.include_router(crm_router, prefix="/crm", tags=["CRM"])
```

3. **Verificar que el endpoint responda con el formato esperado:**
```python
# Para listas, devolver formato paginado:
{
    "items": [...],
    "total": 100,
    "skip": 0,
    "limit": 20
}
```

### Para Métodos HTTP No Permitidos

1. **Verificar el método HTTP en el router:**
```python
# Si el frontend usa PATCH pero el backend espera PUT:
@router.put("/crm/opportunities/{id}")  # Cambiar de PATCH a PUT
# O actualizar el frontend para usar PUT
```

2. **Asegurar que el método esté permitido en CORS:**
```python
# En configuración de CORS
allowed_methods = ["GET", "POST", "PUT", "PATCH", "DELETE"]
```

### Para Errores de Validación

1. **Hacer campos opcionales si no son críticos:**
```python
class ContractCreateRequest(BaseModel):
    service_name: str
    amount: int
    contract_template: Optional[str] = None  # Opcional
```

2. **Proporcionar valores por defecto en el backend:**
```python
if not request.contract_template:
    request.contract_template = "default_template_id"
```

---

## 📝 Notas Importantes

1. **Autenticación:** La mayoría de los errores 401 son esperados ya que los endpoints requieren autenticación. El problema real es cuando endpoints que deberían ser públicos (como `/hiring/*`) requieren autenticación.

2. **404 vs 401:** Los errores 404 indican que el endpoint no existe o la ruta es incorrecta. Los errores 401 indican que el endpoint existe pero requiere autenticación.

3. **Métodos HTTP:** Algunos endpoints pueden requerir un método HTTP diferente al que el frontend está usando. Verificar la documentación de la API o ajustar el método en el frontend.

4. **Validación:** Los errores 422 indican que el backend está validando correctamente, pero el frontend no está enviando todos los campos requeridos. Se debe hacer el campo opcional o el frontend debe enviarlo siempre.

---

## 🚀 Próximos Pasos

1. **Prioridad 1:** Implementar endpoints que devuelven 404
2. **Prioridad 2:** Corregir métodos HTTP (405)
3. **Prioridad 3:** Ajustar validaciones (422)
4. **Prioridad 4:** Verificar autenticación de endpoints públicos

---

## 🔐 IMPORTANTE: Persistencia de Tokens en Errores

### Política de Tokens

El frontend está configurado para **NUNCA descartar tokens** por errores de respuesta del backend. Los tokens solo se limpian cuando el refresh token está realmente inválido/expirado.

**Ver documentación completa:** `docs/TOKEN_PERSISTENCE_ON_ERRORS.md`

### Comportamiento del Frontend

- ❌ **Errores 404, 422, 500, timeout, etc.** → **NO limpian tokens**
- ❌ **Errores 401 que NO son de autenticación** (ej: permisos) → **NO limpian tokens**
- ✅ **Solo se limpian tokens** cuando el refresh token está realmente inválido/expirado

### Requisitos para el Backend

1. **Usar códigos de estado correctos:**
   - `401` → Solo para errores de autenticación (token expirado/inválido)
   - `403` → Para errores de permisos (usuario autenticado pero sin acceso)
   - `404` → Para recursos no encontrados
   - `422` → Para errores de validación
   - `500+` → Para errores del servidor

2. **Endpoint `/auth/refresh` debe responder claramente:**
   - Si el refresh token es inválido → `400/401` con mensaje que incluya "token" o "invalid"
   - Si es error temporal → `500` o timeout (NO limpiar tokens en frontend)

3. **Endpoints públicos NO deben requerir autenticación:**
   - `/api/hiring/*` → Deben ser públicos

---

**Última actualización:** 2025-01-28  
**Reporte generado por:** Script de testing automático  
**Base URL testada:** `https://api.migro.es/api`

