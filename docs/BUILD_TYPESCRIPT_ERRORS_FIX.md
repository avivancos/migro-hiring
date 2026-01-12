# Corrección de Errores TypeScript en Build

## Fecha
2025-01-27

## Problema
Durante el build de Docker, se encontraron varios errores de TypeScript que impedían la compilación:

1. **Imports no utilizados**: El componente `Input` estaba importado pero no se usaba en varios archivos
2. **Prop incorrecta en Modal**: El componente `Modal` estaba recibiendo la prop `visible` en lugar de `open`

## Errores Encontrados

### 1. Imports No Utilizados (TS6133)
- `src/components/CRM/TaskForm.tsx(7,1)`: `Input` declarado pero nunca usado
- `src/components/pipelines/Wizards/Steps/ModifyResponsiblesStep.tsx(8,1)`: `Input` declarado pero nunca usado
- `src/pages/CRMContactDetail.tsx(7,1)`: `Input` declarado pero nunca usado

### 2. Prop Incorrecta en Modal (TS2322)
- `src/components/contracts/ContractAnnexes.tsx(223,9)`: Prop `visible` no existe en `ModalProps`
- `src/components/contracts/ContractAnnexes.tsx(275,9)`: Prop `visible` no existe en `ModalProps`
- `src/components/contracts/ContractAnnexes.tsx(324,9)`: Prop `visible` no existe en `ModalProps`

## Solución Implementada

### 1. Eliminación de Imports No Utilizados

#### `src/components/CRM/TaskForm.tsx`
```typescript
// Antes
import { Input } from '@/components/ui/input';

// Después
// Import eliminado (no se usaba)
```

#### `src/components/pipelines/Wizards/Steps/ModifyResponsiblesStep.tsx`
```typescript
// Antes
import { Input } from '@/components/ui/input';

// Después
// Import eliminado (no se usaba)
```

#### `src/pages/CRMContactDetail.tsx`
```typescript
// Antes
import { Input } from '@/components/ui/input';

// Después
// Import eliminado (no se usaba)
```

### 2. Corrección de Props en Modal

#### `src/components/contracts/ContractAnnexes.tsx`

**Modal Crear Anexo (línea 223):**
```typescript
// Antes
<Modal
  visible={showCreateModal}
  onClose={() => !saving && setShowCreateModal(false)}
  title="Crear Nuevo Anexo"
  size="lg"
>

// Después
<Modal
  open={showCreateModal}
  onClose={() => !saving && setShowCreateModal(false)}
  title="Crear Nuevo Anexo"
  size="lg"
>
```

**Modal Editar Anexo (línea 275):**
```typescript
// Antes
<Modal
  visible={showEditModal}
  onClose={() => !saving && setShowEditModal(false)}
  title="Editar Anexo"
  size="lg"
>

// Después
<Modal
  open={showEditModal}
  onClose={() => !saving && setShowEditModal(false)}
  title="Editar Anexo"
  size="lg"
>
```

**Modal Confirmar Eliminación (línea 324):**
```typescript
// Antes
<Modal
  visible={showDeleteModal}
  onClose={() => !saving && setShowDeleteModal(false)}
  title="Confirmar Eliminación"
  size="md"
>

// Después
<Modal
  open={showDeleteModal}
  onClose={() => !saving && setShowDeleteModal(false)}
  title="Confirmar Eliminación"
  size="md"
>
```

## Referencia del Componente Modal

El componente `Modal` en `src/components/common/Modal.tsx` define las siguientes props:

```typescript
interface ModalProps {
  open: boolean;           // ✅ Prop correcta (no 'visible')
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  footer?: ReactNode;
  className?: string;
}
```

## Verificación

Después de las correcciones, se verificó que:
- ✅ No hay errores de linting en los archivos modificados
- ✅ Los imports no utilizados fueron eliminados
- ✅ Todas las instancias de `visible` fueron cambiadas a `open`

## Archivos Modificados

1. `src/components/CRM/TaskForm.tsx`
2. `src/components/pipelines/Wizards/Steps/ModifyResponsiblesStep.tsx`
3. `src/pages/CRMContactDetail.tsx`
4. `src/components/contracts/ContractAnnexes.tsx`

## Notas

- El componente `Modal` usa la prop `open` siguiendo el estándar de componentes de UI modernos (similar a Radix UI, Headless UI, etc.)
- Los imports no utilizados pueden causar errores en builds estrictos de TypeScript
- Es importante mantener la consistencia en el uso de props entre componentes
