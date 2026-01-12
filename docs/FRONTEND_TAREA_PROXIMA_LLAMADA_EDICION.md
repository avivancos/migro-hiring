# Frontend: Creación Automática de Tarea al Editar Próxima Llamada

**Fecha**: 2025-01-30  
**Prioridad**: 🟡 Media  
**Estado**: ✅ Completado  
**Módulo**: Frontend - CRM Contact Detail

---

## 📋 Resumen

Se actualizó la función `handleSaveProximaAccion` para que cuando se edita la fecha de `proxima_llamada_fecha` desde la ficha del contacto, se cree automáticamente una tarea de seguimiento, similar a como ocurre cuando se registra una nueva llamada con próxima llamada.

---

## 🎯 Objetivo

Asegurar que siempre que se asigne una próxima llamada (ya sea desde el formulario de llamada o editando directamente la fecha desde la ficha del contacto), se cree automáticamente una tarea de seguimiento.

---

## ✅ Solución Implementada

### Cambios en `CRMContactDetail.tsx`

**Archivo:** `src/pages/CRMContactDetail.tsx`

Se modificó la función `handleSaveProximaAccion` para que cuando se actualiza `proxima_llamada_fecha` en una llamada existente, se cree automáticamente una tarea de seguimiento.

**Cambios principales:**

```typescript
// Antes: Solo actualizaba la llamada
if (editingProximaAccionField === 'proxima_llamada_fecha') {
  updates.proxima_llamada_fecha = new Date(editingProximaAccionFecha).toISOString();
}
await crmService.updateCall(editingProximaAccionId, updates);

// Después: Actualiza la llamada Y crea una tarea automáticamente
if (editingProximaAccionField === 'proxima_llamada_fecha') {
  updates.proxima_llamada_fecha = new Date(editingProximaAccionFecha).toISOString();
  
  // Si se actualiza proxima_llamada_fecha, crear automáticamente una tarea de seguimiento
  try {
    const currentUser = adminService.getUser();
    const responsibleUserId = currentUser?.id;
    
    if (responsibleUserId) {
      const taskData: TaskCreateRequest = {
        text: 'Llamada de seguimiento programada',
        task_type: 'call',
        entity_type: 'contacts',
        entity_id: id,
        responsible_user_id: responsibleUserId,
        complete_till: new Date(editingProximaAccionFecha).toISOString(),
      };
      
      const createdTask = await crmService.createTask(taskData);
      
      // Actualización optimista: agregar la tarea localmente
      setTasks(prev => {
        const updated = [createdTask, ...prev].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
        return updated;
      });
    }
  } catch (taskErr: any) {
    console.error('❌ [CRMContactDetail] Error creando tarea de seguimiento:', taskErr);
    // No bloquear el flujo si falla la creación de la tarea
  }
}
await crmService.updateCall(editingProximaAccionId, updates);
```

---

## 🔍 Detalles de Implementación

### Flujo Completo

1. **Usuario edita fecha de próxima llamada:**
   - El usuario hace clic en el botón de editar junto a "Fecha de Nueva Llamada / Acción"
   - Se abre el modal de edición
   - El usuario cambia la fecha y guarda

2. **Actualización de la llamada:**
   - Se actualiza el campo `proxima_llamada_fecha` en la llamada existente
   - Se envía la actualización al backend

3. **Creación automática de tarea:**
   - Si el campo editado es `proxima_llamada_fecha`
   - Se obtiene el usuario actual como responsable
   - Se crea una nueva tarea con:
     - `text`: "Llamada de seguimiento programada"
     - `task_type`: "call"
     - `entity_type`: "contacts"
     - `entity_id`: ID del contacto
     - `responsible_user_id`: ID del usuario actual
     - `complete_till`: La fecha de próxima llamada

4. **Actualización optimista:**
   - La tarea se agrega inmediatamente al estado local
   - Se ordena por fecha de creación (más recientes primero)
   - Luego se recarga la data del contacto desde el servidor

### Manejo de Errores

- Si falla la creación de la tarea, se registra el error pero NO se bloquea el flujo
- La actualización de la llamada se completa independientemente
- El usuario puede crear la tarea manualmente si es necesario

---

## 🎨 Comportamiento

