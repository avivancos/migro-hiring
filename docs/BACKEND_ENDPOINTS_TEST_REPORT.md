# Reporte de Tests de Endpoints del Backend

**Fecha:** 24/12/2025, 15:33:27  
**Timestamp:** 2025-12-24T18:33:27.882Z  
**API Base URL:** https://api.migro.es/api  
**Pili API Base URL:** https://pili.migro.es/api

---

## 📊 Resumen

- **Total de endpoints testeados:** 147
- **✅ Exitosos:** 4
- **❌ Con errores:** 143
- **Tasa de éxito:** 2.72%

---

## ❌ Endpoints con Errores

### 400 (1 endpoint)

#### POST /auth/refresh

- **Método:** POST
- **URL:** `https://api.migro.es/api/auth/refresh`
- **Código de estado:** 400
- **Duración:** 224ms
- **Error:** Request failed with status code 400
- **Respuesta del servidor:**

```json
{
  "detail": "Invalid refresh token"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

### 401 (102 endpoints)

#### POST /auth/login

- **Método:** POST
- **URL:** `https://api.migro.es/api/auth/login`
- **Código de estado:** 401
- **Duración:** 304ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Incorrect email or password"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /users/me

- **Método:** GET
- **URL:** `https://api.migro.es/api/users/me`
- **Código de estado:** 401
- **Duración:** 544ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /users/

- **Método:** GET
- **URL:** `https://api.migro.es/api/users/`
- **Código de estado:** 401
- **Duración:** 217ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /users/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/users/1`
- **Código de estado:** 401
- **Duración:** 221ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PATCH /users/{id}

- **Método:** PATCH
- **URL:** `https://api.migro.es/api/users/1`
- **Código de estado:** 401
- **Duración:** 220ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /users/{id}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/users/999999`
- **Código de estado:** 401
- **Duración:** 212ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PATCH /users/{id}/role

- **Método:** PATCH
- **URL:** `https://api.migro.es/api/users/1/role`
- **Código de estado:** 401
- **Duración:** 223ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PATCH /users/{id}/status

- **Método:** PATCH
- **URL:** `https://api.migro.es/api/users/1/status`
- **Código de estado:** 401
- **Duración:** 224ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /users/{id}/reset-password

- **Método:** POST
- **URL:** `https://api.migro.es/api/users/1/reset-password`
- **Código de estado:** 401
- **Duración:** 245ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PATCH /users/{id}/password

- **Método:** PATCH
- **URL:** `https://api.migro.es/api/users/1/password`
- **Código de estado:** 401
- **Duración:** 243ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /users/{id}/impersonate

- **Método:** POST
- **URL:** `https://api.migro.es/api/users/1/impersonate`
- **Código de estado:** 401
- **Duración:** 226ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /users/export

- **Método:** GET
- **URL:** `https://api.migro.es/api/users/export`
- **Código de estado:** 401
- **Duración:** 224ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /users/audit-logs

- **Método:** GET
- **URL:** `https://api.migro.es/api/users/audit-logs`
- **Código de estado:** 401
- **Duración:** 218ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /users/me/photo-avatar

