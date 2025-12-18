# 📅 API de Calendario CRM - Guía para Frontend

## 📋 Resumen

Los endpoints de calendario (`/api/crm/calls/calendar` y `/api/crm/tasks/calendar`) ahora incluyen campos `contact_id` y `contact_name` para facilitar el acceso directo a la información del contacto sin necesidad de hacer consultas adicionales.

**Fecha de Actualización**: 18 de Diciembre, 2025

---

## ✅ Nuevos Campos en Respuestas

### Campos Agregados

Todos los objetos de respuesta de calendario ahora incluyen:

- **`contact_id`** (`string | null`): ID del contacto asociado (cuando `entity_type === "contacts"`)
- **`contact_name`** (`string | null`): Nombre del contacto asociado (cuando `entity_type === "contacts"`)

---

## 📞 Endpoint: GET /api/crm/calls/calendar

### Request

```typescript
GET /api/crm/calls/calendar?start_date=2025-12-01T00:00:00Z&end_date=2026-01-01T00:00:00Z
Headers:
  X-CRM-Auth: your-token
```

### Response

```typescript
interface CallResponse {
  id: string;
  direction: "inbound" | "outbound" | null;
  phone: string | null;
  call_status: string | null;
  duration: number | null;
  entity_id: string | null;
  entity_type: "contacts" | "leads" | "companies" | null;
  
  // ✅ NUEVOS CAMPOS
  contact_id: string | null;      // Alias de entity_id cuando entity_type === "contacts"
  contact_name: string | null;    // Nombre del contacto cuando entity_type === "contacts"
  
  created_at: string;
  updated_at: string;
  // ... otros campos
}
```

### Ejemplo de Respuesta

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "direction": "inbound",
    "phone": "+34600123456",
    "call_status": "completed",
    "duration": 300,
    "entity_id": "123e4567-e89b-12d3-a456-426614174000",
    "entity_type": "contacts",
    "contact_id": "123e4567-e89b-12d3-a456-426614174000",  // ✅ NUEVO
    "contact_name": "Juan Pérez",                          // ✅ NUEVO
    "created_at": "2025-12-18T10:30:00Z",
    "updated_at": "2025-12-18T10:35:00Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "direction": "outbound",
    "phone": "+34600123457",
    "call_status": "completed",
    "duration": 180,
    "entity_id": null,
    "entity_type": null,
    "contact_id": null,      // ✅ null cuando no hay contacto
    "contact_name": null,    // ✅ null cuando no hay contacto
    "created_at": "2025-12-18T11:00:00Z",
    "updated_at": "2025-12-18T11:03:00Z"
  }
]
```

---

## 📋 Endpoint: GET /api/crm/tasks/calendar

### Request

```typescript
GET /api/crm/tasks/calendar?start_date=2025-12-01T00:00:00Z&end_date=2026-01-01T00:00:00Z
Headers:
  X-CRM-Auth: your-token
```

### Response

```typescript
interface TaskResponse {
  id: string;
  text: string;
  task_type: string | null;
  complete_till: string | null;
  entity_id: string | null;
  entity_type: "contacts" | "leads" | "companies" | null;
  
  // ✅ NUEVOS CAMPOS
  contact_id: string | null;      // Alias de entity_id cuando entity_type === "contacts"
  contact_name: string | null;    // Nombre del contacto cuando entity_type === "contacts"
  
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  // ... otros campos
}
```

### Ejemplo de Respuesta

```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "text": "Llamar a cliente para seguimiento",
    "task_type": "call",
    "complete_till": "2025-12-19T14:00:00Z",
    "entity_id": "123e4567-e89b-12d3-a456-426614174000",
    "entity_type": "contacts",
    "contact_id": "123e4567-e89b-12d3-a456-426614174000",  // ✅ NUEVO
    "contact_name": "Juan Pérez",                          // ✅ NUEVO
    "is_completed": false,
    "created_at": "2025-12-18T09:00:00Z",
    "updated_at": "2025-12-18T09:00:00Z"
  }
]
```

---

## 💻 Uso en Frontend

### Antes (Incomodo)

```typescript
// Tenías que verificar entity_type y extraer entity_id
const getContactId = (call: CallResponse): string | null => {
  if (call.entity_type === 'contacts' && call.entity_id) {
    return call.entity_id;
  }
  return null;
};

