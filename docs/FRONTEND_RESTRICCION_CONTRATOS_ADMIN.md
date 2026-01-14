# Restricción de Acceso a Contratos - Solo Administradores

## Resumen
Se ha implementado una restricción para que solo los administradores puedan ver y acceder a la sección de contratos en el CRM. Los agentes y abogados ya no tienen acceso a esta funcionalidad.

**Nota**: Esta restricción se implementa mediante el **sistema dinámico de permisos de rutas**, lo que permite gestionar los permisos desde la interfaz de administración sin necesidad de cambios en el código.

## Cambios Implementados

### 1. Restricción de Ruta (`src/App.tsx`)
- La ruta `/crm/contracts` utiliza el sistema dinámico de permisos
- Se utiliza `ProtectedRoute` con `useDynamicPermissions={true}` para proteger el acceso

```typescript
<Route 
  path="contracts" 
  element={
    <ProtectedRoute useDynamicPermissions={true}>
      <LazyLoadWrapper fallback="spinner"><CRMContracts /></LazyLoadWrapper>
    </ProtectedRoute>
  } 
/>
```

### 2. Menú de Navegación (`src/components/CRM/CRMSidebar.tsx`)
- El enlace "Contratos" se oculta automáticamente para usuarios que no sean administradores
- Se agregó la propiedad `adminOnly: true` al elemento de navegación
- Se implementó filtrado dinámico basado en `isAdmin` del hook `useAuth()`

```typescript
const navigation = [
  // ... otros elementos
  { name: 'Contratos', href: '/crm/contracts', icon: DocumentCheckIcon, adminOnly: true },
  // ...
];

// Filtrado según permisos
const filteredNavigation = navigation.filter(item => {
  if (item.adminOnly && !isAdmin) {
    return false;
  }
  return true;
});
```

### 3. Dashboard del CRM (`src/pages/CRMDashboardPage.tsx`)
- **Tarjetas de estadísticas**: Las tarjetas "Contratos Totales" y "Últimos Contratos" solo se muestran para administradores
- **Sección completa de contratos**: La sección "Últimos Contratos" con la lista detallada solo es visible para administradores
- **Carga de datos**: Los contratos solo se cargan desde el backend si el usuario es administrador

#### Cambios específicos:
1. Uso de `isAdmin` del hook `useAuth()` en lugar de `!userIsAgent`
2. Condición de carga de datos:
   ```typescript
   isAdmin ? contractsService.getContracts(...) : Promise.resolve({ items: [], total: 0 })
   ```
3. Condiciones de renderizado:
   ```typescript
   {isAdmin && (
     // Tarjetas de estadísticas de contratos
   )}
   
   {isAdmin && (
     // Sección completa de últimos contratos
   )}
   ```

## Verificación de Permisos

El sistema utiliza el hook `useAuth()` que proporciona:
- `isAdmin`: Boolean que indica si el usuario es administrador
- Se calcula como: `user.is_superuser || user.role === 'admin' || user.role === 'superuser'`

## Impacto

### Para Administradores
- Acceso completo a la sección de contratos
- Visualización de estadísticas de contratos en el dashboard
- Lista de contratos recientes en el dashboard

### Para Agentes y Abogados
- El enlace "Contratos" no aparece en el menú de navegación
- Las estadísticas de contratos no se muestran en el dashboard
- La sección de contratos recientes está oculta
- Acceso denegado si intentan acceder directamente a `/crm/contracts`

### 4. Configuración de Permisos en Base de Datos (`src/services/localDatabase.ts`)
- La ruta `/crm/contracts` se registra automáticamente con `agent_allowed: false` y `lawyer_allowed: false`
- Para nuevas instalaciones, se crea con permisos restringidos desde el inicio
- Para instalaciones existentes, se actualiza automáticamente si aún tiene los valores por defecto
- Los administradores pueden gestionar estos permisos desde `/admin/route-permissions`

```typescript
{ path: '/crm/contracts', module: 'CRM', description: 'Contratos - Solo administradores', agent: false, lawyer: false }
```

## Archivos Modificados

1. `src/App.tsx` - Restricción de ruta mediante sistema dinámico
2. `src/components/CRM/CRMSidebar.tsx` - Filtrado de menú
3. `src/pages/CRMDashboardPage.tsx` - Ocultación de secciones y carga condicional
4. `src/services/localDatabase.ts` - Configuración de permisos por defecto

## Notas Técnicas

- La verificación de permisos se realiza mediante el **sistema dinámico de permisos de rutas**
- Los permisos se almacenan en la base de datos SQLite local
- Los administradores pueden modificar los permisos desde la interfaz de administración (`/admin/route-permissions`)
- Los datos de contratos no se cargan para usuarios no administradores, optimizando el rendimiento
- El sistema mantiene compatibilidad con la estructura existente de permisos
- Si un administrador modifica manualmente los permisos desde la interfaz, esos cambios se respetan y no se sobrescriben
