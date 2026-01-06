# Frontend: Crear Oportunidad desde Contacto

**Fecha**: 2025-01-28  
**Prioridad**: 🔴 Alta  
**Estado**: ✅ Implementado  
**Módulo**: Frontend - CRM Contacts

---

## 📋 Resumen Ejecutivo

Se ha implementado la funcionalidad para crear oportunidades manualmente desde la página de detalle de contacto cuando un contacto no tiene una oportunidad enlazada. La relación contacto-oportunidad es **1:1**, por lo que cada contacto debe tener exactamente una oportunidad asociada.

---

## 🎯 Objetivo

Permitir a los usuarios crear una oportunidad para un contacto que no tiene una oportunidad enlazada, especialmente cuando el contacto está asignado a un agente (como en el caso de Joel Echevarria asignado a Sonia).

---

## 🔗 Relación Contacto-Oportunidad

```
Contacto (1) ←→ (1) Oportunidad
```

**Relaciones:**
- Contacto → Oportunidad: **1:1** (Cada contacto tiene exactamente 1 oportunidad)
- Oportunidad → Usuario: **N:1** (Muchas oportunidades pueden estar asignadas a un usuario)
- Oportunidad tiene campo `assigned_to_id` que referencia al usuario CRM asignado

---

## ✅ Implementación Realizada

### 1. Tipo `OpportunityCreateRequest`

**Archivo**: `src/types/opportunity.ts`

Se agregó el tipo para crear oportunidades:

```typescript
export interface OpportunityCreateRequest {
  contact_id: string; // UUID del contacto (requerido)
  opportunity_score?: number; // 0-100 (opcional, default: 50)
  detection_reason?: string | Record<string, any>; // Razón de detección (opcional)
  priority?: 'high' | 'medium' | 'low'; // Prioridad (opcional, default: 'medium')
  assigned_to_id?: string; // UUID del usuario asignado (opcional)
}
```

### 2. Método `create` en `opportunityApi`

**Archivo**: `src/services/opportunityApi.ts`

Se agregó el método para crear oportunidades:

```typescript
/**
 * Crear nueva oportunidad
 * Endpoint: POST /api/crm/opportunities
 */
async create(request: OpportunityCreateRequest): Promise<LeadOpportunity> {
  const { data } = await api.post<LeadOpportunity>(
    `${CRM_BASE_PATH}/opportunities`,
    {
      contact_id: request.contact_id,
      opportunity_score: request.opportunity_score ?? 50,
      detection_reason: request.detection_reason ?? 'Oportunidad creada manualmente',
      priority: request.priority ?? 'medium',
      assigned_to_id: request.assigned_to_id,
    }
  );
  return data;
}
```

### 3. Botón "Crear Oportunidad" en `CRMContactDetail`

**Archivo**: `src/pages/CRMContactDetail.tsx`

Se agregó un botón en la sección de "Oportunidad Enlazada" que aparece cuando no hay oportunidad enlazada:

```typescript
{relatedOpportunities.length === 0 && contact && (
  <Button
    onClick={async () => {
      if (!contact?.id) return;
      
      setCreatingOpportunity(true);
      try {
        // Crear la oportunidad con el agente asignado al contacto si existe
        const newOpportunity = await opportunityApi.create({
          contact_id: contact.id,
          opportunity_score: 50,
          detection_reason: 'Oportunidad creada manualmente desde contacto',
          priority: 'medium',
          assigned_to_id: contact.responsible_user_id, // Asignar al agente del contacto
        });
        
        // Recargar los datos del contacto para mostrar la nueva oportunidad
        await loadContactData();
        
        // Navegar a la página de detalle de la oportunidad
        navigate(`/crm/opportunities/${newOpportunity.id}`);
      } catch (error) {
        // Manejo de errores
      } finally {
        setCreatingOpportunity(false);
      }
    }}
    disabled={creatingOpportunity || !contact?.id}
    className="bg-green-600 hover:bg-green-700 text-white"
  >
    {creatingOpportunity ? (
      <>
        <Clock className="w-4 h-4 mr-2 animate-spin" />
        Creando...
      </>
    ) : (
      <>
        <Plus className="w-4 h-4 mr-2" />
        Crear Oportunidad
      </>
    )}
  </Button>
)}
```

