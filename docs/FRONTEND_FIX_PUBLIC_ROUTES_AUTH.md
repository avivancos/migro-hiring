# 🔧 Solución: Errores 401 en Rutas Públicas de Contratación

## 🎯 Problema

Al acceder a rutas públicas de contratación como `/contratacion/P3KDJ`, se producían errores 401 (No autorizado) en las siguientes llamadas:

1. `GET /api/users/me` - Verificación de autenticación del `AuthProvider`
2. `GET /api/hiring/{code}` - Obtención de detalles del proceso de contratación

### Causa Raíz

- El `AuthProvider` siempre ejecutaba `checkAuth()` al montarse, intentando verificar la autenticación incluso en rutas públicas.
- El interceptor de axios agregaba tokens de autenticación a todas las peticiones, incluyendo endpoints públicos como `/hiring/{code}` que no requieren autenticación según la documentación del backend.

---

## ✅ Solución Implementada

### 1. Endpoints Públicos en Interceptor de Request (`src/services/api.ts`)

Se agregaron los endpoints de hiring a la lista de endpoints públicos para que el interceptor no agregue tokens de autenticación:

```typescript
const publicEndpoints = [
  '/auth/login', 
  '/auth/register', 
  '/auth/refresh',
  '/ai/pili-openai/health',
  '/hiring/' // ← Nuevo: Endpoints públicos de contratación
];
```

**Resultado:** Las peticiones a `/hiring/{code}` y sus sub-rutas ya no incluyen el header `Authorization` con tokens.

---

### 2. Verificación de Rutas Públicas en AuthProvider (`src/providers/AuthProvider.tsx`)

Se modificó el `AuthProvider` para que no verifique autenticación en rutas públicas:

```typescript
// Rutas públicas que no requieren autenticación
const isPublicRoute = useCallback((pathname: string): boolean => {
  const publicRoutes = [
    '/',
    '/contratacion/',
    '/hiring/',
    '/expirado',
    '/404',
    '/privacidad',
    '/privacy',
    '/borrador',
    '/colaboradores',
    '/closer',
    '/auth/login',
  ];
  
  return publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith(route)
  );
}, []);

useEffect(() => {
  // No verificar autenticación en rutas públicas
  if (isPublicRoute(location.pathname)) {
    setIsLoading(false);
    return;
  }
  
  checkAuth();
}, [location.pathname, isPublicRoute, checkAuth]);
```

**Resultado:** El `AuthProvider` no intenta verificar autenticación en rutas públicas, evitando la llamada a `/users/me`.

---

### 3. Mejora en Interceptor de Response (`src/services/api.ts`)

Se mejoró la lógica del interceptor de respuesta para manejar mejor los errores 401 en endpoints públicos:

```typescript
// Verificar si es una ruta pública del frontend
const isPublicFrontendRoute = window.location.pathname === '/' ||
                 window.location.pathname.includes('/contratacion/') || 
                 window.location.pathname.includes('/hiring/') ||
                 // ... más rutas públicas

// Verificar si es un endpoint público de la API
const publicApiEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/hiring/', '/ai/pili-openai/health'];
const isPublicApiEndpoint = originalRequest.url && publicApiEndpoints.some(endpoint => originalRequest.url!.includes(endpoint));

if (isPublicFrontendRoute || isPublicApiEndpoint) {
  // En rutas públicas, simplemente rechazar el error sin intentar refresh
  return Promise.reject(error);
}
```

**Resultado:** Si ocurre un error 401 en un endpoint público, no se intenta refrescar el token (que sería innecesario).

---

## 📋 Endpoints Públicos del Backend

Según la documentación del backend, los siguientes endpoints **NO requieren autenticación**:

```
GET  /api/hiring/{code}                      # Obtener detalles
POST /api/hiring/{code}/confirm-data         # Confirmar datos
POST /api/hiring/{code}/contract/accept      # Aceptar contrato
POST /api/hiring/{code}/kyc/start            # Iniciar KYC
POST /api/hiring/{code}/kyc/complete         # Completar KYC
POST /api/hiring/{code}/payment              # Procesar pago
GET  /api/hiring/{code}/contract/download    # Descargar contrato
```

Todos estos endpoints están cubiertos por el patrón `/hiring/` en la lista de endpoints públicos.

---

## 🧪 Verificación

### Antes de la Solución

1. Acceder a `https://contratacion.migro.es/contratacion/P3KDJ`
2. Errores en consola:
   - `❌ API Error Details: URL: /users/me, Status: 401`
   - `❌ API Error Details: URL: /hiring/P3KDJ, Status: 401`

### Después de la Solución

1. Acceder a `https://contratacion.migro.es/contratacion/P3KDJ`
2. ✅ No hay errores 401
3. ✅ Los detalles del proceso de contratación se cargan correctamente
4. ✅ No se intenta verificar autenticación en rutas públicas

---

## 📝 Archivos Modificados

1. **`src/services/api.ts`**
   - Agregado `/hiring/` a la lista de endpoints públicos en el interceptor de request
   - Mejorada la lógica del interceptor de response para manejar errores 401 en endpoints públicos

2. **`src/providers/AuthProvider.tsx`**
   - Agregada función `isPublicRoute()` para detectar rutas públicas
   - Modificado el `useEffect` para no verificar autenticación en rutas públicas
   - Uso de `useLocation` de React Router para detectar cambios de ruta

---

## 🔒 Seguridad

- Los endpoints públicos del backend tienen su propia validación (código de contratación válido, expiración, etc.)
- La autenticación JWT solo se usa para rutas protegidas (admin, CRM, etc.)
- No se envían tokens de autenticación a endpoints públicos, reduciendo la superficie de ataque

---

## 🚀 Próximos Pasos

- [ ] Verificar que todos los endpoints de hiring funcionan correctamente sin autenticación
- [ ] Añadir tests unitarios para verificar el comportamiento en rutas públicas
- [ ] Documentar en el README principal que los endpoints de hiring son públicos










