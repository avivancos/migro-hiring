# Eliminación de X-Admin-Password - Migración a JWT

## Resumen

Se eliminó completamente el uso de `X-Admin-Password` como método de autenticación en el frontend. Todos los endpoints ahora usan exclusivamente autenticación JWT mediante el interceptor de axios.

## Cambios Realizados

### 1. Servicios (`src/services/contractsService.ts`)

- **Eliminado**: Función `getAdminPasswordHeader()` que generaba el header `X-Admin-Password`
- **Actualizado**: Todos los métodos ahora usan solo JWT (agregado automáticamente por el interceptor de axios)
- **Métodos actualizados**:
  - `getContracts()` - Ahora usa solo JWT
  - `getContract()` - Ahora usa solo JWT
  - `getStripeBillingSummary()` - Intenta endpoint de cliente primero, luego admin (ambos con JWT)
  - `createStripeBillingPortalSession()` - Intenta endpoint de cliente primero, luego admin (ambos con JWT)
  - `createContract()` - Ahora usa solo JWT
  - `updateContract()` - Ahora usa solo JWT
  - `deleteContract()` - Ahora usa solo JWT
  - `expireContract()` - Ahora usa solo JWT

### 2. Interceptor de API (`src/services/api.ts`)

- **Eliminado**: Verificación de `X-Admin-Password` en el interceptor de requests
- **Resultado**: El interceptor ahora siempre agrega el token JWT cuando no es un endpoint público

### 3. Componentes Stripe

- **`StripeBillingSection.tsx`**: Ya usa `getStripeBillingSummary()` que ahora funciona con JWT
- **`ManageBillingButton.tsx`**: Ya usa `createStripeBillingPortalSession()` que ahora funciona con JWT
- **`ClientesBillingSection.tsx`**: Usa métodos específicos de cliente (`getClientStripeBillingSummary`, `createClientStripeBillingPortalSession`)

### 4. Portal de Clientes

- **`ClientesDashboard.tsx`**: Actualizado para usar `getClientContracts()` que usa JWT
- **Fallback**: Si `getClientContracts()` falla, intenta con búsqueda por email como respaldo

## Estrategia de Endpoints

### Endpoints de Cliente (`/clientes/contracts/...`)

- **Uso**: Específicos para el portal de clientes autenticados
- **Autenticación**: JWT del cliente autenticado
- **Métodos**:
  - `getClientStripeBillingSummary()` - Solo endpoint de cliente, sin fallback
  - `createClientStripeBillingPortalSession()` - Solo endpoint de cliente, sin fallback
  - `getClientContracts()` - Endpoint `/client/contracts` o `/me/contracts`

### Endpoints de Admin (`/admin/contracts/...`)

- **Uso**: Para administradores y operaciones internas
- **Autenticación**: JWT con permisos de admin
- **Métodos genéricos**: `getStripeBillingSummary()` y `createStripeBillingPortalSession()` intentan cliente primero, luego admin como fallback

## Backend - Requisitos

El backend debe:

1. **Aceptar solo JWT** en todos los endpoints que anteriormente aceptaban `X-Admin-Password`
2. **Validar permisos** mediante el JWT (roles de admin para endpoints `/admin/...`)
3. **Validar propiedad** en endpoints de cliente (asegurar que el contrato pertenece al usuario autenticado)

### Endpoints que deben migrar

- `GET /admin/contracts/` - Requiere JWT con rol admin
- `GET /admin/contracts/{code}` - Requiere JWT con rol admin
- `GET /admin/contracts/{code}/stripe/summary` - Requiere JWT con rol admin
- `POST /admin/contracts/{code}/stripe/portal` - Requiere JWT con rol admin
- `POST /admin/contracts/` - Requiere JWT con rol admin
- `PATCH /admin/contracts/{code}` - Requiere JWT con rol admin
- `DELETE /admin/contracts/{code}` - Requiere JWT con rol admin
- `POST /admin/contracts/{code}/expire` - Requiere JWT con rol admin

### Endpoints de Cliente (ya implementados)

- `GET /clientes/contracts/{code}/stripe/summary` - Requiere JWT del cliente, valida propiedad
- `POST /clientes/contracts/{code}/stripe/portal` - Requiere JWT del cliente, valida propiedad
- `GET /client/contracts` o `GET /me/contracts` - Requiere JWT del cliente

## Variables de Entorno

Ya no se requieren:
- `VITE_ADMIN_PASSWORD` - Eliminada del frontend

## Seguridad

### Ventajas de la migración

1. **Autenticación unificada**: Un solo método (JWT) para todos los endpoints
2. **Mejor seguridad**: JWT incluye expiración y puede ser revocado
3. **Roles y permisos**: El backend puede validar roles directamente del JWT
4. **Auditoría**: Más fácil rastrear quién hizo qué operación

### Consideraciones

- El backend debe validar que el usuario tiene permisos de admin para endpoints `/admin/...`
- El backend debe validar que el contrato pertenece al usuario para endpoints `/clientes/...`
- Los tokens JWT deben tener expiración adecuada
- Implementar refresh tokens para mantener sesiones activas

## Testing

### Verificar que funciona

1. **Admin Panel**: Verificar que los administradores pueden acceder a contratos y Stripe billing
2. **Client Portal**: Verificar que los clientes pueden ver su facturación
3. **Sin tokens**: Verificar que sin JWT válido, los endpoints retornan 401

### Endpoints a probar

- `GET /admin/contracts/` - Debe requerir JWT admin
- `GET /clientes/contracts/{code}/stripe/summary` - Debe requerir JWT del cliente
- `POST /clientes/contracts/{code}/stripe/portal` - Debe requerir JWT del cliente

## Notas

- Los métodos `getClientStripeBillingSummary()` y `createClientStripeBillingPortalSession()` son específicos para el portal de clientes y NO tienen fallback a admin
- Los métodos genéricos `getStripeBillingSummary()` y `createStripeBillingPortalSession()` intentan cliente primero, luego admin como fallback (útil para componentes compartidos)
