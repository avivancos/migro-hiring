# Fix Error 422: POST /api/crm/opportunities - "Input should be a valid dictionary"

**Fecha**: 2025-01-30  
**Prioridad**: 🔴 Alta  
**Estado**: ✅ Resuelto  
**Módulo**: Frontend - CRM Opportunities API

---

## 📋 Resumen Ejecutivo

Se corrigió el error 422 "Input should be a valid dictionary" que ocurría al crear oportunidades desde el frontend. El problema era que el backend esperaba `detection_reason` como un objeto (diccionario), pero el frontend estaba enviando un string.

---

## 🐛 Problema

El endpoint `POST /api/crm/opportunities` estaba recibiendo un error 422 con el mensaje:
```
Error de validación: Input should be a valid dictionary
```

### Causa Raíz

El backend espera `detection_reason` como un **objeto JSON** (diccionario), pero el frontend estaba enviando:
- Un string cuando se proporcionaba `detection_reason` como string
- Un string por defecto cuando no se proporcionaba

---

## ✅ Solución Implementada

### Cambios en `src/services/opportunityApi.ts`

Se modificó el método `create` para:

1. **Convertir `detection_reason` de string a objeto** cuando se proporciona como string
2. **Enviar `detection_reason` como objeto** incluso cuando no se proporciona (usando un objeto por defecto)
3. **Construir el payload de forma explícita** para asegurar que todos los campos sean del tipo correcto

#### Código Anterior (❌ Incorrecto)

```typescript
async create(request: OpportunityCreateRequest): Promise<LeadOpportunity> {
  const { data } = await api.post<LeadOpportunity>(
    `${CRM_BASE_PATH}/opportunities`,
    {
      contact_id: request.contact_id,
      opportunity_score: request.opportunity_score ?? 50,
      detection_reason: request.detection_reason ?? 'Oportunidad creada manualmente', // ❌ String
      priority: request.priority ?? 'medium',
      assigned_to_id: request.assigned_to_id,
    }
  );
  return data;
}
```

#### Código Nuevo (✅ Correcto)

```typescript
async create(request: OpportunityCreateRequest): Promise<LeadOpportunity> {
  // Construir el payload asegurándonos de que detection_reason sea un objeto
  const payload: Record<string, any> = {
    contact_id: request.contact_id,
  };

  // Agregar campos opcionales solo si están definidos
  if (request.opportunity_score !== undefined) {
    payload.opportunity_score = request.opportunity_score;
  } else {
    payload.opportunity_score = 50; // Default
  }

  // Convertir detection_reason a objeto si es string
  if (request.detection_reason !== undefined) {
    if (typeof request.detection_reason === 'string') {
      payload.detection_reason = {
        reason: request.detection_reason,
        created_manually: true,
      };
    } else {
      payload.detection_reason = request.detection_reason;
    }
  } else {
    payload.detection_reason = {
      reason: 'Oportunidad creada manualmente',
      created_manually: true,
    };
  }

  if (request.priority !== undefined) {
    payload.priority = request.priority;
  } else {
    payload.priority = 'medium'; // Default
  }

  if (request.assigned_to_id !== undefined && request.assigned_to_id !== null) {
    payload.assigned_to_id = request.assigned_to_id;
  }

  const { data } = await api.post<LeadOpportunity>(
    `${CRM_BASE_PATH}/opportunities`,
    payload
  );
  return data;
}
```

---

## 📝 Formato Correcto del Request Body

### Formato Mínimo (Solo `contact_id`)

```json
{
  "contact_id": "79f5b703-d5f0-430b-adf0-f95a58491160"
}
```

### Formato Completo con Defaults

```json
{
  "contact_id": "79f5b703-d5f0-430b-adf0-f95a58491160",
  "opportunity_score": 50,
  "detection_reason": {
    "reason": "Oportunidad creada manualmente",
    "created_manually": true
  },
  "priority": "medium",
  "assigned_to_id": "uuid-del-agente"
}
```

### Formato con `detection_reason` Personalizado

```json
{
  "contact_id": "79f5b703-d5f0-430b-adf0-f95a58491160",
  "opportunity_score": 75,
  "detection_reason": {
    "reason": "Alta probabilidad de conversión",
    "source": "contact_detail_page",
    "created_manually": true
  },
  "priority": "high"
}
```

---

## 🔍 Errores Comunes y Soluciones

### ❌ Error 1: Enviar `detection_reason` como string

**Incorrecto:**
```typescript
detection_reason: 'Oportunidad creada manualmente'
```

