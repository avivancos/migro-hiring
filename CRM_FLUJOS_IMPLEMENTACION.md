# 🚀 Implementación de Flujos del CRM - Frontend

**Fecha**: 2025-01-20  
**Versión**: 1.0

---

## 📋 Resumen

Este documento describe las funciones helper implementadas en el frontend para facilitar los flujos de trabajo comunes del CRM según la documentación del backend.

---

## 🔧 Funciones Helper Implementadas

### 1. `createContactWithLead()`

Crea un contacto y un lead asociado en una sola operación.

```typescript
import { crmService } from '@/services/crmService';

const { contact, lead } = await crmService.createContactWithLead(
  {
    name: 'María García',
    email: 'maria@example.com',
    phone: '+34600123456',
    nacionalidad: 'Colombia',
    edad: 28,
    empadronado: true,
    tiene_ingresos: true,
  },
  {
    name: 'Regularización María García',
    status: 'new',
    price: 3000.00,
    currency: 'EUR',
    responsible_user_id: 'user-uuid',
    pipeline_id: 'pipeline-uuid',
  }
);
```

---

### 2. `assignTasksFromTemplates()`

Asigna tareas automáticamente desde plantillas activas.

```typescript
// Asignar todas las tareas aplicables a un contacto
const tasks = await crmService.assignTasksFromTemplates(
  contactId,
  'contacts'
);

// Asignar solo tareas específicas
const tasks = await crmService.assignTasksFromTemplates(
  contactId,
  'contacts',
  {
    onlyActive: true,
    appliesToContacts: true,
  }
);
```

**Ejemplo completo:**

```typescript
// 1. Obtener plantillas disponibles
const templates = await crmService.getTaskTemplates({ is_active: true });
const situationTemplate = templates.items.find(t => t.name === 'Llamada de Situación');

// 2. Asignar tareas automáticamente
const tasks = await crmService.assignTasksFromTemplates(contactId, 'contacts');
```

---

### 3. `registerCallWithFollowUp()`

Registra una llamada y crea automáticamente una tarea de seguimiento si se especifica `proxima_llamada_fecha`.

```typescript
const { call, followUpTask } = await crmService.registerCallWithFollowUp({
  direction: 'outbound',
  duration: 450,
  phone: contact.phone,
  call_status: 'completed',
  entity_id: contactId,
  entity_type: 'contacts',
  resumen_llamada: 'Cliente muy interesado. Situación favorable para regularización.',
  proxima_llamada_fecha: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  proxima_accion_fecha: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
});

// Si se especificó proxima_llamada_fecha, followUpTask contendrá la tarea creada
if (followUpTask) {
  console.log('Tarea de seguimiento creada:', followUpTask.id);
}
```

---

### 4. `getContactInteractionHistory()`

Obtiene todas las interacciones (tareas, llamadas, notas) de un contacto ordenadas por fecha.

```typescript
const interactions = await crmService.getContactInteractionHistory(contactId);

interactions.forEach(interaction => {
  console.log(`${interaction.type}: ${interaction.data.created_at}`);
  // interaction.type puede ser: 'task', 'call', 'note'
  // interaction.data contiene los datos completos
});
```

**Uso en componente:**

```typescript
const ContactDetail = ({ contactId }) => {
  const [interactions, setInteractions] = useState([]);

  useEffect(() => {
    crmService.getContactInteractionHistory(contactId)
      .then(setInteractions);
  }, [contactId]);

  return (
    <div>
      {interactions.map(interaction => (
        <div key={interaction.id}>
          <span>{interaction.type}</span>
          <span>{new Date(interaction.created_at).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
};
```

---

### 5. `getLeadsPipeline()`

Obtiene leads agrupados por estado para visualización en pipeline.

```typescript
const pipeline = await crmService.getLeadsPipeline();

console.log('Nuevos:', pipeline.new.length);
console.log('Calificados:', pipeline.contacted.length);
console.log('Propuesta:', pipeline.proposal.length);
console.log('Negociación:', pipeline.negotiation.length);
console.log('Ganados:', pipeline.won.length);
console.log('Perdidos:', pipeline.lost.length);
```

**Uso en componente Kanban:**

