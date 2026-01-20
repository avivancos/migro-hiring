## Filtrado de contactos por responsable: exclusión de contactos sin asignación

### Endpoint afectado
`GET /api/crm/contacts` y `GET /api/crm/contacts/count`

### Problema actual
Cuando se filtra por `responsible_user_id`, el backend devuelve contactos que:
- Tienen `responsible_user_id` igual al valor del filtro ✅
- **Pero también incluye contactos sin asignación** (`responsible_user_id` es `null` o vacío) ❌

### Comportamiento esperado
Cuando se envía el parámetro `responsible_user_id`:
- **Solo devolver contactos** donde `responsible_user_id === valor_del_filtro`
- **Excluir contactos** donde `responsible_user_id IS NULL` o `responsible_user_id = ''`
- **Excluir contactos** donde `responsible_user_id !== valor_del_filtro`

### Casos de uso

#### Caso 1: Filtro "Solo mis contactos"
- Frontend envía: `responsible_user_id=uuid_del_usuario_actual`
- Backend debe devolver: **Solo contactos asignados a ese usuario**
- Backend NO debe devolver: Contactos sin asignación u otros usuarios

#### Caso 2: Filtro por responsable específico
- Frontend envía: `responsible_user_id=uuid_de_otro_usuario`
- Backend debe devolver: **Solo contactos asignados a ese usuario**
- Backend NO debe devolver: Contactos sin asignación

### Query SQL esperado

```sql
-- Cuando responsible_user_id está presente en los filtros
SELECT * FROM contacts 
WHERE responsible_user_id = :responsible_user_id
  AND responsible_user_id IS NOT NULL
  AND responsible_user_id != ''
  -- ... otros filtros ...
```

### Parámetro actual
```python
# Actual (comportamiento incorrecto)
responsible_user_id: Optional[str] = None
# Permite NULL/None, lo que causa que se incluyan contactos sin asignación

# Esperado (comportamiento correcto)
responsible_user_id: Optional[str] = None
# Cuando está presente y no es None/vacío:
#   - Filtrar estrictamente por ese valor
#   - Excluir NULL/vacío
```

### Endpoints afectados

1. **`GET /api/crm/contacts`**
   - Debe aplicar filtrado estricto cuando `responsible_user_id` está presente
   - No incluir contactos sin asignación cuando se filtra por responsable

2. **`GET /api/crm/contacts/count`**
   - Debe usar la misma lógica de filtrado
   - El total debe reflejar solo contactos que cumplen el filtro estricto

### Beneficios

1. **Rendimiento**: Filtrado en backend es más eficiente que en frontend
2. **Consistencia**: Los totales del count coinciden con los resultados filtrados
3. **UX mejorada**: Los usuarios ven exactamente lo que esperan al activar "Solo mis contactos"

### Ejemplo de petición

```http
GET /api/crm/contacts?responsible_user_id=123e4567-e89b-12d3-a456-426614174000&limit=25&skip=0
```

**Respuesta esperada**: Solo contactos donde `responsible_user_id = '123e4567-e89b-12d3-a456-426614174000'`

**No debe incluir**:
- Contactos con `responsible_user_id = null`
- Contactos con `responsible_user_id = ''`
- Contactos con `responsible_user_id = 'otro-uuid'`

### Notas técnicas

- El filtrado debe ser **case-sensitive** (comparación exacta de UUIDs)
- Si `responsible_user_id` no está presente o es `null`/vacío en los parámetros, devolver todos los contactos (comportamiento actual normal)
- Este cambio solo afecta cuando el parámetro `responsible_user_id` tiene un valor válido

### Impacto en frontend

Una vez implementado en backend:
- Se puede eliminar el filtrado adicional en frontend que excluye contactos sin asignación
- El total del `count` endpoint será preciso sin necesidad de ajustes manuales
- Mejor rendimiento al no procesar y filtrar contactos innecesarios en el cliente
