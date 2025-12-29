# Asignación Rápida de 50 Oportunidades Aleatorias

## Resumen

Se ha implementado un componente para asignar rápidamente 50 oportunidades aleatorias no asignadas a un agente específico. Este componente facilita la distribución rápida de oportunidades entre agentes.

## Componente

### `AssignRandomOpportunities`

**Ubicación**: `src/components/admin/AssignRandomOpportunities.tsx`

**Funcionalidad**:
- Permite seleccionar un agente de la lista
- Obtiene oportunidades no asignadas del sistema
- Selecciona aleatoriamente 50 oportunidades (o todas si hay menos)
- Asigna las oportunidades seleccionadas al agente
- Notifica el resultado de la operación

**Props**:
```typescript
interface AssignRandomOpportunitiesProps {
  agents: User[];           // Lista de agentes disponibles
  onAssignComplete: () => void;  // Callback cuando se completa la asignación
}
```

## Integración

### En AdminOpportunities

El componente se ha integrado en `src/pages/admin/AdminOpportunities.tsx` y se muestra en la parte superior de la página, antes de la lista de oportunidades.

**Ubicación en el código**:
```typescript
<AssignRandomOpportunities
  agents={agents}
  onAssignComplete={() => {
    loadOpportunities();
  }}
/>
```

## Comportamiento

### Filtro por Defecto

La página de oportunidades ahora muestra por defecto solo oportunidades **no asignadas** (`filterAssigned = 'unassigned'`). Esto significa que:

- ✅ Por defecto se muestran solo oportunidades sin asignar
- ✅ Las oportunidades asignadas desaparecen automáticamente de la vista
- ✅ Los administradores pueden cambiar el filtro para ver todas o solo asignadas si lo desean

### Proceso de Asignación

1. **Selección de Agente**: El usuario selecciona un agente del dropdown
2. **Obtención de Oportunidades**: El sistema obtiene múltiples páginas de oportunidades hasta encontrar al menos 50 no asignadas (o todas las disponibles si hay menos)
3. **Selección Aleatoria**: Se mezclan las oportunidades no asignadas y se seleccionan 50 aleatorias
4. **Asignación**: Se asignan las 50 oportunidades seleccionadas al agente usando `opportunityApi.bulkAssign()`
5. **Actualización**: Se recarga la lista de oportunidades y las asignadas desaparecen de la vista (gracias al filtro por defecto)

## Límites y Consideraciones

- **Máximo de páginas**: El componente consulta hasta 20 páginas (2000 oportunidades) para encontrar 50 no asignadas
- **Si hay menos de 50**: Asigna todas las disponibles
- **Performance**: Si hay muchas oportunidades asignadas, puede tomar varias peticiones para encontrar 50 no asignadas

## Mejoras Futuras

1. **Endpoint Backend Optimizado**: Crear un endpoint específico que devuelva directamente X oportunidades no asignadas aleatorias
2. **Feedback en Tiempo Real**: Mostrar progreso mientras se buscan las oportunidades no asignadas
3. **Configuración del Número**: Permitir al usuario especificar cuántas oportunidades asignar (no siempre 50)

## Fecha de Implementación

2024-12-19