```typescript
const PipelineKanban = () => {
  const [pipeline, setPipeline] = useState(null);

  useEffect(() => {
    crmService.getLeadsPipeline().then(setPipeline);
  }, []);

  if (!pipeline) return <div>Cargando...</div>;

  return (
    <div className="kanban-board">
      <Column title="Nuevos" leads={pipeline.new} />
      <Column title="Contactados" leads={pipeline.contacted} />
      <Column title="Propuesta" leads={pipeline.proposal} />
      <Column title="Negociación" leads={pipeline.negotiation} />
      <Column title="Ganados" leads={pipeline.won} />
      <Column title="Perdidos" leads={pipeline.lost} />
    </div>
  );
};
```

---

### 6. `completeSalesFlow()`

Flujo completo de venta desde crear contacto hasta convertir lead.

```typescript
const result = await crmService.completeSalesFlow({
  contactData: {
    name: 'María García',
    email: 'maria@example.com',
    phone: '+34600123456',
    nacionalidad: 'Colombia',
    edad: 28,
    empadronado: true,
    tiene_ingresos: true,
  },
  leadData: {
    name: 'Regularización María García',
    status: 'new',
    price: 3000.00,
    currency: 'EUR',
    responsible_user_id: 'user-uuid',
    pipeline_id: 'pipeline-uuid',
  },
  assignTasks: true, // Asignar tareas automáticamente
  initialCall: {
    direction: 'outbound',
    duration: 450,
    phone: '+34600123456',
    call_status: 'completed',
    resumen_llamada: 'Cliente muy interesado. Situación favorable.',
    proxima_llamada_fecha: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  updateGradings: {
    grading_llamada: 'A',
    grading_situacion: 'B+',
  },
});

console.log('Contacto creado:', result.contact.id);
console.log('Lead creado:', result.lead.id);
console.log('Tareas asignadas:', result.tasks.length);
if (result.call) {
  console.log('Llamada registrada:', result.call.id);
}
```

---

## 🛠️ Utilidades Helper

### Archivo: `src/utils/crmHelpers.ts`

#### `calculateDueDate(daysFromNow: number): string`

Calcula fecha de vencimiento desde hoy.

```typescript
import { calculateDueDate } from '@/utils/crmHelpers';

const dueDate = calculateDueDate(7); // 7 días desde hoy
```

#### `getContactsStatsByGrading(contacts)`

Obtiene estadísticas de contactos por grading.

```typescript
import { getContactsStatsByGrading } from '@/utils/crmHelpers';

const stats = getContactsStatsByGrading(contacts);
console.log('Grading A:', stats.llamada.A);
console.log('Grading B+:', stats.llamada['B+']);
```

#### `formatCallDuration(seconds: number): string`

Formatea duración de llamada en formato legible.

```typescript
import { formatCallDuration } from '@/utils/crmHelpers';

formatCallDuration(125); // "2m 5s"
formatCallDuration(3665); // "1h 1m"
```

#### `validateContactData(data)`

Valida datos de contacto antes de crear.

```typescript
import { validateContactData } from '@/utils/crmHelpers';

const validation = validateContactData({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  phone: '+34600123456',
});

if (!validation.valid) {
  console.error('Errores:', validation.errors);
}
```

#### `getGradingColor(grading: string): string`

Obtiene color para un grading.

```typescript
import { getGradingColor } from '@/utils/crmHelpers';

const color = getGradingColor('A'); // "#10b981" (verde)
```

---

## 📝 Ejemplos de Uso Completos

### Ejemplo 1: Flujo Completo de Venta

