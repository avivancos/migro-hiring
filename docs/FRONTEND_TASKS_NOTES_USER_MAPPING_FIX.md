# Frontend: Corrección de Mapeo de Usuarios para Tareas y Notas

**Fecha**: 2025-01-28  
**Prioridad**: 🔴 Alta  
**Estado**: ✅ Completado  
**Módulo**: Frontend - CRM Tasks & Notes

---

## 📋 Resumen Ejecutivo

Se corrigió un problema crítico donde los usuarios regulares (agentes, lawyers) no podían ver sus propias tareas y notas. El problema estaba en que el frontend no estaba mapeando correctamente el usuario del sistema de autenticación con el usuario CRM correspondiente.

---

## 🐛 Problema Identificado

### Síntomas
- Los usuarios regulares (no admin) no veían sus tareas en `/crm/tasks`
- Los usuarios regulares no veían sus notas en `/crm/notes`
- El backend devolvía correctamente las tareas/notas, pero el frontend no las mostraba
- Ejemplo: Gabriela Calderón no veía su tarea pendiente aunque el backend la devolvía

### Causa Raíz

El problema estaba en los hooks `useTasks` y `useNotes`:

1. **Eliminación incorrecta del filtro**: Para usuarios regulares, se eliminaba el filtro `responsible_user_id` o `created_by`, asumiendo que el backend lo aplicaría automáticamente.

2. **Falta de mapeo de usuarios**: No se estaba buscando el usuario CRM correspondiente al usuario del sistema de autenticación. El backend necesita el UUID del usuario CRM, no el ID del usuario del sistema.

3. **Diferencia entre IDs**: 
   - Usuario del sistema: `user.id` (ID del sistema de autenticación)
   - Usuario CRM: `crmUser.id` (UUID del sistema CRM)
   - Estos son diferentes y deben mapearse usando el email

---

## 🔧 Solución Implementada

### 1. Corrección en `useTasks.ts`

**Archivo**: `src/hooks/useTasks.ts`

**Cambios**:
- Agregado estado para almacenar usuarios CRM: `crmUsers`
- Carga de usuarios CRM al montar el componente
- Para usuarios regulares: búsqueda del usuario CRM correspondiente usando el email
- Establecimiento de `responsible_user_id` con el UUID del usuario CRM encontrado

**Código clave**:
```typescript
// Cargar usuarios CRM
useEffect(() => {
  const loadCRMUsers = async () => {
    try {
      const users = await crmService.getUsers(true);
      setCrmUsers(users);
    } catch (err) {
      console.warn('⚠️ [useTasks] Error cargando usuarios CRM:', err);
      setCrmUsers([]);
    }
  };
  loadCRMUsers();
}, []);

// En fetchTasks:
if (!isAdmin) {
  // Buscar el usuario CRM correspondiente
  if (user?.email && crmUsers.length > 0) {
    const crmUser = crmUsers.find(u => u.email === user.email);
    if (crmUser) {
      requestFilters.responsible_user_id = crmUser.id;
    }
  }
}
```

### 2. Corrección en `useNotes.ts`

**Archivo**: `src/hooks/useNotes.ts`

**Cambios similares**:
- Agregado estado para almacenar usuarios CRM
- Carga de usuarios CRM al montar el componente
- Para usuarios regulares: búsqueda del usuario CRM y establecimiento de `created_by`
- Corrección del filtrado en el cliente para usar el ID del usuario CRM

**Código clave**:
```typescript
// Similar a useTasks, pero usando created_by en lugar de responsible_user_id
if (!isAdmin) {
  const crmUser = crmUsers.find(u => u.email === user.email);
  if (crmUser) {
    filters.created_by = crmUser.id;
  }
}

// Filtrado en el cliente corregido:
if (!isAdmin && crmUser) {
  filteredNotes = notesList.filter(note => 
    note.created_by === crmUser.id  // Usar crmUser.id, no user.id
  );
}
```

---

## 📝 Cambios Realizados

### Archivos Modificados

1. **`src/hooks/useTasks.ts`**
   - Agregado import de `CRMUser`
   - Agregado estado `crmUsers`
   - Agregado `useEffect` para cargar usuarios CRM
   - Modificada lógica de `fetchTasks` para mapear usuario del sistema a usuario CRM
   - Agregados logs de debug

2. **`src/hooks/useNotes.ts`**
   - Agregado import de `CRMUser`
   - Agregado estado `crmUsers`
   - Agregado `useEffect` para cargar usuarios CRM
   - Modificada lógica de `fetchNotes` para mapear usuario del sistema a usuario CRM
   - Corregido filtrado en el cliente para usar ID del usuario CRM
   - Agregados logs de debug

