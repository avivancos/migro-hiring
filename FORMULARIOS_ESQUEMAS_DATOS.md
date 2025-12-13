# Esquemas de Datos de Formularios - CRM Migro

Este documento especifica los datos exactos que se envían al backend desde cada formulario del sistema CRM.

---

## 📞 1. Formulario de Llamadas (CallForm)

### Endpoint
```
POST /api/crm/calls
```

### Esquema: CallCreateRequest

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `entity_type` | `'contacts' \| 'leads'` | ✅ Sí | Tipo de entidad relacionada | `"contacts"` |
| `entity_id` | `string` (UUID) | ✅ Sí | ID de la entidad (contacto o lead) | `"123e4567-e89b-12d3-a456-426614174000"` |
| `direction` | `'inbound' \| 'outbound'` | ✅ Sí | Dirección de la llamada | `"outbound"` |
| `phone` | `string` | ❌ Opcional | Número de teléfono | `"+34600123456"` |
| `duration` | `number` | ❌ Opcional | Duración en segundos | `450` |
| `call_status` | `string` | ✅ Sí | Estado de la llamada | `"completed"` |
| `call_result` | `string` | ❌ Opcional | Resultado de la llamada | `"Cliente interesado"` |
| `record_url` | `string` | ❌ Opcional | URL de la grabación | `"https://example.com/recording.mp3"` |
| `started_at` | `string` (ISO 8601) | ✅ Sí | **NUEVO** - Fecha y hora de inicio de la llamada | `"2024-01-15T10:30:00.000Z"` |
| `ended_at` | `string` (ISO 8601) | ❌ Opcional | **NUEVO** - Fecha y hora de fin de la llamada | `"2024-01-15T10:35:00.000Z"` |
| `responsible_user_id` | `string` (UUID) | ❌ Opcional | ID del usuario responsable | `"123e4567-e89b-12d3-a456-426614174000"` |
| `notes` | `string` | ❌ Opcional | Notas adicionales | `"Nota importante"` |
| `resumen_llamada` | `string` | ❌ Opcional | Resumen de la llamada. Si es primera llamada, se agrega prefijo `[PRIMERA LLAMADA]` | `"[PRIMERA LLAMADA]\nResumen de la conversación..."` |
| `proxima_llamada_fecha` | `string` (ISO 8601) | ❌ Opcional | Fecha para próxima llamada | `"2024-01-20T10:00:00.000Z"` |
| `proxima_accion_fecha` | `string` (ISO 8601) | ❌ Opcional | Fecha para próxima acción | `"2024-01-20T10:00:00.000Z"` |

### Valores Posibles

#### call_status
- `"completed"` - Completada
- `"failed"` - Fallida
- `"busy"` - Ocupado
- `"no_answer"` - Sin respuesta
- `"missed"` - Perdida

### ⚠️ Campos Eliminados

| Campo Eliminado | Notas |
|----------------|-------|
| `cloudtalk_id` | ❌ **ELIMINADO** - Ya no se usa CloudTalk. No enviar este campo. |

### Ejemplo JSON
```json
{
  "entity_type": "contacts",
  "entity_id": "123e4567-e89b-12d3-a456-426614174000",
  "direction": "outbound",
  "phone": "+34600123456",
  "duration": 450,
  "call_status": "completed",
  "call_result": "Cliente interesado en el servicio",
  "record_url": "https://example.com/recording.mp3",
  "started_at": "2024-01-15T10:30:00.000Z",
  "ended_at": "2024-01-15T10:35:00.000Z",
  "responsible_user_id": "123e4567-e89b-12d3-a456-426614174000",
  "resumen_llamada": "[PRIMERA LLAMADA]\nConversación inicial sobre servicio de arraigo",
  "proxima_llamada_fecha": "2024-01-20T10:00:00.000Z"
}
```

### Datos Adicionales de Primera Llamada

Cuando `isFirstCall = true` y `entity_type === 'contacts'`, además de crear la llamada, se actualiza el contacto con:

#### ContactUpdate (Actualización del Contacto)

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `city` | `string` | Ciudad de residencia | `"Madrid"` |
| `state` | `string` | Provincia de residencia | `"Madrid"` |
| `nacionalidad` | `string` | Nacionalidad del contacto | `"Colombia"` |
| `empadronado` | `boolean` | Si tiene empadronamiento | `true` |
| `tiene_familiares_espana` | `boolean` | Si tiene familiares españoles | `true` |
| `position` | `string` | Profesión | `"Ingeniero"` |
| `trabaja_b` | `boolean` | Si está trabajando actualmente | `true` |
| `tiempo_espana` | `string` | Tiempo en España (calculado) | `"3 años"` |
| `custom_fields.fecha_llegada_espana` | `string` (YYYY-MM-DD) | Fecha exacta de llegada | `"2021-05-15"` |
| `custom_fields.familiares_espana_detalle` | `string` | Detalle de familiares españoles | `"Esposo español, dos hijos españoles"` |
| `custom_fields.tipo_trabajo_detalle` | `string` | Tipo de trabajo detallado (solo si trabaja) | `"Ingeniero de Software"` |
| `custom_fields.servicio_propuesto` | `string` | Servicio propuesto | `"arraigo"` |
| `custom_fields.servicio_detalle` | `string` | Detalle del servicio | `"Arraigo social por trabajo"` |

#### Valores de servicio_propuesto
- `"asilo_proteccion_internacional"`
- `"arraigo"`
- `"reagrupacion_familiar"`
- `"nacionalidad"`

---

## 👤 2. Formulario de Contactos (ContactForm)

### Endpoint
```
POST /api/crm/contacts
PUT /api/crm/contacts/{id}
```

### Esquema: ContactCreateRequest / ContactUpdateRequest

| Campo | Tipo | Requerido (Create) | Requerido (Update) | Descripción | Ejemplo |
|-------|------|-------------------|-------------------|-------------|---------|
| `name` | `string` | ✅ Sí | ❌ No | Nombre completo (requerido por API) | `"Juan Pérez"` |
| `first_name` | `string` | ❌ No | ❌ No | Nombre | `"Juan"` |
| `last_name` | `string` | ❌ No | ❌ No | Apellidos | `"Pérez García"` |
| `email` | `string` | ❌ No | ❌ No | Email | `"juan@example.com"` |
| `phone` | `string` | ❌ No | ❌ No | Teléfono fijo | `"+34600123456"` |
| `mobile` | `string` | ❌ No | ❌ No | **NUEVO** - Teléfono móvil (separado de `phone`) | `"+34600123456"` |
| `address` | `string` | ❌ No | ❌ No | Dirección | `"Calle Mayor 123"` |
| `city` | `string` | ❌ No | ❌ No | Ciudad | `"Madrid"` |
| `state` | `string` | ❌ No | ❌ No | Provincia | `"Madrid"` |
| `postal_code` | `string` | ❌ No | ❌ No | Código postal | `"28001"` |
| `country` | `string` | ❌ No | ❌ No | País (default: "España") | `"España"` |
| `company` | `string` | ❌ No | ❌ No | Nombre de empresa | `"Empresa S.L."` |
| `position` | `string` | ❌ No | ❌ No | Posición/Profesión | `"Abogado"` |
| `company_id` | `string` (UUID) | ❌ No | ❌ No | **NUEVO** - ID de la empresa asociada | `"123e4567-e89b-12d3-a456-426614174000"` |
| `responsible_user_id` | `string` (UUID) | ❌ No | ❌ No | ID del usuario responsable | `"123e4567-e89b-12d3-a456-426614174000"` |
| `notes` | `string` | ❌ No | ❌ No | Notas | `"Notas adicionales"` |
| `custom_fields` | `Record<string, any>` | ❌ No | ❌ No | Campos personalizados (JSON flexible) | `{"campo1": "valor1"}` |
| `grading_llamada` | `'A' \| 'B+' \| 'B-' \| 'C'` | ❌ No | ❌ No | Grado de llamada | `"A"` |
| `grading_situacion` | `'A' \| 'B+' \| 'B-' \| 'C'` | ❌ No | ❌ No | Grado de situación | `"B+"` |
| `nacionalidad` | `string` | ❌ No | ❌ No | Nacionalidad | `"Colombia"` |
| `tiempo_espana` | `string` | ❌ No | ❌ No | Tiempo en España | `"3 años"` |
| `empadronado` | `boolean` | ❌ No | ❌ No | Si tiene empadronamiento | `true` |
| `lugar_residencia` | `string` | ❌ No | ❌ No | Lugar de residencia | `"Madrid"` |
| `tiene_ingresos` | `boolean` | ❌ No | ❌ No | Si tiene ingresos | `true` |
| `trabaja_b` | `boolean` | ❌ No | ❌ No | Si trabaja | `true` |
| `edad` | `number` | ❌ No | ❌ No | Edad | `35` |
| `tiene_familiares_espana` | `boolean` | ❌ No | ❌ No | Si tiene familiares españoles | `true` |

