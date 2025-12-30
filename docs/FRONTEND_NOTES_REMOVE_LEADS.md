# Eliminación de 'leads' y 'companies' del Sistema de Notas

## Resumen
Se eliminaron todas las referencias a `'leads'` y `'companies'` como `entity_type` en el sistema de notas del frontend. Las notas ahora solo pueden asociarse a `'contacts'`.

## Fecha
{{ fecha_actual }}

## Cambios Realizados

### 1. Tipos TypeScript

#### `src/types/crm.ts`
- **Interface `Note`**: Eliminado `'leads'` y `'companies'` del tipo `entity_type`
  ```typescript
  // Antes
  entity_type?: 'contacts' | 'leads' | 'companies' | null;
  
  // Después
  entity_type?: 'contacts' | null;
  ```

- **Interface `NoteCreateRequest`**: Eliminado `'leads'` y `'companies'` del tipo `entity_type`
  ```typescript
  // Antes
  entity_type?: 'contacts' | 'leads' | 'companies';
  
  // Después
  entity_type?: 'contacts';
  ```

- **Interface `NoteUpdateRequest`**: Eliminado `'leads'` y `'companies'` del tipo `entity_type`
  ```typescript
  // Antes
  entity_type?: 'contacts' | 'leads' | 'companies';
  
  // Después
  entity_type?: 'contacts';
  ```

### 2. Hooks

#### `src/hooks/useNotes.ts`
- **Interface `UseNotesOptions`**: Eliminado `'leads'` y `'companies'` del tipo `entityType`
  ```typescript
  // Antes
  entityType?: 'contacts' | 'leads' | 'companies';
  
  // Después
  entityType?: 'contacts';
  ```

### 3. Componentes

#### `src/components/CRM/Notes/NoteList.tsx`
- **Interface `NoteListProps`**: Eliminado `'leads'` y `'companies'` del tipo `entityType`
  ```typescript
  // Antes
  entityType?: 'contacts' | 'leads' | 'companies';
  
  // Después
  entityType?: 'contacts';
  ```

#### `src/components/CRM/NoteForm.tsx`
- **Interface `NoteFormProps`**: Eliminado `'leads'` del tipo `defaultEntityType`
  ```typescript
  // Antes
  defaultEntityType?: 'contacts' | 'leads';
  
  // Después
  defaultEntityType?: 'contacts';
  ```

- **Select de Entity Type**: Eliminada la opción `'leads'`
  ```tsx
  // Antes
  <option value="contacts">Contacto</option>
  <option value="leads">Lead</option>
  
  // Después
  <option value="contacts">Contacto</option>
  ```

- **Sección condicional para leads**: Eliminada completamente la sección que mostraba un input para ID de lead cuando `entity_type === 'leads'`

#### `src/components/CRM/ActivityTimeline.tsx`
- **Interface `ActivityTimelineProps`**: Eliminado `'lead'` y `'company'` del tipo `entityType`
  ```typescript
  // Antes
  entityType: 'lead' | 'contact' | 'company';
  
  // Después
  entityType: 'contact';
  ```

- **Lógica de conversión**: Simplificada para usar siempre `'contacts'`
  ```typescript
  // Antes
  entity_type: entityType === 'lead' ? 'leads' : entityType === 'contact' ? 'contacts' : entityType,
  
  // Después
  entity_type: 'contacts',
  ```

- **Comentario**: Actualizado para reflejar que solo maneja contactos
  ```typescript
  // Antes
  // ActivityTimeline - Timeline of notes and activities for leads/contacts
  
  // Después
  // ActivityTimeline - Timeline of notes and activities for contacts
  ```

### 4. Servicios

