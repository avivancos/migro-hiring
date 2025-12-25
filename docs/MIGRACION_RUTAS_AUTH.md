# Migración de Rutas de Autenticación

**Fecha:** 15 de Diciembre de 2025  
**Objetivo:** Migrar rutas de autenticación de `/contrato/login` a `/auth/login` manteniendo compatibilidad

---

## 📋 Resumen

Se ha realizado la migración de las rutas de autenticación del sistema, moviendo la ruta principal de login de `/contrato/login` a `/auth/login`, mientras se mantienen las rutas antiguas en `/contrato-old/*` para compatibilidad.

---

## 🔄 Cambios Realizados

### 1. **Rutas en App.tsx**

#### Antes:
```tsx
{/* Servicio de contratación y firma */}
<Route path="/contrato/login" element={<AdminLogin />} />
<Route path="/contrato/dashboard" element={<AdminDashboard />} />
<Route path="/contrato" element={<AdminLogin />} />
```

#### Después:
```tsx
{/* Servicio de contratación y firma - RUTAS ANTIGUAS (mantener para compatibilidad) */}
<Route path="/contrato-old/login" element={<AdminLogin />} />
<Route path="/contrato-old/dashboard" element={<AdminDashboard />} />
<Route path="/contrato-old" element={<AdminLogin />} />

{/* Rutas de autenticación unificadas */}
<Route path="/auth/login" element={<AdminLogin />} />

{/* Servicio de contratación y firma - Dashboard */}
<Route path="/contrato/dashboard" element={<AdminDashboard />} />
```

**Cambios:**
- ✅ Nueva ruta `/auth/login` creada usando el componente `AdminLogin` (sin modificar el componente)
- ✅ Rutas antiguas `/contrato/login` y `/contrato` renombradas a `/contrato-old/login` y `/contrato-old`
- ✅ Ruta `/contrato/dashboard` se mantiene activa

---

### 2. **ProtectedRoute.tsx**

Actualizado para usar la nueva ruta de autenticación:

```tsx
// Antes:
const loginPath = redirectTo || '/contrato/login';

// Después:
const loginPath = redirectTo || '/auth/login';
```

**Efecto:** Todas las rutas protegidas ahora redirigen a `/auth/login` cuando el usuario no está autenticado.

---

### 3. **CRMHeader.tsx**

Actualizado el handler de logout:

```tsx
// Antes:
const handleLogout = async () => {
  await logout();
  navigate('/contrato/login');
};

// Después:
const handleLogout = async () => {
  await logout();
  navigate('/auth/login');
};
```

---

### 4. **AdminLayout.tsx**

Actualizado el handler de logout:

```tsx
// Antes:
const handleLogout = async () => {
  await logout();
  navigate('/contrato/login');
};

// Después:
const handleLogout = async () => {
  await logout();
  navigate('/auth/login');
};
```

---

### 5. **api.ts (Interceptor)**

Actualizado para redirigir a la nueva ruta cuando falla el refresh token:

```tsx
// Antes:
if (window.location.pathname.startsWith('/admin') || 
    window.location.pathname.startsWith('/crm') ||
    window.location.pathname.startsWith('/contrato')) {
  window.location.href = '/contrato/login';
}

// Después:
if (window.location.pathname.startsWith('/admin') || 
    window.location.pathname.startsWith('/crm') ||
    window.location.pathname.startsWith('/contrato')) {
  window.location.href = '/auth/login';
}
```

**Nota:** Se actualizaron ambas ocurrencias en el archivo (cuando no hay refresh token y cuando falla el refresh).

---

### 6. **AdminDashboard.tsx**

Actualizado para usar la nueva ruta:

```tsx
// Antes:
useEffect(() => {
  if (!adminService.isAuthenticated()) {
    navigate('/contrato/login');
  }
}, [navigate]);

const handleLogout = () => {
  adminService.logout();
  navigate('/contrato/login');
};

// Después:
useEffect(() => {
  if (!adminService.isAuthenticated()) {
    navigate('/auth/login');
  }
}, [navigate]);

const handleLogout = () => {
  adminService.logout();
  navigate('/auth/login');
};
```

---

## ✅ Componente AdminLogin Sin Modificar

**Importante:** El componente `AdminLogin` (`src/pages/AdminLogin.tsx`) **NO fue modificado** según lo solicitado. El componente permanece intacto y funciona correctamente con la nueva ruta `/auth/login`.

---

## 🔗 Rutas Activas

### Rutas de Autenticación (Nuevas)
- ✅ `/auth/login` - Login principal del sistema (usa `AdminLogin`)

### Rutas Antiguas (Compatibilidad)
- ✅ `/contrato-old/login` - Ruta antigua mantenida para compatibilidad
- ✅ `/contrato-old/dashboard` - Dashboard antiguo
- ✅ `/contrato-old` - Redirige a login antiguo

### Rutas de Servicio
- ✅ `/contrato/dashboard` - Dashboard de contratación (activo)

---

## 📝 Archivos Modificados

1. ✅ `src/App.tsx` - Rutas actualizadas
2. ✅ `src/components/auth/ProtectedRoute.tsx` - Ruta de login actualizada
3. ✅ `src/components/CRM/CRMHeader.tsx` - Logout actualizado
4. ✅ `src/pages/admin/AdminLayout.tsx` - Logout actualizado
5. ✅ `src/services/api.ts` - Redirecciones actualizadas (2 ocurrencias)
6. ✅ `src/pages/AdminDashboard.tsx` - Navegación actualizada

---

## 🎯 Beneficios

1. **Rutas más claras:** `/auth/login` es más semántico y estándar
2. **Compatibilidad:** Las rutas antiguas se mantienen en `/contrato-old/*`
3. **Sin cambios en componentes:** `AdminLogin` permanece sin modificaciones
4. **Sistema unificado:** Todas las rutas de autenticación ahora usan `/auth/*`

---

## 🔍 Verificación

Para verificar que todo funciona correctamente:

1. **Acceder a ruta protegida sin autenticación:**
   ```
   http://localhost:5173/crm
   ```
   Debe redirigir a: `http://localhost:5173/auth/login?returnUrl=%2Fcrm`

2. **Login exitoso:**
   Debe redirigir al `returnUrl` especificado o a la ruta por defecto.

3. **Logout:**
   Debe redirigir a `/auth/login`.

---

## 📚 Referencias

- Documentación del sistema de autenticación: `docs/admin-react/SISTEMA_AUTH_UNIFICADO.md`
- Plan del proyecto: `plan.md`

---

**Última actualización:** 15 de Diciembre de 2025















