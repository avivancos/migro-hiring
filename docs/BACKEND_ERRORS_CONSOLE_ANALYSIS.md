# Análisis de Errores del Backend en Consola

**Fecha:** 2025-01-28  
**Problema:** Múltiples errores 500 y 503 del backend aparecen en la consola  
**Estado:** ⚠️ ERRORES DEL BACKEND (NO FRONTEND)

---

## 🔍 Errores Identificados

### 1. Error 500: `/admin/contracts/` - Error de Pydantic

**Endpoint:** `GET /admin/contracts/?skip=0&limit=10`

**Error:**
```json
{
  "detail": "Internal Server Error: `HiringPaymentDetails` is not fully defined; you should define `ContractAnnexResponse`, then call `HiringPaymentDetails.model_rebuild()`."
}
```

**Causa:** Error de configuración en los modelos de Pydantic del backend. El modelo `HiringPaymentDetails` depende de `ContractAnnexResponse`, pero este no está definido antes de que se intente usar.

**Solución Backend:**
1. Asegurar que `ContractAnnexResponse` se define antes de `HiringPaymentDetails`
2. Llamar a `HiringPaymentDetails.model_rebuild()` después de definir todas las dependencias

**Impacto Frontend:**
- El servicio `contractsService.getContracts()` retorna un array vacío cuando hay error
- La UI muestra lista vacía en lugar de mostrar el error
- No afecta otras funcionalidades

---

### 2. Error 500: `/crm/calls/calendar`

**Endpoint:** `GET /crm/calls/calendar?start_date=2026-01-10T23:00:00.000Z&end_date=2026-01-17T22:59:59.999Z`

**Error:** Error 500 sin detalles específicos en el mensaje

**Causa:** Error interno del servidor al procesar las llamadas del calendario

**Solución Backend:**
- Revisar logs del servidor para identificar la causa específica
- Verificar que los parámetros `start_date` y `end_date` se validen correctamente
- Verificar que la consulta a la base de datos sea correcta

**Impacto Frontend:**
- El servicio `crmService.getCalendarCalls()` retorna un array vacío cuando hay error
- El calendario no muestra llamadas, pero no rompe la aplicación
- Los logs muestran el error para debugging

---

### 3. Error 500: `/crm/tasks/calendar`

**Endpoint:** `GET /crm/tasks/calendar?start_date=2026-01-10T23:00:00.000Z&end_date=2026-01-17T22:59:59.999Z`

**Error:** Error 500 sin detalles específicos en el mensaje

**Causa:** Error interno del servidor al procesar las tareas del calendario

**Solución Backend:**
- Similar al error de calls/calendar
- Revisar logs del servidor para identificar la causa específica
- Verificar validación de parámetros y consultas a la base de datos

**Impacto Frontend:**
- Similar al error de calls/calendar
- El servicio retorna array vacío, no rompe la aplicación

---

### 4. Error 503: `/crm/opportunities` - Feature No Disponible

**Endpoint:** `GET /crm/opportunities?page=1&limit=10`

**Error:**
```json
{
  "detail": "Lead opportunities feature is not yet available. Please wait for database migration to complete."
}
```

**Causa:** Feature en desarrollo. La migración de base de datos aún no está completa.

**Solución Backend:**
- Completar la migración de base de datos
- Habilitar el endpoint cuando esté listo

**Impacto Frontend:**
- El error se muestra en los logs
- El servicio `opportunityApi.list()` lanza el error
- La UI debería manejar este caso mostrando un mensaje apropiado

**Nota:** Este es un error esperado durante el desarrollo y se resolverá cuando la migración esté completa.

---

## ✅ Mejoras Implementadas en el Frontend

### 1. Mejor Manejo de Errores 500

Se mejoró `errorHandler.ts` para:
- Detectar errores de Pydantic específicos
- Mostrar mensajes más descriptivos cuando están disponibles
- Extraer y mostrar detalles del error del backend (limitado a 200 caracteres)

```typescript
case 500:
  // Detectar errores de Pydantic
  if (detailStr.includes('is not fully defined')) {
    return {
      message: 'Error de configuración en el servidor. Por favor, contacta al administrador.',
      code: 'PYDANTIC_ERROR',
    };
  }
  // Mostrar mensaje del backend si está disponible
  return {
    message: detailStr,
    code: 'SERVER_ERROR',
  };
```

### 2. Mejor Manejo de Errores 503

Se mejoró para mostrar mensajes específicos del backend:

```typescript
case 503:
  if (data?.detail) {
    return {
      message: detailStr, // Mostrar mensaje completo del backend
      code: 'SERVICE_UNAVAILABLE',
    };
  }
  return {
    message: 'Servicio temporalmente no disponible. Por favor, intenta más tarde.',
  };
```

### 3. Manejo Silencioso de Errores en Servicios

Los servicios que pueden fallar sin romper la aplicación retornan arrays vacíos:

- `contractsService.getContracts()`: Retorna `{ items: [], total: 0, ... }`
- `crmService.getCalendarCalls()`: Retorna `[]`
- `crmService.getCalendarTasks()`: Retorna `[]`

Esto permite que la aplicación continúe funcionando incluso cuando algunos endpoints fallan.

---

## 📝 Archivos Modificados

1. ✅ `src/utils/errorHandler.ts` - Mejorado manejo de errores 500 y 503
2. ✅ `src/services/api.ts` - Mejorado `getErrorMessage()` para errores 500 y 503

---

## 🎯 Recomendaciones para el Backend

### Prioridad Alta

1. **Fix Error Pydantic en `/admin/contracts/`**:
   ```python
   # Asegurar orden correcto de definición
   class ContractAnnexResponse(BaseModel):
       ...
   
   class HiringPaymentDetails(BaseModel):
       ...
   
   # Reconstruir modelo después de definir dependencias
   HiringPaymentDetails.model_rebuild()
   ```

2. **Investigar errores 500 en calendar endpoints**:
   - Revisar logs del servidor
   - Verificar validación de parámetros
   - Verificar consultas SQL

### Prioridad Media

3. **Completar migración de base de datos para opportunities**:
   - Completar la migración
   - Habilitar el endpoint `/crm/opportunities`
   - Actualizar documentación

---

## 🔗 Referencias

- [Pydantic Model Rebuild](https://docs.pydantic.dev/2.0/usage/models/#rebuild-models)
- [FastAPI Error Handling](https://fastapi.tiangolo.com/tutorial/handling-errors/)
- Documentación de errores del backend en `docs/BACKEND_ENDPOINTS_ERRORS_SOLUTION.md`

---

## ✅ Estado Actual

- ✅ Frontend maneja errores gracefully
- ✅ Mensajes de error mejorados y más descriptivos
- ✅ Servicios no rompen la aplicación ante errores del backend
- ⚠️ Errores del backend requieren corrección en el backend
- ⚠️ Feature de opportunities en desarrollo (esperado)
