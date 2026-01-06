# Fix: Bucle Infinito en Calendario CRM

## Problema

El componente `CRMTaskCalendar` estaba generando un bucle infinito de peticiones a los endpoints `/crm/calls/calendar` y `/crm/tasks/calendar`, causando:

- Cientos de peticiones HTTP repetidas
- Cambios constantes de rango de fechas (octubre, noviembre, diciembre)
- Degradación del rendimiento
- Consumo excesivo de recursos

### Síntomas Observados

```
✅ GET /crm/calls/calendar → 200
✅ GET /crm/tasks/calendar → 200
✅ GET /crm/calls/calendar → 200
... (repetido infinitamente)
```

Los logs mostraban que el rango de fechas cambiaba constantemente entre diferentes meses.

## Causa Raíz

El problema estaba en la gestión de los `useEffect` y las dependencias:

1. **`currentDate` se recreaba en cada render**: Aunque estaba en un `useMemo`, el objeto `Date` se creaba nuevamente cada vez que `searchParams` cambiaba, lo que causaba que las dependencias de los `useEffect` cambiaran constantemente.

2. **Ciclo de actualización de URL**: 
   - `useEffect` actualizaba `searchParams` cuando cambiaban `view` o `currentDate`
   - Esto causaba que `searchParams` cambiara
   - `searchParams` cambiaba → `view` y `currentDate` se recalculaban
   - Si había alguna diferencia, el `useEffect` volvía a actualizar `searchParams`
   - **Bucle infinito**

3. **`loadData` se ejecutaba repetidamente**: Cada vez que `currentDate` o `view` cambiaban (aunque fuera la misma fecha/vista), se disparaba `loadData()`.

## Solución Implementada

### 1. Memoización de Fecha como String

En lugar de memoizar el objeto `Date` directamente, ahora se memoiza la representación de string de la fecha:

```typescript
// Antes
const currentDate = useMemo(() => {
  const dateParam = searchParams.get('date');
  // ... parsear y retornar Date
}, [searchParams]);

// Después
const currentDateStr = useMemo(() => {
  const dateParam = searchParams.get('date');
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return dateParam;
  }
  return new Date().toISOString().split('T')[0];
}, [searchParams]);

const currentDate = useMemo(() => {
  // Parsear desde currentDateStr
}, [currentDateStr]);
```

**Beneficio**: `currentDateStr` es un string primitivo que solo cambia si la fecha realmente cambia, evitando recreaciones innecesarias.

### 2. Control de Actualización de URL

Se agregó un `useRef` para controlar que la URL solo se actualice en el montaje inicial si no hay parámetros:

```typescript
const isInitialMount = useRef(true);

useEffect(() => {
  if (isInitialMount.current) {
    const currentView = searchParams.get('view');
    const currentDateParam = searchParams.get('date');
    
    if (!currentView || !currentDateParam) {
      const params = new URLSearchParams();
      params.set('view', view);
      params.set('date', currentDateStr);
      setSearchParams(params, { replace: true });
    }
    isInitialMount.current = false;
  }
}, [view, currentDateStr, searchParams, setSearchParams]);
```

**Beneficio**: Evita actualizaciones innecesarias de la URL que causaban el ciclo.

### 3. Control de Carga de Datos

Se agregó un `useRef` para rastrear los últimos parámetros con los que se cargaron los datos:

```typescript
const lastLoadParams = useRef<{ dateStr: string; view: string } | null>(null);

useEffect(() => {
  const loadKey = `${currentDateStr}-${view}`;
  const lastKey = lastLoadParams.current 
    ? `${lastLoadParams.current.dateStr}-${lastLoadParams.current.view}` 
    : null;
  
  // Solo cargar si los parámetros realmente cambiaron
  if (loadKey !== lastKey) {
    lastLoadParams.current = { dateStr: currentDateStr, view };
    loadData();
  }
}, [currentDateStr, view]);
```

**Beneficio**: `loadData()` solo se ejecuta cuando los parámetros realmente cambian, no en cada render.

### 4. Optimización de `loadEntityNames`

Se agregó verificación para evitar actualizaciones innecesarias del estado:

```typescript
setEntityNames(prev => {
  const updated = { ...prev, ...names };
  // Solo actualizar si realmente hay cambios
  const hasChanges = Object.keys(names).some(key => prev[key] !== names[key]);
  if (!hasChanges) {
    return prev; // Evitar re-render innecesario
  }
  return updated;
});
```

**Beneficio**: Evita re-renders cuando no hay cambios reales en los nombres de entidades.

## Archivos Modificados

- `src/pages/CRMTaskCalendar.tsx`

## Cambios Específicos

1. **Importaciones**: Agregado `useRef` a los imports de React
2. **Estado**: Agregados `isInitialMount` y `lastLoadParams` como `useRef`
3. **Memoización**: Cambiada la estrategia de memoización de `currentDate` a `currentDateStr`
4. **useEffect de URL**: Modificado para solo ejecutarse en montaje inicial
5. **useEffect de carga**: Agregado control para evitar cargas duplicadas
6. **loadEntityNames**: Optimizado para evitar actualizaciones innecesarias

## Resultado

- ✅ Eliminado el bucle infinito de peticiones
- ✅ Reducción drástica en el número de peticiones HTTP
- ✅ Mejor rendimiento del componente
- ✅ Experiencia de usuario mejorada

## Prevención Futura

Para evitar problemas similares:

1. **Usar strings primitivos en dependencias**: En lugar de objetos `Date`, usar strings ISO en las dependencias de `useEffect`
2. **Rastrear cambios reales**: Usar `useRef` para rastrear valores anteriores y comparar antes de ejecutar efectos
3. **Validar actualizaciones de estado**: Verificar si hay cambios reales antes de actualizar el estado
4. **Evitar efectos que actualicen sus propias dependencias**: Si un `useEffect` actualiza algo que está en sus dependencias, puede causar bucles

## Testing

Para verificar que el fix funciona:

1. Abrir el calendario CRM
2. Verificar en la consola del navegador que solo se hacen 2 peticiones iniciales (tasks y calls)
3. Cambiar de mes/vista y verificar que solo se hacen nuevas peticiones cuando realmente cambia la vista/fecha
4. No deberían aparecer peticiones repetidas infinitamente

---

**Fecha de fix**: 2025-01-20  
**Autor**: Auto (AI Assistant)
