# Guía: Obtención de Datos para Calendario

**Fecha**: 2025-01-20

---

## 📡 Endpoints Disponibles

### 1. Tareas del Calendario
```
GET /api/crm/tasks/calendar?start_date={ISO8601}&end_date={ISO8601}
```

**Parámetros**:
- `start_date` (opcional): Fecha inicio rango (ISO 8601)
- `end_date` (opcional): Fecha fin rango (ISO 8601)

**Response**: `List[TaskResponse]`
```json
[
  {
    "id": "uuid",
    "text": "Llamar a cliente",
    "task_type": "call",
    "complete_till": "2025-01-20T10:00:00Z",  // ⭐ Usar este campo para agrupar por fecha
    "entity_id": "uuid",
    "entity_type": "contacts",
    "is_completed": false,
    ...
  }
]
```

**Nota**: Solo retorna tareas con `is_completed: false`.

---

### 2. Llamadas del Calendario
```
GET /api/crm/calls/calendar?start_date={ISO8601}&end_date={ISO8601}
```

**Parámetros**:
- `start_date` (opcional): Fecha inicio rango (ISO 8601)
- `end_date` (opcional): Fecha fin rango (ISO 8601)

**Response**: `List[CallResponse]`
```json
[
  {
    "id": "uuid",
    "direction": "outbound",
    "phone": "+34600123456",
    "created_at": "2025-01-20T14:30:00Z",  // ⭐ Usar este campo para agrupar por fecha
    "entity_id": "uuid",
    "entity_type": "contacts",
    ...
  }
]
```

---

## 🔑 Campos Clave para Agrupar por Fecha

### Tareas
- **Campo para fecha**: `complete_till` (datetime ISO 8601)
- **Extraer fecha**: `new Date(task.complete_till).toISOString().split('T')[0]` → `"2025-01-20"`

### Llamadas
- **Campo para fecha**: `created_at` (datetime ISO 8601)
- **Extraer fecha**: `new Date(call.created_at).toISOString().split('T')[0]` → `"2025-01-20"`

---

## 📊 Ejemplo: Obtener Datos para Vista Mensual

```typescript
// Calcular rango del mes visible
const startOfMonth = new Date(year, month, 1);
startOfMonth.setHours(0, 0, 0, 0);

const endOfMonth = new Date(year, month + 1, 0);
endOfMonth.setHours(23, 59, 59, 999);

// Obtener tareas
const tasksResponse = await apiClient.get('/api/crm/tasks/calendar', {
  params: {
    start_date: startOfMonth.toISOString(),
    end_date: endOfMonth.toISOString(),
  },
});
const tasks = tasksResponse.data; // List[TaskResponse]

// Obtener llamadas
const callsResponse = await apiClient.get('/api/crm/calls/calendar', {
  params: {
    start_date: startOfMonth.toISOString(),
    end_date: endOfMonth.toISOString(),
  },
});
const calls = callsResponse.data; // List[CallResponse]
```

---

## 🔄 Agrupar por Fecha (Lógica del Frontend)

```typescript
// Agrupar tareas por fecha
const tasksByDate: Record<string, Task[]> = {};
tasks.forEach(task => {
  const dateKey = new Date(task.complete_till).toISOString().split('T')[0];
  if (!tasksByDate[dateKey]) {
    tasksByDate[dateKey] = [];
  }
  tasksByDate[dateKey].push(task);
});

// Agrupar llamadas por fecha
const callsByDate: Record<string, Call[]> = {};
calls.forEach(call => {
  const dateKey = new Date(call.created_at).toISOString().split('T')[0];
  if (!callsByDate[dateKey]) {
    callsByDate[dateKey] = [];
  }
  callsByDate[dateKey].push(call);
});

// Combinar eventos por fecha
const eventsByDate: Record<string, { tasks: Task[], calls: Call[] }> = {};
const allDates = new Set([...Object.keys(tasksByDate), ...Object.keys(callsByDate)]);

allDates.forEach(dateKey => {
  eventsByDate[dateKey] = {
    tasks: tasksByDate[dateKey] || [],
    calls: callsByDate[dateKey] || [],
  };
});
```

---

## 📅 Ejemplo: Obtener Datos para Vista Semanal

