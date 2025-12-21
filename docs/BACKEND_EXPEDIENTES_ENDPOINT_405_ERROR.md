# Error 405 Method Not Allowed - Endpoint /expedientes/

## 📋 Resumen

El frontend está intentando realizar solicitudes GET a `/api/expedientes/` pero el backend está devolviendo un error **405 (Method Not Allowed)**. Esto indica que el endpoint no está implementado o no acepta el método GET.

## 🔍 Problema Detectado

### Errores en Consola

```
GET https://api.migro.es/api/expedientes/?skip=0&limit=20 405 (Method Not Allowed)
GET https://api.migro.es/api/expedientes/?status=in_progress&skip=0&limit=20 405 (Method Not Allowed)
```

### Ubicación del Error

- **Frontend**: `src/services/expedienteApi.ts` - método `list()`
- **Hook**: `src/hooks/useExpedientes.ts` - función `loadExpedientes()`
- **Componente**: `src/pages/CRMExpedientesList.tsx`

## 🎯 Solución Requerida en Backend

El backend necesita implementar el endpoint:

```
GET /api/expedientes/
```

### Parámetros de Query Esperados

Según la interfaz `ExpedienteFilters` definida en `src/types/expediente.ts`:

**Paginación:**
- `skip` (opcional, number): Número de registros a saltar (paginación)
- `limit` (opcional, number): Número máximo de registros a devolver

**Filtros de Búsqueda:**
- `status` (opcional, string): Filtrar por estado del expediente
  - Valores posibles: `'new'`, `'in_progress'`, `'pending_info'`, `'completed'`, `'archived'`
- `user_id` (opcional, string): Filtrar por ID de usuario
- `formulario_id` (opcional, string): Filtrar por ID de formulario oficial
- `search` (opcional, string): Búsqueda de texto libre (título, resumen, etc.)

**Filtros de Fecha:**
- `date_from` (opcional, string): Fecha de inicio (formato ISO 8601)
- `date_to` (opcional, string): Fecha de fin (formato ISO 8601)

**Ordenamiento:**
- `order_by` (opcional, string): Campo por el cual ordenar (ej: `'created_at'`, `'updated_at'`, `'title'`)
- `order_desc` (opcional, boolean): Orden descendente si es `true`, ascendente si es `false`

### Respuesta Esperada

```typescript
{
  items: ExpedienteRead[],
  total: number,
  skip: number,
  limit: number
}
```

## ✅ Cambios Realizados en Frontend

### 1. Manejo de Errores Mejorado

- Agregado caso específico para error 405 en `src/utils/errorHandler.ts`
- Mejorado manejo de errores en `expedienteApi.list()` con `withRetry` y `handleApiError`

### 2. Código Actualizado

**`src/utils/errorHandler.ts`**:
```typescript
case 405:
  return {
    message: 'Método no permitido. El endpoint puede no estar implementado en el backend.',
    code: 'METHOD_NOT_ALLOWED',
    status,
  };
```

**`src/services/expedienteApi.ts`**:
```typescript
async list(filters?: ExpedienteFilters): Promise<ExpedienteListResponse> {
  try {
    return await withRetry(async () => {
      const { data: responseData } = await api.get<ExpedienteListResponse>(
        `${EXPEDIENTES_BASE_PATH}/`,
        { params: filters }
      );
      return responseData;
    });
  } catch (error) {
    throw handleApiError(error);
  }
}
```

## 📝 Notas para Backend

1. **Endpoint Requerido**: `GET /api/expedientes/`
2. **Autenticación**: Requiere token JWT válido
3. **Permisos**: Debe verificar permisos del usuario para listar expedientes
4. **Paginación**: Debe soportar `skip` y `limit`
5. **Filtros**: Debe soportar filtros por `status` y otros campos

## 🔄 Estado Actual

- ✅ Frontend: Código corregido y mejorado
- ⏳ Backend: Pendiente de implementación del endpoint

## 📚 Referencias

- Tipo `ExpedienteFilters`: `src/types/expediente.ts`
- Tipo `ExpedienteListResponse`: `src/types/expediente.ts`
- Documentación del módulo: `docs/expedientes_super_mega_prompt_modulo_completo.md` (si existe)

