# Especificación: Formato de Errores de Validación para el Frontend

**Fecha**: 2025-01-29  
**Objetivo**: Definir el formato exacto que el backend debe devolver cuando hay errores de validación (422) para que el frontend pueda mostrar visualmente los campos con error en rojo.

---

## 📋 Formato de Respuesta Requerido

Cuando el backend detecta errores de validación (422), debe devolver el siguiente formato JSON:

```json
{
  "error": true,
  "message": "Error de validación: 2 campos tienen errores",
  "type": "ValidationError",
  "errors": [
    {
      "field": "responsible_user_id",
      "message": "El ID no es válido",
      "original_message": "Input should be a valid UUID, invalid length: expected length 32 for simple format, found 0",
      "type": "uuid_parsing"
    },
    {
      "field": "email",
      "message": "El email no es válido",
      "original_message": "value is not a valid email address",
      "type": "value_error.email"
    }
  ],
  "field_errors": {
    "responsible_user_id": "El ID no es válido",
    "email": "El email no es válido"
  },
  "detail": [...]  // Formato crudo de FastAPI (opcional, para debugging)
}
```

### Campos Requeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `error` | `boolean` | Siempre `true` para errores |
| `message` | `string` | Mensaje general del error |
| `type` | `string` | Tipo de error: `"ValidationError"` |
| `errors` | `array` | Array de objetos con detalles de cada error |
| `field_errors` | `object` | **IMPORTANTE**: Diccionario que mapea nombre de campo → mensaje de error |

### Estructura de `errors` Array

Cada elemento del array `errors` debe tener:

```json
{
  "field": "nombre_del_campo",
  "message": "Mensaje traducido al español",
  "original_message": "Mensaje original de Pydantic",
  "type": "tipo_de_error"
}
```

### Estructura de `field_errors` (CRÍTICO)

El campo `field_errors` es un **diccionario simple** que mapea directamente el nombre del campo al mensaje de error. Este es el formato que el frontend usa para mostrar errores visualmente:

```json
{
  "field_errors": {
    "responsible_user_id": "El ID no es válido",
    "email": "El email no es válido",
    "phone": "El teléfono es requerido"
  }
}
```

**⚠️ IMPORTANTE**: El nombre del campo debe coincidir exactamente con el nombre del campo en el formulario del frontend.

---

## 🔧 Implementación en FastAPI

### Opción 1: Exception Handler Global (RECOMENDADO)

Crear un exception handler global que capture todos los errores de validación de Pydantic:

```python
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

app = FastAPI()

def translate_error_message(error_type: str, original_msg: str) -> str:
    """Traduce mensajes de error de Pydantic al español."""
    translations = {
        "missing": "Este campo es requerido",
        "value_error.missing": "Este campo es requerido",
        "uuid_parsing": "El ID no es válido",
        "value_error.uuid": "El ID no es válido",
        "value_error.email": "El email no es válido",
        "int_parsing": "Debe ser un número entero",
        "float_parsing": "Debe ser un número",
        "datetime_parsing": "La fecha no es válida",
        "string_too_short": "El texto es demasiado corto",
        "string_too_long": "El texto es demasiado largo",
        "greater_than": "El valor debe ser mayor",
        "less_than": "El valor debe ser menor",
    }
    
    # Buscar traducción por tipo
    if error_type in translations:
        return translations[error_type]
    
    # Buscar traducción por mensaje original
    for key, translation in translations.items():
        if key in original_msg.lower():
            return translation
    
    # Fallback: mensaje genérico
    return "El valor no es válido"

def extract_field_name(loc: list) -> str:
    """Extrae el nombre del campo de la ubicación de Pydantic."""
    # Pydantic devuelve ['body', 'field_name'] o ['query', 'field_name']
    # Queremos solo 'field_name'
    if len(loc) > 1:
        return loc[-1]  # Último elemento es el nombre del campo
    return '.'.join(loc)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Maneja errores de validación de FastAPI/Pydantic."""
    errors = []
    field_errors = {}
    
    for error in exc.errors():
        # Extraer información del error
        field_path = error.get("loc", [])
        field_name = extract_field_name(field_path)
        error_type = error.get("type", "")
        original_msg = error.get("msg", "")
        
        # Traducir mensaje
        translated_msg = translate_error_message(error_type, original_msg)
        
        # Agregar a errors array
        errors.append({
            "field": field_name,
            "message": translated_msg,
            "original_message": original_msg,
            "type": error_type
        })
        
        # Agregar a field_errors (solo el primer error por campo)
        if field_name not in field_errors:
            field_errors[field_name] = translated_msg
    
    # Construir respuesta
    error_count = len(errors)
    message = f"Error de validación: {error_count} campo{'s' if error_count != 1 else ''} {'tienen' if error_count != 1 else 'tiene'} errores"
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "message": message,
            "type": "ValidationError",
            "errors": errors,
            "field_errors": field_errors,
            "detail": exc.errors()  # Formato original de FastAPI (para debugging)
        }
    )
```