### Escenarios Cubiertos

1. **Registrar nueva llamada con próxima llamada:**
   - ✅ Crea automáticamente una tarea (ya implementado en `handleCallSubmit`)

2. **Editar fecha de próxima llamada desde ficha del contacto:**
   - ✅ Ahora también crea automáticamente una tarea (nueva implementación)

3. **Editar fecha de próxima acción (`proxima_accion_fecha`):**
   - ❌ No crea tarea automática (solo actualiza la llamada)
   - Esto es por diseño, ya que `proxima_accion_fecha` es más genérico

4. **Editar fecha de vencimiento de tarea existente:**
   - ❌ No crea nueva tarea (solo actualiza la tarea existente)
   - Esto es por diseño, ya que se está editando una tarea, no creando una nueva

---

## ✅ Beneficios

1. **Consistencia**: Mismo comportamiento tanto al registrar nueva llamada como al editar fecha existente
2. **Trazabilidad**: Siempre hay una tarea asociada cuando hay una próxima llamada programada
3. **Recordatorios**: Las tareas aparecen en los listados y pueden ser marcadas como completadas
4. **Usabilidad**: El usuario no tiene que recordar crear la tarea manualmente

---

## 🧪 Testing

### Verificación Manual

1. **Editar próxima llamada desde ficha de contacto:**
   - Abrir un contacto que tenga llamadas
   - Hacer clic en el botón de editar junto a "Fecha de Nueva Llamada / Acción"
   - Cambiar la fecha y guardar
   - Verificar que:
     - La llamada se actualiza correctamente
     - Se crea automáticamente una nueva tarea
     - La tarea aparece en el listado de tareas
     - La tarea tiene la fecha correcta

2. **Verificar que no se crean tareas duplicadas:**
   - Editar la fecha de próxima llamada varias veces
   - Verificar que cada edición crea una nueva tarea
   - (Esto es el comportamiento esperado - cada cambio crea una nueva tarea de seguimiento)

3. **Verificar manejo de errores:**
   - Simular un error en la creación de la tarea
   - Verificar que la actualización de la llamada se completa igual
   - Verificar que se muestra un error en la consola

---

## 📝 Notas Técnicas

### Diferencia entre `proxima_llamada_fecha` y `proxima_accion_fecha`

- **`proxima_llamada_fecha`**: Específico para llamadas, crea tarea automática
- **`proxima_accion_fecha`**: Más genérico, no crea tarea automática

### Orden de Operaciones

1. Primero se crea la tarea (si aplica)
2. Luego se actualiza la llamada
3. Finalmente se recarga la data del contacto

Esto asegura que la tarea se cree con la fecha correcta antes de actualizar la llamada.

---

## 🔗 Referencias

- [Componente CRMContactDetail](../src/pages/CRMContactDetail.tsx) - Implementación completa
- [FRONTEND_TAREA_PROXIMA_LLAMADA_AUTOMATICA.md](./FRONTEND_TAREA_PROXIMA_LLAMADA_AUTOMATICA.md) - Documentación de la creación automática desde el formulario de llamada
- [handleCallSubmit](../src/pages/CRMContactDetail.tsx#L489) - Función que crea tarea al registrar nueva llamada

---

## ✅ Checklist de Implementación

- [x] Modificar `handleSaveProximaAccion` para crear tarea cuando se edita `proxima_llamada_fecha`
- [x] Obtener usuario actual como responsable
- [x] Crear tarea con datos correctos
- [x] Implementar actualización optimista
- [x] Agregar manejo de errores (no bloquear flujo)
- [x] Agregar logging para diagnóstico
- [x] Verificar que no hay errores de linting
- [x] Documentar cambios

---

## 🚀 Próximos Pasos

1. **Verificar en producción**: Asegurarse de que la creación automática funciona correctamente
2. **Monitorear feedback**: Recopilar feedback de usuarios sobre el comportamiento
3. **Considerar mejoras**: Si es necesario, agregar lógica para evitar tareas duplicadas (por ejemplo, eliminar tarea anterior si se edita la fecha)

---

**Prioridad**: Media  
**Estimación**: 30 minutos  
**Dependencias**: Función `handleSaveProximaAccion` existente, servicio `crmService.createTask`
