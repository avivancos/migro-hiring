# 📋 Inventario Completo de Endpoints - CRM y Admin

**Fecha:** 2025-01-17  
**Propósito:** Listado exhaustivo de TODOS los endpoints usados en el frontend para CRM y Admin  
**Estado:** ✅ COMPLETADO

---

## 🔍 Metodología de Búsqueda

Se ha realizado una búsqueda exhaustiva en todo el código fuente del frontend:

1. ✅ Búsqueda con `grep` de patrones `api.(get|post|put|patch|delete)`
2. ✅ Revisión manual de todos los archivos de servicios
3. ✅ Búsqueda de strings `/api/` en todo el código
4. ✅ Revisión de tipos TypeScript y documentación

---

## 📊 Resumen por Categoría

| Categoría | Cantidad de Endpoints |
|-----------|----------------------|
| **CRM** | ~80+ endpoints |
| **Admin** | ~25+ endpoints |
| **Auth** | ~5 endpoints |
| **Hiring** | ~10 endpoints |
| **Otros** | ~15 endpoints |
| **TOTAL** | **~135+ endpoints** |

---

## 🔵 ENDPOINTS CRM (`/api/crm/*`)

### Leads

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/crm/leads` | Listar leads con filtros | `crmService.ts` |
| GET | `/api/crm/leads/count` | Obtener total de leads | `crmService.ts` |
| GET | `/api/crm/leads/{id}` | Obtener lead por ID | `crmService.ts` |
| GET | `/api/crm/leads/new` | Obtener defaults para nuevo lead | `crmService.ts` |
| POST | `/api/crm/leads` | Crear nuevo lead | `crmService.ts` |
| PUT | `/api/crm/leads/{id}` | Actualizar lead | `crmService.ts` |
| DELETE | `/api/crm/leads/{id}` | Eliminar lead | `crmService.ts` |
| POST | `/api/crm/leads/{id}/convert` | Convertir lead a contacto | `crmService.ts` |
| POST | `/api/crm/leads/{id}/mark-initial-contact-completed` | Marcar como contactado | `crmService.ts` |

### Contacts

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/crm/contacts` | Listar contactos con filtros | `crmService.ts` |
| GET | `/api/crm/contacts/count` | Obtener total de contactos | `crmService.ts` |
| GET | `/api/crm/contacts/{id}` | Obtener contacto por ID | `crmService.ts` |
| POST | `/api/crm/contacts` | Crear nuevo contacto | `crmService.ts` |
| PUT | `/api/crm/contacts/{id}` | Actualizar contacto | `crmService.ts` |
| DELETE | `/api/crm/contacts/{id}` | Eliminar contacto | `crmService.ts` |
| GET | `/api/crm/contacts/{id}/leads` | Obtener leads del contacto | `crmService.ts` |
| GET | `/api/crm/contacts/{id}/tasks` | Obtener tareas del contacto | `crmService.ts` |
| GET | `/api/crm/contacts/{id}/calls` | Obtener llamadas del contacto | `crmService.ts` |
| GET | `/api/crm/contacts/{id}/notes` | Obtener notas del contacto | `crmService.ts` |

### Companies

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/crm/companies` | Listar empresas | `crmService.ts` |
| GET | `/api/crm/companies/{id}` | Obtener empresa por ID | `crmService.ts` |
| POST | `/api/crm/companies` | Crear nueva empresa | `crmService.ts` |
| PUT | `/api/crm/companies/{id}` | Actualizar empresa | `crmService.ts` |
| DELETE | `/api/crm/companies/{id}` | Eliminar empresa | `crmService.ts` |

### Tasks

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/crm/tasks` | Listar tareas con filtros | `crmService.ts` |
| GET | `/api/crm/tasks/calendar` | Obtener tareas para calendario | `crmService.ts` |
| POST | `/api/crm/tasks` | Crear nueva tarea | `crmService.ts` |
| PUT | `/api/crm/tasks/{id}` | Actualizar tarea | `crmService.ts` |
| PUT | `/api/crm/tasks/{id}/complete` | Marcar tarea como completada | `crmService.ts` |
| DELETE | `/api/crm/tasks/{id}` | Eliminar tarea | `crmService.ts` |

### Notes

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/crm/notes` | Listar notas con filtros | `crmService.ts` |
| POST | `/api/crm/notes` | Crear nueva nota | `crmService.ts` |
| DELETE | `/api/crm/notes/{id}` | Eliminar nota | `crmService.ts` |

### Calls

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/crm/calls` | Listar llamadas con filtros | `crmService.ts` |
| GET | `/api/crm/calls/calendar` | Obtener llamadas para calendario | `crmService.ts` |
| POST | `/api/crm/calls` | Crear nueva llamada | `crmService.ts` |
| DELETE | `/api/crm/calls/{id}` | Eliminar llamada | `crmService.ts` |

