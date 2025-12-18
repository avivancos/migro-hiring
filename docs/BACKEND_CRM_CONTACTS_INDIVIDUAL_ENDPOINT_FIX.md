# 🚨 URGENTE: Error 500 en GET /api/crm/contacts/{id}

## 📋 Problema

El endpoint individual de contactos (`GET /api/crm/contacts/{id}`) **aún tiene el mismo error** que tenía el endpoint de lista antes de ser corregido.

### Error Actual

```
GET /api/crm/contacts/8f2f4a02-5282-4493-9b8e-db3750c2b6f5
Status: 500 (Internal Server Error)

Error: column crm_contacts.max_contact_attempts does not exist
```

Este error ocurre cuando:
1. El frontend intenta cargar nombres de contactos en el calendario
2. Un usuario hace clic en una llamada para ver el detalle del contacto
3. Cualquier componente intenta obtener un contacto individual por ID

## ✅ Solución

Aplicar el **mismo fix** que se aplicó en `list_contacts()` al endpoint `get_contact(id: str)`.

### Archivo: `app/api/endpoints/crm.py`

**Función a modificar**: `get_contact(contact_id: str, ...)`

**Código actual (problemático)**:
```python
@router.get("/contacts/{contact_id}")
async def get_contact(
    contact_id: str,
    db: AsyncSession = Depends(get_db),
    # ...
):
    query = select(Contact).where(
        Contact.id == contact_id,
        Contact.is_deleted == False
    )
    result = await db.execute(query)
    contact = result.scalar_one_or_none()
    # ...
```

**Código corregido** (con `defer()` como en `list_contacts()`):
```python
@router.get("/contacts/{contact_id}")
async def get_contact(
    contact_id: str,
    db: AsyncSession = Depends(get_db),
    # ...
):
    query = select(Contact).options(
        defer(Contact.max_contact_attempts),
        defer(Contact.current_attempt_number),
        defer(Contact.last_attempt_at),
        defer(Contact.next_attempt_scheduled_at),
        defer(Contact.remarketing_status),
        defer(Contact.remarketing_started_at),
        defer(Contact.total_attempts_made),
        defer(Contact.successful_contact),
        defer(Contact.preferred_channel),
    ).where(
        Contact.id == contact_id,
        Contact.is_deleted == False
    )
    result = await db.execute(query)
    contact = result.scalar_one_or_none()
    # ... resto del código sin cambios
```

## 🔍 Endpoints Afectados

Este mismo problema puede afectar a **cualquier endpoint que obtenga un contacto individual**, como:
- `GET /api/crm/contacts/{id}` ✅ Identificado
- Posiblemente otros endpoints que hagan `select(Contact).where(Contact.id == ...)`

## ✅ Checklist

- [ ] Buscar todas las funciones que usan `select(Contact).where(Contact.id == ...)`
- [ ] Aplicar el mismo fix de `defer()` a todas ellas
- [ ] Probar que `GET /api/crm/contacts/{id}` funciona correctamente
- [ ] Verificar que el calendario puede cargar nombres de contactos sin errores

## 📞 Impacto

**Alta Prioridad** porque:
- ❌ Impide que los usuarios vean detalles de contactos
- ❌ Impide que el calendario muestre nombres de contactos
- ❌ Rompe la navegación desde llamadas a contactos

---

**Fecha**: 18 de Diciembre, 2025  
**Prioridad**: 🔴 **URGENTE**  
**Relacionado con**: `docs/BACKEND_CRM_CONTACTS_ISSUES.md`

