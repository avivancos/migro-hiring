# 📋 Acciones Requeridas para el Backend

## 🚨 Urgente: Endpoint de Expedientes

### Problema
El frontend está intentando hacer `GET /api/expedientes/` pero recibe error **405 (Method Not Allowed)**.

### Solución Requerida
Implementar el endpoint:

```
GET /api/expedientes/
```

### Parámetros de Query

**Paginación:**
- `skip` (opcional, number): Registros a saltar
- `limit` (opcional, number): Máximo de registros

**Filtros:**
- `status` (opcional, string): `'new'`, `'in_progress'`, `'pending_info'`, `'completed'`, `'archived'`
- `user_id` (opcional, string): Filtrar por usuario
- `formulario_id` (opcional, string): Filtrar por formulario
- `search` (opcional, string): Búsqueda de texto libre

**Fechas:**
- `date_from` (opcional, string): Fecha inicio (ISO 8601)
- `date_to` (opcional, string): Fecha fin (ISO 8601)

**Ordenamiento:**
- `order_by` (opcional, string): Campo para ordenar (`'created_at'`, `'updated_at'`, `'title'`)
- `order_desc` (opcional, boolean): `true` = descendente

### Respuesta Esperada

```json
{
  "items": [
    {
      "id": "string",
      "user_id": "string",
      "title": "string",
      "status": "new" | "in_progress" | "pending_info" | "completed" | "archived",
      "source": "app" | "email" | "phone" | "manual",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      // ... otros campos según ExpedienteRead
    }
  ],
  "total": 100,
  "skip": 0,
  "limit": 20
}
```

### Requisitos
- ✅ Requiere autenticación JWT
- ✅ Verificar permisos del usuario
- ✅ Soporte completo de paginación (`skip`, `limit`)
- ✅ Soporte de todos los filtros mencionados

### Documentación Completa
Ver: `docs/BACKEND_EXPEDIENTES_ENDPOINT_405_ERROR.md`

---

## 🔄 Refresh Token - Comportamiento Esperado

### Contexto
El frontend ahora maneja errores de refresh de forma más conservadora. Solo limpia tokens cuando:

1. El refresh token está realmente expirado
2. El servidor responde con **401** o **403** al intentar refrescar
3. El servidor responde con **400** indicando token inválido

### Recomendaciones para el Backend

**Al recibir `POST /auth/refresh`:**

1. **Si el refresh token es válido**: Devolver nuevos tokens con `expires_in` y `refresh_expires_in`
2. **Si el refresh token está expirado**: Devolver **401** con mensaje claro
3. **Si el refresh token es inválido**: Devolver **400** con `detail` que incluya "token" o "invalid"
4. **Errores temporales**: Devolver **500** o **503** (el frontend NO limpiará tokens en estos casos)

### Ejemplo de Respuesta Exitosa

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1209600,  // 14 días en segundos
  "refresh_expires_in": 2592000  // 30 días en segundos
}
```

### Ejemplo de Error (Token Expirado)

```json
{
  "detail": "Refresh token expired"
}
```
**Status Code:** `401`

### Ejemplo de Error (Token Inválido)

```json
{
  "detail": "Invalid refresh token"
}
```
**Status Code:** `400`

---

## 📝 Notas Adicionales

1. **Persistencia de Sesión**: El frontend ahora mantiene tokens en `localStorage` de forma persistente. Solo se limpian cuando realmente están expirados o son inválidos.

2. **Errores Temporales**: El frontend NO limpiará tokens en errores temporales (red, timeout, 500, etc.), por lo que el backend puede reintentar operaciones si es necesario.

3. **Documentación Completa**: Ver `docs/SESSION_PERSISTENCE_FIX.md` para más detalles sobre el manejo de tokens.

---

---

## 🚨 Crítico: Error al Iniciar Backend

### Problema
El backend no puede iniciar debido a un módulo faltante:

```
ModuleNotFoundError: No module named 'app.services.pili_integration'
```

### Ubicación del Error
- **Archivo**: `app/api/endpoints/legal_qa.py` línea 24
- **Importación**: `from app.services.pili_integration import get_pili_response_for_question, auto_respond_to_new_question`

### Soluciones

**Opción 1: Crear el módulo faltante**
- Crear `app/services/pili_integration.py` con las funciones requeridas

**Opción 2: Hacer la importación opcional**
- Modificar `legal_qa.py` para importar condicionalmente

**Opción 3: Comentar temporalmente**
- Si PILI no es crítico, comentar la importación y crear funciones stub

### Documentación Completa
Ver: `docs/BACKEND_PILI_INTEGRATION_MODULE_ERROR.md`

---

## ✅ Estado

- 🚨 **Crítico**: Backend no puede iniciar - Módulo `pili_integration` faltante
- ⏳ **Pendiente**: Implementar `GET /api/expedientes/`
- ✅ **OK**: Endpoint `/auth/refresh` funciona correctamente (solo verificar que devuelve códigos de error apropiados)

