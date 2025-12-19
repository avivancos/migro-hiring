# 🔧 Fix: Error 500 en DELETE /crm/contacts/{contact_id}

## 📅 Fecha: 2025-01-20

---

## 🐛 Problema

Error 500 al intentar eliminar un contacto del CRM:

```
DELETE https://api.migro.es/api/crm/contacts/90c7fce5-feed-453e-b0ba-eeab43d304ef
500 (Internal Server Error)
```

**Error completo:**
```json
{
  "detail": "Internal Server Error: (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) 
  <class 'asyncpg.exceptions.UndefinedColumnError'>: 
  column crm_contacts.max_contact_attempts does not exist
  [SQL: SELECT crm_contacts.name, crm_contacts.first_name, ... crm_contacts.max_contact_attempts, ...]
  [parameters: (UUID('90c7fce5-feed-453e-b0ba-eeab43d304ef'),)]"
}
```

### Causa

El endpoint `DELETE /crm/contacts/{contact_id}` estaba intentando seleccionar columnas de remarketing que no existen en la base de datos de producción:

- `max_contact_attempts`
- `current_attempt_number`
- `last_attempt_at`
- `next_attempt_scheduled_at`
- `remarketing_status`
- `remarketing_started_at`
- `total_attempts_made`
- `successful_contact`
- `preferred_channel`

Aunque ya existía una función `defer_remarketing_columns()` para manejar este problema, **el endpoint `delete_contact()` no la estaba usando**, a diferencia de otros endpoints como `delete_lead()` que sí la tenían implementada.

---

## ✅ Solución

Se aplicó el mismo fix que ya estaba implementado en otros endpoints: usar la función `defer_remarketing_columns()` para diferir la carga de las columnas de remarketing que pueden no existir aún en la base de datos.

### Endpoints Corregidos

#### 1. ✅ `DELETE /api/crm/contacts/{contact_id}`

**Archivo**: `app/api/endpoints/crm.py`  
**Función**: `delete_contact()`  
**Línea**: ~871

**Antes (problemático)**:
```python
@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(verify_crm_auth),
):
    """Delete a contact (soft delete)."""
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
@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(verify_crm_auth),
):
    """Delete a contact (soft delete)."""
    query = select(Contact).where(
        and_(Contact.id == contact_id, Contact.is_deleted == False)
    )
    # ✅ Defer remarketing columns that may not exist in database yet
    query = defer_remarketing_columns(query)
    
    result = await db.execute(query)
    contact = result.scalar_one_or_none()
    # ...
```

#### 2. ✅ `PUT /api/crm/contacts/{contact_id}`

**Archivo**: `app/api/endpoints/crm.py`  
**Función**: `update_contact()`  
**Línea**: ~835

**Cambio**: Agregado `defer_remarketing_columns()` al query para prevenir el mismo error en actualizaciones.

#### 3. ✅ `GET /api/crm/leads`

**Archivo**: `app/api/endpoints/crm.py`  
**Función**: `get_leads()`  
**Línea**: ~1008

**Cambio**: Agregado `defer_remarketing_columns()` al query para prevenir el mismo error en el listado de leads.

---

## 🔍 Función Helper

La función `defer_remarketing_columns()` está definida en `app/api/endpoints/crm.py` (líneas 17-32):

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

Esta función usa `defer()` de SQLAlchemy para diferir la carga de estas columnas, evitando errores cuando no existen en la base de datos.

---

## 📋 Endpoints que Ya Tenían el Fix

Los siguientes endpoints ya tenían implementado `defer_remarketing_columns()`:

- ✅ `GET /api/crm/contacts` (listado)
- ✅ `GET /api/crm/contacts/{contact_id}` (obtener individual)
- ✅ `GET /api/crm/leads/{lead_id}` (obtener lead)
- ✅ `PUT /api/crm/leads/{lead_id}` (actualizar lead)
- ✅ `DELETE /api/crm/leads/{lead_id}` (eliminar lead)
- ✅ `POST /api/crm/leads/{lead_id}/validate` (validar lead)
- ✅ `POST /api/crm/leads/{lead_id}/convert` (convertir lead)

---

## ✅ Resultado

Después de aplicar estos fixes:

1. ✅ El endpoint `DELETE /api/crm/contacts/{contact_id}` funciona correctamente
2. ✅ El endpoint `PUT /api/crm/contacts/{contact_id}` está protegido contra el mismo error
3. ✅ El endpoint `GET /api/crm/leads` está protegido contra el mismo error
4. ✅ Todos los endpoints de contactos ahora manejan correctamente las columnas de remarketing faltantes

---

## 🚀 Próximos Pasos

**Recomendación**: Ejecutar la migración que agrega las columnas de remarketing para eliminar la necesidad de este workaround:

```bash
alembic upgrade head
```

Las migraciones relevantes son:
- `z39_extend_contact_remarketing_fields`
- `z98_emergency_contact_remarketing_fields`
- `z99_fix_contact_remarketing_columns`

Una vez que las columnas existan en producción, se puede remover el uso de `defer_remarketing_columns()` de todos los endpoints.

---

## 📝 Archivos Modificados

- `app/api/endpoints/crm.py`
  - `delete_contact()` - Agregado `defer_remarketing_columns()`
  - `update_contact()` - Agregado `defer_remarketing_columns()`
  - `get_leads()` - Agregado `defer_remarketing_columns()`

---

## ✅ Testing

Para probar el fix:

```bash
# Eliminar un contacto
curl -X DELETE "https://api.migro.es/api/crm/contacts/{contact_id}" \
  -H "Authorization: Bearer {token}"

# Actualizar un contacto
curl -X PUT "https://api.migro.es/api/crm/contacts/{contact_id}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Nuevo Nombre"}'

# Listar leads
curl -X GET "https://api.migro.es/api/crm/leads" \
  -H "Authorization: Bearer {token}"
```

Todos estos endpoints ahora deberían funcionar correctamente sin errores 500 relacionados con columnas faltantes.

---

**Última Actualización**: 20 de Enero, 2025  
**Estado**: ✅ **FIX APLICADO EN BACKEND**


