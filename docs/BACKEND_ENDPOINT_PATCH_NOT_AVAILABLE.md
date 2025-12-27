# ⚠️ Problema: Endpoint PATCH /admin/contracts/{code} No Disponible

**Fecha**: 2025-01-20  
**Estado**: ⚠️ Requiere Acción del Backend  
**Error**: 405 Method Not Allowed

---

## 📋 Descripción del Problema

El frontend está intentando usar el endpoint `PATCH /api/admin/contracts/{code}` para actualizar contratos, pero el backend está respondiendo con un error **405 Method Not Allowed**, lo que indica que:

1. El endpoint no está implementado
2. El endpoint existe pero no acepta el método PATCH
3. La ruta está mal configurada

---

## 🔍 Error Observado

```
Failed to load resource: the server responded with a status of 405 ()
URL: /admin/contracts/N6M34
Method: patch
Status: 405
```

---

## ✅ Solución Temporal Implementada en Frontend

Se ha implementado un fallback que intenta usar `PUT` si `PATCH` falla con 405:

```typescript
// Intentar primero con PATCH, si falla con 405, intentar con PUT
try {
  const { data } = await api.patch<Contract>(`/admin/contracts/${code}`, body, {
    headers: {
      'X-Admin-Password': 'Pomelo2005.1',
    },
  });
  return normalizeHiringCode(data);
} catch (error: any) {
  // Si el error es 405 (Method Not Allowed), intentar con PUT
  if (error?.response?.status === 405) {
    console.warn('⚠️ PATCH no disponible, intentando con PUT...');
    const { data } = await api.put<Contract>(`/admin/contracts/${code}`, body, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1',
      },
    });
    return normalizeHiringCode(data);
  }
  throw error;
}
```

---

## 🔧 Acción Requerida en el Backend

### Opción 1: Implementar PATCH (Recomendado)

Implementar el endpoint `PATCH /api/admin/contracts/{code}` según la documentación en `docs/BACKEND_ENDPOINT_PATCH_CONTRACTS.md`.

**Características requeridas:**
- Aceptar método PATCH
- Autenticación con header `X-Admin-Password: Pomelo2005.1`
- Actualización parcial de campos (comportamiento PATCH estándar)
- Retornar el contrato actualizado

### Opción 2: Usar PUT

Si el backend prefiere usar PUT, el frontend ya tiene el fallback implementado, pero se recomienda documentar esto claramente.

**Nota**: PUT generalmente requiere enviar todos los campos, mientras que PATCH permite actualizaciones parciales.

---

## 📝 Campos que el Frontend Envía

El frontend envía los siguientes campos (todos opcionales):

```json
{
  "status": "pending" | "paid" | "completed" | "expired" | "cancelled",
  "amount": 40000,  // en centavos
  "currency": "EUR",
  "payment_type": "one_time" | "subscription",
  "manual_payment_confirmed": true,
  "manual_payment_method": "string",
  "manual_payment_note": "string",
  "subscription_id": "string",
  "subscription_status": "string",
  "first_payment_amount": 4800,  // en centavos
  // ... otros campos opcionales
}
```

---

## 🧪 Testing

Para verificar que el endpoint funciona:

```bash
# Test con PATCH
curl -X PATCH "https://api.migro.es/api/admin/contracts/N6M34" \
  -H "X-Admin-Password: Pomelo2005.1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "amount": 40000
  }'

# Test con PUT (si PATCH no funciona)
curl -X PUT "https://api.migro.es/api/admin/contracts/N6M34" \
  -H "X-Admin-Password: Pomelo2005.1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "amount": 40000
  }'
```

---

## ✅ Checklist

- [ ] Verificar si el endpoint PATCH existe en el backend
- [ ] Si no existe, implementar según `docs/BACKEND_ENDPOINT_PATCH_CONTRACTS.md`
- [ ] Si se usa PUT, actualizar la documentación
- [ ] Probar el endpoint con los campos que envía el frontend
- [ ] Verificar que la autenticación con `X-Admin-Password` funciona
- [ ] Confirmar que retorna el contrato actualizado

---

**Última actualización**: 2025-01-20  
**Prioridad**: Alta - Bloquea funcionalidad de actualización de contratos