#### `src/services/crmService.ts`
- **Función `createNote`**: Eliminada la normalización de `'lead'` a `'leads'` y `'company'` a `'companies'`
  ```typescript
  // Antes
  entity_type: note.entity_type === 'contact' ? 'contacts' : 
               note.entity_type === 'lead' ? 'leads' : 
               note.entity_type === 'company' ? 'companies' :
               note.entity_type,
  
  // Después
  entity_type: note.entity_type === 'contact' ? 'contacts' : note.entity_type,
  ```

### 5. Páginas

#### `src/pages/CRMExpedientes.tsx`
- **Llamada a `getNotes`**: Cambiado `entity_type: 'leads'` a `entity_type: 'contacts'`
  ```typescript
  // Antes
  crmService.getNotes({ entity_id: lead.id, entity_type: 'leads', limit: 50 })
  
  // Después
  crmService.getNotes({ entity_id: lead.id, entity_type: 'contacts', limit: 50 })
  ```

#### `src/pages/LeadDetail.tsx`
- **Componente `ActivityTimeline`**: Cambiado `entityType="lead"` a `entityType="contact"`
  ```tsx
  // Antes
  <ActivityTimeline entityType="lead" entityId={lead.id} />
  
  // Después
  <ActivityTimeline entityType="contact" entityId={lead.id} />
  ```

## Impacto

### Compatibilidad
- Las notas existentes con `entity_type: 'leads'` o `entity_type: 'companies'` en la base de datos seguirán existiendo, pero:
  - No se podrán crear nuevas notas con `entity_type: 'leads'` o `'companies'` desde el frontend
  - Los componentes de notas solo permitirán seleccionar 'contacts'
  - El sistema tratará los leads y companies como contactos para las notas

### Migración de Datos
Si es necesario migrar notas existentes de `'leads'` o `'companies'` a `'contacts'`, se debe hacer a nivel de base de datos:

```sql
UPDATE notes 
SET entity_type = 'contacts' 
WHERE entity_type IN ('leads', 'companies');
```

## Notas Adicionales

1. **Tareas y Llamadas**: Este cambio solo afecta a las notas. Las tareas y llamadas aún pueden usar `'leads'` o `'companies'` como `entity_type` si es necesario.

2. **Backend**: El backend puede seguir aceptando `'leads'` o `'companies'` como `entity_type` para notas, pero el frontend ya no los enviará.

3. **Unificación de Entidades**: Este cambio simplifica el sistema de notas para usar únicamente `'contacts'` como `entity_type`, unificando leads y companies bajo contactos.

## Archivos Modificados

1. `src/types/crm.ts`
2. `src/hooks/useNotes.ts`
3. `src/components/CRM/Notes/NoteList.tsx`
4. `src/components/CRM/NoteForm.tsx`
5. `src/components/CRM/ActivityTimeline.tsx`
6. `src/services/crmService.ts`
7. `src/pages/CRMExpedientes.tsx`
8. `src/pages/LeadDetail.tsx`

## Testing

### Verificaciones Recomendadas

1. ✅ Crear una nueva nota desde `NoteForm` - debe mostrar solo "Contacto" como opción
2. ✅ Crear una nota asociada a un contacto - debe funcionar correctamente
3. ✅ Ver notas en `ActivityTimeline` - debe cargar correctamente para contactos (siempre usa 'contacts')
4. ✅ Ver notas en `CRMExpedientes` - debe usar `'contacts'` en lugar de `'leads'`
5. ✅ Ver notas en `LeadDetail` - debe usar `entityType="contact"`

### Casos de Prueba

- [ ] Crear nota desde formulario de contacto
- [ ] Crear nota desde formulario de lead (debe usar 'contacts')
- [ ] Ver timeline de actividades en detalle de contacto
- [ ] Ver timeline de actividades en detalle de lead
- [ ] Ver notas en vista de expedientes
- [ ] Editar nota existente
- [ ] Eliminar nota

## Referencias

- Relacionado con: Unificación de leads y contactos en el sistema
- Similar a: `docs/BACKEND_TASKFORM_REMOVE_LEADS.md` (para tareas)

