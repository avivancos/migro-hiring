# Guía de Integración Frontend - API Pili

**Fecha:** 2025-01-27  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen

Esta documentación describe cómo está implementada la integración del frontend con la API de Pili según la especificación oficial.

---

## 🔧 Configuración Base

### URL de la API

**Desarrollo:**
```
http://localhost:8001/api
```

**Producción:**
```
https://pili.migro.es/api
```

**Configuración:** `src/config/constants.ts`

```typescript
export const PILI_API_BASE_URL = import.meta.env.VITE_PILI_API_URL || 
  (import.meta.env.PROD 
    ? 'https://pili.migro.es/api' 
    : 'http://localhost:8001/api');
```

**Variable de entorno:** `VITE_PILI_API_URL` (opcional, sobrescribe defaults)

### CORS

La API está configurada para aceptar requests desde:
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:5173`
- `http://localhost:3000`
- `http://localhost:9090`
- Cualquier subdominio de `migro.es` y `migro.app`

---

## 📡 Endpoint Principal: `/api/pili/chat`

### Método
`POST`

### URL Completa
```
POST {PILI_API_BASE_URL}/pili/chat
```

Donde `PILI_API_BASE_URL` es:
- Desarrollo: `http://localhost:8001/api`
- Producción: `https://pili.migro.es/api`

### Headers Requeridos
```javascript
{
  "Content-Type": "application/json"
}
```

### Request Body

#### Campos Requeridos

| Campo | Tipo | Descripción | Validaciones |
|-------|------|-------------|--------------|
| `query` | `string` | La pregunta o mensaje del usuario | - Mínimo: 1 carácter<br>- Máximo: 5000 caracteres<br>- No puede estar vacío |
| `user_id` | `string` | Identificador único del usuario | - Mínimo: 1 carácter<br>- No puede estar vacío |

#### Campos Opcionales

| Campo | Tipo | Descripción | Comportamiento |
|-------|------|-------------|----------------|
| `conversation_id` | `string \| null` | ID de conversación existente | - Puede omitirse<br>- Puede ser `null`<br>- Si se omite, se genera como `"conv_{user_id}"` |

### Response

#### Success (200)

```json
{
  "response": "Respuesta de Pili generada por el agente",
  "conversation_id": "conv_user-123"
}
```

#### Error 422 (Validation Error)

```json
{
  "detail": "Error de validación en el request",
  "errors": [
    {
      "field": "body -> query",
      "message": "El campo 'body -> query' no puede estar vacío. Debe contener al menos un carácter.",
      "type": "validation_error"
    }
  ],
  "help": {
    "required_fields": ["query", "user_id"],
    "optional_fields": ["conversation_id"],
    "example": {
      "query": "Tu pregunta aquí",
      "user_id": "user-123",
      "conversation_id": "conv-user-123"
    }
  }
}
```

---

## 💻 Implementación Actual

### Tipos TypeScript

**Archivo:** `src/types/pili.ts`

```typescript
export interface PiliChatRequest {
  query: string;
  user_id: string;
  conversation_id?: string | null;
}

export interface PiliChatResponse {
  response: string;
  conversation_id: string;
}

export interface PiliValidationError {
  detail: string;
  errors: Array<{
    field: string;
    message: string;
    type: string;
  }>;
  help: {
    required_fields: string[];
    optional_fields: string[];
    example: {
      query: string;
      user_id: string;
      conversation_id?: string;
    };
  };
}
```

### Servicio de Pili

**Archivo:** `src/services/piliService.ts`

Características implementadas:

1. **Validación antes de enviar:**
   - Query no vacío
   - user_id no vacío
   - Longitud máxima de 5000 caracteres

2. **Manejo de errores 422:**
   - Extrae y muestra errores de validación de forma clara
   - Muestra todos los errores del array `errors`

3. **Timeout:**
   - 60 segundos (60000ms) para permitir respuestas largas

4. **Manejo de errores:**
   - Errores de validación (422)
   - Errores de conexión
   - Otros errores HTTP

### Componente AdminPili

**Archivo:** `src/pages/admin/AdminPili.tsx`

Características implementadas:

1. **Generación de user_id:**
   - Genera un ID único por sesión usando localStorage
   - Formato: `pili-user-{timestamp}-{random}`
   - Persistente entre recargas de página

2. **Gestión de conversation_id:**
   - Guarda el `conversation_id` de la primera respuesta
   - Lo reutiliza en mensajes subsiguientes para mantener contexto

3. **Validación en el frontend:**
   - Validación de campo vacío
   - Validación de longitud máxima (5000 caracteres)
   - Contador de caracteres cuando se aproxima al límite

