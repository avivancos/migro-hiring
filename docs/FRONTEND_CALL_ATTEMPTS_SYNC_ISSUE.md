# Problema de Sincronización: call_attempts vs first_call_attempts

**Fecha**: 2025-01-29  
**Módulo**: Frontend - Agent Journal - Opportunities  
**Prioridad**: Media  
**Estado**: 📋 Requiere sincronización backend

---

## 📋 Problema

El campo `call_attempts` que se muestra en `OpportunityDetailCard` (usado en el reporte diario de agentes) no está sincronizado con `first_call_attempts` que se usa en los badges de `FirstCallAttemptsRow` (usado en el detalle de oportunidad).

### Contexto

1. **OpportunityDetailCard** (`src/components/agentJournal/OpportunityDetailCard.tsx`):
   - Recibe `OpportunityDetail` del endpoint `/api/agent-journal/daily-report`
   - Muestra `call_attempts` (número entero)
   - No tiene acceso a `first_call_attempts`

2. **FirstCallAttemptsRow** (`src/components/opportunities/FirstCallAttemptsRow.tsx`):
   - Recibe `LeadOpportunity` del endpoint `/api/opportunities/{id}`
   - Muestra badges basados en `first_call_attempts` (mapa de intentos 1-5)
   - Usa `getValidAttemptsCount(first_call_attempts)` para contar intentos

### Problema Específico

El `call_attempts` mostrado en `OpportunityDetailCard` debería ser igual a `getValidAttemptsCount(first_call_attempts)`, pero actualmente estos valores pueden no coincidir porque:

1. El backend calcula `call_attempts` en `opportunities_details` de forma independiente
2. `first_call_attempts` se actualiza cuando se registran llamadas automáticamente
3. No hay sincronización entre estos dos campos

---

## ✅ Solución Implementada

### Frontend (Implementado)

Se ha implementado una solución en `OpportunityDetailCard` que:

1. **Obtiene la oportunidad completa** cuando el card se expande usando `useQuery`
2. **Sincroniza `call_attempts`** con `getValidAttemptsCount(first_call_attempts)` cuando está disponible
3. **Muestra los badges de `FirstCallAttemptsRow`** cuando el card está expandido

**Implementación** (`src/components/agentJournal/OpportunityDetailCard.tsx`):

```typescript
// Obtener la oportunidad completa cuando se expande
const { data: fullOpportunity } = useQuery({
  queryKey: ['opportunity', opportunity.opportunity_id],
  queryFn: () => opportunityApi.get(opportunity.opportunity_id),
  enabled: isExpanded, // Solo obtener cuando está expandido
});

// Usar call_attempts sincronizado desde first_call_attempts si está disponible
const synchronizedCallAttempts = fullOpportunity?.first_call_attempts 
  ? getValidAttemptsCount(fullOpportunity.first_call_attempts)
  : opportunity.call_attempts;
```

**Características**:
- ✅ Los badges se muestran cuando el card está expandido
- ✅ El número de intentos en el header se sincroniza cuando el card está expandido
- ✅ Los badges están sincronizados con `first_call_attempts`
- ⚠️ El número en el header solo se sincroniza cuando el card se expande (por rendimiento)

### Backend (Recomendado para Mejora Futura)

Para una solución óptima, el backend debería calcular `call_attempts` en `opportunities_details` basándose en `first_call_attempts`:

```python
# En el endpoint de daily-report, al construir opportunities_details
for opportunity in opportunities:
    # Obtener la oportunidad completa
    full_opportunity = await get_opportunity(opportunity.id)
    
    # Calcular call_attempts desde first_call_attempts
    call_attempts_count = get_valid_attempts_count(full_opportunity.first_call_attempts)
    
    opportunity_detail = {
        "opportunity_id": opportunity.id,
        "contact_id": opportunity.contact_id,
        "calls_count": calls_count,
        "call_time_seconds": call_time_seconds,
        "tasks_completed": tasks_completed,
        "notes_created": notes_created,
        "call_attempts": call_attempts_count,  # ← Sincronizado con first_call_attempts
    }
```

Esto evitaría la necesidad de hacer una request adicional por cada oportunidad cuando se expande el card.

---

## 🔄 Impacto

- **Alto**: Inconsistencia visual en los reportes
- **Medio**: Puede confundir a los usuarios si ven números diferentes
- **Bajo**: Funcionalidad principal no afectada

---

## 📝 Notas

- El problema es principalmente de sincronización de datos backend
- La solución ideal es que el backend calcule `call_attempts` desde `first_call_attempts`
- El frontend puede hacer una solución temporal, pero no es ideal por rendimiento

---

## 🔗 Referencias

- `src/components/agentJournal/OpportunityDetailCard.tsx`
- `src/components/opportunities/FirstCallAttemptsRow.tsx`
- `src/utils/opportunity.ts` - `getValidAttemptsCount`
- `docs/BACKEND_CALL_ATTEMPTS_AUTO_REGISTRATION.md`
