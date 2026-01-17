# 📊 Endpoints Faltantes en el Diagnóstico

**Fecha:** 2025-01-17  
**Estado:** ⚠️ El diagnóstico actual solo verifica 3 endpoints de ~135+ totales

---

## 📋 Endpoints Actualmente Verificados

El diagnóstico actual (`scripts/diagnose-backend.sh`) solo verifica:

1. ✅ `GET /api/health` - Health check
2. ✅ `POST /api/auth/login` - Login
3. ✅ `POST /api/auth/refresh` - Refresh token

---

## ❌ Endpoints NO Incluidos en el Diagnóstico

### CRM - Leads (~9 endpoints)
- ❌ `GET /api/crm/leads` - Listar leads
- ❌ `GET /api/crm/leads/count` - Contar leads
- ❌ `GET /api/crm/leads/{id}` - Obtener lead
- ❌ `POST /api/crm/leads` - Crear lead
- ❌ `PUT /api/crm/leads/{id}` - Actualizar lead
- ❌ `DELETE /api/crm/leads/{id}` - Eliminar lead
- ❌ `POST /api/crm/leads/{id}/convert` - Convertir lead
- ❌ `POST /api/crm/leads/{id}/mark-initial-contact-completed` - Marcar contactado

### CRM - Contacts (~10 endpoints)
- ❌ `GET /api/crm/contacts` - Listar contactos
- ❌ `GET /api/crm/contacts/count` - Contar contactos
- ❌ `GET /api/crm/contacts/{id}` - Obtener contacto
- ❌ `POST /api/crm/contacts` - Crear contacto
- ❌ `PUT /api/crm/contacts/{id}` - Actualizar contacto
- ❌ `DELETE /api/crm/contacts/{id}` - Eliminar contacto
- ... y más

### CRM - Otros (~70+ endpoints más)
- ❌ Companies, Tasks, Notes, Calls, Pipelines, etc.

### Admin (~25 endpoints)
- ❌ `GET /api/users/` - Listar usuarios
- ❌ `GET /api/users/{id}` - Obtener usuario
- ❌ `POST /api/users/` - Crear usuario
- ❌ `PATCH /api/users/{id}` - Actualizar usuario
- ❌ `GET /api/admin/call-types` - Listar tipos de llamadas
- ... y más

### Otros (~20+ endpoints)
- ❌ Hiring, Expedientes, Pipelines, Conversations, Agent Journal, etc.

---

## 💡 Recomendación

Para un diagnóstico completo, deberíamos incluir al menos:

### Nivel 1 - Críticos (Prioridad Alta) ✅ Actualmente incluidos
- Health check
- Login
- Refresh token

### Nivel 2 - Importantes CRM/Admin (Prioridad Media) ⚠️ Faltantes
- `GET /api/crm/leads` - Endpoint más usado del CRM
- `GET /api/crm/contacts` - Endpoint más usado del CRM
- `GET /api/users/` - Endpoint crítico de Admin
- `GET /api/crm/dashboard/pipeline-stats` - Dashboard

### Nivel 3 - Otros (Prioridad Baja) ⏳ Opcional
- Resto de endpoints según necesidad

---

## 🔧 Próximos Pasos

1. Expandir el diagnóstico para incluir endpoints críticos de Nivel 2
2. Crear modo "completo" opcional que verifique todos los endpoints
3. Agregar configuración para especificar qué endpoints verificar

---

**Nota:** Verificar todos los ~135 endpoints en cada CI/CD podría ser muy lento. Es mejor tener:
- **Diagnóstico rápido** (default): Solo endpoints críticos (actual)
- **Diagnóstico completo** (opcional): Todos los endpoints importantes
- **Diagnóstico personalizado**: Especificar endpoints a verificar
