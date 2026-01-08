# Guía: Manejo de Errores de Validación en el Frontend

**Fecha**: 2025-01-29  
**Objetivo**: Mostrar cómo usar el nuevo formato de errores 422 para marcar campos en rojo en formularios.

---

## 📋 Formato de Respuesta del Backend

Cuando el backend devuelve un error 422 (validación), la respuesta incluye:

```json
{
  "error": true,
  "message": "Error de validación: 2 campos tienen errores",
  "type": "ValidationError",
  "errors": [
    {
      "field": "responsible_user_id",
      "message": "El ID no es válido",
      "original_message": "Input should be a valid UUID...",
      "type": "uuid_parsing"
    },
    {
      "field": "email",
      "message": "El email no es válido",
      "original_message": "value is not a valid email address...",
      "type": "value_error.email"
    }
  ],
  "field_errors": {
    "responsible_user_id": "El ID no es válido",
    "email": "El email no es válido"
  },
  "detail": [...]  // Formato crudo de FastAPI (para debugging)
}
```

---

## 🎯 Uso Recomendado: `field_errors`

El campo **`field_errors`** es un diccionario simple que mapea directamente el nombre del campo al mensaje de error. Es la forma más fácil de usar.

### Ejemplo Básico

```typescript
// 1. Estado para almacenar errores por campo
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

// 2. Capturar errores en el catch
try {
  await api.createCall(formData);
} catch (error: any) {
  if (error.response?.status === 422) {
    const errorData = error.response.data;
    
    // ✅ Usar field_errors directamente
    if (errorData.field_errors) {
      setFieldErrors(errorData.field_errors);
    }
  }
}

// 3. Mapear errores en el JSX
<input
  name="responsible_user_id"
  className={fieldErrors.responsible_user_id ? "border-red-500" : ""}
/>
{fieldErrors.responsible_user_id && (
  <span className="text-red-500 text-sm">
    {fieldErrors.responsible_user_id}
  </span>
)}
```

---

## 📝 Ejemplo Completo: CallForm

```typescript
import React, { useState } from 'react';
import { crmService } from '@/services/crmService';

interface CallFormData {
  responsible_user_id: string;
  entity_id: string;
  direction: string;
  call_status: string;
  phone?: string;
}

const CallForm: React.FC = () => {
  const [formData, setFormData] = useState<CallFormData>({
    responsible_user_id: '',
    entity_id: '',
    direction: '',
    call_status: '',
    phone: ''
  });
  
  // Estado para errores de validación
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores previos
    setFieldErrors({});
    setIsSubmitting(true);
    
    try {
      await crmService.createCall(formData);
      // ✅ Éxito: resetear formulario o redirigir
      alert('Llamada creada exitosamente');
    } catch (error: any) {
      // Manejar errores de validación (422)
      if (error.response?.status === 422) {
        const errorData = error.response.data;
        
        // Opción 1: Usar field_errors (RECOMENDADO)
        if (errorData.field_errors) {
          setFieldErrors(errorData.field_errors);
        }
        // Opción 2: Fallback a errors array
        else if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorsMap: Record<string, string> = {};
          errorData.errors.forEach((err: any) => {
            errorsMap[err.field] = err.message;
          });
          setFieldErrors(errorsMap);
        }
      } else {
        // Otros errores (500, 401, etc.)
        alert('Error al crear la llamada: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campo: Usuario Responsable */}
      <div>
        <label htmlFor="responsible_user_id" className="block text-sm font-medium">
          Usuario Responsable *
        </label>
        <select
          id="responsible_user_id"
          name="responsible_user_id"
          value={formData.responsible_user_id}
          onChange={handleChange}
          className={`
            mt-1 block w-full rounded-md border-gray-300 shadow-sm
            ${fieldErrors.responsible_user_id 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'focus:border-indigo-500 focus:ring-indigo-500'
            }
          `}
        >
          <option value="">Seleccionar usuario...</option>
          {/* Opciones de usuarios */}
        </select>
        {fieldErrors.responsible_user_id && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.responsible_user_id}
          </p>
        )}
      </div>
      
      {/* Campo: Dirección */}
      <div>
        <label htmlFor="direction" className="block text-sm font-medium">
          Dirección *
        </label>
        <select
          id="direction"
          name="direction"
          value={formData.direction}
          onChange={handleChange}
          className={`
            mt-1 block w-full rounded-md border-gray-300 shadow-sm
            ${fieldErrors.direction 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'focus:border-indigo-500 focus:ring-indigo-500'
            }
          `}
        >
          <option value="">Seleccionar...</option>
          <option value="inbound">Entrante</option>
          <option value="outbound">Saliente</option>
        </select>
        {fieldErrors.direction && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.direction}
          </p>
        )}
      </div>
      
      {/* Campo: Teléfono */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium">
          Teléfono
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`
            mt-1 block w-full rounded-md border-gray-300 shadow-sm
            ${fieldErrors.phone 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'focus:border-indigo-500 focus:ring-indigo-500'
            }
          `}
        />
        {fieldErrors.phone && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.phone}
          </p>
        )}
      </div>
      
      {/* Botón de envío */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Guardando...' : 'Guardar Llamada'}
      </button>
    </form>
  );
};

export default CallForm;
```

