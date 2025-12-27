# Tabla de Oportunidades con Asignación Bulk de Agentes

**Fecha**: 2025-01-16  
**Estado**: ✅ Completado  
**Versión**: 1.0.0

---

## 📋 Resumen Ejecutivo

Se ha implementado una tabla de oportunidades en el panel de administración similar a la tabla de roles/usuarios, con funcionalidad para asignar agentes en bulk a múltiples oportunidades. Esta funcionalidad está disponible exclusivamente para administradores.

---

## 🎯 Objetivos

1. **Gestión Centralizada**: Proporcionar una vista tabular de todas las oportunidades del sistema
2. **Asignación Masiva**: Permitir asignar múltiples oportunidades a un agente en una sola operación
3. **Filtrado y Búsqueda**: Implementar filtros avanzados para encontrar oportunidades específicas
4. **Acceso Restringido**: Solo administradores pueden acceder y ejecutar asignaciones

---

## 🔐 Restricciones de Acceso

### Protección de Ruta

La página está protegida con `requireAdmin` en el router:

```tsx
<Route
  path="/admin/opportunities"
  element={
    <ProtectedRoute requireAdmin>
      <AdminOpportunities />
    </ProtectedRoute>
  }
/>
```

Solo usuarios con rol `admin` o `superuser` pueden acceder a esta página.

---

## 📁 Estructura de Archivos

```
src/
├── pages/
│   └── admin/
│       └── AdminOpportunities.tsx    ✅ Nueva página principal
├── components/
│   └── admin/
│       └── Sidebar.tsx                ✅ Actualizado con link
└── App.tsx                            ✅ Ruta agregada
```

---

## 🎨 Funcionalidades Implementadas

### 1. Tabla de Oportunidades

La tabla muestra las siguientes columnas:

- **Checkbox**: Para selección múltiple
- **Contacto**: Nombre y email del contacto asociado
- **Score**: Score de oportunidad (0-100) con colores:
  - Verde (≥70): Alta prioridad
  - Amarillo (50-69): Media prioridad
  - Rojo (<50): Baja prioridad
- **Estado**: Badge con el estado actual:
  - Pendiente
  - Asignada
  - Contactada
  - Convertida
  - Expirada
  - Perdida
- **Asignado a**: Nombre del agente asignado o "Sin asignar"
- **Fecha Detección**: Fecha en que se detectó la oportunidad
- **Acciones**: Botón para ver detalles

### 2. Selección Múltiple

- Checkbox individual por fila
- Checkbox en header para seleccionar/deseleccionar todas
- Visual feedback con fondo azul claro en filas seleccionadas
- Contador de oportunidades seleccionadas

### 3. Asignación Bulk

Cuando hay oportunidades seleccionadas, aparece un panel especial con:

- **Select de Agentes**: Lista de agentes, abogados y admins disponibles
- **Botón Asignar**: Ejecuta la asignación en bulk
- **Botón Cancelar**: Limpia la selección
- **Confirmación**: Dialog de confirmación antes de ejecutar

#### Proceso de Asignación

```typescript
const handleBulkAssign = async () => {
  // 1. Validaciones
  if (!bulkAgentId) return alert('Selecciona un agente');
  if (selectedIds.size === 0) return alert('Selecciona oportunidades');
  
  // 2. Confirmación
  if (!confirm(`Asignar ${selectedIds.size} oportunidad(es)?`)) return;
  
  // 3. Asignación paralela
  const promises = Array.from(selectedIds).map(id => 
    opportunityApi.assign(id, bulkAgentId)
  );
  await Promise.all(promises);
  
  // 4. Recarga y limpieza
  await loadOpportunities();
  setSelectedIds(new Set());
};
```

### 4. Filtros

#### Filtros Disponibles:

- **Búsqueda**: Por nombre, email, teléfono del contacto
- **Estado**: Filtrar por estado de oportunidad
- **Asignación**: 
  - Todas
  - Asignadas
  - Sin asignar

Los filtros se aplican localmente cuando el backend no los soporta directamente (ej: filtro por asignación).

### 5. Ordenamiento

Ordenamiento por columnas clicables:

- Contacto (nombre)
- Score
- Estado
- Asignado a
- Fecha Detección