**Correcto:**
```typescript
detection_reason: {
  reason: 'Oportunidad creada manualmente',
  created_manually: true
}
```

### ❌ Error 2: Enviar un array en lugar de un objeto

**Incorrecto:**
```typescript
const response = await api.post('/crm/opportunities', [
  { contact_id: "..." }
]);
```

**Correcto:**
```typescript
const response = await api.post('/crm/opportunities', {
  contact_id: "..."
});
```

### ❌ Error 3: Anidar los datos incorrectamente

**Incorrecto:**
```typescript
const response = await api.post('/crm/opportunities', {
  data: {
    contact_id: "..."
  }
});
```

**Correcto:**
```typescript
const response = await api.post('/crm/opportunities', {
  contact_id: "..."
});
```

---

## 🧪 Testing

### Ejemplo de Uso en el Frontend

```typescript
// En CRMContactDetail.tsx o similar
const handleCreateOpportunity = async () => {
  try {
    const newOpportunity = await opportunityApi.create({
      contact_id: contact.id,
      opportunity_score: 50,
      detection_reason: 'Oportunidad creada manualmente desde contacto', // ✅ Se convierte automáticamente a objeto
      priority: 'medium',
      assigned_to_id: contact.responsible_user_id,
    });
    
    console.log('Oportunidad creada:', newOpportunity);
    navigate(`/crm/opportunities/${newOpportunity.id}`);
  } catch (error: any) {
    console.error('Error creando oportunidad:', error);
    const errorMessage = error?.response?.data?.detail || 
                        error?.message || 
                        'Error al crear la oportunidad';
    alert(`Error al crear la oportunidad: ${errorMessage}`);
  }
};
```

### Testing con cURL

```bash
curl -X POST "https://api.migro.es/api/crm/opportunities" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "contact_id": "79f5b703-d5f0-430b-adf0-f95a58491160",
    "opportunity_score": 50,
    "detection_reason": {
      "reason": "Oportunidad creada manualmente",
      "created_manually": true
    },
    "priority": "medium"
  }'
```

---

## 📊 Respuesta Exitosa (201 Created)

```json
{
  "id": "opportunity-uuid",
  "contact_id": "79f5b703-d5f0-430b-adf0-f95a58491160",
  "detected_at": "2025-01-30T10:00:00Z",
  "opportunity_score": 50,
  "priority": "medium",
  "status": "pending",
  "detection_reason": {
    "reason": "Oportunidad creada manualmente",
    "created_manually": true
  },
  "contact": {
    "id": "79f5b703-d5f0-430b-adf0-f95a58491160",
    "name": "Nombre del Contacto",
    "email": "email@example.com"
  }
}
```

---

## 🔧 Debugging

Si el error persiste, verifica:

1. **Network Tab**: Revisa el body de la petición en las DevTools del navegador
   - Asegúrate de que el body sea un objeto JSON válido
   - Verifica que `detection_reason` sea un objeto, no un string

2. **Console**: Verifica que no haya errores de serialización
   ```typescript
   console.log('Payload:', JSON.stringify(payload, null, 2));
   ```

3. **Headers**: Asegúrate de que `Content-Type: application/json` esté presente
   - Axios lo agrega automáticamente, pero verifica en el interceptor

4. **Axios Config**: Si usas axios, verifica que no haya interceptors que modifiquen el body
   - Revisa `src/services/api.ts` para interceptors

---

## 📚 Referencias

- **Endpoint**: `POST /api/crm/opportunities`
- **Archivo modificado**: `src/services/opportunityApi.ts` (método `create`)
- **Tipo TypeScript**: `OpportunityCreateRequest` en `src/types/opportunity.ts`
- **Documentación relacionada**: 
  - `docs/FRONTEND_CREATE_OPPORTUNITY_FROM_CONTACT.md`
  - `docs/BACKEND_OPPORTUNITIES_PIPELINE_AUTO_CREATE.md`

---

## ✅ Checklist de Verificación

- [x] Método `create` en `opportunityApi.ts` corregido
- [x] `detection_reason` se convierte de string a objeto automáticamente
- [x] Payload se construye explícitamente como objeto
- [x] Campos opcionales se manejan correctamente
- [x] No hay errores de linting
- [x] Documentación actualizada

---

## 🎯 Resultado

El endpoint ahora funciona correctamente y acepta:
- ✅ `detection_reason` como string (se convierte automáticamente a objeto)
- ✅ `detection_reason` como objeto (se envía tal cual)
- ✅ `detection_reason` no proporcionado (se usa objeto por defecto)

El error 422 "Input should be a valid dictionary" ha sido resuelto.
