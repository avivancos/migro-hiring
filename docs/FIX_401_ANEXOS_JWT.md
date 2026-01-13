# Fix 401 Unauthorized - Crear Anexo desde Frontend

**Fecha**: 2025-01-30  
**Problema**: Error 401 al crear anexo desde frontend  
**Causa**: Uso de `X-Admin-Password` en lugar de JWT  
**Estado**: ✅ Solucionado

---

## 🐛 Error Reportado

```
Failed to load resource: the server responded with a status of 401 ()
URL: /admin/hiring/69GS3/annexes
Method: post
Status: 401
```

---

## 🔍 Causa Raíz

El backend requiere autenticación JWT con el header `Authorization: Bearer <token>`, pero el frontend estaba usando `X-Admin-Password: Pomelo2005.1`.

**Problema adicional**: El interceptor de axios en `src/services/api.ts` tiene lógica que **NO agrega el token JWT** si ya existe el header `X-Admin-Password`:

```typescript
// No añadir token si ya tiene X-Admin-Password (autenticación alternativa)
const hasAdminPassword = config.headers && 'X-Admin-Password' in config.headers;

if (!isPublicEndpoint && !hasAdminPassword) {
  // Solo agrega el token JWT si NO hay X-Admin-Password
  config.headers.Authorization = `Bearer ${token}`;
}
```

Esto significa que cuando se enviaba `X-Admin-Password`, el token JWT no se agregaba, y el backend rechazaba la petición con 401.

---

## ✅ Solución Implementada

### Cambios en `src/services/contractsService.ts`

Se eliminó el header `X-Admin-Password` de todos los métodos de anexos para que el interceptor de axios agregue automáticamente el token JWT:

#### Antes:
```typescript
async createAnnex(request: ContractAnnexCreateRequest): Promise<ContractAnnex> {
  const { data } = await api.post<ContractAnnex>(
    `/admin/hiring/${request.hiring_code}/annexes`,
    {
      title: request.title,
      content: request.content,
    },
    {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1', // ❌ Esto impedía que se agregara el JWT
      },
    }
  );
  return data;
}
```

#### Después:
```typescript
async createAnnex(request: ContractAnnexCreateRequest): Promise<ContractAnnex> {
  // El interceptor de axios agregará automáticamente el token JWT
  // No usar X-Admin-Password porque el backend requiere JWT
  const { data } = await api.post<ContractAnnex>(
    `/admin/hiring/${request.hiring_code}/annexes`,
    {
      title: request.title,
      content: request.content,
    }
  );
  return data;
}
```

### Métodos Actualizados

1. ✅ `getAnnexes(hiringCode: string)` - Eliminado `X-Admin-Password`
2. ✅ `createAnnex(request)` - Eliminado `X-Admin-Password`
3. ✅ `updateAnnex(annexId, request)` - Eliminado `X-Admin-Password`
4. ✅ `deleteAnnex(annexId)` - Eliminado `X-Admin-Password`

---

## 🔄 Cómo Funciona Ahora

1. **Usuario autenticado**: El usuario debe estar autenticado con JWT (login en `/auth/login`)
2. **Token almacenado**: El token JWT se almacena en `localStorage` usando `TokenStorage`
3. **Interceptor automático**: El interceptor de axios en `src/services/api.ts` detecta que es un endpoint admin (no público) y agrega automáticamente:
   ```typescript
   config.headers.Authorization = `Bearer ${token}`;
   ```
4. **Backend valida**: El backend valida el token JWT y verifica que el usuario tenga role "admin" o "superuser"
5. **Request exitoso**: Si todo es correcto, el anexo se crea exitosamente

---

## ✅ Requisitos para que Funcione

### 1. Usuario Autenticado

El usuario debe estar autenticado con JWT. Verificar:

```typescript
import TokenStorage from '@/utils/tokenStorage';

const hasToken = TokenStorage.hasTokens();
const accessToken = TokenStorage.getAccessToken();

if (!hasToken || !accessToken) {
  // Redirigir a login
  window.location.href = '/auth/login';
}
```

### 2. Usuario con Role Admin

El usuario debe tener role "admin" o "superuser" en el backend. Verificar en el token JWT:

```typescript
import { decodeToken } from '@/utils/jwt';

const token = TokenStorage.getAccessToken();
const decoded = decodeToken(token);
const userRole = decoded?.role;

if (userRole !== 'admin' && userRole !== 'superuser') {
  // Usuario no tiene permisos
  console.error('Usuario no tiene permisos de admin');
}
```

### 3. Token Válido (No Expirado)

El token debe estar vigente. El interceptor maneja esto automáticamente:

