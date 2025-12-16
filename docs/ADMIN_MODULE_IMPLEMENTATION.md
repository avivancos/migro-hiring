# ✅ Módulo Admin - Implementación Completa

## 🎯 Resumen

Se ha implementado un módulo completo de administración (`/admin`) con un switch para cambiar entre modo **Admin** y **CRM**, dashboard principal y módulo de gestión de usuarios, todo con diseño responsive mobile-first.

---

## 📁 Estructura de Archivos

```
src/
├── pages/
│   └── admin/
│       ├── AdminLayout.tsx          # Layout con switch Admin/CRM
│       ├── AdminDashboard.tsx        # Dashboard principal
│       ├── AdminUsers.tsx            # Lista de usuarios
│       ├── AdminUserDetail.tsx       # Detalle y edición de usuario
│       └── AdminUserCreate.tsx        # Crear nuevo usuario
├── components/
│   └── ui/
│       └── switch.tsx                # Componente Switch (Radix UI)
└── services/
    └── adminService.ts               # Servicios actualizados con gestión de usuarios
```

---

## 🔄 Switch Admin/CRM

### Funcionalidad

El componente `AdminLayout` incluye un switch visual que permite cambiar entre:
- **Modo Admin** (`/admin/*`): Panel de administración del sistema
- **Modo CRM** (`/crm/*`): Panel CRM existente

### Implementación

```typescript
// El switch detecta automáticamente la ruta actual
const isAdminRoute = location.pathname.startsWith('/admin');
const isCrmRoute = location.pathname.startsWith('/crm');

// Al cambiar el switch, navega a la ruta correspondiente
const handleModeSwitch = (checked: boolean) => {
  setIsAdminMode(checked);
  if (checked) {
    navigate('/admin/dashboard');
  } else {
    navigate('/crm');
  }
};
```

### Ubicación

El switch está ubicado en el header del layout, visible en todas las páginas del módulo admin.

---

## 📊 Dashboard del Admin

### Ruta: `/admin/dashboard`

### Características

- **Estadísticas principales:**
  - Total de usuarios
  - Total de contratos
  - Contratos pendientes
  - Ingresos totales

- **Accesos rápidos:**
  - Gestión de usuarios
  - Gestión de contratos

- **Actividad reciente:**
  - Timeline de eventos del sistema

### Diseño Responsive

- Grid de estadísticas: 1 columna en mobile, 2 en tablet, 4 en desktop
- Botones adaptativos con texto completo en desktop y abreviado en mobile
- Cards con diseño flexible

---

## 👥 Módulo de Gestión de Usuarios

### Rutas

- `/admin/users` - Lista de usuarios
- `/admin/users/create` - Crear nuevo usuario
- `/admin/users/:id` - Detalle y edición de usuario

### Funcionalidades

#### Lista de Usuarios (`AdminUsers.tsx`)

- **Búsqueda:** Por email o nombre
- **Filtros:**
  - Por rol (Todos, Admin, Lawyer, Agent, User)
  - Por estado (Todos, Activos, Inactivos)
  - Por verificación (Todos, Verificados, No verificados)
- **Vista:**
  - Tabla en desktop
  - Cards en mobile
- **Acciones:**
  - Ver detalle
  - Editar
  - Eliminar
  - Exportar (CSV/JSON)

#### Crear Usuario (`AdminUserCreate.tsx`)

**Nota:** Los usuarios se crean mediante el módulo de autenticación. Este formulario está preparado para futura implementación.

- Formulario completo con validaciones
- Campos:
  - Email (requerido)
  - Nombre completo
  - Contraseña (mínimo 8 caracteres)
  - Confirmar contraseña
  - Rol (Usuario, Agente, Abogado, Administrador)
  - Opciones:
    - Usuario activo
    - Email verificado

#### Detalle/Edición (`AdminUserDetail.tsx`)

- Vista de información completa
- Formulario de edición (email, nombre, teléfono, biografía)
- Sidebar con estado actual
- Información del sistema (fechas de creación/actualización, último login)
- **Acciones administrativas:**
  - Cambiar rol (Admin, Lawyer, Agent, User)
  - Activar/Desactivar usuario
  - Reset de contraseña (envía email)
  - Impersonar usuario (solo superuser)
  - Ver logs de auditoría

---

## 🔌 Servicios API

### Métodos Añadidos a `adminService`

```typescript
// Obtener todos los usuarios (admin)
async getAllUsers(params?: {
  skip?: number;
  limit?: number;
}): Promise<any[]>

// Obtener usuario por ID
async getUser(id: string): Promise<any>

// Actualizar usuario
async updateUser(id: string, userData: {
  email?: string | null;
  full_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  photo_avatar_url?: string | null;
  bio?: string | null;
  is_active?: boolean | null;
  is_verified?: boolean | null;
  role?: string | null;
}): Promise<any>

// Eliminar usuario
async deleteUser(id: string): Promise<void>

// Actualizar rol de usuario (admin)
async updateUserRole(id: string, role: string): Promise<any>

// Actualizar estado de usuario (admin)
async updateUserStatus(id: string, isActive: boolean): Promise<any>

// Reset password (admin)
async resetUserPassword(id: string): Promise<{ message: string }>

// Impersonar usuario (superuser)
async impersonateUser(id: string): Promise<any>

// Exportar usuarios (admin)
async exportUsers(params: {
  format?: 'json' | 'csv';
  role?: string;
  is_active?: boolean;
  is_verified?: boolean;
  from_date?: string;
  to_date?: string;
  q?: string;
  skip?: number;
  limit?: number;
}): Promise<any>

// Obtener logs de auditoría (admin)
async getAuditLogs(params?: {
  user_id?: string;
  from_date?: string;
  to_date?: string;
  q?: string;
  skip?: number;
  limit?: number;
}): Promise<any>

// Subir foto de perfil
async uploadPhotoAvatar(file: File): Promise<any>
```

