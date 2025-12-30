# Frontend: Integración del Endpoint de Tipos de Llamada

**Fecha**: 2025-01-29  
**Módulo**: CRM - Calls API  
**Estado**: ✅ Documentado - Pendiente de implementación

---

## ⚠️ Nota Importante

La documentación del backend indica que el endpoint `/api/crm/call-types` devuelve `directions` y `statuses`, pero el código actual del frontend usa `call_type` como un campo separado con valores como `'primera_llamada'`, `'seguimiento'`, `'venta'`.

**Necesario clarificar:**
1. ¿El endpoint realmente devuelve `directions` y `statuses`?
2. ¿O devuelve tipos de llamada con estructura `{ id, name, code }`?
3. ¿Cómo se relaciona con el campo `call_type` del modelo `Call`?

---

## 📋 Resumen

Documentación para integrar el endpoint `GET /api/crm/call-types` en el frontend según la especificación del backend.

---

## 🔌 Endpoint

### `GET /api/crm/call-types`

**Descripción:** Obtiene los tipos de llamada disponibles (direcciones y estados).

**Autenticación:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:** Ninguno

**Response:** `200 OK`
```json
{
  "directions": ["inbound", "outbound"],
  "statuses": ["completed", "failed", "busy", "no_answer", "other"]
}
```

---

## 🔄 Estado Actual del Código

### Implementación Actual

El código actual en `CallForm.tsx` espera que `getCallTypes()` devuelva:
```typescript
Array<{ id: string; name: string; code: string; description?: string }>
```

Y lo usa para poblar un select de "Tipo de Llamada" con valores como:
- `'primera_llamada'` → "Primera Llamada"
- `'seguimiento'` → "Seguimiento"  
- `'venta'` → "Llamada de Venta"

### Servicio Actual

```typescript
// src/services/crmService.ts
async getCallTypes(): Promise<Array<{ id: string; name: string; code: string; description?: string }>> {
  try {
    const { data } = await api.get('/crm/call-types');
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('Error getting call types:', error);
    // Fallback a tipos por defecto
    return [
      { id: '1', name: 'Primera Llamada', code: 'primera_llamada' },
      { id: '2', name: 'Seguimiento', code: 'seguimiento' },
      { id: '3', name: 'Llamada de Venta', code: 'venta' },
    ];
  }
}
```

---

## ❓ Preguntas Pendientes

1. **¿Qué devuelve realmente el endpoint?**
   - ¿`{ directions: [...], statuses: [...] }`?
   - ¿`[{ id, name, code }]`?
   - ¿Otra estructura?

2. **¿Cómo se relaciona con `call_type`?**
   - El campo `call_type` en el modelo `Call` parece ser para tipos de llamada (primera_llamada, seguimiento, venta)
   - Las `directions` y `statuses` son campos diferentes (`direction` y `call_status`)

3. **¿Necesitamos un endpoint diferente?**
   - Para `directions` y `statuses`: Ya tenemos enums en el frontend
   - Para `call_type`: Necesitamos tipos de llamada (primera_llamada, seguimiento, venta)

---

## 💡 Recomendación

Si el endpoint realmente devuelve `directions` y `statuses`, entonces:

1. **No es necesario** para el campo `call_type` actual
2. **Ya tenemos** `direction` y `call_status` como campos separados
3. **Podríamos usar** este endpoint para:
   - Validar valores permitidos
   - Poblar selects de dirección y estado dinámicamente
   - Pero NO para el campo `call_type`

Si necesitamos tipos de llamada (`call_type`), necesitaríamos:
- Un endpoint diferente: `/api/crm/call-type-categories` o similar
- O un campo adicional en la respuesta que incluya los tipos de llamada

---

## 📝 Próximos Pasos

1. ✅ Verificar qué devuelve realmente el endpoint `/api/crm/call-types`
2. ✅ Determinar si necesitamos tipos de llamada separados o si `directions`/`statuses` son suficientes
3. ⏳ Actualizar el código según la respuesta real del endpoint
4. ⏳ Si es necesario, crear endpoint adicional para tipos de llamada (`call_type`)

---

**Estado**: ⚠️ **PENDIENTE DE CLARIFICACIÓN**