```typescript
import { crmService } from '@/services/crmService';

async function procesarNuevoCliente(datosCliente: any) {
  try {
    // 1. Crear contacto y lead
    const { contact, lead } = await crmService.createContactWithLead(
      {
        name: datosCliente.nombre,
        email: datosCliente.email,
        phone: datosCliente.telefono,
        nacionalidad: datosCliente.nacionalidad,
        edad: datosCliente.edad,
        empadronado: datosCliente.empadronado,
        tiene_ingresos: datosCliente.tieneIngresos,
      },
      {
        name: `Regularización ${datosCliente.nombre}`,
        status: 'new',
        price: 3000.00,
        currency: 'EUR',
        responsible_user_id: currentUserId,
        pipeline_id: mainPipelineId,
      }
    );

    // 2. Asignar tareas automáticas
    const tasks = await crmService.assignTasksFromTemplates(contact.id, 'contacts');

    // 3. Registrar llamada inicial
    const { call } = await crmService.registerCallWithFollowUp({
      direction: 'outbound',
      duration: 300,
      phone: contact.phone,
      call_status: 'completed',
      entity_id: contact.id,
      entity_type: 'contacts',
      resumen_llamada: 'Llamada inicial de contacto',
      proxima_llamada_fecha: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // 4. Actualizar gradings
    await crmService.updateContact(contact.id, {
      grading_llamada: 'A',
      grading_situacion: 'B+',
    });

    return { contact, lead, tasks, call };
  } catch (error) {
    console.error('Error procesando nuevo cliente:', error);
    throw error;
  }
}
```

### Ejemplo 2: Dashboard de Contactos con Estadísticas

```typescript
import { crmService } from '@/services/crmService';
import { getContactsStatsByGrading } from '@/utils/crmHelpers';

async function obtenerDashboardContactos() {
  // Obtener contactos
  const contactsResponse = await crmService.getContacts({ limit: 100 });
  const contacts = contactsResponse.items || [];

  // Calcular estadísticas
  const stats = getContactsStatsByGrading(contacts);

  return {
    total: contacts.length,
    porGradingLlamada: {
      A: stats.llamada.A,
      'B+': stats.llamada['B+'],
      'B-': stats.llamada['B-'],
      C: stats.llamada.C,
    },
    porGradingSituacion: {
      A: stats.situacion.A,
      'B+': stats.situacion['B+'],
      'B-': stats.situacion['B-'],
      C: stats.situacion.C,
    },
  };
}
```

### Ejemplo 3: Vista de Calendario de Tareas

```typescript
import { crmService } from '@/services/crmService';

async function obtenerTareasCalendario() {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  const tasks = await crmService.getCalendarTasks({
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  });

  return tasks;
}
```

### Ejemplo 4: Historial de Interacciones

```typescript
import { crmService } from '@/services/crmService';

function ContactTimeline({ contactId }: { contactId: string }) {
  const [interactions, setInteractions] = useState([]);

  useEffect(() => {
    crmService.getContactInteractionHistory(contactId)
      .then(setInteractions);
  }, [contactId]);

  return (
    <div className="timeline">
      {interactions.map(interaction => (
        <div key={interaction.id} className="timeline-item">
          <div className="timeline-type">{interaction.type}</div>
          <div className="timeline-date">
            {new Date(interaction.created_at).toLocaleDateString()}
          </div>
          <div className="timeline-content">
            {interaction.type === 'call' && (
              <div>
                <p>{interaction.data.resumen_llamada}</p>
                <p>Duración: {interaction.data.duration}s</p>
              </div>
            )}
            {interaction.type === 'task' && (
              <div>
                <p>{interaction.data.text}</p>
                <p>Estado: {interaction.data.is_completed ? 'Completada' : 'Pendiente'}</p>
              </div>
            )}
            {interaction.type === 'note' && (
              <div>
                <p>{interaction.data.text}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Checklist de Implementación

- [x] Función `createContactWithLead()` implementada
- [x] Función `assignTasksFromTemplates()` implementada
- [x] Función `registerCallWithFollowUp()` implementada
- [x] Función `getContactInteractionHistory()` implementada
- [x] Función `getLeadsPipeline()` implementada
- [x] Función `completeSalesFlow()` implementada
- [x] Utilidades helper creadas (`crmHelpers.ts`)
- [x] Validaciones de datos implementadas
- [x] Funciones de formateo implementadas
- [x] Documentación completa creada

---

## 🔗 Referencias

- **Documentación Backend**: Ver guía de endpoints del CRM
- **Tipos TypeScript**: `src/types/crm.ts`
- **Servicio CRM**: `src/services/crmService.ts`
- **Utilidades**: `src/utils/crmHelpers.ts`

---

**Última actualización**: 2025-01-20  
**Versión**: 1.0










