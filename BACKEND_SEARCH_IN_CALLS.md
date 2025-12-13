# 🔍 Backend: Búsqueda de Contactos en Llamadas Asociadas

## ✅ Estado: IMPLEMENTADO

Esta funcionalidad ya está implementada en el backend. El endpoint `GET /api/crm/contacts` ahora busca automáticamente en el contenido de las llamadas asociadas.

## 📋 Requerimiento (Completado)

El endpoint de búsqueda de contactos (`GET /crm/contacts`) busca también en el contenido de las llamadas asociadas a cada contacto.

### Comportamiento Implementado

Cuando se proporciona el parámetro `search`, el backend busca contactos que:
1. **Coincidan directamente**: nombre, email, teléfono
2. **Tengan llamadas asociadas** cuyo contenido contenga el término de búsqueda en:
   - `resumen_llamada` ✅
   - `call_result` ✅
   - `transcription` ✅ (nuevo campo)

---

## 🎯 Endpoint Afectado

### `GET /api/crm/contacts`

**Parámetros actuales:**
- `search` o `query`: Búsqueda en nombre, email, teléfono
- `page`: Número de página
- `limit`: Límite de resultados
- Otros filtros (grading, nacionalidad, etc.)

**Parámetros a mantener:**
- Todos los parámetros actuales deben seguir funcionando igual

**Comportamiento nuevo:**
- Si `search` o `query` está presente, buscar también en llamadas asociadas

---

## 🔧 Implementación Backend

### Opción 1: Búsqueda Automática (Recomendada)

El backend busca automáticamente en llamadas cuando hay un término de búsqueda, sin necesidad de parámetros adicionales.

#### Lógica SQL (PostgreSQL)

```sql
-- Ejemplo de consulta que busca en contactos Y en llamadas asociadas
SELECT DISTINCT c.*
FROM crm_contacts c
LEFT JOIN crm_calls calls ON (
  calls.entity_id = c.id::text 
  AND calls.entity_type IN ('contacts', 'contact')
  AND calls.is_deleted = false
)
WHERE c.is_deleted = false
  AND (
    -- Búsqueda en campos del contacto (actual)
    c.first_name ILIKE '%{search_term}%'
    OR c.last_name ILIKE '%{search_term}%'
    OR c.email ILIKE '%{search_term}%'
    OR c.phone ILIKE '%{search_term}%'
    
    -- Búsqueda en llamadas asociadas (NUEVO)
    OR calls.resumen_llamada ILIKE '%{search_term}%'
    OR calls.call_result ILIKE '%{search_term}%'
    OR calls.notes ILIKE '%{search_term}%'
  )
ORDER BY c.created_at DESC
LIMIT {limit} OFFSET {offset};
```

#### Implementación Python (FastAPI/SQLAlchemy)

```python
@router.get("/contacts", response_model=schemas.ContactsListResponse)
async def get_contacts(
    db: Session = Depends(get_db),
    search: Optional[str] = None,  # O query, según tu implementación actual
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    # ... otros parámetros
    current_user = Depends(get_current_admin_user)
):
    """Obtener lista de contactos con búsqueda en llamadas asociadas"""
    query_db = db.query(models.Contact).filter(models.Contact.is_deleted == False)
    
    # Aplicar otros filtros (company_id, etc.)
    # ...
    
    # Búsqueda mejorada: incluye llamadas asociadas
    if search:
        search_term = f"%{search}%"
        
        # Subconsulta para obtener IDs de contactos con llamadas que coinciden
        calls_subquery = db.query(models.Call.entity_id).filter(
            models.Call.entity_type.in_(['contacts', 'contact']),
            models.Call.is_deleted == False,
            or_(
                models.Call.resumen_llamada.ilike(search_term),
                models.Call.call_result.ilike(search_term),
                models.Call.notes.ilike(search_term)
            )
        ).distinct()
        
        # Filtrar contactos que coinciden directamente O tienen llamadas que coinciden
        query_db = query_db.filter(
            or_(
                # Búsqueda en campos del contacto
                models.Contact.first_name.ilike(search_term),
                models.Contact.last_name.ilike(search_term),
                models.Contact.email.ilike(search_term),
                models.Contact.phone.ilike(search_term),
                # Búsqueda en llamadas asociadas
                models.Contact.id.in_(calls_subquery)
            )
        )
    
    total = query_db.count()
    offset = (page - 1) * limit
    contacts = query_db.offset(offset).limit(limit).all()
    
    return {
        "_embedded": {"contacts": contacts},
        "_page": {"page": page, "limit": limit, "total": total}
    }
```

