# Backend: Filtrado de Búsqueda en Oportunidades

**Fecha**: 2025-01-29  
**Módulo**: Backend - CRM Opportunities  
**Prioridad**: 🔴 Alta  
**Estado**: 📋 Pendiente de implementación  
**Módulo**: Backend - CRM Opportunities

---

## 📋 Resumen Ejecutivo

El endpoint `GET /api/crm/opportunities` debe soportar un parámetro de búsqueda `search` que filtre las oportunidades por nombre, apellido, email y ciudad del contacto asociado.

---

## 🎯 Objetivo

Implementar un filtro de búsqueda que permita buscar oportunidades por información del contacto asociado:
- Nombre completo del contacto
- Nombre (first_name)
- Apellido (last_name)
- Email
- Ciudad

---

## 📍 Endpoint Afectado

**`GET /api/crm/opportunities`**

### Parámetro Nuevo/Mejora

**Query Parameter**: `search` (string, opcional)

- **Descripción**: Texto de búsqueda para filtrar oportunidades por información del contacto
- **Tipo**: `string`
- **Requerido**: No
- **Ejemplo**: `?search=rafael` o `?search=juan perez`

---

## 🔧 Implementación Requerida

### 1. Lógica de Filtrado

Cuando se proporciona el parámetro `search`, el backend debe:

1. **Hacer JOIN** entre `lead_opportunities` y `crm_contacts` (ya se hace para expandir contactos)
2. **Aplicar filtros ILIKE** (case-insensitive) en los siguientes campos del contacto:
   - `contact.name` (nombre completo)
   - `contact.first_name` (nombre)
   - `contact.last_name` (apellido)
   - `contact.email` (email)
   - `contact.city` (ciudad)
3. **Usar búsqueda parcial**: El texto debe buscar coincidencias parciales (usar `ILIKE '%search%'`)
4. **Usar OR**: Si el texto coincide con cualquiera de los campos, la oportunidad debe incluirse en los resultados

### 2. Código de Ejemplo (SQLAlchemy)

```python
from sqlalchemy import or_, func
from sqlalchemy.orm import joinedload, contains_eager

async def list_opportunities(
    db: AsyncSession,
    search: Optional[str] = None,
    status: Optional[str] = None,
    assigned_to: Optional[uuid.UUID] = None,
    page: int = 1,
    limit: int = 50,
    # ... otros filtros
) -> tuple[List[LeadOpportunity], int]:
    
    # Query base con JOIN para expandir contactos (ya existente)
    query = (
        select(LeadOpportunity)
        .join(Contact, LeadOpportunity.contact_id == Contact.id)
        .options(contains_eager(LeadOpportunity.contact))
    )
    
    # Aplicar filtro de búsqueda si se proporciona
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Contact.name.ilike(search_term),
                Contact.first_name.ilike(search_term),
                Contact.last_name.ilike(search_term),
                Contact.email.ilike(search_term),
                Contact.city.ilike(search_term),
            )
        )
    
    # Aplicar otros filtros existentes (status, assigned_to, etc.)
    if status:
        query = query.filter(LeadOpportunity.status == status)
    
    if assigned_to:
        query = query.filter(LeadOpportunity.assigned_to_id == assigned_to)
    
    # Contar total antes de paginación
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Aplicar paginación
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    # Ejecutar query
    result = await db.execute(query)
    opportunities = list(result.unique().scalars().all())
    
    return opportunities, total
```

### 3. Esquema Pydantic (FastAPI)

El endpoint debe aceptar el parámetro `search`:

```python
@router.get("/opportunities", response_model=OpportunityListResponse)
async def list_opportunities(
    db: AsyncSession = Depends(get_db),
    search: Optional[str] = Query(None, description="Búsqueda por nombre, email o ciudad del contacto"),
    status: Optional[str] = Query(None),
    assigned_to: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    # ... otros parámetros
):
    opportunities, total = await opportunity_service.list_opportunities(
        db=db,
        search=search,
        status=status,
        assigned_to=assigned_to,
        page=page,
        limit=limit,
    )
    
    # ... serializar y retornar
```

---

## ✅ Comportamiento Esperado

### Casos de Uso

1. **Búsqueda por nombre completo**: `?search=juan perez`
   - Debe encontrar contactos con nombre "Juan Pérez"

2. **Búsqueda por nombre**: `?search=juan`
   - Debe encontrar cualquier contacto con "juan" en nombre, apellido, email o ciudad

3. **Búsqueda por email**: `?search=juan@example.com`
   - Debe encontrar contactos con ese email

4. **Búsqueda por ciudad**: `?search=madrid`
   - Debe encontrar contactos en Madrid

5. **Búsqueda case-insensitive**: `?search=JUAN`
   - Debe encontrar "Juan", "juan", "JUAN", etc.

6. **Búsqueda parcial**: `?search=raf`
   - Debe encontrar "Rafael", "Rafaela", etc.

### Ejemplos de URLs

```
GET /api/crm/opportunities?search=rafael
GET /api/crm/opportunities?search=juan perez&status=assigned
GET /api/crm/opportunities?search=madrid&page=1&limit=50
GET /api/crm/opportunities?search=juan@example.com&assigned_to=uuid-del-usuario
```

---

## 🔍 Validación y Testing

