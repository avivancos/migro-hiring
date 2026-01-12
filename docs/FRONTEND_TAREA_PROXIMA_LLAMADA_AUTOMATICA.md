# Frontend: Crear Tarea Automáticamente desde Próxima Llamada

**Fecha**: 2025-01-30  
**Prioridad**: 🔴 Alta  
**Estado**: ✅ Completado  
**Módulo**: Frontend - CRM Contact Detail

---

## 📋 Resumen

Se implementó la funcionalidad para crear automáticamente una tarea asociada al contacto cuando se registra una llamada con "Próxima Llamada" (`proxima_llamada_fecha`). La tarea es de seguimiento y tiene como responsable al usuario que guarda la llamada.

---

## 🎯 Objetivo

Cuando un usuario registra una llamada en la ficha de contacto y especifica una "Próxima Llamada", se debe crear automáticamente una tarea asociada al contacto con:
- Tipo: `call` (llamada)
- Texto: "Llamada de seguimiento programada"
- Responsable: El usuario que guarda la llamada (el responsable de la llamada o el usuario actual)
- Fecha límite: La fecha de la próxima llamada (`proxima_llamada_fecha`)
- Entidad: El contacto asociado

---

## ✅ Solución Implementada

### Cambios en `CRMContactDetail.tsx`

**Archivo:** `src/pages/CRMContactDetail.tsx`

#### 1. Importar `adminService`

```typescript
import { adminService } from '@/services/adminService';
```

#### 2. Modificar `handleCallSubmit`

Se modificó la función `handleCallSubmit` para que después de crear una llamada con `proxima_llamada_fecha`, cree automáticamente una tarea:

```typescript
const handleCallSubmit = async (callData: CallCreateRequest) => {
  if (!id) return;
  try {
    const finalCallData: CallCreateRequest = {
      ...callData,
      entity_type: 'contacts',
      entity_id: id,
      started_at: callData.started_at || new Date().toISOString(),
    };
    
    // Crear la llamada
    const createdCall = await crmService.createCall(finalCallData);
    
    // Si se especificó una próxima llamada, crear automáticamente una tarea de seguimiento
    if (finalCallData.proxima_llamada_fecha) {
      try {
        // Obtener el usuario responsable (el de la llamada o el usuario actual)
        const responsibleUserId = finalCallData.responsible_user_id || adminService.getUser()?.id;
        
        if (responsibleUserId) {
          const taskData: TaskCreateRequest = {
            text: 'Llamada de seguimiento programada',
            task_type: 'call',
            entity_type: 'contacts',
            entity_id: id,
            responsible_user_id: responsibleUserId,
            complete_till: finalCallData.proxima_llamada_fecha,
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
        console.error('Error creando tarea de seguimiento:', taskErr);
        // No bloquear el flujo si falla la creación de la tarea
      }
    }
    
    // Actualización optimista: agregar la llamada localmente
    setCalls(prev => {
      const updated = [createdCall, ...prev].sort((a, b) => {
        const dateA = new Date(a.started_at || a.created_at).getTime();
        const dateB = new Date(b.started_at || b.created_at).getTime();
        return dateB - dateA;
      });
      return updated;
    });
    
    // Cerrar formulario y cambiar a pestaña de historial
    setShowCallForm(false);
    setActiveTab('history');
    
    // Recargar datos en background para mantener consistencia
    setTimeout(async () => {
      try {
        await loadContactData();
      } catch (err) {
        console.error('Error recargando datos:', err);
      }
    }, 1000);
  } catch (err: any) {
    // Manejo de errores...
  }
};
```

---

## 🔍 Detalles de Implementación

### Flujo de Creación de Tarea

1. **Usuario registra una llamada** con "Próxima Llamada" (`proxima_llamada_fecha`)
2. **Se crea la llamada** usando `crmService.createCall()`
3. **Si hay `proxima_llamada_fecha`**:
   - Se obtiene el usuario responsable (de la llamada o el usuario actual)
   - Se crea una tarea con:
     - `text`: "Llamada de seguimiento programada"
     - `task_type`: "call"
     - `entity_type`: "contacts"
     - `entity_id`: ID del contacto
     - `responsible_user_id`: Usuario responsable
     - `complete_till`: Fecha de la próxima llamada
