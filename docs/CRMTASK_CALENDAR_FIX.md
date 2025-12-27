# Corrección: Error ReferenceError en CRMTaskCalendar

## 📋 Problema Identificado

El componente `CRMTaskCalendar.tsx` tenía un error de referencia a una variable inexistente que causaba un `ReferenceError` en tiempo de ejecución.

### Error Original

```
ReferenceError: callsResponse is not defined
    at loadData (CRMTaskCalendar.tsx:103:73)
```

### Causa

En la función `loadData()`, el código intentaba acceder a `callsResponse.items` pero esta variable nunca fue definida. El código correctamente obtenía los datos en `callsData` (array directo), pero luego intentaba usar `callsResponse` que no existía.

### Código Problemático

```typescript
const [tasksData, callsData] = await Promise.all([
  crmService.getCalendarTasks({...}),
  crmService.getCalendarCalls({...}).catch(...),
]);

// ❌ ERROR: callsResponse no está definido
console.log('Llamadas totales:', callsResponse.items?.length || 0);
if (callsResponse.items && callsResponse.items.length > 0 && ...) {
  // ...
}
```

## ✅ Solución Aplicada

Se corrigió el código para usar `callsData` directamente, que es un array (no un objeto con `items`).

### Código Corregido

```typescript
const [tasksData, callsData] = await Promise.all([
  crmService.getCalendarTasks({...}),
  crmService.getCalendarCalls({...}).catch(...),
]);

// ✅ CORRECTO: Usar callsData directamente
console.log('Llamadas del backend:', callsData.length);
if (callsData.length > 0 && filteredCalls.length === 0) {
  // ...
}
```

## 📝 Cambios Realizados

**Archivo:** `src/pages/CRMTaskCalendar.tsx`

1. **Línea 103**: Cambiado `callsResponse.items?.length` por `callsData.length`
2. **Línea 113**: Cambiado `callsResponse.items && callsResponse.items.length > 0` por `callsData.length > 0`
3. **Línea 114**: Cambiado `callsResponse.items.slice(0, 5)` por `callsData.slice(0, 5)`

## 🔍 Contexto

El endpoint `getCalendarCalls()` retorna un array directo de `Call[]`, no un objeto con estructura `{ items: Call[] }`. Por lo tanto, el código debe trabajar directamente con el array.

### Estructura de Datos

```typescript
// getCalendarCalls() retorna:
Call[]  // Array directo

// NO retorna:
{ items: Call[], total: number, ... }  // Objeto con items
```

## ✅ Estado

- ✅ Error corregido
- ✅ Código actualizado para usar `callsData` correctamente
- ✅ Logs de consola actualizados para reflejar la estructura correcta
- ✅ Sin errores de linting

## 📌 Nota Adicional

El endpoint `/crm/calls/calendar` actualmente devuelve 404 (no existe en el backend), pero el código maneja este error correctamente con `.catch()` y retorna un array vacío, permitiendo que el calendario continúe funcionando para tareas.

Ver documentación: `docs/BACKEND_CALENDAR_CALLS_FILTER.md`














