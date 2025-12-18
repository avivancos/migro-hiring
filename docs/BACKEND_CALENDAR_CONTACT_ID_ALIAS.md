# ✅ Alias `contact_id` en Respuestas de Calendario

## 📋 Resumen

Se agregó un campo `contact_id` como alias en las respuestas de los endpoints de calendario para facilitar el acceso desde el frontend.

**Fecha**: 18 de Diciembre, 2025

---

## 🎯 Problema

El frontend tenía que extraer el `contact_id` desde `entity_id` cuando `entity_type == "contacts"`, lo cual era incómodo:

```typescript
// Antes (incómodo)
const contactId = call.entity_type === 'contacts' ? call.entity_id : null;
```

---

## ✅ Solución Implementada

Se agregó un campo `contact_id` directamente en las respuestas de calendario que se establece automáticamente cuando `entity_type == "contacts"`.

### Cambios Realizados

#### 1. Schemas Actualizados

**Archivo**: `app/schemas/crm_call.py`
- Se agregó campo `contact_id: Optional[uuid.UUID]` a `CallResponse`

**Archivo**: `app/schemas/crm_task.py`
- Se agregó campo `contact_id: Optional[uuid.UUID]` a `TaskResponse`

#### 2. Endpoints de Calendario Actualizados

**Archivo**: `app/api/endpoints/crm.py`

##### `GET /api/crm/calls/calendar`
- Ahora establece `contact_id = entity_id` cuando `entity_type == "contacts"`

##### `GET /api/crm/tasks/calendar`
- Ahora establece `contact_id = entity_id` cuando `entity_type == "contacts"`

---

## 📝 Ejemplo de Respuesta

### Antes
```json
{
  "id": "uuid-123",
  "direction": "inbound",
  "phone": "+34600123456",
  "entity_id": "contact-uuid-456",
  "entity_type": "contacts",
  "created_at": "2025-12-18T10:30:00Z"
}
```

### Después
```json
{
  "id": "uuid-123",
  "direction": "inbound",
  "phone": "+34600123456",
  "entity_id": "contact-uuid-456",
  "entity_type": "contacts",
  "contact_id": "contact-uuid-456",  // ✅ NUEVO - Alias directo
  "created_at": "2025-12-18T10:30:00Z"
}
```

---

## 💻 Uso en Frontend

### Antes (incómodo)
```typescript
// Tenía que verificar entity_type y extraer entity_id
const contactId = call.entity_type === 'contacts' ? call.entity_id : null;
```

### Después (fácil)
```typescript
// Ahora simplemente usa contact_id directamente
const contactId = call.contact_id; // ✅ Mucho más simple
```

---

## 🔍 Comportamiento

- ✅ `contact_id` se establece automáticamente cuando `entity_type == "contacts"` y `entity_id` existe
- ✅ `contact_id` es `null` cuando:
  - `entity_type` no es `"contacts"`
  - `entity_id` es `null`
  - No hay entidad asociada

---

## 📚 Endpoints Afectados

### Endpoints de Calendario
- ✅ `GET /api/crm/calls/calendar` - Llamadas del calendario
- ✅ `GET /api/crm/tasks/calendar` - Tareas del calendario

### Endpoints NO Afectados (mantienen comportamiento original)
- `GET /api/crm/calls` - Lista general de llamadas
- `GET /api/crm/tasks` - Lista general de tareas
- Otros endpoints que no son específicos de calendario

**Nota**: Los endpoints de calendario son los únicos que establecen `contact_id` automáticamente. Los demás endpoints mantienen solo `entity_id` y `entity_type` para compatibilidad.

---

## ✅ Verificación

### Verificar que contact_id aparece en respuestas de calendario:

```bash
# Llamadas del calendario
curl -X GET "https://api.migro.es/api/crm/calls/calendar?start_date=2025-12-01T00:00:00Z&end_date=2026-01-01T00:00:00Z" \
  -H "X-CRM-Auth: your-token"

# Debe incluir contact_id cuando entity_type == "contacts"
```

```bash
# Tareas del calendario
curl -X GET "https://api.migro.es/api/crm/tasks/calendar?start_date=2025-12-01T00:00:00Z&end_date=2026-01-01T00:00:00Z" \
  -H "X-CRM-Auth: your-token"

# Debe incluir contact_id cuando entity_type == "contacts"
```

---

## 📝 Archivos Modificados

1. **Schemas**:
   - `app/schemas/crm_call.py` - Agregado `contact_id` a `CallResponse`
   - `app/schemas/crm_task.py` - Agregado `contact_id` a `TaskResponse`

2. **Endpoints**:
   - `app/api/endpoints/crm.py` - Modificado `get_calls_calendar()` y `get_tasks_calendar()`

---

## 🎯 Beneficios

1. ✅ **Más fácil para el frontend**: No necesita verificar `entity_type` y extraer `entity_id`
2. ✅ **Código más limpio**: `call.contact_id` es más legible que `call.entity_type === 'contacts' ? call.entity_id : null`
3. ✅ **Retrocompatible**: `entity_id` y `entity_type` siguen disponibles
4. ✅ **Solo en calendario**: No afecta otros endpoints que pueden necesitar `entity_id` genérico

---

**Última Actualización**: 18 de Diciembre, 2025  
**Estado**: ✅ **IMPLEMENTADO**  
**Prioridad**: 🟡 Media → ✅ Completado

