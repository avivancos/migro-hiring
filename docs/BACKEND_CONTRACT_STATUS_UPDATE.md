# ✅ Funcionalidad: Modificar Estado de Contrato y Capturar Importe

**Fecha**: 2025-01-16  
**Estado**: ✅ Implementado  
**Módulo**: Admin - Contratos

---

## 📋 Resumen

Se ha implementado la funcionalidad para modificar el estado de un contrato y capturar el importe de forma externa desde el panel de administración. Esta funcionalidad permite a los administradores actualizar manualmente el estado de los contratos (por ejemplo, marcarlos como "pagado") y registrar importes cuando el pago se realiza fuera del sistema (transferencia bancaria, efectivo, etc.).

---

## 🎯 Características Implementadas

### ✅ Funcionalidades Principales

1. **Modificación de Estado**
   - Permite cambiar el estado del contrato: `pending`, `paid`, `completed`, `expired`, `cancelled`
   - Validación del estado seleccionado
   - Actualización en tiempo real en la UI

2. **Captura de Importe**
   - Campo para ingresar el importe pagado
   - Validación de importe positivo
   - Muestra el importe actual del contrato como referencia
   - Formato de moneda (EUR)

3. **Registro de Pago Externo**
   - Opción para marcar si el pago fue realizado externamente
   - Campos opcionales para método de pago y notas
   - Solo se muestra cuando el estado es `paid` o `completed`

4. **Gestión de Suscripciones**
   - Selector de tipo de pago (Pago Único / Suscripción)
   - Campo para Subscription ID de Stripe
   - Selector de estado de suscripción (active, canceled, past_due, etc.)
   - Solo se muestra cuando el tipo de pago es "Suscripción"

5. **Pagos Parciales**
   - Campo para capturar el monto del primer pago
   - Útil para suscripciones donde se paga un porcentaje inicial
   - Se muestra cuando el tipo de pago es "Suscripción"

6. **UI/UX**
   - Modal/diálogo responsive y mobile-first
   - Formulario intuitivo con validaciones
   - Botón destacado en "Acciones Rápidas"
   - Feedback visual al guardar cambios

---

## 📁 Archivos Modificados

### 1. `src/services/contractsService.ts`

**Cambios:**
- ✅ Implementado el método `updateContract()` que estaba pendiente
- Utiliza `PATCH /admin/contracts/{code}` con header `X-Admin-Password`
- Soporta actualización parcial de campos
- Convierte el importe a centavos antes de enviarlo

**Código Implementado:**

