# Autenticación para Endpoints de Anexos - Frontend

**Fecha**: 2025-01-30  
**Módulo**: Frontend - Sistema de Anexos al Contrato  
**Estado**: ✅ Implementado

---

## 🔐 Requisitos de Autenticación

### Endpoints Públicos (Sin Autenticación)

- `GET /api/admin/hiring/{hiring_code}/annexes` - Listar anexos

Este endpoint es público y no requiere ningún header de autenticación. El interceptor de Axios está configurado para no agregar el token JWT en este endpoint específico.

### Endpoints Protegidos (Requieren JWT Admin/Superuser)

Los siguientes endpoints requieren autenticación JWT con sesión de usuario admin o superuser:

- `POST /api/admin/hiring/{hiring_code}/annexes` - Crear anexo
- `PATCH /api/admin/hiring/annexes/{annex_id}` - Actualizar anexo
- `DELETE /api/admin/hiring/annexes/{annex_id}` - Eliminar anexo

---

## ✅ Implementación en Frontend

### 1. Configuración del Interceptor de Axios

El interceptor de Axios en `src/services/api.ts` está configurado para:

- **Agregar token JWT automáticamente** a todas las peticiones protegidas
- **Permitir GET de anexos sin token** (endpoint público)
- **Manejar errores 401** (redirigir a login si el token está expirado)
- **Manejar errores 403** (mostrar mensaje de permisos insuficientes)

#### Código del Interceptor

```typescript
// src/services/api.ts

// Endpoint GET de anexos es público (no requiere autenticación)
const isAnnexesGetEndpoint = config.method?.toLowerCase() === 'get' && 
                              config.url?.includes('/admin/hiring/') && 
                              config.url?.includes('/annexes') &&
                              !config.url?.includes('/annexes/'); // Excluir GET de anexo específico si existe

const isPublicEndpoint = (config.url && publicEndpoints.some(endpoint => config.url!.includes(endpoint))) || 
                         isAnnexesGetEndpoint;

if (!isPublicEndpoint && !hasAdminPassword) {
  // Agregar token JWT automáticamente
  let token = TokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
}
```

#### Manejo de Errores en el Interceptor

```typescript
// src/services/api.ts

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido - intentar refrescar
      // Si falla el refresh, redirigir a login
    } else if (error.response?.status === 403) {
      // Error de permisos - NO limpiar tokens, solo rechazar error
      console.error('❌ Acceso denegado (403) - MANTENIENDO tokens y sesión');
    }
    return Promise.reject(error);
  }
);
```

### 2. Verificación de Permisos en el Componente

El componente `ContractAnnexes.tsx` verifica los permisos del usuario antes de mostrar opciones de crear/editar/eliminar:

```typescript
// src/components/contracts/ContractAnnexes.tsx

import { useAuth } from '@/providers/AuthProvider';

export function ContractAnnexes({ hiringCode }: ContractAnnexesProps) {
  const { user, isAdmin } = useAuth();
  
  // isAdmin se calcula como: user.is_superuser || user.role === 'admin' || user.role === 'superuser'
  
  // Solo mostrar botones si el usuario es admin
  {isAdmin && (
    <Button onClick={handleCreate}>Crear Anexo</Button>
  )}
}
```

### 3. Manejo de Errores en las Operaciones

Cada operación (crear, editar, eliminar) maneja específicamente los errores 401 y 403:

```typescript
// src/components/contracts/ContractAnnexes.tsx

const handleSaveCreate = async () => {
  if (!isAdmin) {
    alert('Solo los administradores pueden crear anexos');
    return;
  }

  try {
    await contractsService.createAnnex(request);
    // ... éxito
  } catch (error: any) {
    if (error.response?.status === 401) {
      alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
    } else if (error.response?.status === 403) {
      alert('No tienes permisos de administrador para crear anexos.');
    } else {
      const errorMessage = getErrorMessage(error);
      alert(errorMessage || 'Error al crear el anexo');
    }
  }
};
```

---

## 🚨 Manejo de Errores

### Error 401 (Unauthorized)

- **Causa**: Token JWT expirado o inválido
- **Acción del Interceptor**: 
  - Intenta refrescar el token automáticamente
  - Si el refresh falla, redirige al usuario a `/auth/login`
- **Acción en el Componente**: 
  - Muestra mensaje: "Sesión expirada. Por favor, inicia sesión nuevamente."

### Error 403 (Forbidden)

- **Causa**: Usuario no tiene permisos de admin o superuser
- **Acción del Interceptor**: 
  - NO limpia tokens (el usuario sigue autenticado)
  - Solo rechaza el error para que el componente lo maneje
