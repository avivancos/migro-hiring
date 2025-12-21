# Endpoint PATCH /admin/contracts/{code}

**Fecha**: 2025-01-20  
**Estado**: ✅ Implementado en Backend

---

## 📋 Descripción

Endpoint para actualizar contratos de contratación (hiring contracts) por código. Permite a los administradores modificar campos del contrato como información del cliente, monto, estado, datos de pago manual, etc.

**Integración Frontend**: ✅ La funcionalidad de modificar estado y capturar importe está implementada en el frontend y utiliza este endpoint.

---

## 🔗 Endpoint

```
PATCH /api/admin/contracts/{code}
```

---

## 🔐 Autenticación

**NO requiere JWT** - Solo requiere contraseña fija en header:

```
X-Admin-Password: Pomelo2005.1
```

---

## 📥 Request

### Parámetros de Ruta

- `code` (string, requerido): Código de contratación (hiring code)

### Request Body

Schema: `HiringPaymentUpdate`

Todos los campos son opcionales. Solo se actualizarán los campos proporcionados (comportamiento PATCH).

```json
{
  // Estado y IDs externos
  "status": "pending" | "completed" | "paid" | "failed",
  "external_id": "string",
  "payment_method": "string",
  "kyc_status": "string",
  "contract_pdf_url": "string",
  "final_contract_url": "string",
  "completed_at": "2025-01-20T10:00:00Z",
  
  // Información del cliente
  "client_name": "string",
  "client_email": "email@example.com",
  "client_passport": "string",
  "client_nie": "string",
  "client_nationality": "string",
  "client_address": "string",
  "client_city": "string",
  "client_province": "string",
  "client_postal_code": "string",
  
  // Detalles de pago
  "amount": 40000,
  "currency": "EUR",
  "payment_type": "one_time" | "subscription",
  "grade": "A" | "B" | "C" | "T",
  
  // Información del servicio
  "service_name": "string",
  "service_description": "string",
  "catalog_item_id": 123,
  
  // Campos de pago manual
  "manual_payment_note": "string",
  "manual_payment_method": "string",
  "manual_payment_confirmed": true,
  
  // Campos de suscripción
  "subscription_id": "string",
  "subscription_status": "active" | "canceled" | "past_due",
  
  // Expiración
  "expires_in_days": 30
}
```

### Ejemplo de Request

```bash
curl -X PATCH "https://api.migro.es/api/admin/contracts/ABC123" \
  -H "X-Admin-Password: Pomelo2005.1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "amount": 40000,
    "manual_payment_confirmed": true,
    "manual_payment_method": "Transferencia bancaria",
    "manual_payment_note": "Transferencia del 24/11/2025 - Ref 123456"
  }'
```

---

## 📤 Response

### Success (200 OK)

Schema: `HiringPaymentDetails`

```json
{
  "id": 123,
  "hiring_code": "ABC123",
  "client_name": "Juan Pérez",
  "client_email": "juan@example.com",
  "service_name": "Servicio de Inmigración",
  "service_description": "Descripción del servicio",
  "amount": 40000,
  "first_payment_amount": 25000,
  "currency": "EUR",
  "status": "paid",
  "kyc_status": null,
  "expires_at": "2025-02-20T10:00:00Z",
  "short_url": "https://migro.es/h/ABC123",
  "grade": "A",
  "client_passport": null,
  "client_nie": null,
  "client_nationality": null,
  "client_address": null,
  "client_city": null,
  "client_province": null,
  "client_postal_code": null,
  "manual_payment_note": "Transferencia del 24/11/2025 - Ref 123456",
  "manual_payment_method": "Transferencia bancaria",
  "manual_payment_confirmed": true,
  "payment_type": "one_time",
  "subscription_id": null,
  "subscription_status": null
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "detail": "Header X-Admin-Password requerido"
}
```

o

```json
{
  "detail": "Contraseña de administrador incorrecta"
}
```

#### 404 Not Found
```json
{
  "detail": "Código de contratación 'ABC123' no encontrado"
}
```

---

## 📝 Campos Actualizables

### Información del Cliente
- `client_name`: Nombre del cliente
- `client_email`: Email del cliente (validado como EmailStr)
- `client_passport`: Número de pasaporte
- `client_nie`: Número de NIE
- `client_nationality`: Nacionalidad
- `client_address`: Dirección
- `client_city`: Ciudad
- `client_province`: Provincia
- `client_postal_code`: Código postal