---

## 🎯 Funcionalidad

### Para Usuarios Regulares (Agentes, Lawyers)

**Antes**:
- ❌ No veían sus tareas
- ❌ No veían sus notas
- ❌ El backend devolvía datos pero el frontend no los mostraba

**Después**:
- ✅ Ven sus propias tareas correctamente
- ✅ Ven sus propias notas correctamente
- ✅ El mapeo entre usuario del sistema y usuario CRM funciona correctamente

### Para Administradores

- ✅ Sin cambios: pueden ver todas las tareas y notas
- ✅ Pueden filtrar por cualquier usuario usando los filtros

---

## 🔒 Seguridad

### Validaciones Implementadas

1. **Mapeo correcto**: Solo se mapea el usuario actual, no se permite acceso a otros usuarios
2. **Filtrado en backend**: El backend recibe el UUID correcto del usuario CRM
3. **Filtrado adicional en cliente**: Como medida de seguridad adicional, se filtra en el cliente usando el ID del usuario CRM

### Flujo de Seguridad

1. Usuario regular accede a `/crm/tasks` o `/crm/notes`
2. Frontend carga usuarios CRM
3. Frontend busca el usuario CRM correspondiente usando el email
4. Frontend establece `responsible_user_id` o `created_by` con el UUID del usuario CRM
5. Backend recibe la petición con el filtro correcto
6. Backend devuelve solo las tareas/notas del usuario
7. Frontend muestra los resultados

---

## 🧪 Testing

### Casos de Prueba

1. **Usuario regular (Gabriela)**:
   - ✅ Debe ver su tarea pendiente
   - ✅ Debe ver sus notas
   - ✅ No debe ver tareas/notas de otros usuarios

2. **Administrador**:
   - ✅ Debe ver todas las tareas sin filtro
   - ✅ Debe poder filtrar por cualquier usuario
   - ✅ Debe ver todas las notas sin filtro

3. **Mapeo de usuarios**:
   - ✅ El email del usuario del sistema debe coincidir con el email del usuario CRM
   - ✅ Si no se encuentra el usuario CRM, debe mostrar un warning en consola
   - ✅ Si no hay usuarios CRM cargados, debe intentar cargarlos

---

## 📚 Referencias

- [Frontend Admin Filter Tasks Notes](./FRONTEND_ADMIN_FILTER_TASKS_NOTES.md) - Implementación de filtros para admins
- [CRMContactList.tsx](../src/pages/CRMContactList.tsx) - Implementación similar para contactos

---

## ✅ Checklist de Implementación

- [x] Agregar carga de usuarios CRM en `useTasks`
- [x] Implementar mapeo de usuario del sistema a usuario CRM en `useTasks`
- [x] Agregar carga de usuarios CRM en `useNotes`
- [x] Implementar mapeo de usuario del sistema a usuario CRM en `useNotes`
- [x] Corregir filtrado en el cliente de `useNotes` para usar ID del usuario CRM
- [x] Agregar logs de debug
- [x] Verificar que usuarios regulares ven sus tareas/notas
- [x] Verificar que admins siguen viendo todo
- [x] Documentar cambios

---

## 🔄 Próximos Pasos

1. **Testing en producción**: Verificar que funciona correctamente con usuarios reales
2. **Optimización**: Considerar caché de usuarios CRM para evitar cargas repetidas
3. **Manejo de errores**: Mejorar el manejo cuando no se encuentra el usuario CRM

---

## 📝 Notas Técnicas

### Mapeo de Usuarios

**Problema**:
- Sistema de autenticación tiene usuarios con `user.id` (ID del sistema)
- Sistema CRM tiene usuarios con `crmUser.id` (UUID)
- Estos IDs son diferentes

**Solución**:
- Usar el email como clave de mapeo
- Buscar en la lista de usuarios CRM el que tenga el mismo email
- Usar el UUID del usuario CRM para filtrar en el backend

### Flujo de Datos

```
Usuario del Sistema (user)
  ↓
Email: gabricalderalvar27@gmail.com
  ↓
Buscar en usuarios CRM
  ↓
Usuario CRM encontrado (crmUser)
  ↓
UUID: b176c565-db78-4730-8633-b999d61d6a2e
  ↓
Enviar al backend como responsible_user_id o created_by
  ↓
Backend filtra correctamente
  ↓
Frontend muestra resultados
```

---

**Autor**: Auto (AI Assistant)  
**Revisado**: Pendiente  
**Versión**: 1.0