// Y luego hacer otra llamada para obtener el nombre
const getContactName = async (contactId: string): Promise<string | null> => {
  const response = await fetch(`/api/crm/contacts/${contactId}`);
  const contact = await response.json();
  return contact.name;
};

// Uso
const contactId = getContactId(call);
if (contactId) {
  const contactName = await getContactName(contactId);
  console.log(`Llamada con ${contactName}`);
}
```

### Después (Fácil) ✅

```typescript
// Ahora simplemente usa los campos directamente
const displayCallInfo = (call: CallResponse) => {
  if (call.contact_id && call.contact_name) {
    console.log(`Llamada con ${call.contact_name} (${call.contact_id})`);
  } else {
    console.log('Llamada sin contacto asociado');
  }
};

// Uso directo
displayCallInfo(call);
```

---

## 🎯 Ejemplos de Uso

### Ejemplo 1: Mostrar Nombre del Contacto en el Calendario

```typescript
interface CalendarEvent {
  id: string;
  type: 'call' | 'task';
  title: string;
  date: string;
  contactName: string | null;
  contactId: string | null;
}

const formatCalendarEvents = (
  calls: CallResponse[],
  tasks: TaskResponse[]
): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  
  // Agregar llamadas
  calls.forEach(call => {
    events.push({
      id: call.id,
      type: 'call',
      title: `Llamada ${call.direction === 'inbound' ? 'entrante' : 'saliente'}`,
      date: call.created_at,
      contactName: call.contact_name,  // ✅ Directo, sin consultas adicionales
      contactId: call.contact_id,      // ✅ Directo
    });
  });
  
  // Agregar tareas
  tasks.forEach(task => {
    events.push({
      id: task.id,
      type: 'task',
      title: task.text,
      date: task.complete_till || task.created_at,
      contactName: task.contact_name,  // ✅ Directo
      contactId: task.contact_id,     // ✅ Directo
    });
  });
  
  return events;
};
```

### Ejemplo 2: Filtrar por Contacto

```typescript
const getEventsForContact = (
  contactId: string,
  calls: CallResponse[],
  tasks: TaskResponse[]
) => {
  const callEvents = calls.filter(call => call.contact_id === contactId);
  const taskEvents = tasks.filter(task => task.contact_id === contactId);
  
  return {
    calls: callEvents,
    tasks: taskEvents,
  };
};
```

### Ejemplo 3: Mostrar en Lista de Eventos

```typescript
const EventListItem: React.FC<{ event: CallResponse | TaskResponse }> = ({ event }) => {
  return (
    <div className="event-item">
      <div className="event-title">
        {'text' in event ? event.text : `Llamada ${event.direction}`}
      </div>
      
      {/* ✅ Mostrar nombre del contacto directamente */}
      {event.contact_name && (
        <div className="event-contact">
          <span className="contact-icon">👤</span>
          <span>{event.contact_name}</span>
        </div>
      )}
      
      {/* ✅ Link directo al contacto si existe */}
      {event.contact_id && (
        <a href={`/crm/contacts/${event.contact_id}`}>
          Ver contacto
        </a>
      )}
    </div>
  );
};
```

### Ejemplo 4: Agrupar por Contacto

```typescript
interface ContactEvents {
  contactId: string;
  contactName: string;
  calls: CallResponse[];
  tasks: TaskResponse[];
}