---

### Opción 2: Parámetro Opcional (Alternativa)

Si prefieres control explícito, puedes agregar un parámetro opcional:

```python
@router.get("/contacts")
async def get_contacts(
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    search_in_calls: bool = Query(True, description="Buscar también en llamadas asociadas"),  # NUEVO
    # ... otros parámetros
):
    # ...
    if search and search_in_calls:
        # Incluir búsqueda en llamadas
    elif search:
        # Solo búsqueda normal
```

**Nota:** La Opción 1 es más simple y transparente para el frontend.

---

## 📊 Ejemplos de Uso

### Request 1: Búsqueda que encuentra contacto por nombre
```
GET /api/crm/contacts?search=juan&page=1&limit=50
```

**Resultado:** Contactos cuyo nombre, email o teléfono contenga "juan"

### Request 2: Búsqueda que encuentra contacto por contenido de llamada
```
GET /api/crm/contacts?search=arraigo&page=1&limit=50
```

**Resultado:** 
- Contactos cuyo nombre/email contenga "arraigo" **O**
- Contactos que tengan llamadas donde `resumen_llamada`, `call_result` o `notes` contenga "arraigo"

### Request 3: Búsqueda combinada con otros filtros
```
GET /api/crm/contacts?search=visado&grading_llamada=A&page=1&limit=50
```

**Resultado:** Contactos con grading A que:
- Tengan "visado" en nombre/email **O**
- Tengan llamadas con "visado" en el contenido

---

## ⚠️ Consideraciones de Rendimiento

### Índices Recomendados

Para optimizar las búsquedas, asegúrate de tener índices en:

```sql
-- Índice en llamadas para búsqueda de texto
CREATE INDEX idx_calls_resumen_llamada ON crm_calls USING gin(to_tsvector('spanish', resumen_llamada));
CREATE INDEX idx_calls_call_result ON crm_calls USING gin(to_tsvector('spanish', call_result));
CREATE INDEX idx_calls_notes ON crm_calls USING gin(to_tsvector('spanish', notes));

-- Índice en relación entity_id/entity_type para JOINs rápidos
CREATE INDEX idx_calls_entity ON crm_calls(entity_id, entity_type) WHERE is_deleted = false;
```

### Alternativa: Búsqueda Full-Text (PostgreSQL)

Si quieres búsqueda más avanzada (recomendado para producción):

```sql
-- Usar búsqueda full-text de PostgreSQL
SELECT DISTINCT c.*
FROM crm_contacts c
LEFT JOIN crm_calls calls ON (
  calls.entity_id = c.id::text 
  AND calls.entity_type IN ('contacts', 'contact')
  AND calls.is_deleted = false
)
WHERE c.is_deleted = false
  AND (
    -- Búsqueda normal
    c.first_name ILIKE '%{search_term}%'
    OR c.last_name ILIKE '%{search_term}%'
    OR c.email ILIKE '%{search_term}%'
    
    -- Búsqueda full-text en llamadas (más eficiente)
    OR to_tsvector('spanish', COALESCE(calls.resumen_llamada, '')) @@ plainto_tsquery('spanish', '{search_term}')
    OR to_tsvector('spanish', COALESCE(calls.call_result, '')) @@ plainto_tsquery('spanish', '{search_term}')
  )
ORDER BY c.created_at DESC;
```