4. **Manejo de errores:**
   - Muestra errores en un banner rojo
   - También muestra errores en el chat
   - Permite cerrar mensajes de error

5. **Estados de UI:**
   - Loading state mientras se procesa la respuesta
   - Typing indicator
   - Disabled state cuando el servicio no está disponible

---

## 🔄 Flujo de Uso

1. **Usuario accede a `/pili`**
   - Se genera/obtiene un `user_id` único del localStorage
   - Se verifica el health del servicio

2. **Usuario envía mensaje**
   - Se valida el query (no vacío, longitud máxima)
   - Se envía request a `/api/pili/chat` con:
     - `query`: mensaje del usuario
     - `user_id`: ID único del usuario
     - `conversation_id`: ID de conversación (si existe)

3. **Respuesta del servidor**
   - Si es la primera respuesta, se guarda el `conversation_id`
   - Se muestra la respuesta en el chat
   - Si hay error, se muestra mensaje de error

---

## 🐛 Manejo de Errores

### Error 422 (Validation Error)

El servicio maneja errores 422 extrayendo información detallada:

```typescript
if (error.response?.status === 422) {
  const validationError = error.response.data as PiliValidationError;
  const errorMessages = validationError.errors
    ?.map(err => `${err.field}: ${err.message}`)
    .join('\n') || validationError.detail;
  
  throw new Error(`Error de validación:\n${errorMessages}`);
}
```

### Otros Errores

- **Error de conexión:** "No se pudo conectar con el servicio de Pili..."
- **Error del servidor:** Muestra el mensaje de `detail` del response
- **Error desconocido:** "Error desconocido al consultar a Pili"

---

## ✅ Validaciones Implementadas

### Frontend (Antes de enviar)

1. ✅ Query no vacío
2. ✅ Query con máximo 5000 caracteres
3. ✅ user_id no vacío
4. ✅ Contador de caracteres visible cuando > 4500

### Backend (En la API)

1. ✅ Query mínimo 1 carácter
2. ✅ Query máximo 5000 caracteres
3. ✅ user_id mínimo 1 carácter
4. ✅ Validación de tipos de datos

---

## 📝 Ejemplos de Request

### Request Mínimo

```json
{
  "query": "¿Cuáles son los requisitos para arraigo social?",
  "user_id": "pili-user-1706380800000-abc123"
}
```

### Request con conversation_id

```json
{
  "query": "Necesito más información",
  "user_id": "pili-user-1706380800000-abc123",
  "conversation_id": "conv_pili-user-1706380800000-abc123"
}
```

### Request con conversation_id null

```json
{
  "query": "Nueva consulta",
  "user_id": "pili-user-1706380800000-abc123",
  "conversation_id": null
}
```

---

## 🔐 Variables de Entorno

### Desarrollo (`.env.local`)

```env
VITE_PILI_API_URL=http://localhost:8001/api
```

### Producción (`.env.production`)

```env
VITE_PILI_API_URL=https://pili.migro.es/api
```

**Nota:** Si no se configura, se usan los valores por defecto según el entorno.

---

## 📁 Archivos Relacionados

- `src/config/constants.ts` - Configuración de URL base
- `src/types/pili.ts` - Tipos TypeScript
- `src/services/piliService.ts` - Servicio de API
- `src/pages/admin/AdminPili.tsx` - Componente de UI
- `docs/PILI_ENABLED.md` - Documentación de habilitación
- `pili/DESPLIEGUE_SERVICIOS_AISLADOS.md` - Documentación de despliegue

---

## ✅ Checklist de Implementación

- [x] Configurar `PILI_API_BASE_URL` en constants.ts
- [x] Implementar tipos TypeScript para request/response
- [x] Implementar `piliService.chat()` con manejo de errores
- [x] Validar `query` y `user_id` antes de enviar
- [x] Manejar `conversation_id` para mantener contexto
- [x] Mostrar errores 422 de forma clara al usuario
- [x] Implementar loading states
- [x] Configurar timeout apropiado (60 segundos)
- [x] Generar user_id único y persistente
- [x] Agregar validación de longitud de query
- [x] Agregar contador de caracteres

---

## 🔮 Mejoras Futuras

- [ ] Permitir al usuario cambiar su user_id
- [ ] Guardar historial de conversaciones en localStorage
- [ ] Implementar paginación para conversaciones largas
- [ ] Agregar soporte para archivos adjuntos (si la API lo permite)
- [ ] Mejorar UI para mostrar errores de validación de forma más visual

---

**Última actualización:** 2025-01-27