### Opción 2: Exception Handler para ValidationError de Pydantic

Si también necesitas manejar errores de validación de Pydantic directamente:

```python
from pydantic import ValidationError

@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    """Maneja errores de validación de Pydantic directamente."""
    errors = []
    field_errors = {}
    
    for error in exc.errors():
        field_path = error.get("loc", [])
        field_name = extract_field_name(field_path)
        error_type = error.get("type", "")
        original_msg = error.get("msg", "")
        
        translated_msg = translate_error_message(error_type, original_msg)
        
        errors.append({
            "field": field_name,
            "message": translated_msg,
            "original_message": original_msg,
            "type": error_type
        })
        
        if field_name not in field_errors:
            field_errors[field_name] = translated_msg
    
    error_count = len(errors)
    message = f"Error de validación: {error_count} campo{'s' if error_count != 1 else ''} {'tienen' if error_count != 1 else 'tiene'} errores"
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "message": message,
            "type": "ValidationError",
            "errors": errors,
            "field_errors": field_errors,
            "detail": exc.errors()
        }
    )
```

---

## 📝 Ejemplo Completo: Archivo `app/exceptions.py`

```python
"""
Exception handlers para errores de validación.
"""
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from typing import List, Dict, Any


def translate_error_message(error_type: str, original_msg: str) -> str:
    """Traduce mensajes de error de Pydantic al español."""
    translations = {
        "missing": "Este campo es requerido",
        "value_error.missing": "Este campo es requerido",
        "uuid_parsing": "El ID no es válido",
        "value_error.uuid": "El ID no es válido",
        "value_error.email": "El email no es válido",
        "int_parsing": "Debe ser un número entero",
        "float_parsing": "Debe ser un número",
        "datetime_parsing": "La fecha no es válida",
        "string_too_short": "El texto es demasiado corto",
        "string_too_long": "El texto es demasiado largo",
        "greater_than": "El valor debe ser mayor",
        "less_than": "El valor debe ser menor",
        "value_error.any_str.min_length": "El texto es demasiado corto",
        "value_error.any_str.max_length": "El texto es demasiado largo",
    }
    
    # Buscar traducción por tipo
    if error_type in translations:
        return translations[error_type]
    
    # Buscar traducción por mensaje original
    original_lower = original_msg.lower()
    for key, translation in translations.items():
        if key in original_lower:
            return translation
    
    # Fallback: mensaje genérico
    return "El valor no es válido"


def extract_field_name(loc: List[str]) -> str:
    """Extrae el nombre del campo de la ubicación de Pydantic.
    
    Pydantic devuelve ['body', 'field_name'] o ['query', 'field_name']
    Queremos solo 'field_name' para que coincida con el nombre del campo en el frontend.
    """
    if not loc:
        return "unknown"
    
    # Si hay más de un elemento, tomar el último (nombre del campo)
    if len(loc) > 1:
        return loc[-1]
    
    # Si solo hay un elemento, devolverlo
    return loc[0]


def format_validation_errors(exc: RequestValidationError) -> Dict[str, Any]:
    """Formatea errores de validación al formato esperado por el frontend."""
    errors = []
    field_errors = {}
    
    for error in exc.errors():
        # Extraer información del error
        field_path = error.get("loc", [])
        field_name = extract_field_name(field_path)
        error_type = error.get("type", "")
        original_msg = error.get("msg", "")
        
        # Traducir mensaje
        translated_msg = translate_error_message(error_type, original_msg)
        
        # Agregar a errors array
        errors.append({
            "field": field_name,
            "message": translated_msg,
            "original_message": original_msg,
            "type": error_type
        })
        
        # Agregar a field_errors (solo el primer error por campo)
        # Esto es importante porque el frontend usa field_errors para mostrar un error por campo
        if field_name not in field_errors:
            field_errors[field_name] = translated_msg
    
    # Construir mensaje general
    error_count = len(errors)
    if error_count == 1:
        message = "Error de validación: 1 campo tiene errores"
    else:
        message = f"Error de validación: {error_count} campos tienen errores"
    
    return {
        "error": True,
        "message": message,
        "type": "ValidationError",
        "errors": errors,
        "field_errors": field_errors,
        "detail": exc.errors()  # Formato original de FastAPI (para debugging)
    }


async def validation_exception_handler(
    request: Request, 
    exc: RequestValidationError
) -> JSONResponse:
    """Exception handler para errores de validación de FastAPI/Pydantic."""
    formatted_errors = format_validation_errors(exc)
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=formatted_errors
    )
```

