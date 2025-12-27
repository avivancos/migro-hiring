# Diagnóstico de Rendimiento - CRM

**Fecha:** 2024-12-19  
**Problema:** Páginas y APIs muy lentas reportadas en métricas de rendimiento

## Resumen Ejecutivo

Se han identificado problemas críticos de rendimiento que afectan la experiencia del usuario:

- **Página más lenta:** `/crm/call` con **237.12 segundos** de tiempo de carga
- **APIs más lentas:** Múltiples endpoints de contactos con tiempos de 1.27s a 5.87s
- **93 alertas** de métricas lentas en total

## Problemas Identificados

### 1. CRMCallHandler.tsx - Problema N+1 (237.12s)

**Ubicación:** `src/pages/CRMCallHandler.tsx`

**Problema Principal:**
La función `loadCallEntityNames` (líneas 182-255) realiza múltiples llamadas API individuales para cada llamada que no tiene `contact_name`. Si hay 50 llamadas recientes, esto puede resultar en 50+ llamadas API secuenciales.

**Código Problemático:**
```typescript
const loadCallEntityNames = async (calls: Call[]) => {
  // ... código que itera sobre calls ...
  entityIdsToLoad.forEach(entityId => {
    const promise = (isContact
      ? crmService.getContact(entityId)  // ❌ Llamada individual
      : crmService.getLead(entityId)      // ❌ Llamada individual
    )
  });
  await Promise.all(loadPromises); // ⚠️ Aunque es paralelo, son muchas llamadas
}
```

**Impacto:**
- Si hay 50 llamadas sin `contact_name`, se hacen 50 llamadas API adicionales
- Cada llamada puede tardar 1-5 segundos
- Tiempo total: 50-250 segundos (explicaría los 237s reportados)

**Solución Propuesta:**
1. Agregar `contact_name` directamente en el endpoint `/crm/calls` del backend
2. Implementar caché de contactos/leads en el frontend
3. Agrupar llamadas por tipo y hacer batch requests si es posible
4. Usar `useMemo` para evitar recargas innecesarias

### 2. CRMContactDetail.tsx - Recargas Innecesarias (5.87s, 5.45s)

**Ubicación:** `src/pages/CRMContactDetail.tsx`

**Problemas Identificados:**

1. **Recarga en visibility change (líneas 67-77):**
   ```typescript
   useEffect(() => {
     const handleVisibilityChange = () => {
       if (document.visibilityState === 'visible' && id) {
         loadContactData(); // ❌ Recarga completa cada vez
       }
     };
   }, [id]);
   ```
   - Recarga todos los datos cada vez que la pestaña se vuelve visible
   - Puede ser innecesario si los datos son recientes

2. **Múltiples llamadas en paralelo sin caché (líneas 91-101):**
   ```typescript
   const [contactData, tasksData, callsData, notesData, usersData] = await Promise.all([
     crmService.getContact(id),
     crmService.getContactTasks(id, { limit: 50 }),
     crmService.getContactCalls(id, { limit: 50 }),
     crmService.getContactNotes(id, { limit: 50 }),
     crmService.getUsers(true),
   ]);
   ```
   - Aunque es paralelo, cada llamada puede ser lenta
   - No hay caché, se repiten las mismas llamadas

**Impacto:**
- Cada carga de detalle de contacto hace 5 llamadas API
- Sin caché, se repiten en cada navegación
- Tiempo total: 1-6 segundos por contacto

**Solución Propuesta:**
1. Implementar caché de respuestas API
2. Agregar debounce/throttle para recargas
3. Usar `useMemo` para datos derivados
4. Implementar stale-while-revalidate pattern

### 3. Falta de Caché de API

**Problema:**
No hay sistema de caché implementado para respuestas API. Cada vez que se navega a una página o se recarga, se hacen las mismas llamadas API.

**Impacto:**
- Llamadas duplicadas innecesarias
- Mayor latencia percibida
- Mayor carga en el servidor

**Solución Propuesta:**
1. Implementar caché en memoria con TTL
2. Usar React Query o similar para gestión de caché
3. Implementar invalidación inteligente de caché

### 4. Falta de Optimización React

**Problema:**
No se están usando `React.memo`, `useMemo`, o `useCallback` en componentes críticos, causando re-renders innecesarios.

