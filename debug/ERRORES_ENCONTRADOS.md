# 🔍 Análisis de Errores Encontrados por el Crawler

**Fecha:** 15 de Diciembre de 2025  
**Log analizado:** `crawler-2025-12-15T20-47-39.log`

---

## 📊 Resumen

- **Total de errores:** 16
- **URLs visitadas:** 27
- **Rutas únicas:** 26
- **Logs de consola:** 602

---

## ❌ Errores Críticos

### 1. `authService.getToken is not a function` (CRÍTICO)

**Ubicación:** `src/hooks/useAuth.ts:19`  
**Frecuencia:** 6 veces (en múltiples páginas)  
**Error:**
```
TypeError: authService.getToken is not a function
    at initAuth (http://localhost:5173/src/hooks/useAuth.ts?t=1765824761487:13:33)
```

**Causa:** 
- En `useAuth.ts` se llama `authService.getToken()` pero en `authService.ts` el método se llama `getAccessToken()`
- También falta el método `getCachedUser()` que se usa en la línea 20

**Impacto:** 
- El hook `useAuth` no puede inicializar correctamente
- Afecta a todas las páginas que usan este hook

**Solución:**
- Agregar método `getToken()` como alias de `getAccessToken()`
- Agregar método `getCachedUser()` para obtener usuario del localStorage

---

### 2. HTTP 422: `/api/users/undefined` (CRÍTICO)

**Ubicación:** `src/pages/AdminDashboard.tsx` o similar  
**Frecuencia:** 2 veces  
**Error:**
```
HTTP 422: https://api.migro.es/api/users/undefined
URL: /users/undefined
Method: get
Status: 422
```

**Causa:**
- Se está intentando obtener un usuario con ID `undefined`
- Probablemente en `AdminDashboard` o `AdminUserDetail` se intenta acceder a `user.id` cuando `user` es null/undefined

**Impacto:**
- La página no puede cargar datos del usuario
- Errores en la consola

**Solución:**
- Verificar que `user` existe antes de hacer la llamada
- Agregar validación de `user?.id` antes de llamar a la API

---

### 3. HTTP 422: `/api/users/audit-logs` (MEDIO)

**Ubicación:** `src/pages/admin/AdminAuditLogs.tsx:31`  
**Frecuencia:** 2 veces  
**Error:**
```
HTTP 422: https://api.migro.es/api/users/audit-logs?skip=0&limit=50
Status: 422
Error cargando logs: JSHandle@object
```

**Causa:**
- El endpoint `/users/audit-logs` está devolviendo 422 (Unprocessable Entity)
- Puede ser un problema del backend o de los parámetros enviados

**Impacto:**
- La página de audit logs no puede cargar datos
- Usuario ve error en la interfaz

**Solución:**
- Verificar que el endpoint existe en el backend
- Revisar los parámetros que se envían
- Agregar manejo de errores más robusto

---

### 4. Error en `CRMContactList` Component (MEDIO)

**Ubicación:** `src/pages/CRMContactList.tsx`  
**Frecuencia:** 1 vez  
**Error:**
```
The above error occurred in the <CRMContactList> component. 
React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
ErrorBoundary caught an error: JSHandle@error JSHandle@object
```

**Causa:**
- Error no especificado en el componente `CRMContactList`
- El ErrorBoundary capturó el error pero no se muestra el detalle

**Impacto:**
- La página de contactos no se renderiza correctamente
- El usuario ve una pantalla de error

**Solución:**
- Revisar el código de `CRMContactList` para encontrar el error
- Verificar que todas las dependencias estén correctamente importadas
- Agregar más logging para identificar el error específico

---

### 5. Error loading actions en `CRMActions` (MEDIO)

**Ubicación:** `src/pages/CRMActions.tsx:92`  
**Frecuencia:** 2 veces  
**Error:**
```
Error loading actions: JSHandle@error
```

**Causa:**
- Error al cargar acciones en la página de CRM Actions
- No se muestra el detalle del error

**Impacto:**
- La página de acciones no puede cargar datos
- Funcionalidad limitada

**Solución:**
- Revisar el código en la línea 92 de `CRMActions.tsx`
- Verificar que las llamadas a la API sean correctas
- Agregar manejo de errores más detallado

---

### 6. REQUEST FAILED: `/api/crm/calls` (BAJO)

**Ubicación:** Probablemente en `CRMExpedientes` o similar  
**Frecuencia:** 2 veces  
**Error:**
```
REQUEST FAILED: https://api.migro.es/api/crm/calls?entity_id=4a3e6b1b-8242-423f-9694-c1513dcc8efe&entity_type=leads&limit=50 - net::ERR_ABORTED
REQUEST FAILED: https://api.migro.es/api/crm/calls?entity_id=72abb1fb-920e-4a27-aec4-2e1789d1e67b&entity_type=leads&limit=50 - net::ERR_ABORTED
```

**Causa:**
- Requests abortados (probablemente por timeout o cancelación)
- Puede ser normal si la página se navega antes de que termine la request

**Impacto:**
- Bajo, puede ser comportamiento esperado

**Solución:**
- Verificar si es un problema real o comportamiento esperado
- Agregar manejo de requests canceladas

---

### 7. REQUEST FAILED: `/api/crm/tasks/calendar` (BAJO)

**Ubicación:** Probablemente en `CRMTaskCalendar`  
**Frecuencia:** 2 veces  
**Error:**
```
REQUEST FAILED: https://api.migro.es/api/crm/tasks/calendar?start_date=2025-12-01T03:00:00.000Z&end_date=2026-01-01T02:59:59.999Z - net::ERR_ABORTED
```

**Causa:**
- Similar al anterior, requests abortadas
- Puede ser por navegación rápida entre páginas

**Impacto:**
- Bajo, puede ser comportamiento esperado

**Solución:**
- Similar al anterior

---

## 🔧 Prioridad de Solución

1. **ALTA:** Error `authService.getToken is not a function` - Afecta múltiples páginas
2. **ALTA:** Error `/api/users/undefined` - Afecta carga de datos del usuario
3. **MEDIA:** Error en `CRMContactList` - Afecta funcionalidad importante
4. **MEDIA:** Error en `CRMActions` - Afecta funcionalidad
5. **MEDIA:** Error `/api/users/audit-logs` - Afecta página específica
6. **BAJA:** Requests abortadas - Puede ser comportamiento esperado

---

## 📝 Notas

- Muchos errores están relacionados con la autenticación y la obtención del usuario actual
- Algunos errores pueden ser del backend (422) y no del frontend
- Los requests abortados pueden ser normales en navegación rápida




















