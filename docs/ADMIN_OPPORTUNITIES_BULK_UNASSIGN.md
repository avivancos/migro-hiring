# Admin: Desasignación Bulk de Oportunidades

**Fecha**: 2025-01-29  
**Estado**: ✅ Implementado  
**Versión**: 1.0.0  
**Módulo**: Frontend - Admin Opportunities

---

## 📋 Resumen Ejecutivo

Se ha implementado la funcionalidad de desasignación masiva de oportunidades en el panel de administración. Los administradores pueden ahora seleccionar múltiples oportunidades y remover su asignación de agentes en una sola operación.

---

## 🎯 Objetivo

Permitir a los administradores desasignar múltiples oportunidades de agentes de forma masiva, facilitando la gestión y redistribución de oportunidades en el sistema.

---

## ✅ Funcionalidades Implementadas

### 1. Método `bulkUnassign` en `opportunityApi`

**Ubicación**: `src/services/opportunityApi.ts`

**Funcionalidad**:
- Desasigna múltiples oportunidades removiendo el `assigned_to_id`
- Usa el método `update()` con `assigned_to_id: undefined` para cada oportunidad
- Procesa las desasignaciones en lotes de 10 para evitar sobrecarga del servidor
- Retorna estadísticas de éxito y errores

**Interfaz**:
```typescript
async bulkUnassign(request: {
  opportunity_ids: string[];
}): Promise<{
  success: boolean;
  unassigned_count: number;
  failed_count: number;
  opportunities: LeadOpportunity[];
  errors: Array<{ opportunity_id: string; error: string }>;
}>
```

### 2. Botón de Desasignación en Admin Opportunities

**Ubicación**: `src/pages/admin/AdminOpportunities.tsx`

**Características**:
- Botón visible cuando hay oportunidades seleccionadas
- Ubicado junto al botón de asignación en el card de acciones
- Estilo visual distintivo (rojo) para diferenciarlo de la asignación
- Icono `UserX` de lucide-react
- Confirmación antes de ejecutar la acción
- Feedback visual durante el proceso (loading spinner)
- Mensaje de confirmación con el resultado de la operación

**Estados**:
- **Habilitado**: Cuando hay oportunidades seleccionadas y no hay operaciones en curso
- **Deshabilitado**: Durante asignación o desasignación en curso
- **Loading**: Muestra spinner y texto "Desasignando..." durante la operación

---

## 🎨 Interfaz de Usuario

### Card de Acciones

El card de acciones aparece cuando el usuario selecciona una o más oportunidades:

```
┌─────────────────────────────────────────────────────────┐
│ Asignar Oportunidades Seleccionadas Manualmente         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ [Dropdown: Seleccionar agente...]                        │
│                                                           │
│ [Asignar Seleccionadas] [Desasignar]                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Uso

1. **Seleccionar Oportunidades**: El usuario marca los checkboxes de las oportunidades que desea desasignar
2. **Hacer Clic en "Desasignar"**: Aparece el botón rojo junto al botón de asignación
3. **Confirmar Acción**: Se muestra un diálogo de confirmación con el número de oportunidades
4. **Procesar**: El sistema desasigna las oportunidades seleccionadas
5. **Feedback**: Se muestra un mensaje con el resultado (éxito/errores)
6. **Actualización**: La tabla se recarga automáticamente mostrando las oportunidades sin asignar

---

## 🔧 Implementación Técnica

### Procesamiento en Lotes

Para evitar sobrecargar el servidor, las desasignaciones se procesan en lotes de 10 oportunidades:

```typescript
const BATCH_SIZE = 10;
for (let i = 0; i < request.opportunity_ids.length; i += BATCH_SIZE) {
  const batch = request.opportunity_ids.slice(i, i + BATCH_SIZE);
  // Procesar lote...
  await new Promise(resolve => setTimeout(resolve, 100)); // Pausa entre lotes
}
```

### Manejo de Errores

- Cada oportunidad se procesa individualmente
- Los errores se capturan y se reportan sin detener el proceso completo
- Se retorna un resumen con el número de éxitos y fallos

### Actualización de Estado

Después de la desasignación:
- Se limpia la selección de oportunidades
- Se recarga la lista de oportunidades
- Se muestra un mensaje con el resultado

---

## 📊 Respuesta de la API

### Éxito Parcial o Total

```json
{
  "success": true,
  "unassigned_count": 8,
  "failed_count": 2,
  "opportunities": [...],
  "errors": [
    {
      "opportunity_id": "uuid-1",
      "error": "Oportunidad no encontrada"
    }
  ]
}
```

### Éxito Total

```json
{
  "success": true,
  "unassigned_count": 10,
  "failed_count": 0,
  "opportunities": [...],
  "errors": []
}
```

---

## 🔐 Restricciones de Acceso

Esta funcionalidad está disponible **solo para administradores**:

- La página `/admin/opportunities` está protegida con `requireAdmin`
- Solo usuarios con rol `admin` o `superuser` pueden acceder
- Ver: `docs/ADMIN_OPPORTUNITIES_BULK_ASSIGNMENT.md`

---

## 🚀 Uso

### Para Administradores

1. Iniciar sesión como administrador
2. Navegar a `/admin/opportunities`
3. Seleccionar las oportunidades que se desean desasignar (usando checkboxes)
4. Hacer clic en el botón **"Desasignar"** (botón rojo)
5. Confirmar la acción en el diálogo
6. Esperar a que se complete la operación
7. Ver el mensaje de confirmación con el resultado

---

## 📝 Notas Técnicas

### Compatibilidad con Backend

- **✅ Implementado**: El endpoint `POST /crm/opportunities/{id}/assign` acepta `assigned_to_id: null` para desasignar
- **✅ Funcionalidad completa**: La desasignación funciona correctamente usando el endpoint `/assign` con `null`
- **📄 Especificación**: Ver `docs/BACKEND_OPPORTUNITIES_UNASSIGN_ENDPOINT.md` para detalles de la implementación
- **🎯 Optimización futura**: Ver `docs/BACKEND_OPPORTUNITIES_BULK_UNASSIGN_ENDPOINT.md` para endpoint batch opcional

### Rendimiento

- Procesa en lotes de 10 oportunidades
- Pausa de 100ms entre lotes para no sobrecargar el servidor
- Para grandes volúmenes (>100), considerar implementar endpoint batch en el backend

---

## 🔄 Relación con Otras Funcionalidades

- **Asignación Bulk**: Complementa la funcionalidad de asignación masiva
- **Filtros**: Las oportunidades desasignadas aparecerán en el filtro "Solo No Asignadas"
- **Modal de Asignación Individual**: También permite desasignar desde la ficha de detalle

---

## ✅ Checklist de Implementación

- [x] Método `bulkUnassign` en `opportunityApi.ts`
- [x] Estado `unassigning` en `AdminOpportunities.tsx`
- [x] Handler `handleBulkUnassign` con confirmación
- [x] Botón de desasignación en la UI
- [x] Icono `UserX` importado
- [x] Estilos visuales (rojo) para diferenciar de asignación
- [x] Manejo de errores y feedback al usuario
- [x] Recarga automática de la lista después de desasignar
- [x] Documentación completa

---

**Implementado por**: Sistema de Desarrollo  
**Revisado por**: -  
**Aprobado por**: -
