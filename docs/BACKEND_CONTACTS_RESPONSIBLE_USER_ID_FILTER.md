# Filtro de Contactos por Responsable (responsible_user_id)

**Fecha**: 2026-01-20  
**Endpoints afectados**: `GET /api/crm/contacts`, `GET /api/crm/contacts/count`

---

## 🎯 Objetivo

Implementar filtrado estricto por `responsible_user_id` que excluya contactos sin asignación cuando se proporciona el parámetro.

---

## 📋 Problema Anterior

Cuando se filtraba por `responsible_user_id`, el backend devolvía contactos que:
- ✅ Tenían `responsible_user_id` igual al valor del filtro
- ❌ **Pero también incluía contactos sin asignación** (`responsible_user_id IS NULL`)

Esto causaba que al filtrar por "Solo mis contactos" se mostraran contactos sin asignar, generando confusión en el frontend.

---

## ✅ Solución Implementada

### Comportamiento Actual

Cuando se envía el parámetro `responsible_user_id`:
- ✅ **Solo devuelve contactos** donde `responsible_user_id === valor_del_filtro`
- ✅ **Excluye contactos** donde `responsible_user_id IS NULL`
- ✅ **Excluye contactos** donde `responsible_user_id !== valor_del_filtro`

### Query SQL Generado

```sql
-- Cuando responsible_user_id está presente en los filtros
SELECT * FROM contacts 
WHERE responsible_user_id = :responsible_user_id
  AND responsible_user_id IS NOT NULL
  -- ... otros filtros ...
```

---

## 🔧 Cambios Técnicos

### 1. Endpoint `GET /api/crm/contacts`

**Parámetro agregado:**
```python
responsible_user_id: Optional[uuid.UUID] = Query(
    None,
    description="Filtro por responsable. Solo devuelve contactos asignados a este usuario (excluye contactos sin asignación).",
)
```

**Lógica de filtrado:**
```python
# 🔒 FILTER: Filtro estricto por responsible_user_id
# Cuando se proporciona responsible_user_id, solo devolver contactos asignados a ese usuario
# Excluir contactos sin asignación (NULL) cuando se aplica este filtro
if responsible_user_id:
    base_conditions.append(Contact.responsible_user_id == responsible_user_id)
    base_conditions.append(Contact.responsible_user_id.isnot(None))
```

### 2. Endpoint `GET /api/crm/contacts/count`

**Parámetro agregado:**
```python
responsible_user_id: Optional[uuid.UUID] = Query(
    None,
    description="Filtro por responsable. Solo cuenta contactos asignados a este usuario (excluye contactos sin asignación).",
)
```

**Lógica de filtrado:**
```python
# 🔒 FILTER: Filtro estricto por responsible_user_id
# Cuando se proporciona responsible_user_id, solo contar contactos asignados a ese usuario
# Excluir contactos sin asignación (NULL) cuando se aplica este filtro
if responsible_user_id:
    base_conditions.append(Contact.responsible_user_id == responsible_user_id)
    base_conditions.append(Contact.responsible_user_id.isnot(None))
```

---

## 📝 Casos de Uso

### Caso 1: Filtro "Solo mis contactos"

**Request:**
```http
GET /api/crm/contacts?responsible_user_id=123e4567-e89b-12d3-a456-426614174000&limit=25&page=1
```

**Respuesta esperada:**
- ✅ Solo contactos donde `responsible_user_id = '123e4567-e89b-12d3-a456-426614174000'`
- ❌ NO incluye contactos con `responsible_user_id = null`
- ❌ NO incluye contactos con `responsible_user_id = 'otro-uuid'`

### Caso 2: Filtro por responsable específico

**Request:**
```http
GET /api/crm/contacts?responsible_user_id=456e7890-e89b-12d3-a456-426614174001&limit=25&page=1
```

**Respuesta esperada:**
- ✅ Solo contactos asignados a ese usuario específico
- ❌ NO incluye contactos sin asignación

### Caso 3: Sin filtro (comportamiento normal)

**Request:**
```http
GET /api/crm/contacts?limit=25&page=1
```

**Respuesta esperada:**
- ✅ Devuelve todos los contactos (incluyendo los sin asignación)
- ✅ Comportamiento normal cuando no se proporciona el parámetro

---

## 🎯 Beneficios

1. **Rendimiento**: Filtrado en backend es más eficiente que en frontend
2. **Consistencia**: Los totales del `count` coinciden con los resultados filtrados
3. **UX mejorada**: Los usuarios ven exactamente lo que esperan al activar "Solo mis contactos"
4. **Precisión**: El total del `count` endpoint es preciso sin necesidad de ajustes manuales

---

## 📊 Impacto en Frontend

Una vez implementado en backend:
- ✅ Se puede eliminar el filtrado adicional en frontend que excluye contactos sin asignación
- ✅ El total del `count` endpoint será preciso sin necesidad de ajustes manuales
- ✅ Mejor rendimiento al no procesar y filtrar contactos innecesarios en el cliente

---

## 🔍 Notas Técnicas

- El filtrado es **case-sensitive** (comparación exacta de UUIDs)
- Si `responsible_user_id` no está presente o es `null`/vacío en los parámetros, devuelve todos los contactos (comportamiento actual normal)
- Este cambio solo afecta cuando el parámetro `responsible_user_id` tiene un valor válido (UUID)
- El filtro se aplica en ambos endpoints (`/contacts` y `/contacts/count`) para mantener consistencia

---

## 📁 Archivos Modificados

- `app/api/endpoints/crm.py`
  - Endpoint `list_contacts`: Agregado parámetro y filtro estricto
  - Endpoint `get_contacts_count`: Agregado parámetro y filtro estricto

---

## ✅ Verificación

Para verificar que el filtro funciona correctamente:

1. **Test con filtro:**
   ```bash
   curl -X GET "http://localhost:8000/api/crm/contacts?responsible_user_id=<UUID_VALIDO>" \
     -H "Authorization: Bearer <TOKEN>"
   ```
   - Debe devolver solo contactos asignados a ese usuario
   - No debe incluir contactos con `responsible_user_id = null`

2. **Test sin filtro:**
   ```bash
   curl -X GET "http://localhost:8000/api/crm/contacts" \
     -H "Authorization: Bearer <TOKEN>"
   ```
   - Debe devolver todos los contactos (comportamiento normal)

3. **Test count con filtro:**
   ```bash
   curl -X GET "http://localhost:8000/api/crm/contacts/count?responsible_user_id=<UUID_VALIDO>" \
     -H "Authorization: Bearer <TOKEN>"
   ```
   - El total debe coincidir con los resultados del endpoint `/contacts` con el mismo filtro