---

## 🔧 Comportamiento

### Cuando NO hay oportunidad enlazada:

1. Se muestra un mensaje: "No hay oportunidad enlazada a este contacto"
2. Se muestra un botón "Crear Oportunidad"
3. Al hacer clic:
   - Se crea la oportunidad con:
     - `contact_id`: ID del contacto actual
     - `opportunity_score`: 50 (por defecto)
     - `detection_reason`: "Oportunidad creada manualmente desde contacto"
     - `priority`: "medium" (por defecto)
     - `assigned_to_id`: `contact.responsible_user_id` (si el contacto tiene un agente asignado)
   - Se recargan los datos del contacto
   - Se navega automáticamente a la página de detalle de la nueva oportunidad

### Cuando SÍ hay oportunidad enlazada:

- Se muestra la información de la oportunidad existente
- No se muestra el botón "Crear Oportunidad"

---

## 🔌 Endpoint Backend Requerido

**Endpoint**: `POST /api/crm/opportunities`

**Request Body**:
```json
{
  "contact_id": "uuid-del-contacto",
  "opportunity_score": 50,
  "detection_reason": "Oportunidad creada manualmente desde contacto",
  "priority": "medium",
  "assigned_to_id": "uuid-del-agente" // Opcional
}
```

**Response**: `LeadOpportunity` (oportunidad creada con pipeline automático si está implementado)

---

## 📝 Notas Importantes

1. **Asignación Automática**: Si el contacto tiene un `responsible_user_id`, la oportunidad se asigna automáticamente a ese agente.

2. **Relación 1:1**: Aunque técnicamente un contacto puede tener múltiples oportunidades, el sistema asume una relación 1:1. Si se intenta crear una segunda oportunidad, el backend debería validar esto.

3. **Pipeline Automático**: Si el backend implementa la creación automática de pipeline (ver `docs/BACKEND_OPPORTUNITIES_PIPELINE_AUTO_CREATE.md`), la oportunidad se creará con su pipeline asociado automáticamente.

4. **Navegación Automática**: Después de crear la oportunidad, el usuario es redirigido automáticamente a la página de detalle de la oportunidad para continuar el flujo.

---

## 🧪 Casos de Uso

### Caso 1: Contacto sin Oportunidad (Joel Echevarria)

**Situación**: Contacto asignado a agente Sonia pero sin oportunidad enlazada.

**Solución**: 
1. Ir a la página de detalle del contacto
2. Ver el mensaje "No hay oportunidad enlazada a este contacto"
3. Hacer clic en "Crear Oportunidad"
4. La oportunidad se crea automáticamente asignada a Sonia
5. Se navega a la página de detalle de la oportunidad

### Caso 2: Contacto con Oportunidad Existente

**Situación**: Contacto que ya tiene una oportunidad enlazada.

**Comportamiento**: 
- Se muestra la información de la oportunidad existente
- No se muestra el botón "Crear Oportunidad"

---

## ✅ Checklist de Implementación

- [x] Agregar tipo `OpportunityCreateRequest` en `src/types/opportunity.ts`
- [x] Agregar método `create` en `src/services/opportunityApi.ts`
- [x] Agregar botón "Crear Oportunidad" en `CRMContactDetail.tsx`
- [x] Implementar asignación automática al agente del contacto
- [x] Implementar navegación automática después de crear
- [x] Agregar estado de carga durante la creación
- [x] Manejar errores apropiadamente
- [x] Documentar la solución

---

## 📅 Fecha de Creación

2025-01-28
