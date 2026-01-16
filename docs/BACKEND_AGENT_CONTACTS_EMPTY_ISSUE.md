# Problema: Agentes no ven contactos en el CRM

**Fecha**: 2025-01-15  
**Prioridad**: 🔴 Alta  
**Estado**: 🔍 En investigación  
**Módulo**: Backend - CRM Contacts

---

## 📋 Descripción del Problema

Un usuario agente no ve ningún resultado al acceder a:
```
GET /api/crm/contacts?sort_by=created_at&sort_order=desc&view=table&skip=0&limit=200
```

El endpoint retorna una lista vacía aunque debería haber contactos disponibles.

---

## 🔍 Causa Raíz

Según la documentación en `docs/BACKEND_CONTACTS_FILTER_BY_USER_OPPORTUNITIES.md`, el backend está filtrando contactos para agentes:

- **Agentes**: Solo ven contactos que tienen oportunidades asignadas al usuario actual
- **Administradores**: Ven todos los contactos sin restricciones

**Problema**: Si el agente no tiene oportunidades asignadas, no verá ningún contacto.

### Lógica del Backend (Implementada)

```python
# Si es agente (no admin)
if not is_admin:
    # JOIN entre contactos y oportunidades
    query_db = db.query(Contact).join(
        LeadOpportunity,
        Contact.id == LeadOpportunity.contact_id
    ).filter(
        and_(
            Contact.is_deleted == False,
            LeadOpportunity.assigned_to_id == crm_user_id  # ← FILTRO POR USUARIO
        )
    )
```

**Resultado**: Si `LeadOpportunity.assigned_to_id` no coincide con el `crm_user_id` del agente, la query retorna 0 resultados.

---

## 🎯 Soluciones Posibles

### Opción 1: Permitir que agentes vean todos los contactos (Recomendada)

**Cambio en Backend**: Eliminar el filtro de oportunidades para agentes, igual que para administradores.

**Ventajas**:
- Consistente con el frontend (que ya eliminó restricciones)
- Los agentes pueden trabajar con todos los contactos
- Más simple de mantener

**Desventajas**:
- Los agentes pueden ver contactos que no les están asignados
- Puede requerir cambios en permisos de rutas

**Implementación**:
```python
# Eliminar el filtro de oportunidades para agentes
# Todos los usuarios (agentes y admins) ven todos los contactos
query_db = db.query(Contact).filter(Contact.is_deleted == False)
```

---

### Opción 2: Asegurar que agentes tengan oportunidades asignadas

**Cambio**: Asignar oportunidades a los agentes para que puedan ver contactos.

**Ventajas**:
- Mantiene el control de acceso basado en asignaciones
- Los agentes solo ven sus contactos asignados

**Desventajas**:
- Requiere asignar manualmente oportunidades
- Si un contacto no tiene oportunidad asignada, no será visible

**Implementación**:
- Asignar oportunidades existentes a los agentes
- Crear oportunidades para contactos sin asignar

---

### Opción 3: Mostrar contactos sin oportunidades también

**Cambio en Backend**: Modificar la query para usar LEFT JOIN en lugar de INNER JOIN.

**Ventajas**:
- Los agentes ven contactos con oportunidades asignadas
- También ven contactos sin oportunidades (para asignar)

**Desventajas**:
- Puede mostrar demasiados contactos
- Lógica más compleja

**Implementación**:
```python
# LEFT JOIN para incluir contactos sin oportunidades
query_db = db.query(Contact).outerjoin(
    LeadOpportunity,
    Contact.id == LeadOpportunity.contact_id
).filter(
    and_(
        Contact.is_deleted == False,
        or_(
            LeadOpportunity.assigned_to_id == crm_user_id,  # Con oportunidad asignada
            LeadOpportunity.contact_id.is_(None)  # Sin oportunidad
        )
    )
)
```

---

## 🔧 Diagnóstico

Para diagnosticar el problema, verificar:

1. **¿El agente tiene un perfil CRM?**
   ```sql
   SELECT * FROM crm_users WHERE user_id = :user_id;
   ```

2. **¿El agente tiene oportunidades asignadas?**
   ```sql
   SELECT COUNT(*) FROM lead_opportunities 
   WHERE assigned_to_id = :crm_user_id;
   ```

3. **¿Hay contactos en la base de datos?**
   ```sql
   SELECT COUNT(*) FROM crm_contacts WHERE is_deleted = false;
   ```

4. **¿Los contactos tienen oportunidades?**
   ```sql
   SELECT COUNT(*) FROM crm_contacts c
   INNER JOIN lead_opportunities lo ON c.id = lo.contact_id
   WHERE c.is_deleted = false;
   ```

---

## 📊 Logging Mejorado

Se ha agregado logging en el frontend para diagnosticar:

```typescript
console.log('📋 [CRMContactList] Contactos cargados:', {
  totalCargados: response.items?.length || 0,
  totalFiltrados: filteredContacts.length
});

console.log('📊 [CRMContactList] Total count:', {
  fromAPI: totalCount,
  filteredCount: filteredContacts.length,
  realTotal: realTotal,
  isAdmin: userIsAdmin,
  isAgent: userIsAgent,
});
```

**Verificar en la consola del navegador**:
- ¿Cuántos contactos retorna el API?
- ¿El total count es 0?
- ¿El usuario es identificado como agente?

---

## ✅ Recomendación

**Recomendación**: Implementar **Opción 1** (permitir que agentes vean todos los contactos).

**Razones**:
1. Consistente con el frontend que ya eliminó restricciones
2. Documentado en `docs/ELIMINACION_RESTRICCIONES_AGENTES.md`
3. Más simple de mantener
4. Los permisos de rutas ya controlan el acceso

**Cambio requerido en Backend**:
- Modificar el endpoint `GET /api/crm/contacts`
- Eliminar el filtro de oportunidades para agentes
- Todos los usuarios (agentes y admins) ven todos los contactos

---

## 📝 Checklist de Implementación

- [ ] Verificar en logs del backend qué está retornando el endpoint
- [ ] Confirmar si el agente tiene oportunidades asignadas
- [ ] Decidir qué solución implementar (Opción 1 recomendada)
- [ ] Modificar el backend para eliminar el filtro de oportunidades
- [ ] Probar que los agentes ahora ven contactos
- [ ] Verificar que los administradores siguen viendo todos los contactos
- [ ] Actualizar documentación

---

## 🔗 Referencias

- `docs/BACKEND_CONTACTS_FILTER_BY_USER_OPPORTUNITIES.md` - Especificación del filtrado
- `docs/ELIMINACION_RESTRICCIONES_AGENTES.md` - Eliminación de restricciones en frontend
- `src/pages/CRMContactList.tsx` - Implementación del frontend
- `src/services/crmService.ts` - Servicio de API

---

## 📅 Fecha de Creación

2025-01-15