---

## 🧪 Casos de Prueba

### Caso 1: Contacto encontrado solo por llamada
1. Crear contacto: "Juan Pérez" (sin "visado" en nombre/email)
2. Crear llamada asociada con `resumen_llamada: "Cliente interesado en visado de estudiante"`
3. Buscar: `GET /api/crm/contacts?search=visado`
4. **Resultado esperado:** Contacto "Juan Pérez" aparece en resultados

### Caso 2: Contacto encontrado por ambos métodos
1. Crear contacto: "María González" (email: "maria@example.com")
2. Crear llamada con `call_result: "Cliente interesado en nacionalidad"`
3. Buscar: `GET /api/crm/contacts?search=maria`
4. **Resultado esperado:** Contacto aparece (coincide por email)

### Caso 3: Sin duplicados
1. Contacto tiene múltiples llamadas con el término de búsqueda
2. **Resultado esperado:** Contacto aparece una sola vez (usar `DISTINCT`)

---

## 📝 Notas de Implementación

1. **Compatibilidad:** Esta funcionalidad debe ser **retrocompatible**. Si no hay término de búsqueda, el comportamiento debe ser idéntico al actual.

2. **Performance:** 
   - Considera limitar la búsqueda en llamadas si hay muchos registros
   - Usa `DISTINCT` para evitar duplicados
   - Considera cachear resultados si es necesario

3. **Campos a buscar en llamadas:**
   - `resumen_llamada` (prioritario - más contenido)
   - `call_result` (resultado de la llamada)
   - `notes` (si existe en tu modelo)

4. **Entity Type:** Asegúrate de buscar en llamadas donde `entity_type` sea `'contacts'` o `'contact'` (según tu normalización)

---

## ✅ Checklist de Implementación

- [ ] Modificar query de búsqueda para incluir JOIN con `crm_calls`
- [ ] Agregar filtros de búsqueda en `resumen_llamada`, `call_result`, `notes`
- [ ] Usar `DISTINCT` para evitar contactos duplicados
- [ ] Mantener compatibilidad con búsqueda actual
- [ ] Agregar índices para optimizar búsquedas
- [ ] Probar casos de búsqueda:
  - [ ] Contacto encontrado solo por llamada
  - [ ] Contacto encontrado por ambos métodos
  - [ ] Sin duplicados
  - [ ] Búsqueda con otros filtros combinados
- [ ] Actualizar documentación de API

---

## 🔄 Migración del Frontend

✅ **COMPLETADO** - El frontend ya ha sido simplificado para usar la búsqueda del backend.

**Antes (búsqueda híbrida en frontend):**
```typescript
// Código complejo que buscaba en llamadas y combinaba resultados
// Cargaba todas las llamadas, filtraba, obtenía contactos, etc.
```

**Después (solo llamada al backend):**
```typescript
const allContacts = await crmService.getAllContacts({ search: searchTerm });
// El backend ya incluye contactos encontrados por llamadas automáticamente
```

## ✅ Estado de Implementación

- [x] **Backend implementado** - Búsqueda en `resumen_llamada`, `call_result`, `transcription`
- [x] **Frontend simplificado** - Removida búsqueda híbrida, ahora solo usa el backend
- [x] **Endpoints actualizados**: `/api/crm/contacts` y `/api/crm/contacts/count`
- [x] **Sin duplicados** - Usa `.distinct()` para evitar contactos duplicados
- [x] **Retrocompatible** - Funciona igual si no hay término de búsqueda

---

## 📞 Soporte

Si tienes dudas sobre la implementación, considera:
- Usar subconsultas para mejor rendimiento
- Implementar paginación correcta (el `total` debe incluir contactos encontrados por llamadas)
- Considerar búsqueda full-text si el volumen de datos es grande







