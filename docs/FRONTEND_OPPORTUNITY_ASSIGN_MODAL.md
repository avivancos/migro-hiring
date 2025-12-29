# Frontend: Modal de Asignación de Agente en Ficha de Oportunidad

**Fecha**: 2025-01-29  
**Módulo**: Frontend - CRM Opportunities  
**Prioridad**: 🟡 Media  
**Estado**: ✅ Implementado  
**Módulo**: Frontend - CRM Opportunities

---

## 📋 Resumen Ejecutivo

Se ha implementado un modal para modificar el agente asignado a una oportunidad desde la ficha de detalle. Esta funcionalidad está disponible **solo para administradores** y permite asignar o desasignar agentes (lawyers y agents) a oportunidades.

---

## 🎯 Objetivo

Permitir a los administradores modificar el agente asignado a una oportunidad directamente desde la ficha de detalle, sin necesidad de navegar a otras páginas o usar funcionalidades de asignación masiva.

---

## ✅ Funcionalidades Implementadas

### 1. Botón de Edición en Card de Responsable

- **Ubicación**: Card "Responsable" en el sidebar de la ficha de oportunidad
- **Visibilidad**: Solo visible para usuarios con permisos de administrador (`isAdmin`)
- **Estados**:
  - Si hay agente asignado: Muestra botón "Editar" en el header del card
  - Si no hay agente asignado: Muestra botón "Asignar Agente" dentro del contenido del card

### 2. Modal de Asignación

- **Título**: "Asignar Agente"
- **Tamaño**: Medio (`md`)
- **Contenido**:
  - Select con lista de usuarios disponibles (lawyers y agents)
  - Opción "Sin asignar" para desasignar el agente actual
  - Indicador de carga mientras se cargan los usuarios
  - Mensaje informativo: "Solo abogados y agentes pueden ser responsables"

### 3. Funcionalidades del Modal

- **Carga de usuarios**: Carga automática de usuarios activos cuando se abre el modal
- **Filtrado**: Solo muestra usuarios con rol `lawyer` o `agent`
- **Preselección**: Preselecciona el agente actual si existe
- **Asignación**: Permite asignar un nuevo agente o desasignar (seleccionando "Sin asignar")
- **Validación**: Botón "Guardar" deshabilitado mientras se está guardando

---

## 🔧 Implementación Técnica

### Archivos Modificados

**`src/pages/CRMOpportunityDetail.tsx`**

#### Imports Agregados

```typescript
import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Modal } from '@/components/common/Modal';
import { Label } from '@/components/ui/label';
import { crmService } from '@/services/crmService';
import type { CRMUser } from '@/types/crm';
```

#### Estados Agregados

```typescript
const { isAdmin } = useAuth();
const [showAssignModal, setShowAssignModal] = useState(false);
const [availableUsers, setAvailableUsers] = useState<CRMUser[]>([]);
const [loadingUsers, setLoadingUsers] = useState(false);
const [selectedUserId, setSelectedUserId] = useState<string>('');
```

#### Métodos del Hook

- `assign`: Para asignar un agente (usa `opportunityApi.assign`)
- `update`: Para desasignar un agente (usa `opportunityApi.update` con `assigned_to_id: undefined`)
- `isAssigning`: Estado de carga durante la asignación
- `isUpdating`: Estado de carga durante la actualización

#### Funciones Implementadas

1. **`loadUsers()`**: Carga usuarios activos del CRM y filtra por rol (lawyer/agent)
2. **`handleOpenAssignModal()`**: Abre el modal y preselecciona el agente actual
3. **`handleCloseAssignModal()`**: Cierra el modal y resetea el estado
4. **`handleAssignAgent()`**: Maneja la asignación o desasignación del agente

---

## 🎨 Interfaz de Usuario

### Card de Responsable (Sin Agente)

```
┌─────────────────────────────┐
│ Responsable          [Editar]│
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 👤                      │ │
│ │ Sin asignar             │ │
│ │ [Asignar Agente]        │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Card de Responsable (Con Agente)

```
┌─────────────────────────────┐
│ Responsable          [Editar]│
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 👤                      │ │
│ │ Asignado a              │ │
│ │ Juan Pérez              │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Modal de Asignación

```
┌─────────────────────────────────────┐
│ Asignar Agente                  [X] │
├─────────────────────────────────────┤
│                                     │
│ Seleccionar Agente                  │
│ ┌─────────────────────────────────┐ │
│ │ [Sin asignar              ▼]    │ │
│ │ Juan Pérez (Abogado)            │ │
│ │ María García (Agente)           │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Solo abogados y agentes pueden ser │
│ responsables                        │
│                                     │
├─────────────────────────────────────┤
│              [Cancelar] [Guardar]    │
└─────────────────────────────────────┘
```

---

## 🔐 Permisos y Seguridad

### Verificación de Permisos

- **Hook utilizado**: `useAuth()` de `@/providers/AuthProvider`
- **Propiedad**: `isAdmin`
- **Lógica**: `user.is_superuser || user.role === 'admin' || user.role === 'superuser'`

### Restricciones

- Solo usuarios con permisos de administrador pueden ver el botón de edición
- Solo se pueden asignar usuarios con rol `lawyer` o `agent`
- El modal no se muestra si el usuario no es administrador

---

## 📡 Integración con Backend

### Endpoints Utilizados

1. **Asignar Agente**: `POST /api/crm/opportunities/{id}/assign`
   - Body: `{ assigned_to_id: string }`
   - Usado cuando se selecciona un agente

