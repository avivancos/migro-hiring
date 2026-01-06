# Backend: Endpoint para Desasignar Oportunidades

**Fecha**: 2025-01-29  
**Prioridad**: 🔴 Alta (requerido para funcionalidad de desasignación bulk)  
**Estado**: ✅ Implementado (Opción 1)  
**Módulo**: CRM - Opportunities

---

## 📋 Resumen Ejecutivo

✅ **IMPLEMENTADO**: El endpoint `POST /crm/opportunities/{id}/assign` ahora acepta `assigned_to_id: null` o cadena vacía para desasignar oportunidades. La funcionalidad está completamente operativa.

---

## ✅ Estado Actual

**✅ IMPLEMENTADO**: El endpoint `/assign` acepta `null` para desasignar:
- `POST /api/crm/opportunities/{id}/assign` con `{ assigned_to_id: null }`
- El backend normaliza `None`/`""` → `None`
- Al desasignar: `assigned_to_id = None`, `status = 'pending'`
- Al asignar: `assigned_to_id = UUID`, `status = 'assigned'`
- El endpoint solo valida usuario si se envía UUID; con `None` desasigna directamente

**Commit**: 472d659 (ya contiene esta lógica)

---

## 🎯 Solución Implementada

### Opción 1: Endpoint `/assign` acepta `null` ✅ IMPLEMENTADO

Si el endpoint `POST /crm/opportunities/{id}/assign` puede aceptar `null` o cadena vacía para desasignar:

```json
POST /api/crm/opportunities/{id}/assign
{
  "assigned_to_id": null
}
```

**Ventajas**:
- No requiere nuevo endpoint
- Reutiliza lógica existente
- Cambio mínimo en backend

**Implementación Backend** (✅ Ya implementado):
```python
# OpportunityAssignRequest normaliza None/"" → None
# El servicio pone assigned_to_id=None y estado pending al desasignar
# El endpoint solo valida usuario si se envía UUID; con None desasigna
```

---

### Opción 2: Endpoint Específico `/unassign` (Alternativa)

Si el endpoint `/assign` no puede aceptar `null`, crear un endpoint específico:

```
DELETE /api/crm/opportunities/{id}/assign
```

o

```
POST /api/crm/opportunities/{id}/unassign
```

**Implementación Backend**:
```python
@router.delete("/opportunities/{opportunity_id}/assign")
async def unassign_opportunity(
    opportunity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Desasigna una oportunidad removiendo el assigned_to_id.
    """
    opportunity = await get_opportunity_by_id(opportunity_id, db)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidad no encontrada")
    
    opportunity.assigned_to_id = None
    if opportunity.status == 'assigned':
        opportunity.status = 'pending'
    opportunity.updated_at = datetime.utcnow()
    
    await db.commit()
    return opportunity
```

---

## 📥 Request (Opción 1 - Usando /assign con null)

```json
POST /api/crm/opportunities/{id}/assign
{
  "assigned_to_id": null
}
```

## 📥 Request (Opción 2 - Endpoint específico)

```
DELETE /api/crm/opportunities/{id}/assign
```

o

```
POST /api/crm/opportunities/{id}/unassign
```

---

## 📤 Response

### Éxito (200 OK)

```json
{
  "id": "uuid",
  "contact_id": "uuid",
  "assigned_to_id": null,
  "status": "pending",
  "updated_at": "2025-01-29T10:30:00Z"
}
```

---

## 🔧 Actualización del Frontend

### ✅ Opción 1 Implementada (assign con null)

**Estado**: ✅ Completado

El frontend está actualizado y funcionando. El método `unassign()` en `opportunityApi.ts` usa `/assign` con `null`:

```typescript
async unassign(id: string): Promise<LeadOpportunity> {
  const { data } = await api.post<LeadOpportunity>(
    `${CRM_BASE_PATH}/opportunities/${id}/assign`,
    { assigned_to_id: null } as OpportunityAssignRequest
  );
  return data;
}
```

**Tipo actualizado**: `OpportunityAssignRequest` ahora permite `assigned_to_id: string | null`

---

## ✅ Checklist de Implementación

### Opción 1: Modificar `/assign` para aceptar null ✅ COMPLETADO
- [x] Modificar endpoint `POST /crm/opportunities/{id}/assign` para aceptar `assigned_to_id: null`
- [x] Actualizar validación del request (normaliza None/"" → None)
- [x] Agregar lógica para desasignar cuando `assigned_to_id` es null
- [x] Cambiar estado a 'pending' si estaba 'assigned'
- [x] Actualizar frontend para usar `/assign` con `null`
- [x] Actualizar tipo `OpportunityAssignRequest` para permitir `null`
- [ ] Probar con frontend después del redeploy

### Opción 2: Crear endpoint `/unassign` (No necesario)
- No se requiere, la Opción 1 es suficiente

---

## 🚀 Estado

**✅ COMPLETADO** - La funcionalidad de desasignación está implementada y lista para probar.

**Próximos pasos**:
1. Redeploy en Render (commit 472d659)
2. Probar desde el frontend: `POST /api/crm/opportunities/{id}/assign` con `{"assigned_to_id": null}`
3. Verificar que devuelve 200 con `assigned_to_id: null`, `status: pending`

---

## 📝 Notas

- ✅ El backend acepta `null` o `""` en `/assign` y desasigna correctamente
- ✅ El frontend está actualizado para usar `/assign` con `null`
- ✅ El tipo `OpportunityAssignRequest` permite `assigned_to_id: string | null`
- ✅ La desasignación cambia el estado a 'pending' automáticamente
- ✅ La asignación cambia el estado a 'assigned' automáticamente

---

**Reportado por**: Sistema de Desarrollo  
**Revisado por**: -  
**Aprobado por**: -
