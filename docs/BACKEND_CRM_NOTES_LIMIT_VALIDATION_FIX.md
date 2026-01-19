# Fix: Error 422 en Endpoint de Notas CRM - Validación de Límite

**Fecha**: 2026-01-17  
**Estado**: ✅ Resuelto  
**Prioridad**: 🔴 Alta  
**Módulo**: Frontend - CRM Task Calendar

---

## 🐛 Problema

El componente `CRMTaskCalendar` estaba enviando una petición a `GET /api/crm/notes?limit=1000`, pero el backend tiene una validación que limita el parámetro `limit` a un máximo de **100**.

### Error Observado

```
GET http://localhost:3000/api/crm/notes?limit=1000 422 (Unprocessable Entity)
```

**Mensaje de error del backend:**
```json
{
  "error": true,
  "message": "Error de validación: Input should be less than or equal to 100",
  "type": "ValidationError"
}
```

---

## ✅ Solución Implementada

### Cambio en Frontend

**Archivo**: `src/pages/CRMTaskCalendar.tsx`

Se cambió el límite de `1000` a `100` para cumplir con la validación del backend:

```typescript
// Antes
crmService.getNotes({
  limit: 1000, // Cargar muchas notas para el rango de fechas
})

// Después
crmService.getNotes({
  limit: 100, // Máximo permitido por el backend (le=100)
})
```

---

## 📋 Validación del Backend

El endpoint `GET /api/crm/notes` tiene una validación estricta del parámetro `limit`:

- **Mínimo**: 1 (`ge=1`)
- **Máximo**: 100 (`le=100`)
- **Valor por defecto**: Probablemente 20 o 50 (según implementación)

Si se envía un valor fuera de este rango, FastAPI devuelve un error **422 (Unprocessable Entity)**.

---

## 🔍 Otros Usos de `getNotes` en el Código

Se verificó que otros lugares del código usan límites válidos:

- `CRMDashboardPage.tsx`: `limit: 10` ✅
- `CRMLeadDetail.tsx`: `limit: 50` ✅
- `CRMExpedientes.tsx`: `limit: 50` ✅

---

## 💡 Recomendaciones Futuras

Si se necesita cargar más de 100 notas en el calendario, considerar:

1. **Paginación**: Implementar múltiples llamadas con `skip` y `limit`
2. **Filtrado por fecha en el backend**: Si el endpoint de notes soporta filtros de fecha, usarlos para reducir la cantidad de datos
3. **Endpoint específico para calendario**: Similar a `/tasks/calendar` y `/calls/calendar`, crear un `/notes/calendar` que filtre por rango de fechas

---

## ✅ Estado

- [x] Error corregido en `CRMTaskCalendar.tsx`
- [x] Verificado que no hay otros lugares con límites inválidos
- [x] Documentación creada