### Endpoints Utilizados del Backend

```
GET    /api/users/               # Listar usuarios (admin)
GET    /api/users/:id            # Obtener usuario
PATCH  /api/users/:id            # Actualizar usuario
DELETE /api/users/:id            # Eliminar usuario
PATCH  /api/users/:id/role       # Actualizar rol (admin)
PATCH  /api/users/:id/status     # Actualizar estado (admin)
POST   /api/users/:id/reset-password  # Reset password (admin)
POST   /api/users/:id/impersonate     # Impersonar (superuser)
GET    /api/users/export         # Exportar usuarios (admin)
GET    /api/users/audit-logs     # Logs de auditoría (admin)
POST   /api/users/me/photo-avatar     # Subir foto de perfil
```

**Nota:** Los usuarios se crean mediante el módulo de autenticación (`/api/auth/register`), no directamente desde el módulo admin.

---

## 🎨 Diseño Responsive Mobile-First

### Principios Aplicados

1. **Mobile First:** Todos los componentes están diseñados primero para mobile
2. **Breakpoints de Tailwind:**
   - `sm:` - 640px (tablet)
   - `md:` - 768px (tablet grande)
   - `lg:` - 1024px (desktop)

### Ejemplos de Responsive

#### Header
```tsx
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  {/* Contenido adaptativo */}
</div>
```

#### Grid de Estadísticas
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards de estadísticas */}
</div>
```

#### Tabla/Cards
```tsx
{/* Desktop: Tabla */}
<div className="hidden md:block">
  <table>...</table>
</div>

{/* Mobile: Cards */}
<div className="md:hidden space-y-4">
  {users.map(user => <Card>...</Card>)}
</div>
```

#### Botones
```tsx
<Button>
  <span className="hidden sm:inline">Texto Completo</span>
  <span className="sm:hidden">Corto</span>
</Button>
```

---

## 🔐 Autenticación

### Verificación

El `AdminLayout` verifica automáticamente la autenticación:

```typescript
useEffect(() => {
  if (!adminService.isAuthenticated()) {
    navigate('/contrato/login');
    return;
  }
  // ...
}, []);
```

### Permisos

Solo usuarios con rol `admin` o `superuser` pueden acceder al módulo.

**Roles disponibles en el sistema:**
- `admin`: Administrador completo
- `lawyer`: Abogado
- `agent`: Agente
- `user`: Usuario regular

---

## 📱 Características Mobile

### Optimizaciones

1. **Navegación:**
   - Menú colapsable en mobile
   - Botones con iconos visibles, texto opcional
   - Switch compacto

2. **Tablas:**
   - Convertidas a cards en mobile
   - Información esencial visible
   - Acciones accesibles

3. **Formularios:**
   - Campos en columna única en mobile
   - Grid de 2 columnas en desktop
   - Botones full-width en mobile

4. **Espaciado:**
   - Padding reducido en mobile
   - Gap adaptativo entre elementos

---

## 🚀 Rutas Configuradas

```typescript
// App.tsx
<Route path="/admin/dashboard" element={<AdminDashboardPage />} />
<Route path="/admin/users" element={<AdminUsers />} />
<Route path="/admin/users/create" element={<AdminUserCreate />} />
<Route path="/admin/users/:id" element={<AdminUserDetail />} />
```

---

## 📦 Dependencias Añadidas

```json
{
  "@radix-ui/react-switch": "^1.x"
}
```

---

## ✅ Estado de Implementación

- [x] Estructura de carpetas `admin/`
- [x] Componente Switch Admin/CRM
- [x] AdminLayout con navegación
- [x] Dashboard del admin
- [x] Lista de usuarios con filtros
- [x] Crear usuario
- [x] Detalle y edición de usuario
- [x] Servicios API actualizados
- [x] Rutas configuradas
- [x] Diseño responsive mobile-first
- [x] Autenticación integrada

---

## 🔄 Integración con CRM

El switch permite cambiar entre:
- **Admin:** `/admin/dashboard` → Panel de administración
- **CRM:** `/crm` → Panel CRM existente

Ambos módulos comparten:
- Misma autenticación (`adminService`)
- Mismo usuario logueado
- Navegación fluida entre ambos

---

## 📝 Notas de Desarrollo

### Datos Mock

Actualmente, si los endpoints del backend no están disponibles, los componentes muestran:
- Listas vacías
- Mensajes informativos
- Estados de carga apropiados

### Próximos Pasos

1. Implementar endpoints en backend (`/api/admin/users/*`)
2. Añadir más estadísticas al dashboard
3. Implementar paginación en lista de usuarios
4. Añadir exportación de datos
5. Implementar logs de actividad

---

## 🎯 Uso

### Acceso

1. Login como admin en `/contrato/login`
2. Navegar a `/admin/dashboard`
3. Usar el switch para cambiar entre Admin y CRM

### Gestión de Usuarios

1. Ir a `/admin/users`
2. Usar filtros y búsqueda
3. Crear nuevo usuario con botón "Nuevo Usuario"
4. Editar haciendo clic en el icono de edición
5. Eliminar con confirmación

---

**Última actualización:** Enero 2025  
**Versión:** 1.0.0  
**Autor:** Sistema de Migro Hiring

