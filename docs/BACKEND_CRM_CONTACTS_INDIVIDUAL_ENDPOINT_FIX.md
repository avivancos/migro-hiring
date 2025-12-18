# 🚨 Fix: Error 500 en GET /api/crm/contacts/{id}

## 📋 Problema

El endpoint individual de contactos (`GET /api/crm/contacts/{id}`) tenía el mismo error que el endpoint de lista antes de ser corregido.

### Error Original

```
GET /api/crm/contacts/{id}
Status: 500 (Internal Server Error)
Error: column crm_contacts.max_contact_attempts does not exist
```

### Impacto

Este error ocurría cuando:
1. El frontend intentaba cargar nombres de contactos en el calendario
2. Un usuario hacía clic en una llamada para ver el detalle del contacto
3. Cualquier componente intentaba obtener un contacto individual por ID

---

## ✅ Solución Implementada

### 1. Función Helper Creada

**Archivo**: `app/api/endpoints/crm.py`

Se creó una función helper para evitar repetir código:

```python
def defer_remarketing_columns(query):
    """Defer remarketing columns that may not exist in database yet.
    
    This prevents errors if the migration hasn't been run.
    """
    return query.options(
        defer(Contact.max_contact_attempts),
        defer(Contact.current_attempt_number),
        defer(Contact.last_attempt_at),
        defer(Contact.next_attempt_scheduled_at),
        defer(Contact.remarketing_status),
        defer(Contact.remarketing_started_at),
        defer(Contact.total_attempts_made),
        defer(Contact.successful_contact),
        defer(Contact.preferred_channel),
    )
```

### 2. Endpoints Corregidos

Se aplicó el fix a **todos los endpoints que obtienen contactos por ID**:

#### ✅ `GET /api/crm/contacts/{contact_id}`
- **Función**: `get_contact()`
- **Línea**: ~672
- **Fix aplicado**: ✅

#### ✅ `GET /api/crm/leads/{lead_id}` (compatibilidad)
- **Función**: `get_lead()`
- **Línea**: ~1050
- **Fix aplicado**: ✅

#### ✅ `PUT /api/crm/leads/{lead_id}` (compatibilidad)
- **Función**: `update_lead()`
- **Línea**: ~1180
- **Fix aplicado**: ✅

#### ✅ `POST /api/crm/leads/{lead_id}/validate` (compatibilidad)
- **Función**: `validate_lead()`
- **Línea**: ~1247
- **Fix aplicado**: ✅

#### ✅ `DELETE /api/crm/leads/{lead_id}` (compatibilidad)
- **Función**: `delete_lead()`
- **Línea**: ~1302
- **Fix aplicado**: ✅

#### ✅ `POST /api/crm/leads/{lead_id}/convert` (compatibilidad)
- **Función**: `convert_lead_to_contact()`
- **Línea**: ~1329
- **Fix aplicado**: ✅

### 3. Código Antes y Después

**Antes (problemático)**:
```python
@router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(verify_crm_auth),
) -> ContactResponse:
    """Get a contact by ID."""
    result = await db.execute(
        select(Contact).where(
            and_(Contact.id == contact_id, Contact.is_deleted == False)
        )
    )
    contact = result.scalar_one_or_none()
    # ...
```

**Después (corregido)**:
```python
@router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(verify_crm_auth),
) -> ContactResponse:
    """Get a contact by ID."""
    query = select(Contact).where(
        and_(Contact.id == contact_id, Contact.is_deleted == False)
    )
    # ✅ Defer remarketing columns that may not exist in database yet
    query = defer_remarketing_columns(query)
    
    result = await db.execute(query)
    contact = result.scalar_one_or_none()
    # ...
```

---

## 📝 Archivos Modificados

### 1. Endpoint Principal
- **Archivo**: `app/api/endpoints/crm.py`
- **Función**: `get_contact()`
- **Cambio**: Agregado `defer_remarketing_columns()` al query

### 2. Endpoints de Compatibilidad (Leads)
- **Archivo**: `app/api/endpoints/crm.py`
- **Funciones**: `get_lead()`, `update_lead()`, `validate_lead()`, `delete_lead()`, `convert_lead_to_contact()`
- **Cambio**: Agregado `defer_remarketing_columns()` a todos los queries

### 3. Función Helper
- **Archivo**: `app/api/endpoints/crm.py`
- **Función**: `defer_remarketing_columns()`
- **Descripción**: Helper para evitar repetir código

---

## ✅ Estado Actual

- ✅ **RESUELTO** - Todos los endpoints que obtienen contactos por ID ahora funcionan correctamente
- ✅ **Funcional**: El frontend puede obtener detalles de contactos sin errores
- ✅ **Funcional**: El calendario puede cargar nombres de contactos correctamente

---

## 🔍 Verificación

### Verificar que el endpoint funciona:
```bash
# Debe retornar 200 OK con los datos del contacto
curl -X GET "https://api.migro.es/api/crm/contacts/{contact_id}" \
  -H "X-CRM-Auth: your-token"
```

### Verificar que el calendario funciona:
```bash
# Debe retornar llamadas con entity_id y permitir obtener contactos
curl -X GET "https://api.migro.es/api/crm/calls/calendar?start_date=2025-12-01T00:00:00Z&end_date=2026-01-01T00:00:00Z" \
  -H "X-CRM-Auth: your-token"
```

---

## 📚 Referencias

- **Documentación Completa**: `docs/CRM_BACKEND_FIXES.md`
- **Problema Original**: `docs/BACKEND_CRM_CONTACTS_ISSUES.md`
- **Modelo Contact**: `app/models/crm_contact.py`
- **Endpoint CRM**: `app/api/endpoints/crm.py`

---

## 🚀 Próximos Pasos

### Inmediato (Ya Funciona)
- ✅ El endpoint `/api/crm/contacts/{id}` ya funciona correctamente
- ✅ Todos los endpoints relacionados ya funcionan correctamente

### Para Solución Permanente (Opcional pero Recomendado)

Ejecutar migración en producción para agregar las columnas permanentemente:

```bash
# Opción 1: Alembic (recomendado)
docker compose exec app alembic upgrade head

# Opción 2: Script Python
docker compose exec app python scripts/add_remarketing_columns.py

# Opción 3: SQL directo (ver docs/CRM_BACKEND_FIXES.md para SQL completo)
```

---

**Última Actualización**: 18 de Diciembre, 2025  
**Estado**: ✅ **RESUELTO**  
**Prioridad**: 🔴 Urgente → ✅ Resuelto

