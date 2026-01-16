# Fix: Mapeo de Usuario CRM en useTasks y useNotes

## Problema

Al crear una tarea o cargar tareas/notas, aparecía un warning en la consola:

```
⚠️ [useTasks] No se encontró usuario CRM para: soniacisnero7@gmail.com
```

### Causa Raíz

El problema ocurría porque:

1. **Búsqueda limitada**: Los hooks `useTasks` y `useNotes` solo buscaban el usuario CRM por email exacto (`u.email === user.email`)
2. **Inconsistencia con TaskForm**: El componente `TaskForm` ya tenía una búsqueda mejorada que buscaba tanto por ID como por email (case-insensitive)
3. **Falta de flexibilidad**: No se consideraban variaciones en mayúsculas/minúsculas o diferencias entre el ID del sistema y el ID del CRM

### Impacto

- Los usuarios regulares no podían filtrar correctamente sus tareas/notas
- Aparecían warnings innecesarios en la consola
- La experiencia de usuario se degradaba con mensajes de error confusos

## Solución Implementada

### Cambios en `useTasks.ts`

Se mejoró la búsqueda del usuario CRM para que:

1. **Busque primero por ID** (más confiable que el email)
2. **Luego busque por email** (case-insensitive)
3. **Proporcione mejor logging** para diagnóstico

```typescript
// Antes: Solo búsqueda por email exacto
const crmUser = crmUsers.find(u => u.email === user.email);

// Después: Búsqueda por ID y email (case-insensitive)
const crmUser = crmUsers.find(u => {
  const matchesId = currentUserId && u.id === currentUserId;
  const matchesEmail = currentEmail && (
    u.email?.toLowerCase() === currentEmail || 
    u.email === user.email
  );
  return matchesId || matchesEmail;
});
```

### Cambios en `useNotes.ts`

Se aplicó la misma mejora para mantener consistencia:

1. Búsqueda por ID y email (case-insensitive)
2. Mejor logging con información de diagnóstico
3. Mismo comportamiento que `useTasks` y `TaskForm`

### Mejoras en el Logging

Ahora el logging incluye información más detallada:

```typescript
console.log('🔍 [useTasks] Usuario regular, filtrando por CRM user:', {
  systemUserId: user.id,
  systemUserEmail: user.email,
  crmUserId: crmUser.id,
  crmUserName: crmUser.name,
  crmUserEmail: crmUser.email,
  matchedBy: currentUserId && crmUser.id === currentUserId ? 'ID' : 'email',
});
```

Y cuando no se encuentra el usuario, se muestra información útil:

```typescript
console.warn('⚠️ [useTasks] No se encontró usuario CRM para:', {
  systemUserId: user.id,
  systemUserEmail: user.email,
  availableCrmUsers: crmUsers.map(u => ({ id: u.id, email: u.email, name: u.name })),
});
```

## Archivos Modificados

1. `src/hooks/useTasks.ts`
   - Líneas 64-125: Mejora en la búsqueda del usuario CRM en `fetchTasks`
   - Búsqueda por ID y email (case-insensitive)
   - Mejor logging para diagnóstico

2. `src/hooks/useNotes.ts`
   - Líneas 62-103: Mejora en la búsqueda del usuario CRM en `fetchNotes`
   - Líneas 119-137: Mejora en el filtrado de seguridad
   - Búsqueda por ID y email (case-insensitive)
   - Mejor logging para diagnóstico

## Beneficios

1. **Consistencia**: Todos los componentes ahora usan la misma lógica de búsqueda
2. **Robustez**: La búsqueda por ID es más confiable que solo por email
3. **Flexibilidad**: Maneja variaciones en mayúsculas/minúsculas
4. **Diagnóstico**: Mejor logging ayuda a identificar problemas más rápido
5. **Experiencia de usuario**: Elimina warnings innecesarios

## Testing

Para verificar que la solución funciona:

1. Iniciar sesión con un usuario que tenga tareas/notas
2. Crear una nueva tarea
3. Verificar que no aparezcan warnings en la consola
4. Verificar que las tareas se filtren correctamente por usuario

## Notas Técnicas

- La búsqueda por ID tiene prioridad sobre la búsqueda por email
- La comparación de emails es case-insensitive pero también intenta match exacto
- El logging incluye información sobre cómo se encontró el match (por ID o email)
- Si no se encuentra el usuario, se muestra la lista de usuarios CRM disponibles para diagnóstico

## Relacionado

- `src/components/CRM/TaskForm.tsx` - Ya tenía la lógica correcta implementada
- `src/components/CRM/CallForm.tsx` - También usa la misma lógica mejorada
- `docs/FRONTEND_TASKS_NOTES_USER_MAPPING_FIX.md` - Documentación previa sobre mapeo de usuarios