### Casos de Prueba Recomendados

1. **Búsqueda sin resultados**: `?search=xyz123nonexistent`
   - Debe retornar lista vacía (`opportunities: []`, `total: 0`)

2. **Búsqueda con resultados múltiples**: `?search=juan`
   - Debe retornar todas las oportunidades con contactos que contengan "juan"

3. **Búsqueda combinada con otros filtros**: `?search=juan&status=assigned`
   - Debe aplicar ambos filtros (búsqueda Y status)

4. **Búsqueda case-insensitive**: `?search=JUAN` vs `?search=juan`
   - Debe retornar los mismos resultados

5. **Búsqueda con espacios**: `?search=juan perez`
   - Debe funcionar correctamente (trim antes de buscar)

6. **Búsqueda vacía**: `?search=` o sin parámetro
   - No debe aplicar filtro de búsqueda, retornar todas las oportunidades (según otros filtros)

---

## ⚠️ Consideraciones Importantes

### 1. Rendimiento

- **Índices**: Asegurar que existen índices en las columnas de búsqueda:
  - `crm_contacts.name`
  - `crm_contacts.first_name`
  - `crm_contacts.last_name`
  - `crm_contacts.email`
  - `crm_contacts.city`

```sql
-- Ejemplo de índices (ajustar según necesidad)
CREATE INDEX IF NOT EXISTS idx_contacts_name ON crm_contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_city ON crm_contacts(city);
```

### 2. Relación con Contactos

- El JOIN entre `lead_opportunities` y `crm_contacts` ya debería existir para expandir contactos
- Asegurar que el filtro de búsqueda se aplica **antes** de la paginación
- Usar `result.unique()` después del JOIN para evitar duplicados

### 3. Compatibilidad con Filtros Existentes

- El filtro de búsqueda debe ser **compatible** con otros filtros (status, assigned_to, etc.)
- Se deben aplicar en **AND** (todos los filtros deben cumplirse)

### 4. Límite de Resultados

- El frontend puede solicitar hasta 1000 resultados cuando hay búsqueda activa
- Asegurar que el límite se respeta correctamente después del filtrado

---

## 📊 Formato de Respuesta

La respuesta debe mantener el formato existente:

```json
{
  "opportunities": [
    {
      "id": "uuid",
      "contact_id": "uuid",
      "contact": {
        "id": "uuid",
        "name": "Rafael García",
        "first_name": "Rafael",
        "last_name": "García",
        "email": "rafael@example.com",
        "city": "Madrid",
        // ... otros campos
      },
      // ... otros campos de la oportunidad
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 50,
  "total_pages": 1
}
```

---

## 🔄 Estado Actual del Frontend

El frontend ya está preparado para usar este parámetro:

- ✅ Envía el parámetro `search` cuando el usuario escribe en el campo de búsqueda
- ✅ Aumenta el límite a 1000 cuando hay búsqueda activa
- ✅ Maneja la respuesta paginada del backend
- ✅ Tiene un **filtro local como respaldo** (implementado en `AdminOpportunities.tsx`)

**Nota**: Actualmente el frontend tiene un filtro local que funciona como respaldo, pero el backend debería hacer el filtrado para mejor rendimiento.

---

## 🚀 Prioridad de Implementación

**Prioridad**: 🔴 Alta

**Razón**: 
- La búsqueda es una funcionalidad crítica para encontrar oportunidades
- El frontend ya está enviando el parámetro pero no está funcionando
- Los usuarios necesitan poder buscar por nombre del contacto

---

## 📝 Notas Adicionales

1. **Búsqueda en múltiples campos**: Se recomienda buscar en varios campos (nombre, email, ciudad) para dar más flexibilidad al usuario

2. **Búsqueda parcial**: Usar `ILIKE '%term%'` permite búsquedas parciales (ej: "raf" encuentra "Rafael")

3. **Case-insensitive**: Usar `ILIKE` en lugar de `LIKE` para búsquedas case-insensitive

4. **Trim y validación**: Asegurar hacer `.strip()` del parámetro search antes de usarlo

5. **Seguridad**: Considerar sanitizar el parámetro search para prevenir SQL injection (aunque SQLAlchemy ya lo hace automáticamente)

---

## ✅ Checklist de Implementación

- [ ] Agregar parámetro `search` al endpoint `/api/crm/opportunities`
- [ ] Implementar filtro con JOIN entre `lead_opportunities` y `crm_contacts`
- [ ] Aplicar filtros ILIKE en: name, first_name, last_name, email, city
- [ ] Asegurar que el filtro se aplica antes de paginación
- [ ] Probar búsqueda case-insensitive
- [ ] Probar búsqueda parcial
- [ ] Probar combinación con otros filtros (status, assigned_to)
- [ ] Verificar índices en columnas de búsqueda
- [ ] Actualizar documentación de la API (si existe)
- [ ] Probar con límites grandes (1000 resultados)

---

## 📚 Referencias Relacionadas

- [Expansión de Contactos en Oportunidades](./BACKEND_OPPORTUNITIES_CONTACT_EXPANSION.md)
- [Filtrado de Contactos](./BACKEND_CONTACTS_FILTER_BY_USER_OPPORTUNITIES.md)

---

**Última actualización**: 2025-01-29