- **Acción en el Componente**: 
  - Muestra mensaje: "No tienes permisos de administrador para [acción]."

### Error 404 (Not Found)

- **Causa**: Hiring code o anexo no encontrado
- **Acción**: Mostrar mensaje de error apropiado usando `getErrorMessage(error)`

---

## ✅ Checklist de Implementación

- [x] Verificar que el interceptor de Axios agregue el token JWT automáticamente
- [x] Verificar que el endpoint GET funciona sin autenticación
- [x] Verificar permisos del usuario antes de mostrar opciones de crear/editar/eliminar
- [x] Manejar errores 401 (redirigir a login)
- [x] Manejar errores 403 (mostrar mensaje de permisos insuficientes)
- [x] Los endpoints POST, PATCH, DELETE requieren token JWT válido
- [x] El usuario debe tener role "admin" o "superuser" para operaciones de escritura

---

## 📝 Notas Importantes

### 1. GET es Público

El endpoint `GET /api/admin/hiring/{hiring_code}/annexes` es público y no requiere autenticación. El interceptor está configurado para no agregar el token JWT en este endpoint específico.

**Código relevante**:
```typescript
// src/services/api.ts
const isAnnexesGetEndpoint = config.method?.toLowerCase() === 'get' && 
                              config.url?.includes('/admin/hiring/') && 
                              config.url?.includes('/annexes');
```

### 2. Verificación de Permisos en Frontend

Aunque el backend valida los permisos, el frontend también verifica para mejorar la UX:
- Oculta botones si el usuario no tiene permisos
- Muestra mensajes claros cuando el usuario intenta realizar acciones sin permisos

**Código relevante**:
```typescript
// src/components/contracts/ContractAnnexes.tsx
const { isAdmin } = useAuth();

{isAdmin && (
  <Button onClick={handleCreate}>Crear Anexo</Button>
)}
```

### 3. Token JWT

El token debe ser un token de acceso (access token), no un refresh token. El token se obtiene de `TokenStorage.getAccessToken()`.

### 4. Sesión Activa

El usuario debe tener una sesión activa con un token JWT válido para realizar operaciones de escritura. El interceptor maneja automáticamente:
- Refresh proactivo si el token está por expirar (menos de 2 minutos)
- Refresh automático si el token está expirado pero el refresh token es válido
- Redirección a login si ambos tokens están expirados

---

## 🔗 Archivos Relacionados

- `src/services/api.ts` - Interceptor de Axios con manejo de JWT
- `src/components/contracts/ContractAnnexes.tsx` - Componente de gestión de anexos
- `src/services/contractsService.ts` - Servicio de contratos y anexos
- `src/providers/AuthProvider.tsx` - Provider de autenticación con hook `useAuth()`
- `src/utils/tokenStorage.ts` - Utilidades para manejo de tokens

---

## 🧪 Cómo Probar

### 1. Verificar que GET Funciona Sin Autenticación

```bash
# Desde la consola del navegador (sin estar autenticado)
fetch('https://api.migro.es/api/admin/hiring/69GS3/annexes')
  .then(r => r.json())
  .then(console.log);
```

### 2. Verificar que POST Requiere Autenticación

1. Iniciar sesión como admin
2. Ir a `/admin/contracts/{hiring_code}`
3. Intentar crear un anexo
4. Verificar en DevTools → Network que el header `Authorization: Bearer <token>` está presente

### 3. Verificar Permisos Insuficientes

1. Iniciar sesión como usuario sin permisos de admin
2. Intentar acceder a `/admin/contracts/{hiring_code}`
3. Verificar que los botones de crear/editar/eliminar no aparecen

### 4. Verificar Manejo de Errores 401

1. Esperar a que el token expire (o forzar expiración)
2. Intentar crear un anexo
3. Verificar que se muestra el mensaje: "Sesión expirada. Por favor, inicia sesión nuevamente."

### 5. Verificar Manejo de Errores 403

1. Iniciar sesión como usuario sin permisos de admin
2. Intentar crear un anexo (si es posible)
3. Verificar que se muestra el mensaje: "No tienes permisos de administrador para crear anexos."

---

## 📚 Referencias

- `docs/FIX_401_ANEXOS_JWT.md` - Fix anterior de autenticación JWT
- `docs/ANEXOS_CONTRATO_VERIFICACION.md` - Verificación del sistema de anexos
- `docs/BACKEND_CONTRACT_ANNEXES_IMPLEMENTATION.md` - Documentación del backend

---

**Última actualización**: 2025-01-30  
**Estado**: ✅ Implementación Completa
