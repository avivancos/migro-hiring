# Backend: Filtrado de Contactos por Usuario Actual y Oportunidades Asignadas

**Fecha**: 2025-01-28  
**Prioridad**: 🔴 Alta  
**Estado**: 📋 Pendiente de implementación  
**Módulo**: Backend - CRM Contacts

---

## 📋 Resumen Ejecutivo

El endpoint `GET /api/crm/contacts` debe mostrar **únicamente** los contactos que tienen oportunidades asignadas al usuario actual (el usuario que tiene la sesión activa). La relación contacto-oportunidad es **1:1**, es decir, cada contacto tiene exactamente una oportunidad asociada.

---

## 🎯 Objetivo

Filtrar la lista de contactos para que:
- **Agentes**: Solo aparezcan contactos que tienen oportunidades asignadas al usuario actual
- **Administradores**: Vean **ABSOLUTAMENTE TODO** sin ninguna limitación (todos los contactos, incluso sin oportunidades)

Esto garantiza que cada agente solo vea los contactos relacionados con sus propias asignaciones, mientras que los administradores tienen acceso completo.

---

## 🔗 Relación Contacto-Oportunidad

```
Contacto (1) ←→ (1) Oportunidad
```

**Relaciones:**
- Contacto → Oportunidad: **1:1** (Cada contacto tiene exactamente 1 oportunidad)
- Oportunidad → Usuario: **N:1** (Muchas oportunidades pueden estar asignadas a un usuario)
- Oportunidad tiene campo `assigned_to_id` que referencia al usuario CRM asignado

**Estructura de Datos:**
- `crm_contacts`: Tabla de contactos
- `lead_opportunities`: Tabla de oportunidades
  - `contact_id`: UUID del contacto (FK a `crm_contacts.id`)
  - `assigned_to_id`: UUID del usuario CRM asignado (FK a `crm_users.id`)

---

## 📍 Implementación Requerida

### Endpoint Afectado

**`GET /api/crm/contacts`**

### Cambios Necesarios

1. **Obtener el usuario actual** de la sesión (`current_user`)
2. **Hacer JOIN** entre `crm_contacts` y `lead_opportunities`
3. **Filtrar** por `assigned_to_id = current_user.id` (o el ID del usuario CRM correspondiente)
4. **Mantener** todos los filtros existentes (búsqueda, paginación, etc.)

---

## 🔧 Implementación Backend

### Opción 1: JOIN con Oportunidades (Recomendada)

```python
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from app.models.crm import Contact, LeadOpportunity
from app.core.deps import get_current_admin_user

@router.get("/contacts", response_model=schemas.ContactsListResponse)
async def get_contacts(
    db: Session = Depends(get_db),
    company_id: Optional[int] = None,
    query: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_admin_user)
):
    """
    Obtener lista de contactos.
    
    - AGENTES: Solo contactos con oportunidades asignadas al usuario actual
    - ADMINISTRADORES: TODOS los contactos sin ninguna limitación
    """
    
    # Verificar si es administrador
    is_admin = (
        getattr(current_user, 'is_superuser', False) or 
        getattr(current_user, 'role', None) == 'admin' or
        getattr(current_user, 'role', None) == 'superuser'
    )
    
    if is_admin:
        # ADMIN: Ver TODOS los contactos sin ninguna limitación
        # No aplicar filtro de oportunidades ni de usuario
        query_db = db.query(Contact).filter(Contact.is_deleted == False)
    else:
        # AGENTE: Filtrar solo contactos con oportunidades asignadas al usuario actual
        # Obtener el ID del usuario CRM correspondiente al usuario actual
        # OPCIÓN A: Si current_user.id es directamente el crm_user.id
        crm_user_id = current_user.id
        
        # OPCIÓN B: Si necesitas buscar el crm_user por user.id
        # from app.models.crm import CRMUser
        # crm_user = db.query(CRMUser).filter(CRMUser.user_id == current_user.id).first()
        # if not crm_user:
        #     return {"_embedded": {"contacts": []}, "_page": {"page": page, "limit": limit, "total": 0}}
        # crm_user_id = crm_user.id
        
        # Query base: JOIN entre contactos y oportunidades
        query_db = db.query(Contact).join(
            LeadOpportunity,
            Contact.id == LeadOpportunity.contact_id
        ).filter(
            and_(
                Contact.is_deleted == False,
                LeadOpportunity.assigned_to_id == crm_user_id  # Filtrar por usuario actual
            )
        )
    
    # Aplicar filtros existentes
    if company_id:
        query_db = query_db.filter(Contact.company_id == company_id)
    
    if query:
        query_db = query_db.filter(
            (Contact.first_name.ilike(f"%{query}%")) |
            (Contact.last_name.ilike(f"%{query}%")) |
            (Contact.email.ilike(f"%{query}%"))
        )
    
    # Contar total (antes de paginación)
    total = query_db.count()
    
    # Aplicar paginación
    offset = (page - 1) * limit
    contacts = query_db.offset(offset).limit(limit).all()
    
    return {
        "_embedded": {"contacts": contacts},
        "_page": {"page": page, "limit": limit, "total": total}
    }
```