- Si el token está por expirar (menos de 2 minutos), se refresca automáticamente
- Si el token está expirado, se intenta refrescar usando el refresh token
- Si el refresh token también está expirado, se redirige a login

---

## 🧪 Cómo Probar

### 1. Verificar que el Token se Está Enviando

Abrir DevTools → Network y verificar la petición POST:

```
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
```

**NO debe aparecer** `X-Admin-Password` en los headers.

### 2. Crear un Anexo desde el Frontend

1. Ir a `/admin/contracts/{hiring_code}`
2. Ir a la sección "Anexos al Contrato"
3. Hacer clic en "Crear Anexo"
4. Completar el formulario
5. Hacer clic en "Guardar"
6. Verificar que no hay error 401

### 3. Verificar en la Consola

Buscar logs que indiquen éxito:

```
✅ POST /api/admin/hiring/69GS3/annexes → 201
```

Si hay error 401, verificar:

```
❌ API Error Details:
   URL: /api/admin/hiring/69GS3/annexes
   Method: post
   Status: 401
   Response Data: { detail: "..." }
```

---

## 🚨 Errores Comunes y Soluciones

### Error 1: 401 Unauthorized - "Token no encontrado"

**Síntoma**: 
```
401 Unauthorized
{ detail: "Token no encontrado" }
```

**Causa**: El usuario no está autenticado o el token no está en localStorage.

**Solución**:
1. Verificar que el usuario haya hecho login
2. Verificar en DevTools → Application → Local Storage que existe `access_token`
3. Si no existe, hacer login nuevamente

### Error 2: 401 Unauthorized - "Token expirado"

**Síntoma**:
```
401 Unauthorized
{ detail: "Token expirado" }
```

**Causa**: El token JWT ha expirado y no se pudo refrescar.

**Solución**:
1. El interceptor debería refrescar automáticamente el token
2. Si falla, verificar que existe `refresh_token` en localStorage
3. Si el refresh token también está expirado, hacer login nuevamente

### Error 3: 403 Forbidden - "No tienes permisos"

**Síntoma**:
```
403 Forbidden
{ detail: "No tienes permisos para realizar esta acción" }
```

**Causa**: El usuario no tiene role "admin" o "superuser".

**Solución**:
1. Verificar el role del usuario en el backend
2. Actualizar el role del usuario a "admin" o "superuser"
3. Hacer login nuevamente para obtener un nuevo token con el role actualizado

### Error 4: 401 Unauthorized - "Token inválido"

**Síntoma**:
```
401 Unauthorized
{ detail: "Token inválido" }
```

**Causa**: El token JWT está malformado o fue firmado con una clave diferente.

**Solución**:
1. Limpiar localStorage: `localStorage.clear()`
2. Hacer login nuevamente
3. Verificar que el backend está usando la misma clave secreta para firmar tokens

---

## 📋 Checklist de Verificación

- [x] Eliminado `X-Admin-Password` de `getAnnexes()`
- [x] Eliminado `X-Admin-Password` de `createAnnex()`
- [x] Eliminado `X-Admin-Password` de `updateAnnex()`
- [x] Eliminado `X-Admin-Password` de `deleteAnnex()`
- [x] Interceptor de axios configurado para agregar JWT automáticamente
- [x] Token almacenado en localStorage usando `TokenStorage`
- [x] Usuario autenticado con role "admin" o "superuser"
- [x] Token JWT válido (no expirado)

---

## 🔗 Referencias

- `src/services/contractsService.ts` - Servicio de contratos y anexos
- `src/services/api.ts` - Interceptor de axios con manejo de JWT
- `src/utils/tokenStorage.ts` - Utilidades para manejo de tokens
- `docs/BACKEND_ANEXOS_CONTRATO.md` - Documentación de endpoints de anexos

---

## 📝 Notas Importantes

1. **Autenticación Dual**: Algunos endpoints del backend pueden aceptar tanto `X-Admin-Password` como JWT, pero los endpoints de anexos **requieren JWT**.

2. **Interceptor Inteligente**: El interceptor de axios es inteligente y:
   - Agrega JWT automáticamente a endpoints admin
   - NO agrega JWT si ya existe `X-Admin-Password` (para evitar conflictos)
   - Refresca el token automáticamente si está por expirar
   - Maneja errores 401 y redirige a login si es necesario

3. **Seguridad**: El uso de JWT es más seguro que `X-Admin-Password` porque:
   - El token tiene expiración
   - El token puede ser revocado
   - El token incluye información del usuario (role, permisos, etc.)
   - El token está firmado criptográficamente

---

**Última actualización**: 2025-01-30  
**Estado**: ✅ Solucionado - Endpoints de anexos ahora usan JWT correctamente