**Componentes Afectados:**
- `CRMCallHandler.tsx` - No usa memoización
- `CRMContactDetail.tsx` - No usa memoización
- Componentes de lista - Re-renderizan completamente en cada cambio

**Solución Propuesta:**
1. Agregar `React.memo` a componentes de lista
2. Usar `useMemo` para cálculos costosos
3. Usar `useCallback` para funciones pasadas como props

## Métricas de Rendimiento Actuales

### Páginas Más Lentas
- `/crm/call`: **237.12s** ⚠️ CRÍTICO
- `/admin/dashboard`: **1.72s**
- `/crm/call` (otra métrica): **2ms** (posible error de medición)

### APIs Más Lentas
- `/crm/contacts/{id}`: **5.87s** (múltiples instancias)
- `/crm/contacts/{id}`: **5.45s**
- `/crm/contacts/{id}`: **5.32s**
- `/crm/contacts/{id}`: **5.31s** (múltiples instancias)
- Múltiples otras con tiempos de 1.27s a 1.54s

### Estadísticas Generales
- **103 métricas** totales
- **93 alertas** de métricas lentas
- **Promedio:** 5.15s
- **Páginas:** 3
- **Componentes:** 0 (no registrados)
- **APIs:** 100

## Plan de Optimización

### Fase 1: Optimizaciones Críticas (Inmediatas)

1. **Optimizar `loadCallEntityNames` en CRMCallHandler**
   - Prioridad: ALTA
   - Tiempo estimado: 2-4 horas
   - Impacto esperado: Reducción de 80-90% en tiempo de carga

2. **Implementar caché básico de API**
   - Prioridad: ALTA
   - Tiempo estimado: 4-6 horas
   - Impacto esperado: Reducción de 50-70% en llamadas duplicadas

3. **Optimizar recargas en CRMContactDetail**
   - Prioridad: MEDIA
   - Tiempo estimado: 2-3 horas
   - Impacto esperado: Reducción de 30-50% en tiempo de carga

### Fase 2: Optimizaciones de React (Corto Plazo)

1. **Agregar memoización a componentes críticos**
   - Prioridad: MEDIA
   - Tiempo estimado: 3-4 horas
   - Impacto esperado: Reducción de 20-30% en re-renders

2. **Optimizar componentes de lista**
   - Prioridad: MEDIA
   - Tiempo estimado: 2-3 horas
   - Impacto esperado: Mejora en scroll y renderizado

### Fase 3: Optimizaciones Backend (Mediano Plazo)

1. **Agregar `contact_name` al endpoint `/crm/calls`**
   - Prioridad: ALTA
   - Tiempo estimado: 1-2 horas (backend)
   - Impacto esperado: Eliminación completa del problema N+1

2. **Implementar paginación eficiente**
   - Prioridad: MEDIA
   - Tiempo estimado: 2-3 horas (backend)
   - Impacto esperado: Reducción en tamaño de respuestas

3. **Agregar índices de base de datos**
   - Prioridad: MEDIA
   - Tiempo estimado: 1 hora (backend)
   - Impacto esperado: Reducción de 30-50% en tiempo de consultas

## Recomendaciones Adicionales

1. **Monitoreo Continuo:**
   - Implementar logging de tiempos de respuesta
   - Alertas automáticas para tiempos > 2s
   - Dashboard de métricas de rendimiento

2. **Testing de Rendimiento:**
   - Tests de carga para endpoints críticos
   - Lighthouse CI para métricas de frontend
   - Profiling periódico de componentes React

3. **Optimizaciones Futuras:**
   - Implementar React Query para gestión de estado del servidor
   - Considerar Server-Side Rendering (SSR) para páginas críticas
   - Implementar lazy loading más agresivo
   - Considerar Service Workers para caché offline

## Próximos Pasos

1. ✅ Crear diagnóstico completo (este documento)
2. ⏳ Implementar optimizaciones de Fase 1
3. ⏳ Medir impacto de optimizaciones
4. ⏳ Implementar optimizaciones de Fase 2
5. ⏳ Coordinar con backend para optimizaciones de Fase 3

## Referencias

- Archivos analizados:
  - `src/pages/CRMCallHandler.tsx`
  - `src/pages/CRMContactDetail.tsx`
  - `src/services/crmService.ts`
  - `src/services/api.ts`

- Métricas reportadas por el usuario:
  - 103 métricas totales
  - 93 alertas de métricas lentas
  - Promedio: 5.15s