- **Método:** POST
- **URL:** `https://api.migro.es/api/users/me/photo-avatar`
- **Código de estado:** 401
- **Duración:** 247ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/leads

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/leads`
- **Código de estado:** 401
- **Duración:** 210ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/leads/count

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/leads/count`
- **Código de estado:** 401
- **Duración:** 242ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/leads/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/leads/1`
- **Código de estado:** 401
- **Duración:** 213ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/leads/new

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/leads/new`
- **Código de estado:** 401
- **Duración:** 245ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/leads

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/leads`
- **Código de estado:** 401
- **Duración:** 226ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PUT /crm/leads/{id}

- **Método:** PUT
- **URL:** `https://api.migro.es/api/crm/leads/1`
- **Código de estado:** 401
- **Duración:** 222ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /crm/leads/{id}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/crm/leads/999999`
- **Código de estado:** 401
- **Duración:** 223ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/leads/{id}/convert

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/leads/1/convert`
- **Código de estado:** 401
- **Duración:** 252ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/leads/{id}/mark-initial-contact-completed

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/leads/1/mark-initial-contact-completed`
- **Código de estado:** 401
- **Duración:** 248ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/contacts

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/contacts`
- **Código de estado:** 401
- **Duración:** 257ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/contacts/count

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/contacts/count`
- **Código de estado:** 401
- **Duración:** 221ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/contacts/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/contacts/1`
- **Código de estado:** 401
- **Duración:** 215ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/contacts

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/contacts`
- **Código de estado:** 401
- **Duración:** 220ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PUT /crm/contacts/{id}

- **Método:** PUT
- **URL:** `https://api.migro.es/api/crm/contacts/1`
- **Código de estado:** 401
- **Duración:** 215ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /crm/contacts/{id}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/crm/contacts/999999`
- **Código de estado:** 401
- **Duración:** 225ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/contacts/{id}/leads

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/contacts/1/leads`
- **Código de estado:** 401
- **Duración:** 239ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/contacts/{id}/tasks

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/contacts/1/tasks`
- **Código de estado:** 401
- **Duración:** 260ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/contacts/{id}/calls

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/contacts/1/calls`
- **Código de estado:** 401
- **Duración:** 219ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/contacts/{id}/notes

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/contacts/1/notes`
- **Código de estado:** 401
- **Duración:** 249ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/pipelines

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/pipelines`
- **Código de estado:** 401
- **Duración:** 217ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/tasks

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/tasks`
- **Código de estado:** 401
- **Duración:** 221ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/tasks/calendar

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/tasks/calendar`
- **Código de estado:** 401
- **Duración:** 210ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/tasks

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/tasks`
- **Código de estado:** 401
- **Duración:** 220ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PUT /crm/tasks/{id}/complete

- **Método:** PUT
- **URL:** `https://api.migro.es/api/crm/tasks/1/complete`
- **Código de estado:** 401
- **Duración:** 209ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/notes

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/notes`
- **Código de estado:** 401
- **Duración:** 236ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/notes

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/notes`
- **Código de estado:** 401
- **Duración:** 216ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/calls

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/calls`
- **Código de estado:** 401
- **Duración:** 213ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/calls/calendar

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/calls/calendar`
- **Código de estado:** 401
- **Duración:** 219ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/calls

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/calls`
- **Código de estado:** 401
- **Duración:** 216ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/users

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/users`
- **Código de estado:** 401
- **Duración:** 243ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/task-templates

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/task-templates`
- **Código de estado:** 401
- **Duración:** 225ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/task-templates

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/task-templates`
- **Código de estado:** 401
- **Duración:** 218ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PUT /crm/task-templates/{id}

- **Método:** PUT
- **URL:** `https://api.migro.es/api/crm/task-templates/1`
- **Código de estado:** 401
- **Duración:** 233ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PUT /crm/task-templates/order