### Valores Posibles

#### grading_llamada / grading_situacion
- `"A"`
- `"B+"`
- `"B-"`
- `"C"`

### Ejemplo JSON (Create)
```json
{
  "name": "Juan Pérez García",
  "first_name": "Juan",
  "last_name": "Pérez García",
  "email": "juan@example.com",
  "phone": "+34600123456",
  "mobile": "+34600123456",
  "city": "Madrid",
  "state": "Madrid",
  "country": "España",
  "nacionalidad": "Colombia",
  "empadronado": true,
  "tiene_familiares_espana": true,
  "position": "Ingeniero",
  "trabaja_b": true,
  "custom_fields": {
    "servicio_propuesto": "arraigo",
    "servicio_detalle": "Arraigo social"
  }
}
```

---

## 📋 3. Formulario de Leads (LeadForm)

### Endpoint
```
POST /api/crm/leads
PUT /api/crm/leads/{id}
```

### Esquema: LeadCreateRequest / LeadUpdateRequest

| Campo | Tipo | Requerido (Create) | Requerido (Update) | Descripción | Ejemplo |
|-------|------|-------------------|-------------------|-------------|---------|
| `name` | `string` | ✅ Sí | ❌ No | Nombre del lead | `"Lead: Juan Pérez - Arraigo"` |
| `status` | `string` | ✅ Sí | ❌ No | Estado del lead | `"new"` |
| `pipeline_id` | `string` (UUID) | ✅ Sí | ❌ No | ID del pipeline | `"123e4567-e89b-12d3-a456-426614174000"` |
| `contact_id` | `string` (UUID) | ❌ No | ❌ No | ID del contacto asociado | `"123e4567-e89b-12d3-a456-426614174000"` |
| `price` | `number` | ❌ No | ❌ No | Precio | `1500.00` |
| `currency` | `string` | ❌ No | ❌ No | Moneda (default: "EUR") | `"EUR"` |
| `description` | `string` | ❌ No | ❌ No | Descripción | `"Cliente interesado en arraigo social"` |
| `responsible_user_id` | `string` (UUID) | ✅ Sí | ❌ No | ID del usuario responsable (⚠️ solo `lawyer` o `admin`) | `"123e4567-e89b-12d3-a456-426614174000"` |
| `company_id` | `string` (UUID) | ❌ No | ❌ No | **NUEVO** - ID de la empresa asociada | `"123e4567-e89b-12d3-a456-426614174000"` |
| `priority` | `string` | ❌ No | ❌ No | **NUEVO** - Prioridad del lead | `"high"` |
| `score` | `number` | ❌ No | ❌ No | **NUEVO** - Puntuación del lead | `85` |
| `service_type` | `string` | ❌ No | ❌ No | **NUEVO** - Tipo de servicio | `"Arraigo"` |
| `service_description` | `string` | ❌ No | ❌ No | **NUEVO** - Descripción del servicio | `"Arraigo social por trabajo"` |
| `source` | `string` | ❌ No | ❌ No | **NUEVO** - Origen del lead | `"Web"` |
| `expected_close_date` | `string` (ISO 8601) | ❌ No | ❌ No | **NUEVO** - Fecha esperada de cierre | `"2024-06-15T00:00:00.000Z"` |
| `custom_fields` | `Record<string, any>` | ❌ No | ❌ No | Campos personalizados (JSON flexible) | `{"campo1": "valor1"}` |