---

## 🎨 Estilos CSS (Tailwind)

### Clase para campos con error

```css
/* Campo con error */
.border-red-500 {
  border-color: rgb(239 68 68);
}

/* Mensaje de error */
.text-red-600 {
  color: rgb(220 38 38);
}
```

### Alternativa con CSS puro

```css
.form-field.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 1px #ef4444;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
```

---

## 🔄 Limpiar Errores al Escribir

Es buena práctica limpiar el error de un campo cuando el usuario empieza a escribir:

```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
  
  // Limpiar error del campo si existe
  if (fieldErrors[name]) {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }
};
```

---

## 📊 Mensajes de Error Disponibles

El backend traduce automáticamente estos tipos de error a español:

| Tipo de Error | Mensaje en Español |
|--------------|-------------------|
| `missing` / `value_error.missing` | "Este campo es requerido" |
| `uuid_parsing` / `value_error.uuid` | "El ID no es válido" |
| `value_error.email` | "El email no es válido" |
| `int_parsing` | "Debe ser un número entero" |
| `float_parsing` | "Debe ser un número" |
| `datetime_parsing` | "La fecha no es válida" |
| `string_too_short` | "El texto es demasiado corto" |
| `string_too_long` | "El texto es demasiado largo" |

---

## 🔧 Hook Personalizado (Opcional)

Para reutilizar la lógica de manejo de errores, puedes crear un hook personalizado:

```typescript
import { useState } from 'react';

export function useFormErrors() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const setErrors = (error: any) => {
    if (error?.response?.status === 422) {
      const errorData = error.response.data;
      if (errorData.field_errors) {
        setFieldErrors(errorData.field_errors);
        return;
      }
      // Fallback a errors array
      if (errorData.errors && Array.isArray(errorData.errors)) {
        const errorsMap: Record<string, string> = {};
        errorData.errors.forEach((err: any) => {
          errorsMap[err.field] = err.message;
        });
        setFieldErrors(errorsMap);
        return;
      }
    }
    // Limpiar errores si no es un error 422
    setFieldErrors({});
  };
  
  const clearError = (fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };
  
  const clearAllErrors = () => {
    setFieldErrors({});
  };
  
  const getFieldError = (fieldName: string): string | undefined => {
    return fieldErrors[fieldName];
  };
  
  const hasErrors = (): boolean => {
    return Object.keys(fieldErrors).length > 0;
  };
  
  return {
    fieldErrors,
    setErrors,
    clearError,
    clearAllErrors,
    getFieldError,
    hasErrors
  };
}
```

### Uso del Hook

```typescript
const { fieldErrors, setErrors, clearError } = useFormErrors();

try {
  await crmService.createCall(formData);
} catch (error: any) {
  setErrors(error);
}

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
  clearError(name); // Limpiar error al escribir
};
```

---

## ✅ Checklist de Implementación

- [ ] Agregar estado `fieldErrors` al componente
- [ ] Capturar errores 422 en el `catch`
- [ ] Usar `errorData.field_errors` para mapear errores
- [ ] Aplicar clase CSS de error a campos con `fieldErrors[campo]`
- [ ] Mostrar mensaje de error debajo de cada campo
- [ ] Limpiar errores cuando el usuario escribe
- [ ] Probar con diferentes tipos de errores

---

## 🎯 Mejores Prácticas

1. **Siempre limpiar errores previos** antes de enviar el formulario
2. **Limpiar errores individuales** cuando el usuario empieza a escribir en ese campo
3. **Usar `field_errors`** en lugar de parsear el array `errors` manualmente
4. **Mostrar mensajes claros** debajo de cada campo con error
5. **Aplicar estilos visuales** (borde rojo) para indicar campos con error
6. **Manejar otros tipos de errores** (500, 401, etc.) de forma diferente

---

## 🔗 Referencias

- [Especificación Backend](./BACKEND_VALIDATION_ERROR_FORMAT.md) - **Formato exacto que el backend debe devolver** para errores 422
- [Fix UUID Validation](./BACKEND_CALL_FORM_UUID_VALIDATION_FIX.md) - Fix relacionado con validación UUID en CallForm
- [Esquemas de formularios CRM](../FORMULARIOS_ESQUEMAS_DATOS.md) - Documentación de esquemas de datos de formularios CRM
- [Componente CallForm](../src/components/CRM/CallForm.tsx) - Implementación real del formulario de llamadas
- [Servicio CRM](../src/services/crmService.ts) - Servicio que maneja las llamadas a la API

---

**Última actualización**: 2025-01-29