### Pipelines

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/crm/pipelines` | Listar pipelines | `crmService.ts` |
| GET | `/api/crm/pipelines/{id}` | Obtener pipeline por ID | `crmService.ts` |
| GET | `/api/crm/pipelines/{id}/stages` | Obtener stages del pipeline | `crmService.ts` |

### Task Templates

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/crm/task-templates` | Listar plantillas de tareas | `crmService.ts` |
| POST | `/api/crm/task-templates` | Crear plantilla | `crmService.ts` |
| PUT | `/api/crm/task-templates/{id}` | Actualizar plantilla | `crmService.ts` |
| DELETE | `/api/crm/task-templates/{id}` | Eliminar plantilla | `crmService.ts` |
| PUT | `/api/crm/task-templates/order` | Reordenar plantillas | `crmService.ts` |

### Custom Fields

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/crm/custom-fields` | Listar campos personalizados | `crmService.ts` |
| GET | `/api/crm/custom-fields/{id}` | Obtener campo por ID | `crmService.ts` |
| POST | `/api/crm/custom-fields` | Crear campo personalizado | `crmService.ts` |
| PUT | `/api/crm/custom-fields/{id}` | Actualizar campo | `crmService.ts` |
| DELETE | `/api/crm/custom-fields/{id}` | Eliminar campo | `crmService.ts` |

### Custom Field Values

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/crm/custom-field-values` | Listar valores de campos | `crmService.ts` |
| POST | `/api/crm/custom-field-values` | Crear valor | `crmService.ts` |
| PUT | `/api/crm/custom-field-values/{id}` | Actualizar valor | `crmService.ts` |
| DELETE | `/api/crm/custom-field-values/{id}` | Eliminar valor | `crmService.ts` |

### Opportunities

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/crm/opportunities` | Listar oportunidades | `opportunityApi.ts` |
| GET | `/api/crm/opportunities/{id}` | Obtener oportunidad | `opportunityApi.ts` |
| POST | `/api/crm/opportunities` | Crear oportunidad | `opportunityApi.ts` |
| POST | `/api/crm/opportunities/{id}/assign` | Asignar oportunidad | `opportunityApi.ts` |
| POST | `/api/crm/opportunities/assign-random` | Asignar aleatoria | `opportunityApi.ts` |
| POST | `/api/crm/opportunities/{id}/analyze` | Analizar oportunidad | `caseAnalysisApi.ts` |

### Dashboard

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/crm/dashboard/pipeline-stats` | Estadísticas de pipeline | `crmService.ts` |
| GET | `/api/crm/dashboard/stats` | Estadísticas generales | `crmService.ts` (referenciado) |