```typescript
async updateContract(code: string, request: ContractUpdateRequest): Promise<Contract> {
  const body: any = {};
  
  // Solo incluir campos que están presentes en el request
  if (request.service_name !== undefined) body.service_name = request.service_name;
  if (request.amount !== undefined) body.amount = Math.round(request.amount * 100); // Convert to cents
  if (request.status !== undefined) body.status = request.status;
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

### 2. `src/pages/admin/AdminContractDetail.tsx`

**Cambios:**
- ✅ Agregado estado para controlar el modal (`showUpdateStatusModal`)
- ✅ Agregado estado para el formulario (`updateForm`)
- ✅ Implementadas funciones `handleOpenUpdateStatusModal`, `handleCloseUpdateStatusModal`, `handleUpdateStatus`
- ✅ Agregado botón "Modificar Estado y Pago" en "Acciones Rápidas"
- ✅ Implementado modal con formulario completo

**Funcionalidades del Modal:**

1. **Selector de Tipo de Pago**
   - Dropdown: "Pago Único" o "Suscripción"
   - Valor inicializado con el tipo actual del contrato

2. **Selector de Estado**
   - Dropdown con todos los estados disponibles
   - Valor inicializado con el estado actual del contrato

3. **Campo de Importe Total**
   - Input numérico con validación
   - Muestra el importe actual como referencia
   - Validación de importe positivo requerido

4. **Campos de Suscripción** (solo si tipo de pago es "Suscripción")
   - **Primer Pago / Pago Parcial**: Input numérico para el monto del primer pago
   - **Subscription ID**: Campo de texto para el ID de Stripe (ej: `sub_xxxxxxxxxxxxx`)
   - **Estado de Suscripción**: Dropdown con opciones (active, canceled, past_due, unpaid, incomplete, trialing)
   - Muestra valores actuales como referencia

5. **Opciones de Pago Externo** (solo si estado es `paid` o `completed`)
   - Checkbox "Pago realizado externamente"
   - Campo opcional para método de pago
   - Campo opcional para notas sobre el pago

4. **Acciones**
   - Botón "Cancelar" para cerrar sin guardar
   - Botón "Guardar Cambios" con validación

---

## 🔌 Endpoint del Backend

### **PATCH `/api/admin/contracts/{code}`**

✅ **ESTADO**: Implementado en el backend (2025-01-20)

Este endpoint acepta actualizaciones parciales de contratos (comportamiento PATCH estándar).

**Headers:**
```
X-Admin-Password: Pomelo2005.1
Content-Type: application/json
```

**Body (ejemplo):**
```json
{
  "status": "paid",
  "amount": 40000,
  "manual_payment_confirmed": true,
  "manual_payment_method": "Transferencia bancaria",
  "manual_payment_note": "Transferencia del 24/11/2025 - Ref 123456"
}
```

**Campos Aceptados (todos opcionales):**
- `status` (string): Estado del contrato (`pending`, `paid`, `completed`, `failed`)
- `amount` (number): Importe en centavos (ej: 40000 = 400.00 EUR)
- `currency` (string): Moneda (default: EUR)
- `manual_payment_confirmed` (boolean): Si el pago fue confirmado manualmente
- `manual_payment_method` (string): Método de pago externo
- `manual_payment_note` (string): Notas sobre el pago
- Información del cliente: `client_name`, `client_email`, `client_passport`, `client_nie`, etc.
- Información del servicio: `service_name`, `service_description`
- Configuración: `grade`, `payment_type`, `expires_in_days`
- Ver documentación completa del backend para todos los campos

**Response (200 OK):**
```json
{
  "id": 123,
  "hiring_code": "ABC123",
  "status": "paid",
  "amount": 40000,
  "currency": "EUR",
  "manual_payment_confirmed": true,
  "manual_payment_method": "Transferencia bancaria",
  "manual_payment_note": "Transferencia del 24/11/2025 - Ref 123456",
  ...
}
```

**Nota sobre Estados:**
- El backend acepta: `pending`, `paid`, `completed`, `failed`
- El frontend también permite `expired` y `cancelled` en la UI
- El backend procesará cualquier string como estado, pero los valores documentados son los estándar

---

## 🎨 Flujo de Usuario

### Modificar Estado y Capturar Importe

1. El administrador accede al detalle de un contrato (`/admin/contracts/{code}`)
2. Hace clic en el botón "Modificar Estado y Pago" en "Acciones Rápidas"
3. Se abre un modal con el formulario:
   - Selecciona el nuevo estado del contrato
   - Ingresa el importe pagado
   - Si el estado es `paid` o `completed`, puede marcar "Pago realizado externamente"
   - Si marca pago externo, puede agregar método y notas opcionales
4. Hace clic en "Guardar Cambios"
5. El sistema valida los datos y envía la actualización al backend
6. Si tiene éxito, el contrato se actualiza y el modal se cierra
7. Se muestra un mensaje de confirmación

---

## 🔒 Validaciones Implementadas

1. **Importe**
   - Debe ser un número positivo
   - Campo requerido
   - Validación antes de habilitar el botón "Guardar"

2. **Estado**
   - Debe ser uno de los estados válidos
   - Campo requerido con valor por defecto

3. **Pago Externo**
   - Solo se muestra si el estado es `paid` o `completed`
   - Los campos de método y nota son opcionales

---

## 📱 Diseño Responsive

El modal está diseñado con enfoque mobile-first:

- **Móvil**: Modal ocupa el ancho completo con padding
- **Desktop**: Modal con ancho máximo de `max-w-md`
- **Scroll**: Si el contenido es largo, el modal tiene scroll interno
- **Overlay**: Fondo oscuro semitransparente para destacar el modal

---

## 🧪 Casos de Uso

### Caso 1: Marcar Contrato como Pagado con Importe Externo

1. Contrato con estado `pending`
2. Cliente realizó transferencia bancaria
3. Admin marca estado como `paid`
4. Ingresa el importe: `400.00`
5. Marca "Pago realizado externamente"
6. Ingresa método: "Transferencia bancaria"
7. Ingresa nota: "Transferencia del 24/11/2025 - Ref 123456"
8. Guarda cambios

### Caso 2: Actualizar Solo el Estado

1. Contrato con estado `pending`
2. Admin cambia estado a `completed`
3. Mantiene el importe actual
4. Guarda cambios

### Caso 3: Actualizar Solo el Importe

1. Contrato con estado `paid`
2. Se corrige el importe pagado
3. Admin actualiza el importe
4. Mantiene el estado actual
5. Guarda cambios

### Caso 4: Registrar Suscripción con Pago Parcial

1. Contrato con tipo de pago "Pago Único"
2. Admin cambia a "Suscripción"
3. Ingresa importe total: `480.00`
4. Ingresa primer pago: `48.00` (10%)
5. Ingresa Subscription ID: `sub_1PqR8sT9uVwX2yZ3`
6. Selecciona estado de suscripción: "Activa"
7. Guarda cambios

### Caso 5: Actualizar Estado de Suscripción

1. Contrato con suscripción activa
2. Admin actualiza el estado de suscripción a "Cancelada"
3. Opcionalmente actualiza el Subscription ID
4. Guarda cambios

---

## 🔄 Integración con Backend

### Notas Importantes

1. **Endpoint Requerido**: El backend debe implementar `PATCH /admin/contracts/{code}`
2. **Conversión de Importe**: El frontend envía el importe en centavos (multiplica por 100)
3. **Autenticación**: Se usa `X-Admin-Password` header para autenticación
4. **Actualización Parcial**: Solo se envían los campos que se desean actualizar

### Estructura de Datos

El `ContractUpdateRequest` incluye:

```typescript
{
  status?: ContractStatus;
  amount?: number; // Se convierte a centavos antes de enviar
  manual_payment_confirmed?: boolean;
  manual_payment_method?: string;
  manual_payment_note?: string;
  // ... otros campos opcionales
}
```

---

## ✅ Checklist de Implementación

- [x] Implementar método `updateContract` en `contractsService`
- [x] Agregar estado para controlar el modal
- [x] Crear formulario en el modal
- [x] Agregar botón "Modificar Estado y Pago"
- [x] Implementar validaciones
- [x] Manejar errores y mostrar feedback
- [x] Actualizar UI después de guardar
- [x] Diseño responsive
- [x] Documentación completa

---

## ✅ Estado del Backend

El endpoint ya está implementado y funcional:

- ✅ Endpoint `PATCH /api/admin/contracts/{code}` implementado
- ✅ Validación del header `X-Admin-Password`
- ✅ Acepta actualización parcial de campos (PATCH)
- ✅ Maneja importe en centavos correctamente
- ✅ Actualiza campos en la base de datos
- ✅ Retorna el contrato actualizado con todos los detalles

**Referencia**: Ver documentación completa del endpoint en el backend para más detalles sobre campos disponibles y validaciones.

---

## 📝 Notas Técnicas

1. **Conversión de Importe**: 
   - El frontend muestra y recibe el importe en euros (formato decimal)
   - Se convierte a centavos (entero) antes de enviar al backend
   - Ejemplo: `400.00` → `40000` centavos
   - El backend espera y almacena el importe en centavos

2. **Estados Válidos**:
   - **Frontend permite**: `pending`, `paid`, `completed`, `expired`, `cancelled`
   - **Backend documentado**: `pending`, `paid`, `completed`, `failed`
   - El backend acepta cualquier string como estado, pero los valores documentados son los estándar
   - Nota: Los estados `expired` y `cancelled` son manejados por el frontend y deberían funcionar

3. **Pago Externo**:
   - Solo se muestra en el formulario si el estado es `paid` o `completed`
   - Los campos son opcionales pero útiles para registro
   - El backend acepta estos campos independientemente del estado

4. **Suscripciones**:
   - El tipo de pago puede cambiarse entre "one_time" y "subscription"
   - Cuando es suscripción, se pueden capturar:
     - `subscription_id`: ID de la suscripción en Stripe
     - `subscription_status`: Estado de la suscripción
     - `first_payment_amount`: Monto del primer pago (en centavos)
   - El frontend convierte el importe del primer pago de euros a centavos antes de enviar

5. **Pagos Parciales**:
   - El campo `first_payment_amount` permite registrar el monto del primer pago
   - Útil para suscripciones donde se paga un porcentaje inicial (normalmente 10%)
   - Se muestra solo cuando el tipo de pago es "subscription"

4. **Autenticación**:
   - No requiere JWT token
   - Solo requiere header `X-Admin-Password: Pomelo2005.1`
   - Este patrón se usa consistentemente en endpoints admin

5. **Actualización Parcial**:
   - Solo se envían los campos que se desean actualizar
   - Los campos no incluidos mantienen su valor actual
   - Comportamiento estándar de PATCH

---

**Última actualización**: 2025-01-16  
**Autor**: Sistema de Documentación Automática