### Opción 2: Subquery (Alternativa)

```python
from sqlalchemy import select, exists

@router.get("/contacts", response_model=schemas.ContactsListResponse)
async def get_contacts(
    db: Session = Depends(get_db),
    company_id: Optional[int] = None,
    query: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_admin_user)
):
    """
    Obtener lista de contactos usando subquery para filtrar por oportunidades asignadas.
    """
    
    # Obtener ID del usuario CRM
    crm_user_id = current_user.id  # Ajustar según estructura
    
    # Subquery: contactos que tienen oportunidades asignadas al usuario actual
    subquery = select(LeadOpportunity.contact_id).where(
        and_(
            LeadOpportunity.assigned_to_id == crm_user_id,
            LeadOpportunity.contact_id.isnot(None)
        )
    ).distinct()
    
    # Query principal: contactos que están en la subquery
    query_db = db.query(Contact).filter(
        and_(
            Contact.is_deleted == False,
            Contact.id.in_(subquery)
        )
    )
    
    # Aplicar filtros existentes
    if company_id:
        query_db = query_db.filter(Contact.company_id == company_id)
    
    if query:
        query_db = query_db.filter(
            (Contact.first_name.ilike(f"%{query}%")) |
            (Contact.last_name.ilike(f"%{query}%")) |
            (Contact.email.ilike(f"%{query}%"))
        )
    
    # Contar y paginar
    total = query_db.count()
    offset = (page - 1) * limit
    contacts = query_db.offset(offset).limit(limit).all()
    
    return {
        "_embedded": {"contacts": contacts},
        "_page": {"page": page, "limit": limit, "total": total}
    }
```

---

## 🔍 Consideraciones Importantes

### 1. Mapeo de Usuario Actual a Usuario CRM

**Problema**: El `current_user` puede ser de la tabla `users`, pero `assigned_to_id` en oportunidades referencia a `crm_users`.

**Solución**: Necesitas mapear correctamente:
- Si `current_user` es directamente un `CRMUser`, usar `current_user.id`
- Si `current_user` es un `User` y existe relación con `CRMUser`, buscar el `CRMUser` correspondiente

**Ejemplo de mapeo:**
```python
# Si existe relación directa
crm_user = db.query(CRMUser).filter(
    CRMUser.user_id == current_user.id
).first()

if not crm_user:
    # Usuario no tiene perfil CRM, retornar lista vacía
    return {"_embedded": {"contacts": []}, "_page": {"page": page, "limit": limit, "total": 0}}

crm_user_id = crm_user.id
```

### 2. Relación 1:1 Contacto-Oportunidad

**Garantía**: Asegurar que la consulta respete la relación 1:1. Si un contacto tiene múltiples oportunidades, usar `DISTINCT` o `GROUP BY`:

```python
# Si puede haber múltiples oportunidades por contacto (aunque debería ser 1:1)
query_db = db.query(Contact).join(
    LeadOpportunity,
    Contact.id == LeadOpportunity.contact_id
).filter(
    and_(
        Contact.is_deleted == False,
        LeadOpportunity.assigned_to_id == crm_user_id
    )
).distinct()  # Evitar duplicados
```

### 3. Contactos sin Oportunidades

**Comportamiento**: Los contactos que no tienen oportunidades asignadas al usuario actual **NO** deben aparecer en la lista.

### 4. Permisos de Administrador

**IMPORTANTE**: Los administradores (`admin`, `superuser`) deben ver **ABSOLUTAMENTE TODO** sin ninguna limitación. No se aplica ningún filtro de usuario para ellos.

**Lógica condicional:**

