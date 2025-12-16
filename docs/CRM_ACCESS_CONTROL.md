# Control de Acceso al CRM

## 📋 Resumen

Se ha implementado un sistema de control de acceso granular que permite a usuarios tipo `lawyer`, `agent` y `admin` acceder al CRM. Los usuarios tipo `admin` tienen acceso tanto al panel de administración como al CRM.

## 🎯 Objetivo

- **Usuarios `lawyer`, `agent` y `admin`**: Pueden acceder al CRM
- **Usuarios `admin`**: Pueden acceder tanto al CRM como al panel de administración

## 🔧 Cambios Implementados

### 1. Componente `ProtectedRoute` (`src/components/auth/ProtectedRoute.tsx`)

Se agregó soporte para control de acceso basado en roles mediante el prop `allowedRoles`:

```tsx
interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: UserRole[];  // Nuevo prop
  redirectTo?: string;
}
```

**Funcionalidad:**
- Si se especifica `allowedRoles`, verifica que el usuario tenga uno de los roles permitidos
- Permite acceso si el rol del usuario está incluido en `allowedRoles`
- Mantiene compatibilidad con `requireAdmin` para rutas de administración

### 2. Rutas del CRM (`src/App.tsx`)

Todas las rutas del CRM ahora usan `allowedRoles={['lawyer', 'agent', 'admin']}` para permitir acceso a todos los roles autorizados:

- `/crm` - Dashboard principal
- `/crm/contacts` - Lista de contactos
- `/crm/contacts/:id` - Detalle de contacto
- `/crm/contacts/:id/edit` - Editar contacto
- `/crm/leads` - Lista de leads
- `/crm/leads/:id` - Detalle de lead
- `/crm/calendar` - Calendario de tareas
- `/crm/tasks/:id` - Detalle de tarea
- `/crm/actions` - Acciones
- `/crm/expedientes` - Expedientes
- `/crm/call` - Manejador de llamadas
- `/crm/settings` - Configuración
- `/crm/settings/task-templates` - Plantillas de tareas
- `/crm/settings/custom-fields` - Campos personalizados

**Ejemplo:**
```tsx
<Route
  path="/crm"
  element={
    <ProtectedRoute allowedRoles={['lawyer', 'agent', 'admin']}>
      <CRMDashboardPage />
    </ProtectedRoute>
  }
/>
```

### 3. Rutas de Administración (`src/App.tsx`)

Las rutas de administración mantienen `requireAdmin={true}`:

```tsx
<Route
  path="/admin"
  element={
    <ProtectedRoute requireAdmin>
      <AdminLayout />
    </ProtectedRoute>
  }
>
  {/* Rutas hijas */}
</Route>
```

### 4. Componente `CRMHeader` (`src/components/CRM/CRMHeader.tsx`)

**Cambios realizados:**
- El switch Admin/CRM solo se muestra si el usuario es admin (`isAdmin`)
- Se actualizó el texto del rol para mostrar correctamente "Abogado", "Agente" o "Administrador" según el rol del usuario

**Código relevante:**
```tsx
const { user, logout, isAdmin } = useAuth();

// Switch solo visible para admins
{isAdmin && (
  <div className="flex items-center gap-2...">
    {/* Switch Admin/CRM */}
  </div>
)}

// Texto del rol
<p className="text-[10px] md:text-xs text-gray-500">
  {user?.role === 'lawyer' ? 'Abogado' : 
   user?.role === 'agent' ? 'Agente' : 
   user?.role === 'admin' ? 'Administrador' : 
   'Usuario'}
</p>
```

## 🔐 Flujo de Autenticación

### Para usuarios `lawyer` y `agent`:

1. Inician sesión con sus credenciales
2. `AuthProvider` valida el token y obtiene el rol del usuario
3. Al intentar acceder a `/crm/*`:
   - `ProtectedRoute` verifica que el rol esté en `allowedRoles`
   - Si es `lawyer` o `agent` → Acceso permitido
4. Al intentar acceder a `/admin/*`:
   - `ProtectedRoute` verifica `requireAdmin`
   - Como no es admin → Acceso denegado

### Para usuarios `admin`:

1. Inician sesión con sus credenciales
2. `AuthProvider` valida el token y detecta que es admin
3. Al intentar acceder a `/crm/*`:
   - `ProtectedRoute` verifica que el rol esté en `allowedRoles`
   - Como `admin` está en `['lawyer', 'agent', 'admin']` → Acceso permitido
4. Al intentar acceder a `/admin/*`:
   - `ProtectedRoute` verifica `requireAdmin`
   - Como es admin → Acceso permitido

## 📝 Mensajes de Error

### Acceso Denegado para usuario sin rol permitido:
```
Acceso Denegado
No tienes permisos para acceder a esta sección
```

## ✅ Verificaciones de Seguridad

1. **Rutas protegidas**: Todas las rutas del CRM están protegidas con `ProtectedRoute`
2. **Verificación de roles**: Se verifica el rol del usuario contra los roles permitidos
3. **Control granular**: Solo usuarios con roles `lawyer`, `agent` o `admin` pueden acceder al CRM
4. **UI condicional**: El switch Admin/CRM solo se muestra a usuarios admin

## 🔄 Compatibilidad

- Se mantiene compatibilidad con el sistema anterior mediante `requireAdmin`
- Las rutas de admin siguen funcionando igual que antes
- No se requieren cambios en el backend

## 📚 Archivos Modificados

1. `src/components/auth/ProtectedRoute.tsx` - Agregado soporte para `allowedRoles`
2. `src/App.tsx` - Actualizadas todas las rutas del CRM
3. `src/components/CRM/CRMHeader.tsx` - Switch condicional y texto de rol

## 🧪 Pruebas Recomendadas

1. **Usuario `lawyer`**:
   - ✅ Debe poder acceder a todas las rutas `/crm/*`
   - ✅ No debe ver el switch Admin/CRM
   - ✅ No debe poder acceder a `/admin/*`

2. **Usuario `agent`**:
   - ✅ Debe poder acceder a todas las rutas `/crm/*`
   - ✅ No debe ver el switch Admin/CRM
   - ✅ No debe poder acceder a `/admin/*`

3. **Usuario `admin`**:
   - ✅ Debe poder acceder a todas las rutas `/admin/*`
   - ✅ Debe poder acceder a todas las rutas `/crm/*`
   - ✅ Debe ver el switch Admin/CRM para cambiar entre paneles

## 📅 Fecha de Implementación

Implementado: [Fecha actual]

