# 🎯 Wizard de Modificación de Pipeline - Mobile First

**Fecha**: 2025-12-25  
**Versión**: 1.0  
**Estado**: ✅ Implementación Completa  
**Diseño**: Mobile-First con Usabilidad Simple

---

## 📋 Resumen

Implementación completa del wizard de modificación de pipeline con diseño mobile-first y máxima simplicidad para que cualquier usuario pueda usarlo fácilmente.

---

## 🎨 Principios de Diseño

### Mobile-First
- **Botones grandes**: Mínimo 44px de altura (estándar de accesibilidad)
- **Texto legible**: Tamaño mínimo de 16px en móviles
- **Espaciado generoso**: Márgenes y padding amplios para facilitar el toque
- **Navegación clara**: Botones de navegación siempre visibles y accesibles
- **Progreso visual**: Barra de progreso clara en cada paso

### Simplicidad
- **Mensajes claros**: Texto directo y sin jerga técnica
- **Iconos descriptivos**: Iconos que ayudan a entender la acción
- **Feedback inmediato**: Confirmaciones visuales de acciones
- **Flujo intuitivo**: Pasos lógicos y secuenciales
- **Ayuda contextual**: Información relevante visible en cada paso

---

## 📁 Estructura de Componentes

```
src/components/pipelines/Wizards/
├── PipelineModifyWizard.tsx          # Componente principal del wizard
└── Steps/
    ├── PipelineOverviewStep.tsx      # Paso 1: Vista general
    ├── AvailableActionsStep.tsx      # Paso 2: Acciones disponibles
    ├── ModifyResponsiblesStep.tsx    # Paso 3: Modificar responsables
    └── ReviewChangesStep.tsx         # Paso 4: Revisar cambios
```

---

## 🔧 Componentes Principales

### PipelineModifyWizard

Componente principal que orquesta todo el wizard.

**Características:**
- Barra de progreso móvil visible
- Navegación entre pasos
- Carga de datos del pipeline
- Gestión de cambios del wizard
- Callbacks de completado y cancelación

**Props:**
```typescript
interface PipelineModifyWizardProps {
  entityType: EntityType;
  entityId: string;
  onComplete?: (changes: WizardChanges) => void;
  onCancel?: () => void;
}
```

**Uso:**
```tsx
<PipelineModifyWizard
  entityType="leads"
  entityId="123"
  onComplete={(changes) => {
    // Guardar cambios
  }}
  onCancel={() => {
    // Cancelar wizard
  }}
/>
```

---

### Paso 1: PipelineOverviewStep

Vista general del pipeline con información del caso y etapas.

**Características:**
- Información del contacto/oportunidad
- Visualización de etapas del pipeline (vertical en móvil)
- Lista de acciones actuales
- Botón grande para continuar

**Elementos visuales:**
- Cards con información clara
- Indicadores de etapa (completada, actual, pendiente)
- Badges de estado de acciones
- Timeline vertical en móvil

---

### Paso 2: AvailableActionsStep

Selección de acciones disponibles según el rol del usuario.

**Características:**
- Filtrado automático por rol
- Separación entre acciones requeridas y opcionales
- Acciones de otros roles bloqueadas (visualmente)
- Selección múltiple con feedback visual
- Información de validación y plazos

**Elementos visuales:**
- Cards de acción con estado de selección
- Badges de "Requerida" para acciones obligatorias
- Iconos de bloqueo para acciones no disponibles
- Checkboxes grandes y fáciles de tocar

---

### Paso 3: ModifyResponsiblesStep

Configuración de responsables, fechas y prioridades.

**Características:**
- Selector de responsable (carga usuarios del CRM)
- Date picker para fecha límite
- Selector de prioridad (botones grandes)
- Campo de notas (textarea)
- Indicador de acción actual (si hay múltiples)
- Navegación entre acciones múltiples

**Elementos visuales:**
- Inputs grandes (44px mínimo)
- Labels con iconos descriptivos
- Botones de prioridad en grid 2x2
- Barra de progreso de acciones múltiples
- Valores por defecto claros

---

### Paso 4: ReviewChangesStep

Revisión y confirmación de cambios.

**Características:**
- Resumen visual de todos los cambios
- Información detallada de cada acción
- Advertencia antes de confirmar
- Botones de acción claros

**Elementos visuales:**
- Cards con información estructurada
- Iconos descriptivos (usuario, calendario, bandera)
- Badges de prioridad con colores
- Botón de confirmación destacado
- Mensaje de advertencia visible

---

## 🛠️ Utilidades

### pipelineDecisionTree.ts

Utilidades para el árbol de decisiones del pipeline.

**Funciones principales:**
- `getNextActions()`: Obtiene acciones disponibles según etapa y rol
- `getNextStage()`: Calcula el siguiente stage según acción completada
- `isActionRequired()`: Verifica si una acción es requerida

**Uso:**
```typescript
import { getNextActions } from '@/utils/pipelineDecisionTree';

const actions = getNextActions(
  'agent_initial',
  completedActions,
  'agent',
  actionTypes
);
```

---

## 🎣 Hooks

### useCRMUsers

Hook para obtener usuarios del CRM.

**Características:**
- Caché automático
- Filtrado por rol y estado activo
- Manejo de errores
- Loading state

**Uso:**
```typescript
const { users, loading, error } = useCRMUsers({
  role: 'lawyer',
  isActive: true
});
```

---

## 📱 Responsive Design

### Móvil (< 768px)
- Layout vertical
- Botones de ancho completo
- Cards apiladas
- Timeline vertical
- Barra de progreso superior