```python
# Verificar si es administrador
is_admin = (
    getattr(current_user, 'is_superuser', False) or 
    getattr(current_user, 'role', None) == 'admin' or
    getattr(current_user, 'role', None) == 'superuser'
)

if is_admin:
    # ADMIN: Ver TODOS los contactos sin ninguna limitación
    # No aplicar filtro de oportunidades ni de usuario
    query_db = db.query(Contact).filter(Contact.is_deleted == False)
else:
    # AGENTE/OTROS: Filtrar solo contactos con oportunidades asignadas al usuario actual
    query_db = db.query(Contact).join(
        LeadOpportunity,
        Contact.id == LeadOpportunity.contact_id
    ).filter(
        and_(
            Contact.is_deleted == False,
            LeadOpportunity.assigned_to_id == crm_user_id
        )
    )
```

---

## 📊 SQL Equivalente

La consulta SQL equivalente sería:

**Para Agentes:**
```sql
SELECT DISTINCT c.*
FROM crm_contacts c
INNER JOIN lead_opportunities lo ON (
    lo.contact_id = c.id
    AND lo.assigned_to_id = :crm_user_id
)
WHERE c.is_deleted = false
  AND (:company_id IS NULL OR c.company_id = :company_id)
  AND (
    :query IS NULL OR
    c.first_name ILIKE '%' || :query || '%' OR
    c.last_name ILIKE '%' || :query || '%' OR
    c.email ILIKE '%' || :query || '%'
  )
ORDER BY c.created_at DESC
LIMIT :limit
OFFSET :offset;
```

**Para Administradores (SIN filtro de oportunidades):**
```sql
SELECT c.*
FROM crm_contacts c
WHERE c.is_deleted = false
  AND (:company_id IS NULL OR c.company_id = :company_id)
  AND (
    :query IS NULL OR
    c.first_name ILIKE '%' || :query || '%' OR
    c.last_name ILIKE '%' || :query || '%' OR
    c.email ILIKE '%' || :query || '%'
  )
ORDER BY c.created_at DESC
LIMIT :limit
OFFSET :offset;
```

---

## 🧪 Testing

### Casos de Prueba

1. **Agente con oportunidades asignadas**: Debe ver solo sus contactos (con oportunidades asignadas a él)
2. **Agente sin oportunidades**: Debe ver lista vacía
3. **Admin ve TODO**: Debe ver TODOS los contactos sin ninguna limitación (incluso sin oportunidades)
4. **Búsqueda funciona**: Filtros de búsqueda deben seguir funcionando para todos los roles
5. **Paginación funciona**: Paginación debe respetar el filtro de usuario (solo para agentes)

### Ejemplo de Test

```python
async def test_get_contacts_filtered_by_user():
    # Crear usuario y oportunidades
    user = create_user()
    crm_user = create_crm_user(user_id=user.id)
    
    contact1 = create_contact()
    contact2 = create_contact()
    
    # Oportunidad asignada al usuario
    opportunity1 = create_opportunity(contact_id=contact1.id, assigned_to_id=crm_user.id)
    
    # Oportunidad asignada a otro usuario
    other_user = create_crm_user()
    opportunity2 = create_opportunity(contact_id=contact2.id, assigned_to_id=other_user.id)
    
    # Llamar al endpoint como user
    response = await client.get(
        "/api/crm/contacts",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Solo debe ver contact1 (el que tiene oportunidad asignada a él)
    assert len(data["_embedded"]["contacts"]) == 1
    assert data["_embedded"]["contacts"][0]["id"] == str(contact1.id)
```

---

## 📝 Notas Adicionales

1. **Rendimiento**: Considerar agregar índices en:
   - `lead_opportunities.contact_id`
   - `lead_opportunities.assigned_to_id`
   - `crm_contacts.id`

2. **Compatibilidad**: Mantener todos los parámetros existentes para no romper el frontend

3. **Logging**: Agregar logs para debugging:
   ```python
   logger.info(f"Filtrando contactos para usuario CRM: {crm_user_id}, Total encontrados: {total}")
   ```

---

## ✅ Checklist de Implementación

- [ ] Modificar endpoint `GET /api/crm/contacts`
- [ ] Implementar JOIN con `lead_opportunities`
- [ ] Filtrar por `assigned_to_id = current_user.id`
- [ ] Mapear correctamente `current_user` a `crm_user_id`
- [ ] Mantener todos los filtros existentes
- [ ] Agregar lógica para admins (opcional)
- [ ] Agregar índices en base de datos si es necesario
- [ ] Probar con diferentes usuarios
- [ ] Verificar paginación funciona correctamente
- [ ] Verificar búsqueda funciona correctamente

---

## 📅 Fecha de Creación

2025-01-28

