# Eliminación de Leads del TaskForm

## Resumen
Se eliminaron todas las referencias a leads del componente `TaskForm` para que las tareas solo se relacionen con contactos, según los requisitos del sistema.

## Cambios Realizados

### 1. TaskForm.tsx (`src/components/CRM/TaskForm.tsx`)

#### Imports
- **Eliminado**: `KommoLead` del import de tipos
- **Mantenido**: `KommoContact` para manejar solo contactos

#### Interface TaskFormProps
- **Cambiado**: `defaultEntityType?: 'leads' | 'contacts' | 'companies'` 
- **A**: `defaultEntityType?: 'contacts' | 'companies'`
- Eliminada la opción de 'leads'

#### Estados
- **Eliminados**:
  - `const [leads, setLeads] = useState<KommoLead[]>([]);`
  - `const [selectedLead, setSelectedLead] = useState<KommoLead | null>(null);`
- **Mantenido**: Solo estados relacionados con contactos

#### Valores por defecto
- **Cambiado**: `const normalizedEntityType = defaultEntityType || 'leads';`
- **A**: `const normalizedEntityType = defaultEntityType || 'contacts';`

#### Normalización de entity_type
- **Agregado**: En el estado inicial, se normaliza cualquier `entity_type` que sea 'leads' a 'contacts':
  ```typescript
  entity_type: (task?.entity_type === 'leads' ? 'contacts' : task?.entity_type) || normalizedEntityType,
  ```

#### Función loadEntities
- **Simplificada**: Eliminada toda la lógica relacionada con leads
- **Ahora solo**:
  - Carga contactos cuando `defaultEntityType === 'contacts'`
  - Carga lista de contactos cuando `formData.entity_type === 'contacts'`
  - Eliminadas todas las referencias a `crmService.getLead()` y `crmService.getLeads()`

#### handleSubmit
- **Simplificada**: Eliminada la normalización de 'lead' a 'leads'
- **Ahora solo normaliza**: 'contact' a 'contacts'

#### UI del Formulario
- **Select de entity_type**: 
  - Eliminada la opción `<option value="leads">Lead</option>`
  - Solo queda `<option value="contacts">Contacto</option>`
  - Texto de ayuda actualizado: "La tarea está relacionada con un Contacto"

- **Select de entity_id**:
  - Eliminada la lógica condicional para mostrar leads
  - Siempre muestra solo contactos
  - Label simplificado a "Contacto" (sin condicional)

- **Visualización de entidad predefinida**:
  - Eliminada la lógica para mostrar información de leads
  - Solo muestra información de contactos cuando `defaultEntityType === 'contacts'`

#### useEffect
- **Optimizado**: Solo carga entidades cuando `formData.entity_type === 'contacts'`

### 2. CRMLeadDetail.tsx (`src/pages/CRMLeadDetail.tsx`)

- **Cambiado**: `defaultEntityType="leads"` a `defaultEntityType="contacts"`
- Esto asegura que cuando se crea una tarea desde la vista de un lead, se use 'contacts' como entity_type

### 3. Tests (`src/components/CRM/__tests__/TaskForm.test.tsx`)

- **Actualizados todos los tests**:
  - `defaultEntityType="lead"` → `defaultEntityType="contacts"`
  - Expectativa de `entity_type: 'lead'` → `entity_type: 'contacts'`

## Impacto

### Componentes Afectados
1. **TaskForm**: Componente principal modificado
2. **CRMLeadDetail**: Actualizado para usar 'contacts' en lugar de 'leads'
3. **Tests**: Actualizados para reflejar los cambios

### Compatibilidad
- Las tareas existentes con `entity_type: 'leads'` se normalizan automáticamente a 'contacts' al cargarse en el formulario
- El sistema mantiene compatibilidad hacia atrás al normalizar 'leads' a 'contacts' en el estado inicial

### API
- No se requieren cambios en el backend
- El backend puede seguir recibiendo 'contacts' como entity_type (que es lo que ahora siempre se envía)

## Verificación

### Linting
✅ No hay errores de linting en los archivos modificados

### Archivos Modificados
1. `src/components/CRM/TaskForm.tsx`
2. `src/pages/CRMLeadDetail.tsx`
3. `src/components/CRM/__tests__/TaskForm.test.tsx`

### Archivos que NO requieren cambios
- `CRMOpportunityDetail.tsx`: Usa `entityType="leads"` para `PipelineActionsList`, no para `TaskForm`
- Otros componentes que usan `entity_type` en otros contextos (llamadas, notas, etc.) no se modificaron ya que el cambio es específico para tareas

## Notas Técnicas

1. **Normalización automática**: El formulario normaliza automáticamente cualquier tarea existente que tenga `entity_type: 'leads'` a 'contacts' al cargarse
2. **Default seguro**: Si no se especifica `defaultEntityType`, se usa 'contacts' por defecto
3. **Simplificación**: La lógica del componente es ahora más simple y mantenible al eliminar la complejidad de manejar dos tipos de entidades

## Fecha de Implementación
2025-01-27

