# Instrucciones para el Backend: Pago Manual en Hiring Codes

## Resumen
El administrador ahora puede marcar en el dashboard (`/contrato/dashboard`) que un cliente ya pagó por otro medio (transferencia, efectivo, etc.) antes de crear el código de contratación. Cuando el cliente accede al flujo público con ese código, **NO** debe pasar por Stripe y puede firmar el contrato directamente.

---

## 1. Nuevos Campos en `POST /admin/hiring/create`

Agregar los siguientes campos opcionales al endpoint de creación de códigos:

```json
{
  "manual_payment_confirmed": boolean,
  "manual_payment_note": string,
  "manual_payment_method": string
}
```

### Descripción de los campos:
- `manual_payment_confirmed` (boolean): Indica si el admin confirmó que el pago ya fue realizado. Default: `false`.
- `manual_payment_note` (string, opcional): Nota descriptiva de cómo se realizó el pago (ej: "Transferencia bancaria del 24/11/2025 - Referencia 123456").
- `manual_payment_method` (string, opcional): Método de pago registrado (ej: "Pago previo registrado: Transferencia bancaria...").

### Almacenamiento:
- Guardar estos campos en la tabla de hiring codes o el modelo correspondiente.
- Estos campos deben persistir junto con el código para que puedan consultarse después.

---

## 2. Modificar `GET /hiring/{code}`

El endpoint que devuelve los detalles del hiring code debe incluir los nuevos campos:

```json
{
  "id": 123,
  "hiring_code": "ABC123",
  "client_name": "Juan Pérez",
  "client_email": "cliente@ejemplo.com",
  "service_name": "Residencia Legal en España",
  "amount": 40000,
  "currency": "EUR",
  "status": "pending",
  "manual_payment_confirmed": true,
  "manual_payment_note": "Transferencia bancaria del 24/11/2025 - Referencia 123456",
  "manual_payment_method": "Pago previo registrado: Transferencia bancaria...",
  ...
}
```

### Comportamiento:
- Si `manual_payment_confirmed` es `true`, el frontend mostrará un mensaje indicando que el pago ya está registrado y permitirá al cliente saltar directamente a la firma.

---

## 3. Omitir Stripe cuando `manual_payment_confirmed = true`

### En el flujo de pago:
- **`POST /hiring/{code}/checkout`**: Si `manual_payment_confirmed` es `true`, este endpoint puede:
  - Retornar un error indicando que el pago ya fue confirmado (código 400 o similar), O
  - Retornar una respuesta vacía/mock para que el frontend no intente crear la sesión de Stripe.

- **`POST /hiring/{code}/payment`**: Similar al anterior, debe fallar o retornar mock si `manual_payment_confirmed = true`.

### Recomendación:
Agregar validación temprana en estos endpoints:
```python
if hiring_code.manual_payment_confirmed:
    return {"error": "El pago ya fue confirmado por el administrador", "manual_payment": True}
```

---

## 4. Generar Contrato con Nota de Pago Manual

### En `POST /hiring/{code}/confirm` o endpoint similar:
- Si `manual_payment_confirmed` es `true`, incluir la nota de pago en los datos del contrato.
- El PDF generado debe mostrar la información del pago manual en lugar de datos de Stripe.

### Campos a incluir en el contrato:
- `payment_method`: "Pago previo registrado: [nota]"
- `payment_date`: Fecha de creación del código o fecha actual
- `payment_note`: Contenido de `manual_payment_note`
- `payment_status`: "Confirmado por administrador"

### Ejemplo de metadatos para el PDF:
```python
payment_data = {
    "paymentIntentId": "manual_payment",
    "stripeTransactionId": f"manual_{hiring_code.id}_{timestamp}",
    "paymentDate": datetime.now().isoformat(),
    "paymentMethod": hiring_code.manual_payment_method,
    "paymentNote": hiring_code.manual_payment_note,
}
```

---

## 5. Actualizar Estado del Código

### Cuando el cliente completa la firma:
- Si `manual_payment_confirmed` es `true`, marcar el código como `paid` o `completed` automáticamente.
- No debe requerirse confirmación adicional de Stripe webhook.

---

## 6. Validaciones y Seguridad

1. **Validar que `manual_payment_confirmed` solo puede ser seteado por un admin autenticado** en `POST /admin/hiring/create`.
2. **No permitir que el cliente modifique** estos campos desde el frontend público.
3. **Registrar en logs** cuando se crea un código con pago manual para auditoría.

---

## 7. Migración de Datos (Opcional)

Si ya existen códigos en la base de datos:
- Agregar los nuevos campos con valores por defecto:
  - `manual_payment_confirmed = false`
  - `manual_payment_note = null`
  - `manual_payment_method = null`

---

## 8. Testing

### Casos de prueba sugeridos:

1. **Crear código sin pago manual**:
   - El flujo debe funcionar normalmente con Stripe.

2. **Crear código con pago manual**:
   - `manual_payment_confirmed = true`
   - `manual_payment_note = "Transferencia bancaria"`
   - Verificar que `GET /hiring/{code}` devuelve los campos correctamente.

3. **Intentar crear checkout con pago manual confirmado**:
   - `POST /hiring/{code}/checkout` debe fallar o retornar mock.

4. **Generar contrato con pago manual**:
   - Verificar que el PDF incluye la nota de pago manual.
   - Verificar que no se muestran datos de Stripe.

5. **Completar flujo sin Stripe**:
   - El cliente debe poder firmar y completar sin pasar por paso de pago.

---

## 9. Respuestas de Error Sugeridas

### Si se intenta crear checkout con pago manual confirmado:
```json
{
  "error": "payment_already_confirmed",
  "message": "El pago ya fue confirmado por el administrador. No es necesario usar Stripe.",
  "manual_payment": true,
  "manual_payment_note": "Transferencia bancaria del 24/11/2025"
}
```

---

## 10. Ejemplo Completo de Flujo

### 1. Admin crea código con pago manual:
```bash
POST /admin/hiring/create
{
  "client_name": "Juan Pérez",
  "client_email": "juan@ejemplo.com",
  "service_name": "Residencia Legal",
  "amount": 40000,
  "currency": "EUR",
  "manual_payment_confirmed": true,
  "manual_payment_note": "Transferencia bancaria del 24/11/2025 - Ref: 123456"
}
```

### 2. Cliente accede al código:
```bash
GET /hiring/ABC123
# Respuesta incluye:
{
  "manual_payment_confirmed": true,
  "manual_payment_note": "Transferencia bancaria del 24/11/2025 - Ref: 123456"
}
```

### 3. Frontend muestra mensaje:
> "El administrador confirmó que el pago ya fue realizado. Puedes continuar directamente con la firma del contrato."

### 4. Cliente firma contrato:
- El backend genera el PDF con la nota de pago manual.
- El código se marca como `completed`.
- Se envía el contrato por email.

---

## 11. Documentación Adicional

Ver también:
- `src/pages/AdminDashboard.tsx` - Frontend del formulario admin
- `src/components/PaymentForm.tsx` - Frontend del flujo de pago
- `src/types/hiring.ts` - Tipos TypeScript actualizados
- `plan.md` - Documentación del proyecto

---

**Última actualización:** 19 de Noviembre de 2025
**Autor:** Sistema de contratación Migro

