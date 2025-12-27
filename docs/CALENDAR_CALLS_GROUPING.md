# Implementación: Agrupación de Llamadas en el Calendario

## 📋 Resumen

Se ha implementado la funcionalidad para que las llamadas se muestren en el calendario agrupadas por fecha, usando `created_at` (fecha de grabación en el sistema) como referencia temporal.

## ✅ Cambios Realizados

### 1. Componente CRMTaskCalendar

**Archivo**: `src/pages/CRMTaskCalendar.tsx`

#### Modificaciones

1. **Importación de Tipos y Componentes**
   - Se agregó `Call` al import de tipos
   - Se agregó `Phone` al import de iconos de lucide-react

2. **Estado del Componente**
   - Se agregó `calls` al estado para almacenar las llamadas cargadas

3. **Carga de Datos**
   - La función `loadTasks()` se renombró a `loadData()`
   - Ahora carga tareas y llamadas en paralelo usando `Promise.all()`
   - Las llamadas se obtienen usando `crmService.getCalls()` con filtros `date_from` y `date_to`
   - Se maneja errores de carga de llamadas para que no afecte la carga de tareas

4. **Agrupación por Fecha**
   - Se creó la función `getCallsForDate(date: Date)` que filtra llamadas por fecha
   - **Usa `created_at` como fecha de referencia** (cuando se graba en el sistema)
   - Fallback a `started_at` si `created_at` no está disponible

5. **Vista Mensual**
   - Muestra tareas (verde) y llamadas (azul) en cada día
   - Las llamadas se muestran con icono de teléfono
   - Muestra "Entrante" o "Saliente" según el tipo
   - Limita a 3 items visibles por día (tareas + llamadas combinadas)

6. **Vista Semanal**
   - Muestra tareas y llamadas en cada día de la semana
   - Las llamadas muestran la hora de grabación
   - Click en una llamada navega al contacto asociado

7. **Vista Diaria**
   - Muestra todas las tareas y llamadas del día
   - Las llamadas se muestran en tarjetas azules diferenciadas
   - Incluye información detallada: dirección (entrante/saliente), teléfono, duración, estado
   - Muestra la fecha/hora de grabación (`created_at`)

#### Código Clave

```typescript
// Carga de datos
const loadData = async () => {
  const startDate = getStartDate();
  const endDate = getEndDate();
  
  const [tasksData, callsResponse] = await Promise.all([
    crmService.getCalendarTasks({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    }),
    crmService.getCalls({
      date_from: startDate.toISOString(),
      date_to: endDate.toISOString(),
      limit: 1000,
    }).catch(() => ({ items: [], total: 0, skip: 0, limit: 0 })),
  ]);
  
  setTasks(tasksData);
  setCalls(callsResponse.items || []);
};

// Agrupación por fecha usando created_at
const getCallsForDate = (date: Date): Call[] => {
  const dateStr = date.toISOString().split('T')[0];
  return calls.filter(call => {
    // Usar created_at como fecha de referencia (cuando se graba en el sistema)
    const callDate = new Date(call.created_at || call.started_at).toISOString().split('T')[0];
    return callDate === dateStr;
  });
};
```

## 🎨 Diferenciación Visual

### Colores

- **Tareas**: Fondo verde (`bg-green-100`, `hover:bg-green-200`)
- **Llamadas**: Fondo azul (`bg-blue-100`, `hover:bg-blue-200`)

### Iconos

- **Llamadas**: Icono de teléfono (`Phone`) a la izquierda del texto

### Información Mostrada

#### Vista Mensual
- Solo muestra "Entrante" o "Saliente"
- Icono de teléfono pequeño

#### Vista Semanal
- Muestra "Llamada Entrante" o "Llamada Saliente"
- Hora de grabación (`created_at`)

#### Vista Diaria
- Tarjeta completa con:
  - Tipo: "Llamada Entrante" o "Llamada Saliente"
  - Fecha/hora de grabación: `created_at`
  - Teléfono (si está disponible)
  - Duración (si está disponible)
  - Estado de la llamada (badge)

## 🔄 Flujo de Funcionamiento

1. **Carga del Calendario**
   - Se calcula el rango de fechas según la vista (mes/semana/día)
   - Se cargan tareas y llamadas en paralelo
   - Las llamadas se filtran usando `date_from` y `date_to`

2. **Agrupación por Día**
   - Para cada día visible, se filtran las llamadas usando `getCallsForDate()`
   - Se usa `created_at` como fecha de referencia (fecha de grabación)
   - Si `created_at` no está disponible, se usa `started_at` como fallback

3. **Visualización**
   - Las llamadas se muestran junto con las tareas
   - En vista mensual, se limitan a 3 items visibles (combinados)
   - Click en una llamada navega al contacto/lead asociado

## 📝 Consideraciones Técnicas

### Filtrado de Llamadas

El backend debe soportar filtros `date_from` y `date_to` en el endpoint `/crm/calls`. Estos filtros deberían filtrar por `created_at`:

```
GET /api/crm/calls?date_from=2025-01-01T00:00:00Z&date_to=2025-01-31T23:59:59Z&limit=1000
```

### Campo de Fecha de Referencia

- **Prioridad 1**: `created_at` - Fecha de grabación en el sistema
- **Prioridad 2**: `started_at` - Fecha de inicio de la llamada (fallback)

### Rendimiento

- Se usa `limit: 1000` para obtener todas las llamadas en el rango
- Se carga en paralelo con las tareas usando `Promise.all()`
- El filtrado por fecha se hace en el cliente (fron-end) para mayor flexibilidad

## 🚀 Próximos Pasos

1. ✅ Carga de llamadas implementada
2. ✅ Agrupación por fecha usando `created_at` implementada
3. ✅ Visualización en todas las vistas (mes/semana/día) implementada
4. ⏳ Verificar que el backend soporte filtros `date_from` y `date_to` correctamente
5. ⏳ Probar con datos reales para verificar el rendimiento

## 🔗 Referencias

- Componente: `src/pages/CRMTaskCalendar.tsx`
- Servicio: `src/services/crmService.ts` - `getCalls()`
- Tipos: `src/types/crm.ts` - `Call`, `CallFilters`