### Tablet (768px - 1024px)
- Layout híbrido
- Botones en fila cuando es posible
- Cards en grid 2 columnas
- Timeline horizontal

### Desktop (> 1024px)
- Layout horizontal
- Navegación lateral
- Cards en grid múltiple
- Timeline horizontal completo
- Indicadores de paso en footer

---

## 🎨 Paleta de Colores

### Estados
- **Completado**: Verde (`text-green-600`, `bg-green-50`)
- **Actual**: Azul (`text-blue-600`, `bg-blue-50`)
- **Pendiente**: Gris (`text-gray-400`, `bg-gray-50`)
- **Requerido**: Verde (`border-green-600`)
- **Seleccionado**: Azul (`border-blue-600`)

### Prioridades
- **Baja**: Info (azul claro)
- **Media**: Success (verde)
- **Alta**: Warning (amarillo)
- **Urgente**: Error (rojo)

---

## ♿ Accesibilidad

### Características Implementadas
- **Botones grandes**: Mínimo 44x44px (WCAG 2.1)
- **Contraste adecuado**: Ratio mínimo 4.5:1
- **Labels descriptivos**: Todos los inputs tienen labels
- **Feedback visual**: Estados claros (hover, focus, active)
- **Navegación por teclado**: Tab order lógico
- **ARIA labels**: En elementos interactivos

### Mejoras Futuras
- [ ] Soporte para lectores de pantalla
- [ ] Modo de alto contraste
- [ ] Tamaño de fuente ajustable
- [ ] Animaciones reducidas (prefers-reduced-motion)

---

## 🔄 Flujo de Datos

```
PipelineModifyWizard
  ├─ Carga datos iniciales
  │  ├─ pipelineApi.getStage()
  │  ├─ pipelineApi.listActions()
  │  └─ pipelineApi.getActionTypes()
  │
  ├─ Paso 1: Vista general
  │  └─ Muestra información sin cambios
  │
  ├─ Paso 2: Selección de acciones
  │  └─ Actualiza changes.actions[]
  │
  ├─ Paso 3: Configuración
  │  └─ Actualiza changes.actions[].config
  │
  └─ Paso 4: Confirmación
     └─ onComplete(changes) → Guardar en backend
```

---

## 📝 Integración con Backend

### Endpoints Utilizados

1. **GET /api/pipelines/stages/{entity_type}/{entity_id}**
   - Obtiene el stage actual del pipeline

2. **GET /api/pipelines/actions/{entity_type}/{entity_id}**
   - Lista las acciones existentes

3. **GET /api/pipelines/action-types**
   - Obtiene los tipos de acción disponibles

4. **GET /api/crm/users**
   - Obtiene usuarios para asignar responsables

5. **POST /api/pipelines/actions**
   - Crea nuevas acciones (al confirmar)

---

## 🧪 Testing

### Casos de Prueba Recomendados

1. **Flujo completo**
   - Crear wizard → Seleccionar acciones → Configurar → Confirmar

2. **Navegación**
   - Avanzar y retroceder entre pasos
   - Cancelar wizard

3. **Validaciones**
   - Acciones requeridas no se pueden deseleccionar
   - Fecha límite no puede ser en el pasado
   - Responsable es requerido para acciones con validación

4. **Responsive**
   - Verificar en móvil, tablet y desktop
   - Verificar que los botones sean táctiles

5. **Carga de datos**
   - Manejo de errores de red
   - Loading states
   - Datos vacíos

---

## 🚀 Uso en Producción

### Ejemplo Completo

```tsx
import { PipelineModifyWizard } from '@/components/pipelines/Wizards/PipelineModifyWizard';
import { pipelineApi } from '@/services/pipelineApi';

function PipelineDetailPage({ entityId }: { entityId: string }) {
  const handleComplete = async (changes: WizardChanges) => {
    try {
      // Crear acciones en el backend
      for (const action of changes.actions) {
        await pipelineApi.createAction({
          pipeline_stage_id: stageId,
          action_type: action.actionType,
          responsible_for_validation_id: action.responsibleId,
          action_data: {
            due_date: action.dueDate,
            priority: action.priority,
            notes: action.notes,
          },
        });
      }
      // Mostrar éxito
      toast.success('Acciones creadas correctamente');
    } catch (error) {
      toast.error('Error al crear acciones');
    }
  };

  return (
    <PipelineModifyWizard
      entityType="leads"
      entityId={entityId}
      onComplete={handleComplete}
      onCancel={() => navigate(-1)}
    />
  );
}
```

---

## 📚 Referencias

- [Diseño del Wizard](./WIZARD_PIPELINE_DESIGN.md)
- [Sistema de Pipelines](./PIPELINE_SYSTEM_COMPLETE.md)
- [Guía Frontend](./FRONTEND_PILI_PIPELINE_INTEGRATION_GUIDE.md)

---

## ✅ Checklist de Implementación

- [x] Componente principal PipelineModifyWizard
- [x] Paso 1: PipelineOverviewStep
- [x] Paso 2: AvailableActionsStep
- [x] Paso 3: ModifyResponsiblesStep
- [x] Paso 4: ReviewChangesStep
- [x] Utilidades de árbol de decisiones
- [x] Hook useCRMUsers
- [x] Integración con servicios API
- [x] Diseño mobile-first
- [x] Responsive design
- [x] Documentación

---

**Última Actualización**: 2025-12-25  
**Mantenido por**: Equipo de Desarrollo Migro