2. **Desasignar Agente**: `PATCH /api/crm/opportunities/{id}`
   - Body: `{ assigned_to_id: undefined }`
   - Usado cuando se selecciona "Sin asignar"

3. **Obtener Usuarios**: `GET /api/crm/users?is_active=true`
   - Usado para cargar la lista de usuarios disponibles

### Invalidación de Cache

Después de asignar/desasignar, se invalidan automáticamente:
- `['opportunity', id]` - Datos de la oportunidad actual
- `['opportunities']` - Lista de oportunidades

---

## 🧪 Casos de Uso

### Caso 1: Asignar Agente a Oportunidad Sin Asignar

1. Usuario admin abre la ficha de una oportunidad sin agente asignado
2. Ve el botón "Asignar Agente" en el card de Responsable
3. Hace clic en el botón
4. Se abre el modal con la lista de usuarios
5. Selecciona un agente (ej: "Juan Pérez (Abogado)")
6. Hace clic en "Guardar"
7. La oportunidad se asigna al agente seleccionado
8. El card se actualiza mostrando el nuevo agente asignado

### Caso 2: Cambiar Agente Asignado

1. Usuario admin abre la ficha de una oportunidad con agente asignado
2. Ve el botón "Editar" en el header del card de Responsable
3. Hace clic en "Editar"
4. Se abre el modal con el agente actual preseleccionado
5. Selecciona un nuevo agente
6. Hace clic en "Guardar"
7. La oportunidad se reasigna al nuevo agente
8. El card se actualiza mostrando el nuevo agente

### Caso 3: Desasignar Agente

1. Usuario admin abre la ficha de una oportunidad con agente asignado
2. Hace clic en "Editar"
3. Se abre el modal con el agente actual preseleccionado
4. Selecciona "Sin asignar"
5. Hace clic en "Guardar"
6. La oportunidad se desasigna
7. El card se actualiza mostrando "Sin asignar"

### Caso 4: Usuario No Admin

1. Usuario no admin abre la ficha de una oportunidad
2. No ve el botón "Editar" ni "Asignar Agente"
3. Solo puede ver el agente asignado (si existe)

---

## ⚠️ Consideraciones

### 1. Carga de Usuarios

- Los usuarios se cargan solo cuando se abre el modal (no al cargar la página)
- Se filtran automáticamente para mostrar solo `lawyer` y `agent`
- Se muestra un spinner de carga mientras se obtienen los usuarios

### 2. Preselección

- Si la oportunidad tiene un agente asignado, se preselecciona en el select
- Si no tiene agente, el select muestra "Sin asignar" por defecto

### 3. Validación

- El botón "Guardar" se deshabilita durante la operación (asignación o actualización)
- No se requiere validación adicional ya que siempre hay una opción válida (incluso "Sin asignar")

### 4. Manejo de Errores

- Si falla la asignación, se muestra un alert con el error
- El modal permanece abierto para permitir reintentar

---

## 🔄 Flujo de Datos

```
Usuario Admin
    ↓
Clic en "Editar" o "Asignar Agente"
    ↓
Abrir Modal
    ↓
Cargar Usuarios (GET /api/crm/users)
    ↓
Mostrar Select con Usuarios
    ↓
Usuario Selecciona Agente
    ↓
Clic en "Guardar"
    ↓
Si selectedUserId existe:
    → POST /api/crm/opportunities/{id}/assign
Si selectedUserId está vacío:
    → PATCH /api/crm/opportunities/{id} (assigned_to_id: undefined)
    ↓
Invalidar Cache
    ↓
Actualizar UI
    ↓
Cerrar Modal
```

---

## 📝 Notas de Implementación

### Componentes Reutilizados

- **Modal**: `@/components/common/Modal` - Modal genérico con footer
- **Label**: `@/components/ui/label` - Etiqueta para el select
- **Button**: `@/components/ui/button` - Botones del modal
- **LoadingSpinner**: `@/components/common/LoadingSpinner` - Spinner de carga

### Hooks Utilizados

- **useAuth**: Para verificar permisos de administrador
- **useOpportunityDetail**: Para obtener datos de la oportunidad y métodos de asignación
- **useQueryClient**: Para invalidar cache después de asignar

### Servicios Utilizados

- **crmService.getUsers()**: Para obtener lista de usuarios del CRM
- **opportunityApi.assign()**: Para asignar agente
- **opportunityApi.update()**: Para desasignar agente

---

## ✅ Checklist de Implementación

- [x] Agregar botón de edición en el card de Responsable (solo para admins)
- [x] Crear modal para modificar agente asignado
- [x] Cargar lista de usuarios (lawyers y agents) para el select
- [x] Integrar con método assign del hook useOpportunityDetail
- [x] Integrar con método update para desasignar
- [x] Preseleccionar agente actual en el modal
- [x] Manejar estados de carga (loadingUsers, isAssigning, isUpdating)
- [x] Invalidar cache después de asignar/desasignar
- [x] Mostrar mensaje informativo sobre roles permitidos
- [x] Permitir desasignar agente (opción "Sin asignar")
- [x] Manejar errores con alerts
- [x] Verificar permisos de administrador

---

## 🚀 Próximas Mejoras (Opcional)

- [ ] Agregar búsqueda en el select de usuarios (si hay muchos)
- [ ] Mostrar información adicional del agente (email, teléfono) en el select
- [ ] Agregar confirmación antes de desasignar
- [ ] Mostrar historial de asignaciones
- [ ] Agregar notificación de éxito/error más elegante (toast)

---

**Última actualización**: 2025-01-29