### Valores Posibles

#### status
- `"new"` - Nuevo
- `"contacted"` - Contactado
- `"proposal"` - Propuesta
- `"negotiation"` - Negociación
- `"won"` - Ganado
- `"lost"` - Perdido

#### priority
- `"low"`
- `"medium"`
- `"high"`
- `"urgent"`

#### service_type (Mapeo desde primera llamada)
- `"Asilo/Protección Internacional"` (desde `"asilo_proteccion_internacional"`)
- `"Arraigo"` (desde `"arraigo"`)
- `"Reagrupación Familiar"` (desde `"reagrupacion_familiar"`)
- `"Nacionalidad"` (desde `"nacionalidad"`)

### Ejemplo JSON (Create)
```json
{
  "name": "Lead: Juan Pérez - Arraigo",
  "status": "new",
  "pipeline_id": "123e4567-e89b-12d3-a456-426614174000",
  "contact_id": "123e4567-e89b-12d3-a456-426614174000",
  "price": 1500.00,
  "currency": "EUR",
  "description": "Cliente interesado en servicio de arraigo social",
  "responsible_user_id": "123e4567-e89b-12d3-a456-426614174000",
  "priority": "high",
  "service_type": "Arraigo",
  "service_description": "Arraigo social por trabajo"
}
```

---

## ✅ 4. Formulario de Tareas (TaskForm)

### Endpoint
```
POST /api/crm/tasks
PUT /api/crm/tasks/{id}
```

### Esquema: TaskCreateRequest

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `text` | `string` | ✅ Sí | Texto de la tarea | `"Llamar al cliente para seguimiento"` |
| `task_type` | `string` | ❌ No | Tipo de tarea | `"call"` |
| `entity_type` | `'contacts' \| 'leads'` | ✅ Sí | Tipo de entidad relacionada | `"contacts"` |
| `entity_id` | `string` (UUID) | ✅ Sí | ID de la entidad | `"123e4567-e89b-12d3-a456-426614174000"` |
| `responsible_user_id` | `string` (UUID) | ✅ Sí | ID del usuario responsable | `"123e4567-e89b-12d3-a456-426614174000"` |
| `complete_till` | `string` (ISO 8601) | ❌ No | ✅ **Preferido** - Fecha límite para completar | `"2024-01-20T10:00:00.000Z"` |
| `due_date` | `string` (ISO 8601) | ❌ No | ⚠️ **Legacy** - Se mapea automáticamente a `complete_till` | `"2024-01-20T10:00:00.000Z"` |
| `result_text` | `string` | ❌ No | Texto del resultado | `"Tarea completada exitosamente"` |
| `task_template_id` | `string` (UUID) | ❌ No | ID de la plantilla de tarea | `"123e4567-e89b-12d3-a456-426614174000"` |

**Recomendación**: Usar `complete_till` como campo principal. El campo `due_date` se acepta por compatibilidad pero se convierte internamente.

### Valores Posibles

#### task_type
- `"call"` - Llamada
- `"follow_up"` - Seguimiento
- `"meeting"` - Reunión
- `"email"` - Email
- `"reminder"` - Recordatorio
- `"other"` - Otro

⚠️ **Nota**: `"deadline"` **NO es un valor válido**. Usar `"reminder"` o `"other"` en su lugar.

### Ejemplo JSON
```json
{
  "text": "Primera llamada al cliente",
  "task_type": "call",
  "entity_type": "contacts",
  "entity_id": "123e4567-e89b-12d3-a456-426614174000",
  "responsible_user_id": "123e4567-e89b-12d3-a456-426614174000",
  "complete_till": "2024-01-20T10:00:00.000Z"
}
```

---

## 🏢 5. Formulario de Empresas (CompanyForm)

### Endpoint
```
POST /api/crm/companies
PUT /api/crm/companies/{id}
```

### Esquema: CompanyCreateRequest / CompanyUpdateRequest