### Registrar el Handler en `main.py`

```python
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from app.exceptions import validation_exception_handler

app = FastAPI()

# Registrar el exception handler
app.add_exception_handler(
    RequestValidationError,
    validation_exception_handler
)
```

---

## 🧪 Ejemplos de Respuestas

### Ejemplo 1: Campo UUID Inválido

**Request:**
```json
POST /api/crm/calls
{
  "responsible_user_id": "",
  "entity_id": "e7ca9581-df91-4775-a363-66cbb01ae0e4",
  "direction": "outbound",
  "call_status": "completed"
}
```

**Response (422):**
```json
{
  "error": true,
  "message": "Error de validación: 1 campo tiene errores",
  "type": "ValidationError",
  "errors": [
    {
      "field": "responsible_user_id",
      "message": "El ID no es válido",
      "original_message": "Input should be a valid UUID, invalid length: expected length 32 for simple format, found 0",
      "type": "uuid_parsing"
    }
  ],
  "field_errors": {
    "responsible_user_id": "El ID no es válido"
  }
}
```

### Ejemplo 2: Múltiples Campos con Error

**Request:**
```json
POST /api/crm/contacts
{
  "name": "",
  "email": "email-invalido",
  "phone": "123"
}
```

**Response (422):**
```json
{
  "error": true,
  "message": "Error de validación: 3 campos tienen errores",
  "type": "ValidationError",
  "errors": [
    {
      "field": "name",
      "message": "Este campo es requerido",
      "original_message": "Field required",
      "type": "missing"
    },
    {
      "field": "email",
      "message": "El email no es válido",
      "original_message": "value is not a valid email address",
      "type": "value_error.email"
    },
    {
      "field": "phone",
      "message": "El texto es demasiado corto",
      "original_message": "String should have at least 9 characters",
      "type": "string_too_short"
    }
  ],
  "field_errors": {
    "name": "Este campo es requerido",
    "email": "El email no es válido",
    "phone": "El texto es demasiado corto"
  }
}
```

---

## 🎯 Mapeo de Tipos de Error

| Tipo de Error Pydantic | Mensaje en Español |
|------------------------|-------------------|
| `missing` / `value_error.missing` | "Este campo es requerido" |
| `uuid_parsing` / `value_error.uuid` | "El ID no es válido" |
| `value_error.email` | "El email no es válido" |
| `int_parsing` | "Debe ser un número entero" |
| `float_parsing` | "Debe ser un número" |
| `datetime_parsing` | "La fecha no es válida" |
| `string_too_short` | "El texto es demasiado corto" |
| `string_too_long` | "El texto es demasiado largo" |
| `greater_than` | "El valor debe ser mayor" |
| `less_than` | "El valor debe ser menor" |

---

## ✅ Checklist de Implementación

- [ ] Crear archivo `app/exceptions.py` con las funciones de formato
- [ ] Implementar `translate_error_message()` con traducciones al español
- [ ] Implementar `extract_field_name()` para extraer nombres de campos
- [ ] Implementar `format_validation_errors()` para formatear errores
- [ ] Crear `validation_exception_handler()` como exception handler
- [ ] Registrar el handler en `main.py` con `app.add_exception_handler()`
- [ ] Probar con diferentes tipos de errores de validación
- [ ] Verificar que `field_errors` mapea correctamente los nombres de campos
- [ ] Verificar que los mensajes están traducidos al español

---

## 🔍 Debugging

Para verificar que el formato es correcto, puedes hacer una petición con datos inválidos y revisar la respuesta:

```bash
curl -X POST http://localhost:8000/api/crm/calls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "responsible_user_id": "",
    "entity_id": "invalid-uuid",
    "direction": "invalid"
  }'
```

La respuesta debe incluir:
- ✅ `field_errors` con los nombres de campos correctos
- ✅ Mensajes traducidos al español
- ✅ Status code 422

---

## 🔗 Referencias

- [Documentación Frontend](./FRONTEND_VALIDATION_ERROR_HANDLING.md) - Cómo el frontend usa estos errores
- [FastAPI Exception Handlers](https://fastapi.tiangolo.com/tutorial/handling-errors/) - Documentación oficial
- [Pydantic Validation Errors](https://docs.pydantic.dev/latest/errors/errors/) - Tipos de errores de Pydantic

---

**Última actualización**: 2025-01-29
