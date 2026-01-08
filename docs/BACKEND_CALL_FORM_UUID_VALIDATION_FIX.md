# Fix: Error de Validación UUID para responsible_user_id en CallForm

**Fecha**: 2025-01-29  
**Problema**: Error 422 al crear llamadas desde el frontend cuando `responsible_user_id` se envía como cadena vacía.

---

## 🔴 Problema

Al crear una llamada desde el frontend (CallForm), se producía un error 422 con el siguiente mensaje:

```
Campo: body.responsible_user_id
Mensaje: Input should be a valid UUID, invalid length: expected length 32 for simple format, found 0
Tipo: uuid_parsing
```

### Causa Raíz

El frontend estaba enviando `responsible_user_id` como cadena vacía (`""`) cuando el usuario de sesión no se encontraba en la lista de responsables disponibles. El esquema Pydantic `CallCreate` esperaba un UUID válido o `None`, pero intentaba validar la cadena vacía como UUID, lo que causaba el error.

### Logs del Frontend

```
❌ [CallForm] loadUsers - Usuario de sesión NO encontrado en lista de responsables: Object
❌ [crmService] Error details: 
   Campo: body.responsible_user_id
   Mensaje: Input should be a valid UUID, invalid length: expected length 32 for simple format, found 0
   Tipo: uuid_parsing
```

---

## ✅ Solución Implementada

Se agregó un `model_validator` en el esquema `CallCreate` que convierte cadenas vacías a `None` antes de la validación de tipos de Pydantic.

### Cambios Realizados

**Archivo**: `app/schemas/crm_call.py`

1. **Importación de `model_validator`**:
   ```python
   from pydantic import BaseModel, Field, model_validator
   from typing import Any
   ```

2. **Validador agregado a `CallCreate`**:
   ```python
   @model_validator(mode='before')
   @classmethod
   def normalize_empty_strings(cls, data: Any) -> Any:
       """Convert empty strings to None for UUID fields before validation.
       
       This handles cases where the frontend sends empty strings ("") instead of null/undefined
       for optional UUID fields like responsible_user_id.
       """
       if isinstance(data, dict):
           # Convert empty strings to None for responsible_user_id
           if 'responsible_user_id' in data:
               value = data.get('responsible_user_id')
               if value == "" or value is None:
                   data['responsible_user_id'] = None
           
           # Also handle entity_id in case it's sent as empty string
           if 'entity_id' in data:
               value = data.get('entity_id')
               if value == "" or value is None:
                   data['entity_id'] = None
       
       return data
   ```

### Cómo Funciona

1. El validador se ejecuta **antes** de la validación de tipos (`mode='before'`).
2. Convierte cadenas vacías (`""`) a `None` para `responsible_user_id` y `entity_id`.
3. Pydantic luego valida correctamente `None` como valor opcional para `Optional[uuid.UUID]`.
4. El endpoint `POST /crm/calls` detecta que `responsible_user_id` es `None` y automáticamente asigna el usuario actual de la sesión.

---

## 🔒 Flujo Completo

### Antes del Fix

```
Frontend envía: { "responsible_user_id": "" }
    ↓
Pydantic intenta validar "" como UUID
    ↓
❌ Error 422: invalid length: expected length 32 for simple format, found 0
```

### Después del Fix

```
Frontend envía: { "responsible_user_id": "" }
    ↓
model_validator convierte "" → None
    ↓
Pydantic valida None como Optional[uuid.UUID] ✅
    ↓
Endpoint detecta None y asigna current_user.id ✅
    ↓
✅ Llamada creada exitosamente
```

---

## 📋 Comportamiento del Backend

El endpoint `POST /crm/calls` ya tenía la lógica correcta para asignar automáticamente el usuario actual:

```python
# Prepare call data
call_data = call_in.model_dump()

# 🔒 AUTO-ASSIGN: If responsible_user_id is not provided, assign to current user
if not call_data.get('responsible_user_id'):
    call_data['responsible_user_id'] = current_user.id
```

Este código funciona correctamente con:
- `responsible_user_id: null` → ✅ Asigna `current_user.id`
- `responsible_user_id: undefined` (no enviado) → ✅ Asigna `current_user.id`
- `responsible_user_id: ""` (cadena vacía) → ✅ Ahora también funciona gracias al validador

---

## 🧪 Casos de Prueba

### 1. Envío con cadena vacía (Fix principal)
```json
POST /api/crm/calls
{
  "entity_type": "contacts",
  "entity_id": "e7ca9581-df91-4775-a363-66cbb01ae0e4",
  "direction": "outbound",
  "call_status": "completed",
  "responsible_user_id": ""
}
```
**Resultado esperado**: ✅ Llamada creada con `responsible_user_id` asignado al usuario actual.

### 2. Envío sin campo (Comportamiento original)
```json
POST /api/crm/calls
{
  "entity_type": "contacts",
  "entity_id": "e7ca9581-df91-4775-a363-66cbb01ae0e4",
  "direction": "outbound",
  "call_status": "completed"
}
```
**Resultado esperado**: ✅ Llamada creada con `responsible_user_id` asignado al usuario actual.

### 3. Envío con UUID válido
```json
POST /api/crm/calls
{
  "entity_type": "contacts",
  "entity_id": "e7ca9581-df91-4775-a363-66cbb01ae0e4",
  "direction": "outbound",
  "call_status": "completed",
  "responsible_user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```
**Resultado esperado**: ✅ Llamada creada con el UUID proporcionado.

---

## 📝 Recomendación para Frontend

Aunque el backend ahora maneja cadenas vacías correctamente, se recomienda que el frontend:

1. **No envíe el campo** si no hay un valor válido, o
2. **Envíe `null`** en lugar de cadena vacía, o
3. **Pre-cargue el usuario de sesión** como se documenta en `docs/CRM_FORM_SCHEMAS.md`

Ejemplo recomendado:
```typescript
const callData = {
  entity_type: "contacts",
  entity_id: contactId,
  direction: "outbound",
  call_status: "completed",
  // ✅ Opción 1: No incluir el campo si no hay valor
  // responsible_user_id: undefined
  
  // ✅ Opción 2: Pre-cargar usuario actual si está disponible
  responsible_user_id: currentUser?.id || undefined
};
```

---

## 🎯 Campos Afectados

El validador normaliza los siguientes campos:
- ✅ `responsible_user_id` (principal)
- ✅ `entity_id` (preventivo)

Si en el futuro aparecen otros campos UUID opcionales con el mismo problema, se pueden agregar al validador.

---

## ✅ Estado

- ✅ Validador implementado en `CallCreate`
- ✅ Linting sin errores
- ✅ Compatible con comportamiento existente
- ✅ Documentación completa

**Próximo paso**: Verificar en producción que el fix resuelve el error 422.

---

## 🔗 Referencias

- Esquema Pydantic: `app/schemas/crm_call.py`
- Endpoint: `POST /api/crm/calls`
- Frontend: `src/components/CRM/CallForm.tsx`
- Documentación de formularios: `FORMULARIOS_ESQUEMAS_DATOS.md`