| Campo | Tipo | Requerido (Create) | Requerido (Update) | Descripción | Ejemplo |
|-------|------|-------------------|-------------------|-------------|---------|
| `name` | `string` | ✅ Sí | ❌ No | Nombre de la empresa | `"Empresa S.L."` |
| `description` | `string` | ❌ No | ❌ No | Descripción | `"Empresa dedicada a servicios legales"` |
| `website` | `string` | ❌ No | ❌ No | Sitio web | `"https://www.empresa.com"` |
| `industry` | `string` | ❌ No | ❌ No | Industria | `"Servicios Legales"` |
| `phone` | `string` | ❌ No | ❌ No | Teléfono | `"+34600123456"` |
| `email` | `string` | ❌ No | ❌ No | Email | `"info@empresa.com"` |
| `address` | `string` | ❌ No | ❌ No | Dirección | `"Calle Mayor 123"` |
| `city` | `string` | ❌ No | ❌ No | Ciudad | `"Madrid"` |
| `country` | `string` | ❌ No | ❌ No | País (default: "España") | `"España"` |
| `responsible_user_id` | `string` (UUID) | ❌ No | ❌ No | ID del usuario responsable | `"123e4567-e89b-12d3-a456-426614174000"` |
| `custom_fields` | `Record<string, any>` | ❌ No | ❌ No | Campos personalizados (JSON flexible) | `{"campo1": "valor1"}` |