const groupEventsByContact = (
  calls: CallResponse[],
  tasks: TaskResponse[]
): ContactEvents[] => {
  const contactMap = new Map<string, ContactEvents>();
  
  // Procesar llamadas
  calls.forEach(call => {
    if (call.contact_id && call.contact_name) {
      if (!contactMap.has(call.contact_id)) {
        contactMap.set(call.contact_id, {
          contactId: call.contact_id,
          contactName: call.contact_name,
          calls: [],
          tasks: [],
        });
      }
      contactMap.get(call.contact_id)!.calls.push(call);
    }
  });
  
  // Procesar tareas
  tasks.forEach(task => {
    if (task.contact_id && task.contact_name) {
      if (!contactMap.has(task.contact_id)) {
        contactMap.set(task.contact_id, {
          contactId: task.contact_id,
          contactName: task.contact_name,
          calls: [],
          tasks: [],
        });
      }
      contactMap.get(task.contact_id)!.tasks.push(task);
    }
  });
  
  return Array.from(contactMap.values());
};
```

---

## 🔍 Comportamiento de los Campos

### `contact_id`

- **Tipo**: `string | null`
- **Valor cuando hay contacto**: Igual a `entity_id` cuando `entity_type === "contacts"`
- **Valor cuando no hay contacto**: `null`
- **Uso**: ID directo del contacto, sin necesidad de verificar `entity_type`

### `contact_name`

- **Tipo**: `string | null`
- **Valor cuando hay contacto**: Nombre completo del contacto (`contact.name`)
- **Valor cuando no hay contacto**: `null`
- **Uso**: Nombre del contacto listo para mostrar, sin consultas adicionales

---

## ⚠️ Notas Importantes

### 1. Retrocompatibilidad

Los campos `entity_id` y `entity_type` siguen disponibles y funcionan como antes. Los nuevos campos son **adicionales** y no rompen código existente.

### 2. Cuando `contact_id` es `null`

- `contact_id` será `null` cuando:
  - `entity_type` no es `"contacts"`
  - `entity_id` es `null`
  - No hay entidad asociada

### 3. Cuando `contact_name` es `null`

- `contact_name` será `null` cuando:
  - `contact_id` es `null`
  - El contacto no existe o fue eliminado
  - No hay contacto asociado

### 4. Optimización

Los nombres de contacto se cargan de forma optimizada en una sola query por lote, por lo que no hay impacto significativo en el rendimiento.

---

## 📚 Endpoints Relacionados

### Obtener Detalles del Contacto

Si necesitas más información del contacto (además del nombre), puedes usar:

```typescript
GET /api/crm/contacts/{contact_id}
Headers:
  X-CRM-Auth: your-token
```

Pero en la mayoría de casos, `contact_id` y `contact_name` son suficientes para mostrar información en el calendario.

---

## ✅ Checklist de Migración

Si estás actualizando código existente:

- [ ] Reemplazar verificaciones de `entity_type === "contacts"` por uso directo de `contact_id`
- [ ] Eliminar llamadas adicionales a `/api/crm/contacts/{id}` solo para obtener el nombre
- [ ] Actualizar componentes que muestran nombres de contactos para usar `contact_name`
- [ ] Actualizar tipos TypeScript/interfaces para incluir `contact_id` y `contact_name`
- [ ] Probar que los eventos sin contacto (`contact_id === null`) se manejan correctamente

---

## 🚀 Beneficios

1. ✅ **Menos llamadas API**: No necesitas hacer consultas adicionales para obtener el nombre del contacto
2. ✅ **Código más simple**: `call.contact_name` es más legible que verificar `entity_type` y hacer una consulta
3. ✅ **Mejor rendimiento**: Los nombres se cargan de forma optimizada en una sola query
4. ✅ **Mejor UX**: Puedes mostrar nombres de contactos inmediatamente sin esperar cargas adicionales

---

## 📞 Soporte

Si tienes preguntas o encuentras problemas con estos campos, contacta al equipo de backend.

---

**Última Actualización**: 18 de Diciembre, 2025  
**Versión API**: 1.0  
**Estado**: ✅ **Disponible en Producción**