Cada columna muestra un ícono indicando la dirección del ordenamiento:
- ↕️ Sin ordenar
- ↑ Orden ascendente
- ↓ Orden descendente

### 6. Paginación

- Control de resultados por página: 10, 20, 50, 100
- Navegación anterior/siguiente
- Indicador de página actual y total
- Contador de resultados mostrados

### 7. Vista Responsive

- **Desktop**: Tabla completa con todas las columnas
- **Mobile**: Cards individuales con información esencial
- Mantiene funcionalidad completa en ambos formatos

---

## 🔌 Integración con APIs

### Endpoints Utilizados

1. **Listar Oportunidades**:
   ```typescript
   GET /crm/opportunities?page=1&limit=20&status=pending&search=...
   ```

2. **Asignar Oportunidad** (usado en bulk):
   ```typescript
   POST /crm/opportunities/{id}/assign
   Body: { assigned_to_id: string }
   ```

3. **Obtener Usuarios/Agentes**:
   ```typescript
   GET /crm/users?is_active=true
   ```

### Servicios Utilizados

- `opportunityApi.list()`: Lista oportunidades con filtros
- `opportunityApi.assign()`: Asigna una oportunidad a un agente
- `crmService.getUsers()`: Obtiene lista de agentes disponibles

---

## 📊 Estructura de Datos

### LeadOpportunity

```typescript
interface LeadOpportunity {
  id: string;
  contact_id: string;
  contact?: KommoContact;
  detected_at: string;
  opportunity_score: number;
  priority?: 'high' | 'medium' | 'low';
  status: 'pending' | 'assigned' | 'contacted' | 'converted' | 'expired' | 'lost';
  assigned_to_id?: string;
  assigned_to?: CRMUser;
  pipeline_stage_id?: string;
  created_at: string;
  updated_at: string;
}
```

### OpportunityFilters

```typescript
interface OpportunityFilters {
  status?: 'pending' | 'assigned' | 'contacted' | 'converted' | 'expired' | 'lost';
  priority?: 'high' | 'medium' | 'low';
  assigned_to?: string;
  page?: number;
  limit?: number;
  search?: string;
  min_score?: number;
  max_score?: number;
}
```

---

## 🎯 Flujo de Usuario

### Asignación Bulk

1. Usuario navega a `/admin/opportunities`
2. Usuario busca/filtra oportunidades según necesidades
3. Usuario selecciona oportunidades usando checkboxes
4. Aparece panel de asignación bulk
5. Usuario selecciona agente del dropdown
6. Usuario hace clic en "Asignar"
7. Se muestra confirmación
8. Sistema ejecuta asignaciones en paralelo
9. Se recarga la tabla automáticamente
10. Se muestra mensaje de éxito

---

## 🔄 Manejo de Estados

### Estados Principales

- `loading`: Carga inicial de datos
- `assigning`: Proceso de asignación bulk en curso
- `selectedIds`: Set de IDs de oportunidades seleccionadas
- `bulkAgentId`: ID del agente seleccionado para asignación
- `opportunities`: Array de oportunidades actuales
- `agents`: Array de agentes disponibles

### Estados de UI

- Panel de asignación bulk: Visible cuando `selectedIds.size > 0`
- Botones deshabilitados durante `assigning`
- Loading spinner durante carga inicial
- Mensajes de confirmación y éxito

---

## 🎨 Componentes UI Utilizados

- `Card`, `CardHeader`, `CardTitle`, `CardContent`: Contenedores principales
- `Button`: Acciones y navegación
- `Input`: Búsqueda y filtros
- `Label`: Etiquetas de formularios
- `Badge`: Estados y scores
- `LoadingSpinner`: Estados de carga
- Íconos de `lucide-react`: Briefcase, Search, UserCheck, Filter, etc.

---

## 📱 Navegación

### En Sidebar

```tsx
{
  name: 'Oportunidades',
  href: '/admin/opportunities',
  icon: Briefcase
}
```

### Ruta Completa

```
/admin/opportunities
```

---

## ⚡ Optimizaciones