### Ejemplo JSON (Create)
```json
{
  "name": "Empresa Legal S.L.",
  "description": "Empresa dedicada a servicios legales y de inmigración",
  "website": "https://www.empresalegal.com",
  "industry": "Servicios Legales",
  "phone": "+34600123456",
  "email": "info@empresalegal.com",
  "address": "Calle Mayor 123",
  "city": "Madrid",
  "country": "España",
  "responsible_user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

## 📝 6. Formulario de Notas (NoteForm)

### Endpoint
```
POST /api/crm/notes
```

### Esquema: NoteCreateRequest

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `entity_type` | `'contacts' \| 'leads'` | ✅ Sí | Tipo de entidad relacionada | `"contacts"` |
| `entity_id` | `string` (UUID) | ✅ Sí | ID de la entidad | `"123e4567-e89b-12d3-a456-426614174000"` |
| `note_type` | `string` | ❌ No | Tipo de nota (default: "comment") | `"comment"` |
| `content` | `string` | ✅ Sí | Contenido de la nota | `"Nota importante sobre el cliente"` |
| `params` | `Record<string, any>` | ❌ No | Parámetros adicionales (JSON flexible) | `{"campo1": "valor1"}` |

### Ejemplo JSON
```json
{
  "entity_type": "contacts",
  "entity_id": "123e4567-e89b-12d3-a456-426614174000",
  "note_type": "comment",
  "content": "Cliente requiere documentación adicional para el proceso"
}
```

---

## 🔄 Flujos Especiales

### Primera Llamada (First Call Flow)

Cuando se registra una primera llamada (`isFirstCall = true`), se ejecutan las siguientes actualizaciones automáticas:

1. **Se actualiza el Contacto** con los datos capturados en el formulario
2. **Se actualiza el Lead asociado** (si existe) con el servicio propuesto
3. **Se crea la llamada** con prefijo `[PRIMERA LLAMADA]` en el resumen

#### Campos de Primera Llamada que se actualizan en el Contacto:

- `city` - Ciudad de residencia
- `state` - Provincia de residencia
- `nacionalidad` - Nacionalidad
- `empadronado` - Boolean
- `tiene_familiares_espana` - Boolean
- `position` - Profesión
- `trabaja_b` - Boolean (trabajando actualmente)
- `tiempo_espana` - Calculado desde fecha_llegada_espana
- `custom_fields.fecha_llegada_espana` - Fecha exacta (YYYY-MM-DD)
- `custom_fields.familiares_espana_detalle` - Detalle de familiares
- `custom_fields.servicio_propuesto` - Código del servicio
- `custom_fields.servicio_detalle` - Descripción del servicio
- `custom_fields.tipo_trabajo_detalle` - Tipo de trabajo detallado (solo si trabaja)

#### Campos de Primera Llamada que se actualizan en el Lead:

- `service_type` - Tipo de servicio (mapeado desde servicio_propuesto)
- `service_description` - Descripción del servicio

---

---

## 🆕 7. Nuevos Endpoints de Conteo

### `GET /api/crm/contacts/count`

Retorna el número total de contactos (no eliminados).

**Query Parameters:**
- `nacionalidad` (opcional): Filtrar por nacionalidad
- `search` (opcional): Búsqueda por nombre o email
- `grading_llamada` (opcional): Filtrar por grado de llamada
- `grading_situacion` (opcional): Filtrar por grado de situación

**Ejemplo:**
```bash
GET /api/crm/contacts/count
GET /api/crm/contacts/count?nacionalidad=Colombia
GET /api/crm/contacts/count?search=juan
```

**Response:**
```json
{
  "total": 527
}
```

---

### `GET /api/crm/leads/count`

Retorna el número total de leads (no eliminados, excluye soft-deleted).

**Ejemplo:**
```bash
GET /api/crm/leads/count
```

**Response:**
```json
{
  "total": 342
}
```

---

## 🔒 Validaciones Importantes

### ⚠️ Validación de Responsible User

**CRÍTICO**: El campo `responsible_user_id` **solo acepta usuarios con rol `lawyer` o `admin`**.

- ❌ **Rechazado**: Usuarios con rol `"user"`
- ✅ **Aceptado**: Usuarios con rol `"lawyer"` o `"admin"`
- ✅ **Aceptado**: `null` (sin usuario responsable)

**Error si se envía un usuario con rol incorrecto:**
```json
{
  "detail": "Only users with role 'lawyer' or 'admin' can be assigned as responsible users. Regular users (role 'user') cannot be responsible."
}
```

**Recomendación Frontend:**
- Filtrar la lista de usuarios en el selector de "Responsable" para mostrar solo `lawyer` y `admin`
- El endpoint `GET /api/crm/users` ya filtra automáticamente por defecto

---

### ✅ Validación de Email Único (Contacts)

El email de los contactos debe ser único (excluyendo eliminados).

**Error si el email ya existe:**
```json
{
  "detail": "Contact with this email already exists"
}
```

---

### ✅ Manejo de Entity ID "new"

Los endpoints que filtran por `entity_id` manejan correctamente el valor `"new"`:

- `GET /api/crm/notes?entity_id=new&entity_type=leads` → Retorna `[]` (lista vacía) con status `200`
- `GET /api/crm/calls?entity_id=new&entity_type=contacts` → Retorna `[]` (lista vacía) con status `200`

**No generan error 422**, retornan listas vacías correctamente.

---

## 🗑️ Campos Eliminados / Deprecated

### ❌ CloudTalk - ELIMINADO

| Campo Eliminado | Reemplazo | Notas |
|----------------|-----------|-------|
| `cloudtalk_id` | ❌ Nada | Ya no se usa CloudTalk. Campo removido completamente del backend. |

**⚠️ Acción Frontend:**
- Remover cualquier referencia a `cloudtalk_id`
- No enviar este campo en los requests

---

## 📌 Notas Importantes

1. **UUIDs**: Todos los IDs son UUIDs en formato string
2. **Fechas ISO 8601**: Todas las fechas se envían en formato ISO 8601 (ej: `"2024-01-15T10:30:00.000Z"`)
3. **Custom Fields**: Los campos personalizados se almacenan en `custom_fields` como un objeto JSON flexible
4. **Campos Legacy**: Algunos campos tienen versiones legacy que se normalizan antes de enviar
5. **Validación Responsible User**: El backend valida que los usuarios responsables tengan el rol adecuado (abogados o administradores)
6. **Email Único**: Los emails de contactos deben ser únicos (excluyendo eliminados)
7. **Entity ID "new"**: Los endpoints manejan correctamente `entity_id="new"` retornando listas vacías

---

## 🔗 Referencias

- Tipos TypeScript: `src/types/crm.ts`
- Servicios: `src/services/crmService.ts`
- Componentes de formularios: `src/components/CRM/`

---

**Última actualización**: 2025-01-15

