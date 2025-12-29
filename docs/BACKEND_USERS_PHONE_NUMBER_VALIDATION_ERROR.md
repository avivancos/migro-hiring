# Error de Validación: phone_number Vacío en Usuarios

## Problema

El endpoint `GET /api/users/` está devolviendo un error 500 cuando hay usuarios con `phone_number` vacío (`''`).

### Error del Backend

```
Internal Server Error: 1 validation error for UsersListResponse
items.1.phone_number
  Value error, Phone number must start with '+' or contain only digits [type=value_error, input_value='', input_type=str]
```

## Causa

El modelo Pydantic del backend tiene una validación estricta para `phone_number` que requiere que:
- Comience con '+' O
- Contenga solo dígitos

Sin embargo, hay usuarios en la base de datos con `phone_number` vacío (`''`), lo cual no pasa esta validación.

## Impacto

Este error afecta a:
- ✅ `AdminUsers` - No puede cargar la lista de usuarios
- ✅ `AdminOpportunities` - No puede cargar agentes para asignación
- ✅ Cualquier componente que use `adminService.getAllUsers()`

## Solución en el Backend

El backend necesita hacer una de las siguientes correcciones:

### Opción 1: Permitir valores null/vacíos (Recomendado)

Modificar el modelo Pydantic para permitir `phone_number` opcional:

```python
from typing import Optional
from pydantic import field_validator

class UserResponse(BaseModel):
    phone_number: Optional[str] = None
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v):
        if v is None or v == '':
            return None  # Permitir null/vacío
        # Si tiene valor, validar formato
        if not (v.startswith('+') or v.isdigit()):
            raise ValueError('Phone number must start with "+" or contain only digits')
        return v
```

### Opción 2: Normalizar valores vacíos antes de validar

```python
@field_validator('phone_number', mode='before')
@classmethod
def normalize_phone_number(cls, v):
    if v == '':
        return None  # Convertir string vacío a None
    return v
```

### Opción 3: Limpiar datos existentes

Actualizar usuarios existentes en la base de datos:

```sql
UPDATE users 
SET phone_number = NULL 
WHERE phone_number = '' OR phone_number IS NULL OR phone_number = 'null';
```

## Solución Temporal en el Frontend

El frontend ya maneja el error capturándolo y mostrando un array vacío, pero podría mejorarse mostrando un mensaje más informativo al usuario.

## Archivos Afectados

### Backend
- Modelo de respuesta `UsersListResponse`
- Modelo `User` o equivalente
- Endpoint `GET /api/users/`

### Frontend
- `src/services/adminService.ts` - `getAllUsers()`
- `src/pages/admin/AdminUsers.tsx` - Lista de usuarios
- `src/pages/admin/AdminOpportunities.tsx` - Selector de agentes

## Estado

- ⚠️ **Problema identificado**: Backend rechazando usuarios con phone_number vacío
- 🔄 **Pendiente**: Corrección en el backend
- ✅ **Frontend**: Manejo de errores implementado (muestra array vacío)

## Fecha de Identificación

2024-12-19

## Notas Adicionales

Este es un problema de validación de datos del backend. El frontend no puede resolverlo completamente, solo puede manejar el error de manera más elegante. La solución definitiva requiere cambios en el backend.