```typescript
// Calcular inicio y fin de semana
const startOfWeek = new Date(date);
startOfWeek.setDate(date.getDate() - date.getDay()); // Domingo
startOfWeek.setHours(0, 0, 0, 0);

const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 6); // Sábado
endOfWeek.setHours(23, 59, 59, 999);

// Mismo proceso que vista mensual
```

---

## 📅 Ejemplo: Obtener Datos para Vista Diaria

```typescript
// Calcular inicio y fin del día
const startOfDay = new Date(date);
startOfDay.setHours(0, 0, 0, 0);

const endOfDay = new Date(date);
endOfDay.setHours(23, 59, 59, 999);

// Obtener eventos del día
const tasksResponse = await apiClient.get('/api/crm/tasks/calendar', {
  params: {
    start_date: startOfDay.toISOString(),
    end_date: endOfDay.toISOString(),
  },
});

const callsResponse = await apiClient.get('/api/crm/calls/calendar', {
  params: {
    start_date: startOfDay.toISOString(),
    end_date: endOfDay.toISOString(),
  },
});

const dayTasks = tasksResponse.data;
const dayCalls = callsResponse.data;
```

---

## ⚠️ Puntos Importantes

1. **Sin filtros de fecha**: Si no envías `start_date` y `end_date`, retorna TODOS los eventos (puede ser lento).

2. **Tareas completadas**: El endpoint `/tasks/calendar` automáticamente excluye tareas con `is_completed: true`.

3. **Ordenamiento**:
   - Tareas: Ordenadas por `complete_till` ascendente
   - Llamadas: Ordenadas por `created_at` descendente

4. **Formato de fecha**: Ambos endpoints aceptan y retornan fechas en formato ISO 8601 con timezone UTC.

5. **Sin paginación**: Ambos endpoints retornan listas completas (no paginadas) dentro del rango especificado.

---

## 🔍 Obtener Nombre del Contacto (Opcional)

Si necesitas el nombre del contacto para mostrar en las llamadas:

```typescript
// Las llamadas tienen entity_id y entity_type
// Si entity_type === "contacts", puedes obtener el contacto:
if (call.entity_type === "contacts" && call.entity_id) {
  const contactResponse = await apiClient.get(`/api/crm/contacts/${call.entity_id}`);
  const contactName = contactResponse.data.name;
}
```

**Nota**: Esto requiere una llamada adicional por llamada. Considera hacer un batch o cachear contactos.

---

## ✅ Implementación en el Frontend

### Servicio (crmService.ts)

```typescript
async getCalendarTasks(filters: { start_date: string; end_date?: string }): Promise<Task[]> {
  const { data } = await api.get<Task[]>(`${CRM_BASE_PATH}/tasks/calendar`, {
    params: filters,
  });
  // El endpoint retorna un array directo (List[TaskResponse])
  return Array.isArray(data) ? data : [];
}

async getCalendarCalls(filters: { start_date: string; end_date?: string }): Promise<Call[]> {
  const { data } = await api.get<Call[]>(`${CRM_BASE_PATH}/calls/calendar`, {
    params: filters,
  });
  // El endpoint retorna un array directo (List[CallResponse])
  return Array.isArray(data) ? data : [];
}
```

### Componente (CRMTaskCalendar.tsx)

```typescript
const loadData = async () => {
  const startDate = getStartDate();
  const endDate = getEndDate();
  
  // Cargar tareas y llamadas en paralelo
  const [tasksData, callsData] = await Promise.all([
    crmService.getCalendarTasks({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    }),
    crmService.getCalendarCalls({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    }).catch((err) => {
      console.warn('Error cargando llamadas:', err);
      return [];
    }),
  ]);
  
  setTasks(tasksData);
  setCalls(callsData);
};

// Agrupar por fecha
const getTasksForDate = (date: Date): Task[] => {
  const dateStr = date.toISOString().split('T')[0];
  return tasks.filter(task => {
    if (!task.complete_till) return false;
    const taskDate = new Date(task.complete_till).toISOString().split('T')[0];
    return taskDate === dateStr;
  });
};

const getCallsForDate = (date: Date): Call[] => {
  const dateStr = date.toISOString().split('T')[0];
  return calls.filter(call => {
    if (!call.created_at) return false;
    const callDate = new Date(call.created_at).toISOString().split('T')[0];
    return callDate === dateStr;
  });
};
```

---

**Última actualización**: 2025-01-20