### Estado y Pago
- `status`: Estado del pago (pending, completed, paid, failed)
- `external_id`: ID externo (ej: Stripe Payment Intent ID)
- `payment_method`: Método de pago
- `kyc_status`: Estado de verificación KYC
- `completed_at`: Fecha de completado

### Montos y Configuración
- `amount`: Monto total (en centavos)
- `currency`: Moneda (default: EUR)
- `payment_type`: Tipo de pago (one_time, subscription)
- `grade`: Grado del cliente (A, B, C, T)

### Servicio
- `service_name`: Nombre del servicio
- `service_description`: Descripción del servicio
- `catalog_item_id`: ID del ítem del catálogo

### Pago Manual
- `manual_payment_note`: Nota sobre el pago manual
- `manual_payment_method`: Método de pago manual
- `manual_payment_confirmed`: Confirmación de pago manual

### Suscripción
- `subscription_id`: ID de suscripción (Stripe)
- `subscription_status`: Estado de suscripción

### Contratos
- `contract_pdf_url`: URL del contrato PDF
- `final_contract_url`: URL del contrato final

### Expiración
- `expires_in_days`: Días hasta expiración (actualiza `hiring_code_expires_at`)

---

## 🔧 Implementación Frontend

### Servicio

**Archivo**: `src/services/contractsService.ts`

```typescript
async updateContract(code: string, request: ContractUpdateRequest): Promise<Contract> {
  const body: any = {};
  
  // Solo incluir campos que están presentes en el request
  if (request.status !== undefined) body.status = request.status;
  if (request.amount !== undefined) body.amount = Math.round(request.amount * 100); // Convert to cents
  if (request.manual_payment_confirmed !== undefined) body.manual_payment_confirmed = request.manual_payment_confirmed;
  if (request.manual_payment_method !== undefined) body.manual_payment_method = request.manual_payment_method;
  if (request.manual_payment_note !== undefined) body.manual_payment_note = request.manual_payment_note;
  // ... más campos
  
  const { data } = await api.patch<Contract>(`/admin/contracts/${code}`, body, {
    headers: {
      'X-Admin-Password': 'Pomelo2005.1',
    },
  });
  
  return normalizeHiringCode(data);
}
```

### UI

**Archivo**: `src/pages/admin/AdminContractDetail.tsx`

- Modal para modificar estado y capturar importe
- Botón "Modificar Estado y Pago" en Acciones Rápidas
- Formulario con validaciones
- Feedback visual al guardar

---

## 📚 Ejemplos de Uso

### Actualizar Información del Cliente

```json
{
  "client_name": "María García",
  "client_email": "maria@example.com",
  "client_nie": "X1234567Y"
}
```

### Actualizar Monto y Estado (uso desde frontend)

```json
{
  "amount": 40000,
  "status": "paid"
}
```

### Actualizar Pago Manual

```json
{
  "manual_payment_note": "Pago recibido por transferencia",
  "manual_payment_method": "Transferencia bancaria",
  "manual_payment_confirmed": true,
  "status": "paid"
}
```

### Extender Expiración

```json
{
  "expires_in_days": 60
}
```

---

## 🔗 Endpoints Relacionados

- `GET /api/admin/contracts/{code}` - Obtener contrato
- `POST /api/admin/contracts/` - Crear contrato
- `DELETE /api/admin/contracts/{code}` - Eliminar contrato
- `POST /api/admin/contracts/{code}/expire` - Expirar código

---

## ✅ Estado

- [x] Endpoint implementado en backend
- [x] Schema actualizado con todos los campos
- [x] Servicio actualizado para manejar expires_in_days
- [x] Validaciones implementadas
- [x] Frontend integrado con este endpoint
- [x] Documentación completa

---

## 📝 Notas

- El endpoint sigue el patrón de autenticación de otros endpoints admin (contraseña fija)
- Solo se actualizan los campos proporcionados (comportamiento PATCH estándar)
- El campo `expires_in_days` calcula automáticamente la nueva fecha de expiración
- La respuesta incluye todos los campos del contrato, no solo los actualizados
- El frontend convierte importes de euros a centavos antes de enviar
- El backend acepta cualquier string como estado, pero los valores documentados son los estándar

---

**Última actualización**: 2025-01-20  
**Referencia Frontend**: `docs/BACKEND_CONTRACT_STATUS_UPDATE.md`