- **Método:** PUT
- **URL:** `https://api.migro.es/api/crm/task-templates/order`
- **Código de estado:** 401
- **Duración:** 216ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/custom-fields

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/custom-fields`
- **Código de estado:** 401
- **Duración:** 225ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/custom-fields/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/custom-fields/1`
- **Código de estado:** 401
- **Duración:** 220ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/custom-fields

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/custom-fields`
- **Código de estado:** 401
- **Duración:** 219ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PUT /crm/custom-fields/{id}

- **Método:** PUT
- **URL:** `https://api.migro.es/api/crm/custom-fields/1`
- **Código de estado:** 401
- **Duración:** 213ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /crm/custom-fields/{id}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/crm/custom-fields/999999`
- **Código de estado:** 401
- **Duración:** 217ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/custom-field-values

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/custom-field-values`
- **Código de estado:** 401
- **Duración:** 362ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/custom-field-values

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/custom-field-values`
- **Código de estado:** 401
- **Duración:** 322ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PUT /crm/custom-field-values/{id}

- **Método:** PUT
- **URL:** `https://api.migro.es/api/crm/custom-field-values/1`
- **Código de estado:** 401
- **Duración:** 311ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /crm/custom-field-values/{id}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/crm/custom-field-values/999999`
- **Código de estado:** 401
- **Duración:** 326ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/opportunities

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/opportunities`
- **Código de estado:** 401
- **Duración:** 252ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/opportunities/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/opportunities/1`
- **Código de estado:** 401
- **Duración:** 265ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/opportunities/{id}/assign

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/opportunities/1/assign`
- **Código de estado:** 401
- **Duración:** 221ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/calls/{id}/wizard/start

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/calls/1/wizard/start`
- **Código de estado:** 401
- **Duración:** 217ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/calls/{id}/wizard

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/calls/1/wizard`
- **Código de estado:** 401
- **Duración:** 220ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/calls/{id}/wizard/next-step

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/calls/1/wizard/next-step`
- **Código de estado:** 401
- **Duración:** 218ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/calls/{id}/wizard/guidance

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/calls/1/wizard/guidance`
- **Código de estado:** 401
- **Duración:** 219ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/calls/{id}/wizard/step

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/calls/1/wizard/step`
- **Código de estado:** 401
- **Duración:** 226ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/calls/{id}/wizard/complete

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/calls/1/wizard/complete`
- **Código de estado:** 401
- **Duración:** 221ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/calls/{id}/wizard/pause

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/calls/1/wizard/pause`
- **Código de estado:** 401
- **Duración:** 223ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/calls/{id}/wizard/resume

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/calls/1/wizard/resume`
- **Código de estado:** 401
- **Duración:** 220ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /pipelines/stages/{entity_type}/{entity_id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/pipelines/stages/leads/1`
- **Código de estado:** 401
- **Duración:** 238ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /pipelines/stages

- **Método:** POST
- **URL:** `https://api.migro.es/api/pipelines/stages`
- **Código de estado:** 401
- **Duración:** 224ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PATCH /pipelines/stages/{stage_id}/next-action

- **Método:** PATCH
- **URL:** `https://api.migro.es/api/pipelines/stages/1/next-action`
- **Código de estado:** 401
- **Duración:** 224ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /pipelines/stages/{entity_type}/{entity_id}/status

- **Método:** GET
- **URL:** `https://api.migro.es/api/pipelines/stages/leads/1/status`
- **Código de estado:** 401
- **Duración:** 221ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /pipelines/actions

- **Método:** POST
- **URL:** `https://api.migro.es/api/pipelines/actions`
- **Código de estado:** 401
- **Duración:** 232ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /pipelines/actions/{entity_type}/{entity_id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/pipelines/actions/leads/1`
- **Código de estado:** 401
- **Duración:** 225ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /pipelines/actions/{action_id}/validate

- **Método:** POST
- **URL:** `https://api.migro.es/api/pipelines/actions/1/validate`
- **Código de estado:** 401
- **Duración:** 224ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /pipelines/action-types

- **Método:** GET
- **URL:** `https://api.migro.es/api/pipelines/action-types`
- **Código de estado:** 401
- **Duración:** 217ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /pipelines/calls/{call_id}/analyze

- **Método:** POST
- **URL:** `https://api.migro.es/api/pipelines/calls/1/analyze`
- **Código de estado:** 401
- **Duración:** 220ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /pipelines/calls/{call_id}/next-action

- **Método:** GET
- **URL:** `https://api.migro.es/api/pipelines/calls/1/next-action`
- **Código de estado:** 401
- **Duración:** 231ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /expedientes/

- **Método:** POST
- **URL:** `https://api.migro.es/api/expedientes/`
- **Código de estado:** 401
- **Duración:** 216ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /expedientes/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/expedientes/1`
- **Código de estado:** 401
- **Duración:** 215ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /expedientes/user/{user_id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/expedientes/user/1`
- **Código de estado:** 401
- **Duración:** 220ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PUT /expedientes/{id}

- **Método:** PUT
- **URL:** `https://api.migro.es/api/expedientes/1`
- **Código de estado:** 401
- **Duración:** 214ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /expedientes/{id}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/expedientes/999999`
- **Código de estado:** 401
- **Duración:** 228ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /expedientes/

- **Método:** GET
- **URL:** `https://api.migro.es/api/expedientes/`
- **Código de estado:** 401
- **Duración:** 215ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /expedientes/{id}/seleccionar-formulario

- **Método:** POST
- **URL:** `https://api.migro.es/api/expedientes/1/seleccionar-formulario`
- **Código de estado:** 401
- **Duración:** 224ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /expedientes/{id}/completitud

- **Método:** GET
- **URL:** `https://api.migro.es/api/expedientes/1/completitud`
- **Código de estado:** 401
- **Duración:** 217ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /expedientes/{id}/checklist

- **Método:** GET
- **URL:** `https://api.migro.es/api/expedientes/1/checklist`
- **Código de estado:** 401
- **Duración:** 215ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /expedientes/{id}/historial

- **Método:** GET
- **URL:** `https://api.migro.es/api/expedientes/1/historial`
- **Código de estado:** 401
- **Duración:** 221ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /expedientes/{id}/cambiar-estado

- **Método:** POST
- **URL:** `https://api.migro.es/api/expedientes/1/cambiar-estado`
- **Código de estado:** 401
- **Duración:** 217ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /expedientes/{id}/estadisticas

- **Método:** GET
- **URL:** `https://api.migro.es/api/expedientes/1/estadisticas`
- **Código de estado:** 401
- **Duración:** 223ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /expedientes/buscar

- **Método:** GET
- **URL:** `https://api.migro.es/api/expedientes/buscar?q=test`
- **Código de estado:** 401
- **Duración:** 218ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /conversations/

- **Método:** GET
- **URL:** `https://api.migro.es/api/conversations/`
- **Código de estado:** 401
- **Duración:** 249ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /conversations/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/conversations/1`
- **Código de estado:** 401
- **Duración:** 221ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /conversations/

- **Método:** POST
- **URL:** `https://api.migro.es/api/conversations/`
- **Código de estado:** 401
- **Duración:** 243ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PUT /conversations/{id}

- **Método:** PUT
- **URL:** `https://api.migro.es/api/conversations/1`
- **Código de estado:** 401
- **Duración:** 222ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /conversations/{id}/messages

- **Método:** POST
- **URL:** `https://api.migro.es/api/conversations/1/messages`
- **Código de estado:** 401
- **Duración:** 224ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /conversations/{id}/read

- **Método:** POST
- **URL:** `https://api.migro.es/api/conversations/1/read`
- **Código de estado:** 401
- **Duración:** 239ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /conversations/{id}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/conversations/999999`
- **Código de estado:** 401
- **Duración:** 253ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /conversations/admin/all

- **Método:** GET
- **URL:** `https://api.migro.es/api/conversations/admin/all`
- **Código de estado:** 401
- **Duración:** 213ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /conversations/{id}/messages

- **Método:** GET
- **URL:** `https://api.migro.es/api/conversations/1/messages`
- **Código de estado:** 401
- **Duración:** 226ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /conversations/{id}/messages/{message_id}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/conversations/1/messages/999999`
- **Código de estado:** 401
- **Duración:** 228ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PATCH /conversations/{id}/assign-lawyer

- **Método:** PATCH
- **URL:** `https://api.migro.es/api/conversations/1/assign-lawyer`
- **Código de estado:** 401
- **Duración:** 221ms
- **Error:** Request failed with status code 401
- **Respuesta del servidor:**

```json
{
  "detail": "Authentication required"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

### 404 (33 endpoints)

#### GET /hiring/{code}

- **Método:** GET
- **URL:** `https://api.migro.es/api/hiring/TEST123`
- **Código de estado:** 404
- **Duración:** 277ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Código de contratación no encontrado"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /hiring/{code}/confirm-data

- **Método:** POST
- **URL:** `https://api.migro.es/api/hiring/TEST123/confirm-data`
- **Código de estado:** 404
- **Duración:** 227ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Código de contratación no encontrado"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /hiring/{code}/contract/download

- **Método:** GET
- **URL:** `https://api.migro.es/api/hiring/TEST123/contract/download`
- **Código de estado:** 404
- **Duración:** 243ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Código de contratación no encontrado"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /hiring/{code}/final-contract/download

- **Método:** GET
- **URL:** `https://api.migro.es/api/hiring/TEST123/final-contract/download`
- **Código de estado:** 404
- **Duración:** 228ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Código de contratación no encontrado"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /admin/call-types

- **Método:** GET
- **URL:** `https://api.migro.es/api/admin/call-types`
- **Código de estado:** 404
- **Duración:** 239ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /admin/call-types

- **Método:** POST
- **URL:** `https://api.migro.es/api/admin/call-types`
- **Código de estado:** 404
- **Duración:** 250ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PATCH /admin/call-types/{id}

- **Método:** PATCH
- **URL:** `https://api.migro.es/api/admin/call-types/1`
- **Código de estado:** 404
- **Duración:** 219ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /admin/call-types/{id}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/admin/call-types/999999`
- **Código de estado:** 404
- **Duración:** 221ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /admin/contracts/{code}

- **Método:** GET
- **URL:** `https://api.migro.es/api/admin/contracts/TEST123`
- **Código de estado:** 404
- **Duración:** 269ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Código de contratación 'TEST123' no encontrado"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PATCH /admin/contracts/{code}

- **Método:** PATCH
- **URL:** `https://api.migro.es/api/admin/contracts/TEST123`
- **Código de estado:** 404
- **Duración:** 250ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Código de contratación 'TEST123' no encontrado"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /admin/contracts/{code}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/admin/contracts/TEST123`
- **Código de estado:** 404
- **Duración:** 230ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Código de contratación 'TEST123' no encontrado"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /admin/contracts/{code}/expire

- **Método:** POST
- **URL:** `https://api.migro.es/api/admin/contracts/TEST123/expire`
- **Código de estado:** 404
- **Duración:** 232ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Código de contratación 'TEST123' no encontrado"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /admin/hiring/list

- **Método:** GET
- **URL:** `https://api.migro.es/api/admin/hiring/list`
- **Código de estado:** 404
- **Duración:** 226ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/companies

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/companies`
- **Código de estado:** 404
- **Duración:** 241ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/companies/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/companies/1`
- **Código de estado:** 404
- **Duración:** 216ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/pipelines/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/pipelines/1`
- **Código de estado:** 404
- **Duración:** 217ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/pipelines/{id}/stages

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/pipelines/1/stages`
- **Código de estado:** 404
- **Duración:** 234ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/tasks/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/tasks/1`
- **Código de estado:** 404
- **Duración:** 221ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PUT /crm/tasks/{id}

- **Método:** PUT
- **URL:** `https://api.migro.es/api/crm/tasks/1`
- **Código de estado:** 404
- **Duración:** 249ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /crm/tasks/{id}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/crm/tasks/999999`
- **Código de estado:** 404
- **Duración:** 241ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/notes/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/notes/1`
- **Código de estado:** 404
- **Duración:** 215ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PUT /crm/notes/{id}

- **Método:** PUT
- **URL:** `https://api.migro.es/api/crm/notes/1`
- **Código de estado:** 404
- **Duración:** 250ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /crm/notes/{id}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/crm/notes/999999`
- **Código de estado:** 404
- **Duración:** 215ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/calls/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/calls/1`
- **Código de estado:** 404
- **Duración:** 215ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PUT /crm/calls/{id}

- **Método:** PUT
- **URL:** `https://api.migro.es/api/crm/calls/1`
- **Código de estado:** 404
- **Duración:** 225ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /crm/calls/{id}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/crm/calls/999999`
- **Código de estado:** 404
- **Duración:** 217ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/call-types

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/call-types`
- **Código de estado:** 404
- **Duración:** 225ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/users/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/users/1`
- **Código de estado:** 404
- **Duración:** 224ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/dashboard/stats

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/dashboard/stats`
- **Código de estado:** 404
- **Duración:** 217ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/dashboard/pipeline-stats

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/dashboard/pipeline-stats`
- **Código de estado:** 404
- **Duración:** 225ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /crm/opportunities/{id}/first-call-attempt

- **Método:** POST
- **URL:** `https://api.migro.es/api/crm/opportunities/1/first-call-attempt`
- **Código de estado:** 404
- **Duración:** 217ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /expedientes/{id}/archivos

- **Método:** POST
- **URL:** `https://api.migro.es/api/expedientes/1/archivos`
- **Código de estado:** 404
- **Duración:** 220ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PATCH /expedientes/{id}/archivos/{archivo_id}

- **Método:** PATCH
- **URL:** `https://api.migro.es/api/expedientes/1/archivos/1`
- **Código de estado:** 404
- **Duración:** 214ms
- **Error:** Request failed with status code 404
- **Respuesta del servidor:**

```json
{
  "detail": "Not Found"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

### 405 (5 endpoints)

#### POST /users/

- **Método:** POST
- **URL:** `https://api.migro.es/api/users/`
- **Código de estado:** 405
- **Duración:** 223ms
- **Error:** Request failed with status code 405
- **Respuesta del servidor:**

```json
{
  "detail": "Method Not Allowed"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /crm/task-templates/{id}

- **Método:** GET
- **URL:** `https://api.migro.es/api/crm/task-templates/1`
- **Código de estado:** 405
- **Duración:** 237ms
- **Error:** Request failed with status code 405
- **Respuesta del servidor:**

```json
{
  "detail": "Method Not Allowed"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### DELETE /crm/task-templates/{id}

- **Método:** DELETE
- **URL:** `https://api.migro.es/api/crm/task-templates/999999`
- **Código de estado:** 405
- **Duración:** 220ms
- **Error:** Request failed with status code 405
- **Respuesta del servidor:**

```json
{
  "detail": "Method Not Allowed"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### PATCH /crm/opportunities/{id}

- **Método:** PATCH
- **URL:** `https://api.migro.es/api/crm/opportunities/1`
- **Código de estado:** 405
- **Duración:** 218ms
- **Error:** Request failed with status code 405
- **Respuesta del servidor:**

```json
{
  "detail": "Method Not Allowed"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### GET /conversations/{id}/export

- **Método:** GET
- **URL:** `https://api.migro.es/api/conversations/1/export?format=json`
- **Código de estado:** 405
- **Duración:** 220ms
- **Error:** Request failed with status code 405
- **Respuesta del servidor:**

```json
{
  "detail": "Method Not Allowed"
}
```

- **Código de error:** ERR_BAD_REQUEST

---

### 422 (2 endpoints)

#### POST /admin/contracts/

- **Método:** POST
- **URL:** `https://api.migro.es/api/admin/contracts/`
- **Código de estado:** 422
- **Duración:** 247ms
- **Error:** Request failed with status code 422
- **Respuesta del servidor:**

```json
{
  "error": true,
  "message": "Field required",
  "type": "ValidationError",
  "errors": [
    {
      "field": "contract_template",
      "message": "Field required",
      "type": "missing"
    }
  ],
  "detail": [
    {
      "type": "missing",
      "loc": [
        "body",
        "contract_template"
      ],
      "msg": "Field required",
      "input": {
        "service_name": "Test",
        "amount": 10000
      },
      "url": "https://errors.pydantic.dev/2.11/v/missing"
    }
  ]
}
```

- **Código de error:** ERR_BAD_REQUEST

---

#### POST /admin/hiring/create

- **Método:** POST
- **URL:** `https://api.migro.es/api/admin/hiring/create`
- **Código de estado:** 422
- **Duración:** 231ms
- **Error:** Request failed with status code 422
- **Respuesta del servidor:**

```json
{
  "error": true,
  "message": "Field required",
  "type": "ValidationError",
  "errors": [
    {
      "field": "contract_template",
      "message": "Field required",
      "type": "missing"
    }
  ],
  "detail": [
    {
      "type": "missing",
      "loc": [
        "body",
        "contract_template"
      ],
      "msg": "Field required",
      "input": {
        "service_name": "Test",
        "amount": 10000
      },
      "url": "https://errors.pydantic.dev/2.11/v/missing"
    }
  ]
}
```

- **Código de error:** ERR_BAD_REQUEST

---

## 📋 Todos los Endpoints Testeados

| Endpoint | Método | Estado | Código | Duración |
|----------|--------|--------|--------|----------|
| POST /auth/login | POST | ❌ | 401 | 304ms |
| POST /auth/refresh | POST | ❌ | 400 | 224ms |
| GET /users/me | GET | ❌ | 401 | 544ms |
| GET /hiring/{code} | GET | ❌ | 404 | 277ms |
| POST /hiring/{code}/confirm-data | POST | ❌ | 404 | 227ms |
| GET /hiring/{code}/contract/download | GET | ❌ | 404 | 243ms |
| GET /hiring/{code}/final-contract/download | GET | ❌ | 404 | 228ms |
| GET /users/ | GET | ❌ | 401 | 217ms |
| GET /users/{id} | GET | ❌ | 401 | 221ms |
| PATCH /users/{id} | PATCH | ❌ | 401 | 220ms |
| DELETE /users/{id} | DELETE | ❌ | 401 | 212ms |
| PATCH /users/{id}/role | PATCH | ❌ | 401 | 223ms |
| PATCH /users/{id}/status | PATCH | ❌ | 401 | 224ms |
| POST /users/{id}/reset-password | POST | ❌ | 401 | 245ms |
| PATCH /users/{id}/password | PATCH | ❌ | 401 | 243ms |
| POST /users/{id}/impersonate | POST | ❌ | 401 | 226ms |
| GET /users/export | GET | ❌ | 401 | 224ms |
| GET /users/audit-logs | GET | ❌ | 401 | 218ms |
| POST /users/me/photo-avatar | POST | ❌ | 401 | 247ms |
| POST /users/ | POST | ❌ | 405 | 223ms |
| GET /admin/call-types | GET | ❌ | 404 | 239ms |
| POST /admin/call-types | POST | ❌ | 404 | 250ms |
| PATCH /admin/call-types/{id} | PATCH | ❌ | 404 | 219ms |
| DELETE /admin/call-types/{id} | DELETE | ❌ | 404 | 221ms |
| GET /admin/contracts/ | GET | ✅ | 200 | 353ms |
| GET /admin/contracts/{code} | GET | ❌ | 404 | 269ms |
| POST /admin/contracts/ | POST | ❌ | 422 | 247ms |
| PATCH /admin/contracts/{code} | PATCH | ❌ | 404 | 250ms |
| DELETE /admin/contracts/{code} | DELETE | ❌ | 404 | 230ms |
| POST /admin/contracts/{code}/expire | POST | ❌ | 404 | 232ms |
| POST /admin/hiring/create | POST | ❌ | 422 | 231ms |
| GET /admin/hiring/list | GET | ❌ | 404 | 226ms |
| GET /crm/leads | GET | ❌ | 401 | 210ms |
| GET /crm/leads/count | GET | ❌ | 401 | 242ms |
| GET /crm/leads/{id} | GET | ❌ | 401 | 213ms |
| GET /crm/leads/new | GET | ❌ | 401 | 245ms |
| POST /crm/leads | POST | ❌ | 401 | 226ms |
| PUT /crm/leads/{id} | PUT | ❌ | 401 | 222ms |
| DELETE /crm/leads/{id} | DELETE | ❌ | 401 | 223ms |
| POST /crm/leads/{id}/convert | POST | ❌ | 401 | 252ms |
| POST /crm/leads/{id}/mark-initial-contact-completed | POST | ❌ | 401 | 248ms |
| GET /crm/contacts | GET | ❌ | 401 | 257ms |
| GET /crm/contacts/count | GET | ❌ | 401 | 221ms |
| GET /crm/contacts/{id} | GET | ❌ | 401 | 215ms |
| POST /crm/contacts | POST | ❌ | 401 | 220ms |
| PUT /crm/contacts/{id} | PUT | ❌ | 401 | 215ms |
| DELETE /crm/contacts/{id} | DELETE | ❌ | 401 | 225ms |
| GET /crm/contacts/{id}/leads | GET | ❌ | 401 | 239ms |
| GET /crm/contacts/{id}/tasks | GET | ❌ | 401 | 260ms |
| GET /crm/contacts/{id}/calls | GET | ❌ | 401 | 219ms |
| GET /crm/contacts/{id}/notes | GET | ❌ | 401 | 249ms |
| GET /crm/companies | GET | ❌ | 404 | 241ms |
| GET /crm/companies/{id} | GET | ❌ | 404 | 216ms |
| GET /crm/pipelines | GET | ❌ | 401 | 217ms |
| GET /crm/pipelines/{id} | GET | ❌ | 404 | 217ms |
| GET /crm/pipelines/{id}/stages | GET | ❌ | 404 | 234ms |
| GET /crm/tasks | GET | ❌ | 401 | 221ms |
| GET /crm/tasks/{id} | GET | ❌ | 404 | 221ms |
| GET /crm/tasks/calendar | GET | ❌ | 401 | 210ms |
| POST /crm/tasks | POST | ❌ | 401 | 220ms |
| PUT /crm/tasks/{id} | PUT | ❌ | 404 | 249ms |
| DELETE /crm/tasks/{id} | DELETE | ❌ | 404 | 241ms |
| PUT /crm/tasks/{id}/complete | PUT | ❌ | 401 | 209ms |
| GET /crm/notes | GET | ❌ | 401 | 236ms |
| GET /crm/notes/{id} | GET | ❌ | 404 | 215ms |
| POST /crm/notes | POST | ❌ | 401 | 216ms |
| PUT /crm/notes/{id} | PUT | ❌ | 404 | 250ms |
| DELETE /crm/notes/{id} | DELETE | ❌ | 404 | 215ms |
| GET /crm/calls | GET | ❌ | 401 | 213ms |
| GET /crm/calls/{id} | GET | ❌ | 404 | 215ms |
| GET /crm/calls/calendar | GET | ❌ | 401 | 219ms |
| POST /crm/calls | POST | ❌ | 401 | 216ms |
| PUT /crm/calls/{id} | PUT | ❌ | 404 | 225ms |
| DELETE /crm/calls/{id} | DELETE | ❌ | 404 | 217ms |
| GET /crm/call-types | GET | ❌ | 404 | 225ms |
| GET /crm/users | GET | ❌ | 401 | 243ms |
| GET /crm/users/{id} | GET | ❌ | 404 | 224ms |
| GET /crm/task-templates | GET | ❌ | 401 | 225ms |
| GET /crm/task-templates/{id} | GET | ❌ | 405 | 237ms |
| POST /crm/task-templates | POST | ❌ | 401 | 218ms |
| PUT /crm/task-templates/{id} | PUT | ❌ | 401 | 233ms |
| DELETE /crm/task-templates/{id} | DELETE | ❌ | 405 | 220ms |
| PUT /crm/task-templates/order | PUT | ❌ | 401 | 216ms |
| GET /crm/dashboard/stats | GET | ❌ | 404 | 217ms |
| GET /crm/dashboard/pipeline-stats | GET | ❌ | 404 | 225ms |
| GET /crm/custom-fields | GET | ❌ | 401 | 225ms |
| GET /crm/custom-fields/{id} | GET | ❌ | 401 | 220ms |
| POST /crm/custom-fields | POST | ❌ | 401 | 219ms |
| PUT /crm/custom-fields/{id} | PUT | ❌ | 401 | 213ms |
| DELETE /crm/custom-fields/{id} | DELETE | ❌ | 401 | 217ms |
| GET /crm/custom-field-values | GET | ❌ | 401 | 362ms |
| POST /crm/custom-field-values | POST | ❌ | 401 | 322ms |
| PUT /crm/custom-field-values/{id} | PUT | ❌ | 401 | 311ms |
| DELETE /crm/custom-field-values/{id} | DELETE | ❌ | 401 | 326ms |
| GET /crm/opportunities | GET | ❌ | 401 | 252ms |
| GET /crm/opportunities/{id} | GET | ❌ | 401 | 265ms |
| POST /crm/opportunities/{id}/assign | POST | ❌ | 401 | 221ms |
| PATCH /crm/opportunities/{id} | PATCH | ❌ | 405 | 218ms |
| POST /crm/opportunities/{id}/first-call-attempt | POST | ❌ | 404 | 217ms |
| POST /crm/calls/{id}/wizard/start | POST | ❌ | 401 | 217ms |
| GET /crm/calls/{id}/wizard | GET | ❌ | 401 | 220ms |
| GET /crm/calls/{id}/wizard/next-step | GET | ❌ | 401 | 218ms |
| GET /crm/calls/{id}/wizard/guidance | GET | ❌ | 401 | 219ms |
| POST /crm/calls/{id}/wizard/step | POST | ❌ | 401 | 226ms |
| POST /crm/calls/{id}/wizard/complete | POST | ❌ | 401 | 221ms |
| POST /crm/calls/{id}/wizard/pause | POST | ❌ | 401 | 223ms |
| POST /crm/calls/{id}/wizard/resume | POST | ❌ | 401 | 220ms |
| GET /pipelines/stages/{entity_type}/{entity_id} | GET | ❌ | 401 | 238ms |
| POST /pipelines/stages | POST | ❌ | 401 | 224ms |
| PATCH /pipelines/stages/{stage_id}/next-action | PATCH | ❌ | 401 | 224ms |
| GET /pipelines/stages/{entity_type}/{entity_id}/status | GET | ❌ | 401 | 221ms |
| POST /pipelines/actions | POST | ❌ | 401 | 232ms |
| GET /pipelines/actions/{entity_type}/{entity_id} | GET | ❌ | 401 | 225ms |
| POST /pipelines/actions/{action_id}/validate | POST | ❌ | 401 | 224ms |
| GET /pipelines/action-types | GET | ❌ | 401 | 217ms |
| POST /pipelines/calls/{call_id}/analyze | POST | ❌ | 401 | 220ms |
| GET /pipelines/calls/{call_id}/next-action | GET | ❌ | 401 | 231ms |
| POST /expedientes/ | POST | ❌ | 401 | 216ms |
| GET /expedientes/{id} | GET | ❌ | 401 | 215ms |
| GET /expedientes/user/{user_id} | GET | ❌ | 401 | 220ms |
| PUT /expedientes/{id} | PUT | ❌ | 401 | 214ms |
| DELETE /expedientes/{id} | DELETE | ❌ | 401 | 228ms |
| GET /expedientes/ | GET | ❌ | 401 | 215ms |
| POST /expedientes/{id}/seleccionar-formulario | POST | ❌ | 401 | 224ms |
| GET /expedientes/{id}/completitud | GET | ❌ | 401 | 217ms |
| GET /expedientes/{id}/checklist | GET | ❌ | 401 | 215ms |
| GET /expedientes/{id}/historial | GET | ❌ | 401 | 221ms |
| POST /expedientes/{id}/cambiar-estado | POST | ❌ | 401 | 217ms |
| GET /expedientes/{id}/estadisticas | GET | ❌ | 401 | 223ms |
| GET /expedientes/buscar | GET | ❌ | 401 | 218ms |
| POST /expedientes/{id}/archivos | POST | ❌ | 404 | 220ms |
| PATCH /expedientes/{id}/archivos/{archivo_id} | PATCH | ❌ | 404 | 214ms |
| GET /conversations/ | GET | ❌ | 401 | 249ms |
| GET /conversations/{id} | GET | ❌ | 401 | 221ms |
| POST /conversations/ | POST | ❌ | 401 | 243ms |
| PUT /conversations/{id} | PUT | ❌ | 401 | 222ms |
| POST /conversations/{id}/messages | POST | ❌ | 401 | 224ms |
| POST /conversations/{id}/read | POST | ❌ | 401 | 239ms |
| DELETE /conversations/{id} | DELETE | ❌ | 401 | 253ms |
| GET /conversations/admin/all | GET | ❌ | 401 | 213ms |
| GET /conversations/{id}/messages | GET | ❌ | 401 | 226ms |
| DELETE /conversations/{id}/messages/{message_id} | DELETE | ❌ | 401 | 228ms |
| GET /conversations/{id}/export | GET | ❌ | 405 | 220ms |
| PATCH /conversations/{id}/assign-lawyer | PATCH | ❌ | 401 | 221ms |
| GET /pili/health | GET | ✅ | 200 | 778ms |
| POST /pili/chat | POST | ✅ | 200 | 5269ms |
| POST /pili/chat/messages | POST | ✅ | 200 | 5889ms |

---

**Última actualización:** 2025-12-24T18:33:27.882Z
