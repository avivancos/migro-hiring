# Backend: Endpoint para Descartar Oportunidades

**Fecha**: 2026-01-06  
**Estado**: ✅ Implementado  
**Módulo**: CRM - Opportunities

---

## 📋 Resumen Ejecutivo

Se ha creado un endpoint genérico `PATCH /api/crm/opportunities/{opportunity_id}` que permite actualizar cualquier campo de una oportunidad, incluyendo el status para descartar oportunidades marcándolas como `lost`.

---

## 🔗 Endpoint

### Actualizar Oportunidad

```http
PATCH /api/crm/opportunities/{opportunity_id}
```

**Autenticación**: ✅ Requerida (CRM auth)

**Permisos**: 
- Solo el usuario asignado a la oportunidad puede actualizarla
- Los administradores pueden actualizar cualquier oportunidad

---

## 📥 Request

### Parámetros de Ruta

- `opportunity_id` (UUID, requerido): ID de la oportunidad a actualizar

### Request Body

Todos los campos son opcionales. Solo se actualizarán los campos proporcionados (comportamiento PATCH).

```json
{
  "status": "lost",
  "notes": "[Descarte] trabaja con otro abogado",
  "priority": "low",
  "opportunity_score": 0,
  "next_action_due_date": null
}
```

### Campos Actualizables

- `status`: Estado de la oportunidad (pending, assigned, contacted, converted, expired, **lost**)
- `notes`: Notas adicionales
- `priority`: Prioridad (low, medium, high, urgent)
- `opportunity_score`: Score de 0 a 100
- `assigned_to_id`: Usuario asignado (UUID o null para desasignar)
- `next_action_due_date`: Fecha de próxima acción
- `last_contact_attempt_at`: Fecha del último intento de contacto
- `pipeline_stage_id`: ID del pipeline stage asociado

---

## 🎯 Uso para Descartar Oportunidades

Para descartar una oportunidad, envía un `PATCH` con `status: "lost"` y el motivo en `notes`:

```json
{
  "status": "lost",
  "notes": "[Descarte] trabaja con otro abogado"
}
```

### Motivos de Descarte Recomendados

- `[Descarte] trabaja con otro abogado`
- `[Descarte] ya regularizado`
- `[Descarte] no le interesa`
- `[Descarte] otros: [motivo personalizado]`

---

## 📤 Response

### 200 OK

```json
{
  "id": "uuid",
  "status": "lost",
  "notes": "[Descarte] trabaja con otro abogado",
  "priority": "low",
  "opportunity_score": 0,
  "assigned_to_id": "uuid",
  "updated_at": "2026-01-06T10:30:00Z",
  // ... otros campos de LeadOpportunityRead
}
```

### 401 Unauthorized

```json
{
  "detail": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "detail": "No tiene permisos para actualizar esta oportunidad"
}
```

### 404 Not Found

```json
{
  "detail": "Oportunidad no encontrada"
}
```

---

## ✅ Validaciones

1. **Autenticación**: El usuario debe estar autenticado
2. **Permisos**: Solo el usuario asignado o admin puede actualizar
3. **Existencia**: La oportunidad debe existir
4. **Campos**: Solo se actualizan los campos incluidos en el body

---

## 💻 Ejemplos de Uso

### cURL

```bash
curl -X PATCH "https://api.migro.es/api/crm/opportunities/{opportunity_id}" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "lost",
    "notes": "[Descarte] trabaja con otro abogado"
  }'
```

### TypeScript/React Query

```typescript
const discardMutation = useMutation({
  mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
    const response = await fetch(`/api/crm/opportunities/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'lost',
        notes: `[Descarte] ${reason}`
      })
    });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
  }
});
```

### Uso con opportunityApi (Frontend)

```typescript
import { opportunityApi } from '@/services/opportunityApi';

// Descartar oportunidad
await opportunityApi.update(opportunityId, {
  status: 'lost',
  notes: '[Descarte] trabaja con otro abogado'
});
```

---

## 🔄 Integración con Frontend

El frontend ya está usando `opportunityApi.update(id, data)` que ahora tiene soporte completo en el backend. El endpoint es compatible con la implementación actual del frontend.

**Archivo Frontend**: `src/pages/CRMOpportunityDetail.tsx`

**Implementación**:
- Botón "Descartar oportunidad" en la tarjeta de acciones
- Modal con selección de motivo de descarte
- Guarda el motivo en `notes` con prefijo `[Descarte]`
- Marca la oportunidad con `status: 'lost'`

---

## 📝 Notas Técnicas

- El endpoint invalida automáticamente el cache del dashboard
- Los campos no incluidos en el body no se modifican (actualización parcial)
- El campo `status` acepta el valor `"lost"` además de los valores estándar
- Se registra en logs quién actualizó la oportunidad y qué campos se modificaron
- El endpoint es genérico y puede usarse para actualizar cualquier campo de la oportunidad, no solo para descartar

---

## 🔍 Archivos Relacionados

### Backend
- `app/api/endpoints/leads_opportunities.py` - Endpoint PATCH implementado
- `docs/leads_opportunities_api.md` - Documentación de la API (si existe)

### Frontend
- `src/pages/CRMOpportunityDetail.tsx` - Componente con botón de descarte
- `src/services/opportunityApi.ts` - Servicio API con método `update()`
- `src/hooks/useOpportunityDetail.ts` - Hook con mutación `update`
- `docs/FRONTEND_OPPORTUNITY_DISCARD_BUTTON.md` - Documentación del frontend

---

## ✅ Checklist de Implementación

- [x] Endpoint PATCH implementado en backend
- [x] Validación de permisos (usuario asignado o admin)
- [x] Soporte para actualización parcial de campos
- [x] Frontend implementado con botón de descarte
- [x] Modal con selección de motivos de descarte
- [x] Invalidación de queries en frontend
- [x] Documentación completa

---

## 🚀 Estado

**✅ COMPLETADO** - La funcionalidad de descarte de oportunidades está implementada y lista para usar.

**Próximos pasos** (si aplica):
1. Probar desde el frontend: Botón "Descartar oportunidad" en detalle de oportunidad
2. Verificar que la oportunidad se marca como `lost` correctamente
3. Verificar que el motivo se guarda en `notes` con prefijo `[Descarte]`

---

**Reportado por**: Sistema de Desarrollo  
**Revisado por**: -  
**Aprobado por**: -