4. **Actualización optimista**: La tarea se agrega inmediatamente al estado local
5. **Recarga en background**: Se recargan los datos del contacto después de 1 segundo

### Obtención del Usuario Responsable

El usuario responsable se obtiene en este orden:
1. `callData.responsible_user_id` (si la llamada tiene un responsable asignado)
2. `adminService.getUser()?.id` (usuario actual de la sesión)

---

## ✅ Características

- ✅ Creación automática de tarea cuando se especifica "Próxima Llamada"
- ✅ Tarea asociada al contacto correcto
- ✅ Responsable asignado automáticamente (usuario que guarda la llamada)
- ✅ Actualización optimista (la tarea aparece inmediatamente)
- ✅ Recarga en background para mantener consistencia
- ✅ Manejo de errores sin bloquear el flujo principal

---

## 🧪 Testing

### Verificación Manual

1. **Abrir la ficha de un contacto:**
   - Ir a `/crm/contacts/{id}`
   - Verificar que se cargan las tareas existentes

2. **Registrar una llamada con próxima llamada:**
   - Hacer clic en "Nueva Llamada"
   - Completar los datos de la llamada
   - Especificar una fecha en "Próxima Llamada"
   - Guardar la llamada

3. **Verificar que se crea la tarea:**
   - La tarea debería aparecer inmediatamente en el timeline (pestaña "history")
   - La tarea debería aparecer en la pestaña "tasks"
   - La tarea debe tener:
     - Texto: "Llamada de seguimiento programada"
     - Tipo: "call"
     - Responsable: El usuario que guardó la llamada
     - Fecha límite: La fecha de la próxima llamada

### Verificación en Consola

Abrir la consola del navegador y verificar:

```javascript
// Debería mostrar:
📞 [CRMContactDetail] Enviando llamada: {...}
✅ [CRMContactDetail] Llamada creada exitosamente: {id}
📋 [CRMContactDetail] Creando tarea de seguimiento automática: {...}
✅ [CRMContactDetail] Tarea de seguimiento creada exitosamente: {id}
📋 [CRMContactDetail] Tareas actualizadas localmente: {count} tareas
📞 [CRMContactDetail] Llamadas actualizadas localmente: {count} llamadas
```

---

## 📝 Notas Técnicas

### Estructura de la Tarea Creada

```typescript
{
  text: 'Llamada de seguimiento programada',
  task_type: 'call',
  entity_type: 'contacts',
  entity_id: '{contactId}',
  responsible_user_id: '{userId}',
  complete_till: '{proxima_llamada_fecha}',
}
```

### Manejo de Errores

- Si falla la creación de la tarea, se loggea el error pero no se bloquea el flujo principal
- La llamada se guarda exitosamente incluso si falla la creación de la tarea
- El usuario puede crear la tarea manualmente si es necesario

---

## 🔗 Referencias

- [Componente CRMContactDetail](../src/pages/CRMContactDetail.tsx) - Implementación del componente
- [Servicio CRM](../src/services/crmService.ts) - Servicio que maneja las llamadas a la API
- [Servicio Admin](../src/services/adminService.ts) - Servicio para obtener el usuario actual
- [Formulario de Llamadas](../src/components/CRM/CallForm.tsx) - Formulario de llamadas

---

## ✅ Checklist de Implementación

- [x] Importar `adminService`
- [x] Modificar `handleCallSubmit` para crear tarea automáticamente
- [x] Obtener usuario responsable (de la llamada o usuario actual)
- [x] Crear tarea con datos correctos
- [x] Actualización optimista de la tarea
- [x] Actualización optimista de la llamada
- [x] Manejo de errores sin bloquear el flujo
- [x] Recarga en background para mantener consistencia
- [x] Verificar que no hay errores de linting
- [x] Documentar cambios

---

## 🚀 Próximos Pasos

1. **Verificar en producción**: Asegurarse de que las tareas se crean correctamente cuando se registran llamadas con próxima llamada
2. **Considerar mejoras**: Si es necesario, agregar más opciones de personalización del texto de la tarea
3. **Monitorear logs**: Verificar que no hay errores en la creación de tareas

---

**Prioridad**: Alta  
**Estimación**: 1 hora  
**Dependencias**: Ninguna