1. **Asignación Paralela**: Las asignaciones se ejecutan en paralelo usando `Promise.all()`
2. **Filtrado Local**: Filtros de asignación se aplican localmente para mejor UX
3. **Lazy Loading**: Componente cargado con lazy loading en App.tsx
4. **Debounce**: Búsqueda podría implementarse con debounce (futuro)

---

## 🐛 Manejo de Errores

### Validaciones

- Verificar que se seleccione un agente antes de asignar
- Verificar que se seleccionen oportunidades antes de asignar
- Confirmación antes de ejecutar asignación

### Manejo de Errores

```typescript
try {
  await Promise.all(promises);
  // Éxito
} catch (error) {
  console.error('Error asignando oportunidades:', error);
  alert('Error al asignar oportunidades. Por favor intenta de nuevo.');
}
```

---

## 🔮 Mejoras Futuras

1. **Endpoint Bulk Backend**: 
   - ⚠️ **Pendiente**: Implementar endpoint `POST /api/crm/opportunities/bulk-assign` en el backend
   - Ver documentación: `docs/BACKEND_OPPORTUNITIES_BULK_ASSIGN_ENDPOINT.md`
   - Actualmente el frontend usa múltiples llamadas individuales, pero está preparado para usar el endpoint batch cuando esté disponible
   - El método `opportunityApi.bulkAssign()` internamente usa llamadas individuales hasta que el endpoint esté listo
2. **Debounce en Búsqueda**: Implementar debounce para búsqueda en tiempo real
3. **Exportación**: Agregar funcionalidad de exportación a CSV/Excel
4. **Bulk Actions Adicionales**: 
   - Cambiar estado en bulk
   - Asignar pipeline stage en bulk
   - Eliminar en bulk
5. **Filtros Avanzados**:
   - Por score range
   - Por fecha de detección
   - Por pipeline stage
6. **Persistencia de Filtros**: Guardar filtros en URL params
7. **Búsqueda Global**: Búsqueda más robusta en todos los campos

---

## ✅ Checklist de Implementación

- [x] Crear componente `AdminOpportunities.tsx`
- [x] Implementar tabla con columnas principales
- [x] Implementar selección múltiple
- [x] Implementar asignación bulk
- [x] Agregar filtros básicos
- [x] Agregar ordenamiento por columnas
- [x] Implementar paginación
- [x] Vista responsive (mobile/desktop)
- [x] Agregar ruta en `App.tsx`
- [x] Agregar link en `Sidebar.tsx`
- [x] Protección de ruta (solo admins)
- [x] Manejo de errores
- [x] Estados de loading
- [x] Documentación

---

## 📝 Notas Técnicas

### Filtrado Local vs Backend

Actualmente, algunos filtros (como "asignadas" vs "sin asignar") se aplican localmente después de obtener los datos del backend. Idealmente, el backend debería soportar estos filtros directamente para mejor rendimiento con grandes volúmenes de datos.

### Asignación Individual vs Bulk

**Estado Actual:**
- El frontend usa el método `opportunityApi.bulkAssign()` que internamente hace múltiples llamadas individuales al endpoint `/assign`
- Esto funciona correctamente pero no es óptimo para grandes volúmenes

**Mejora Pendiente:**
- Implementar endpoint batch en el backend: `POST /api/crm/opportunities/bulk-assign`
- Ver instrucciones completas en: `docs/BACKEND_OPPORTUNITIES_BULK_ASSIGN_ENDPOINT.md`
- Una vez implementado, el frontend solo necesita descomentar el código del endpoint batch en `opportunityApi.ts`

**Beneficios del Endpoint Batch:**
- Mejor rendimiento (una sola request HTTP)
- Transacción atómica en base de datos
- Menor carga en el servidor
- Mejor escalabilidad para grandes volúmenes

---

## 🚀 Uso

### Para Administradores

1. Iniciar sesión como administrador
2. Navegar a `/admin/opportunities`
3. Usar filtros y búsqueda para encontrar oportunidades
4. Seleccionar oportunidades deseadas
5. Seleccionar agente del dropdown
6. Hacer clic en "Asignar"
7. Confirmar la acción
8. Las oportunidades serán asignadas y la tabla se actualizará automáticamente

---

**Implementado por**: Sistema de Desarrollo  
**Revisado por**: -  
**Aprobado por**: -