### Call Types

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/crm/call-types` | Listar tipos de llamadas | `crmService.ts` |

### Wizard (Call Wizard)

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| POST | `/api/crm/calls/{id}/wizard/start` | Iniciar wizard | `wizardApi.ts` |
| GET | `/api/crm/calls/{id}/wizard` | Obtener estado del wizard | `wizardApi.ts` |
| GET | `/api/crm/calls/{id}/wizard/next-step` | Obtener siguiente paso | `wizardApi.ts` |
| GET | `/api/crm/calls/{id}/wizard/guidance` | Obtener guía | `wizardApi.ts` |
| POST | `/api/crm/calls/{id}/wizard/step` | Enviar paso | `wizardApi.ts` |
| POST | `/api/crm/calls/{id}/wizard/complete` | Completar wizard | `wizardApi.ts` |
| POST | `/api/crm/calls/{id}/wizard/pause` | Pausar wizard | `wizardApi.ts` |
| POST | `/api/crm/calls/{id}/wizard/resume` | Reanudar wizard | `wizardApi.ts` |

---

## 🟢 ENDPOINTS ADMIN (`/api/admin/*` y `/api/users/*`)

### User Management

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/users/` | Listar usuarios (paginado) | `adminService.ts` |
| GET | `/api/users/{id}` | Obtener usuario por ID | `adminService.ts` |
| GET | `/api/users/me` | Obtener usuario actual | `adminService.ts`, `AuthProvider.tsx` |
| POST | `/api/users/` | Crear nuevo usuario | `adminService.ts` |
| PATCH | `/api/users/{id}` | Actualizar usuario | `adminService.ts` |
| DELETE | `/api/users/{id}` | Eliminar usuario | `adminService.ts` |
| PATCH | `/api/users/{id}/role` | Actualizar rol | `adminService.ts` |
| PATCH | `/api/users/{id}/status` | Actualizar estado | `adminService.ts` |
| PATCH | `/api/users/{id}/password` | Cambiar contraseña | `adminService.ts` |
| POST | `/api/users/{id}/reset-password` | Resetear contraseña | `adminService.ts` |
| POST | `/api/users/{id}/impersonate` | Impersonar usuario | `adminService.ts` |
| POST | `/api/users/me/photo-avatar` | Subir foto de perfil | `adminService.ts` |
| GET | `/api/users/export` | Exportar usuarios | `adminService.ts` |
| GET | `/api/users/audit-logs` | Obtener logs de auditoría | `adminService.ts` |

### Admin - Hiring

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/admin/hiring/list` | Listar códigos de contratación | `adminService.ts` |
| POST | `/api/admin/hiring/create` | Crear código de contratación | `adminService.ts` |

### Admin - Contracts

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| DELETE | `/api/admin/contracts/{code}` | Eliminar contrato | `contractsService.ts` |

### Admin - Hiring Annexes

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| DELETE | `/api/admin/hiring/annexes/{annexId}` | Eliminar anexo | `contractsService.ts` |

### Admin - Call Types

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/admin/call-types` | Listar tipos de llamadas | `adminService.ts` |
| POST | `/api/admin/call-types` | Crear tipo de llamada | `adminService.ts` |
| PATCH | `/api/admin/call-types/{id}` | Actualizar tipo | `adminService.ts` |
| DELETE | `/api/admin/call-types/{id}` | Eliminar tipo | `adminService.ts` |

---

## 🔐 ENDPOINTS AUTH (`/api/auth/*`)

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| POST | `/api/auth/login` | Iniciar sesión | `authService.ts`, `adminService.ts` |
| POST | `/api/auth/register` | Registrar usuario | `authService.ts` |
| POST | `/api/auth/refresh` | Refrescar token | `authService.ts` |
| POST | `/api/auth/logout` | Cerrar sesión | `authService.ts` |

---

## 📝 ENDPOINTS HIRING (`/api/hiring/*`)

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/hiring/{code}` | Obtener datos de contratación | `hiringService.ts` |
| POST | `/api/hiring/{code}/confirm-data` | Confirmar datos | `hiringService.ts` |
| POST | `/api/hiring/{code}/contract/accept` | Aceptar contrato | `hiringService.ts` |
| POST | `/api/hiring/{code}/kyc/complete` | Completar KYC | `hiringService.ts` |

---

## 📁 ENDPOINTS EXPEDIENTES (`/api/expedientes/*`)

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/expedientes/` | Listar expedientes | `expedienteApi.ts` |
| GET | `/api/expedientes/{id}` | Obtener expediente | `expedienteApi.ts` |
| GET | `/api/expedientes/user/{user_id}` | Obtener por usuario | `expedienteApi.ts` |
| POST | `/api/expedientes/` | Crear expediente | `expedienteApi.ts` |
| PUT | `/api/expedientes/{id}` | Actualizar expediente | `expedienteApi.ts` |
| DELETE | `/api/expedientes/{id}` | Eliminar expediente | `expedienteApi.ts` |
| POST | `/api/expedientes/{id}/seleccionar-formulario` | Seleccionar formulario | `expedienteApi.ts` |
| GET | `/api/expedientes/{id}/completitud` | Obtener completitud | `expedienteApi.ts` |
| GET | `/api/expedientes/{id}/checklist` | Obtener checklist | `expedienteApi.ts` |
| GET | `/api/expedientes/{id}/historial` | Obtener historial | `expedienteApi.ts` |
| POST | `/api/expedientes/{id}/cambiar-estado` | Cambiar estado | `expedienteApi.ts` |
| GET | `/api/expedientes/{id}/estadisticas` | Obtener estadísticas | `expedienteApi.ts` |
| GET | `/api/expedientes/buscar` | Buscar expedientes | `expedienteApi.ts` |
| POST | `/api/expedientes/{id}/archivos` | Subir archivo | `expedienteApi.ts` |
| PATCH | `/api/expedientes/{id}/archivos/{archivo_id}` | Actualizar archivo | `expedienteApi.ts` |

---

## 🔄 ENDPOINTS PIPELINES (`/api/pipelines/*`)

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/pipelines/stages/{entity_type}/{entity_id}` | Obtener stages | `pipelineApi.ts` |
| POST | `/api/pipelines/stages` | Crear stage | `pipelineApi.ts` |
| PATCH | `/api/pipelines/stages/{stage_id}/next-action` | Siguiente acción | `pipelineApi.ts` |
| GET | `/api/pipelines/stages/{entity_type}/{entity_id}/status` | Obtener estado | `pipelineApi.ts` |
| POST | `/api/pipelines/actions` | Crear acción | `pipelineApi.ts` |
| GET | `/api/pipelines/actions/{entity_type}/{entity_id}` | Obtener acciones | `pipelineApi.ts` |
| POST | `/api/pipelines/actions/{action_id}/validate` | Validar acción | `pipelineApi.ts` |
| GET | `/api/pipelines/action-types` | Obtener tipos de acción | `pipelineApi.ts` |
| POST | `/api/pipelines/calls/{call_id}/analyze` | Analizar llamada | `pipelineApi.ts` |
| GET | `/api/pipelines/calls/{call_id}/next-action` | Siguiente acción de llamada | `pipelineApi.ts` |
| GET | `/api/pipelines/admin/approve-hiring-code/validate` | Validar token | `pipelineApi.ts` |
| POST | `/api/pipelines/admin/approve-hiring-code` | Aprobar código | `pipelineApi.ts` |

---

## 💬 ENDPOINTS CONVERSATIONS (`/api/conversations/*`)

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/conversations/{id}/messages` | Obtener mensajes | `conversationsService.ts` |
| GET | `/api/conversations/{id}/export` | Exportar conversación | `conversationsService.ts` |

---

## 📊 ENDPOINTS AGENT JOURNAL (`/api/agent-journal/*`)

| Método | Endpoint | Descripción | Archivo |
|--------|----------|-------------|---------|
| GET | `/api/agent-journal/daily-report` | Reporte diario | `agentJournalApi.ts` |
| GET | `/api/agent-journal/performance-dashboard` | Dashboard de performance | `agentJournalApi.ts` |
| GET | `/api/agent-journal/metrics/{user_id}` | Métricas de usuario | `agentJournalApi.ts` |
| POST | `/api/agent-journal/sync` | Sincronizar datos | `agentJournalApi.ts` |
| POST | `/api/agent-journal/sign-and-send` | Firmar y enviar | `agentJournalApi.ts` |

---

## ✅ Verificación de Cobertura

### Endpoints Verificados ✅

- [x] **CRM Leads** - Todos los endpoints verificados
- [x] **CRM Contacts** - Todos los endpoints verificados
- [x] **CRM Companies** - Todos los endpoints verificados
- [x] **CRM Tasks** - Todos los endpoints verificados
- [x] **CRM Notes** - Todos los endpoints verificados
- [x] **CRM Calls** - Todos los endpoints verificados
- [x] **CRM Pipelines** - Todos los endpoints verificados
- [x] **CRM Task Templates** - Todos los endpoints verificados
- [x] **CRM Custom Fields** - Todos los endpoints verificados
- [x] **CRM Opportunities** - Todos los endpoints verificados
- [x] **CRM Wizard** - Todos los endpoints verificados
- [x] **Admin Users** - Todos los endpoints verificados
- [x] **Admin Hiring** - Todos los endpoints verificados
- [x] **Admin Call Types** - Todos los endpoints verificados
- [x] **Auth** - Todos los endpoints verificados
- [x] **Hiring** - Todos los endpoints verificados
- [x] **Expedientes** - Todos los endpoints verificados
- [x] **Pipelines** - Todos los endpoints verificados
- [x] **Conversations** - Todos los endpoints verificados
- [x] **Agent Journal** - Todos los endpoints verificados

---

## 📝 Notas Importantes

1. **Base URL:** Todos los endpoints usan la base URL configurada en `config.API_BASE_URL` (normalmente `https://api.migro.es/api` o `http://localhost:3000/api`)

2. **Autenticación:** La mayoría de endpoints requieren token JWT en el header `Authorization: Bearer {token}`

3. **Paginación:** Los endpoints de listado soportan parámetros `skip`, `limit`, `page`

4. **Filtros:** Muchos endpoints soportan filtros avanzados mediante query parameters

5. **Formato de Respuesta:** Algunos endpoints devuelven formato Kommo-style (`_embedded`, `_page`), otros formato estándar (`items`, `total`)

---

## 🔍 Próximos Pasos

1. ✅ Inventario completo realizado
2. ⏳ Verificar en backend que TODOS estos endpoints están implementados
3. ⏳ Agregar endpoints faltantes al diagnóstico automático
4. ⏳ Documentar comportamiento esperado de cada endpoint

---

**Última actualización:** 2025-01-17
