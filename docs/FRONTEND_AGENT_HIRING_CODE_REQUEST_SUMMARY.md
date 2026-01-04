# ✅ Resumen: Contrato a Petición para Agentes - Frontend

**Fecha**: 2025-01-28  
**Versión**: 1.0  
**Estado**: ✅ Backend Implementado - Frontend Pendiente  
**Módulo**: Frontend - CRM Opportunities

---

## 🎯 Objetivo

Permitir que un agente, desde la ficha de una oportunidad, pueda solicitar un código de contratación (hiring code) confirmando con su firma que la situación está completada previa al expediente.

---

## 📡 Endpoint API

### Solicitar Código de Contratación

```http
POST /api/pipelines/stages/{entity_type}/{entity_id}/request-hiring-code
```

**Autenticación**: Requerida (Bearer Token)

**Parámetros de Ruta**:
- `entity_type`: `"contacts"` o `"leads"`
- `entity_id`: UUID del contacto o lead

---

## 📝 Request Body

### Campos Requeridos

```typescript
{
  agent_signature: string;        // Firma digital del agente (obligatorio)
  contract_template: string;       // Plantilla del contrato (ej: "standard")
  // Uno de estos dos:
  catalog_item_id?: number;       // ID del servicio del catálogo
  service_name?: string;          // O nombre del servicio en texto libre
  // Uno de estos dos:
  amount?: number;                // Monto en centavos (ej: 40000 = 400.00 EUR)
  grade?: "A" | "B" | "C" | "T";  // O grado del cliente para calcular precio
}
```

### Campos Opcionales

```typescript
{
  currency?: string;              // Default: "EUR"
  expires_in_days?: number;       // Default: 30 (1-365)
  description?: string;            // Descripción adicional
  payment_type?: "one_time" | "subscription"; // Default: "one_time"
  
  // Información del cliente (se obtiene del contacto si no se proporciona)
  client_name?: string;
  client_email?: string;
  client_passport?: string;
  client_nie?: string;
  client_nationality?: string;
  client_address?: string;
  client_city?: string;
  client_province?: string;
  client_postal_code?: string;
  
  // Tipo de servicio (se obtiene de la oportunidad si no se proporciona)
  tipo_servicio?: string;         // hoja_1, hoja_2, ..., nacionalidad, asilo
  tipo_servicio_especificacion?: string; // Requerido si tipo_servicio es nacionalidad/asilo
  
  // Pago manual
  manual_payment_note?: string;
  manual_payment_method?: string;
  manual_payment_confirmed?: boolean;
}
```

---

## ✅ Response

```typescript
{
  success: boolean;
  message: string;
  hiring_code: string;           // Código generado (ej: "ABC12")
  hiring_code_id: null;          // Siempre null (HiringPayment usa ID numérico)
  pipeline_stage_id: string;     // UUID del pipeline stage
  email_sent: boolean;           // Si el email se envió al admin
}
```

---

## 🎨 Componente Frontend Sugerido

### Estructura del Formulario

```
┌─────────────────────────────────────────┐
│ Solicitar Código de Contratación        │
├─────────────────────────────────────────┤
│                                         │
│ 1. Firma del Agente *                  │
│    [___________________________]        │
│                                         │
│ 2. Tipo de Servicio                     │
│    [Selector: Catálogo o Texto Libre]   │
│    - Si catálogo: [Dropdown]            │
│    - Si texto libre:                    │
│      Nombre: [___________]              │
│      Descripción: [___________]         │
│                                         │
│ 3. Precio                               │
│    ○ Monto fijo: [€_____]               │
│    ○ Por grado: [A/B/C/T ▼]            │
│                                         │
│ 4. Configuración del Contrato           │
│    Plantilla: [standard ▼]              │
│    Tipo de pago: [one_time ▼]          │
│    Expira en: [30] días                │
│                                         │
│ 5. Información del Cliente              │
│    (Opcional - se obtiene del contacto) │
│    Nombre: [___________]                │
│    Email: [___________]                 │
│    ...                                  │
│                                         │
│ [Cancelar]  [Solicitar Código]          │
└─────────────────────────────────────────┘
```

---

## 🔄 Flujo de Usuario

### 1. Agente Abre Oportunidad
- Ve botón "Solicitar Código de Contratación"
- Solo visible si:
  - La situación está completada (`situacion_migrante` existe)
  - El pipeline está en `agent_initial` o `lawyer_validation`

### 2. Agente Completa Formulario
- **Firma**: Escribe su nombre completo
- **Servicio**: Selecciona del catálogo o escribe nombre personalizado
- **Precio**: Elige monto fijo o grado del cliente
- **Configuración**: Ajusta plantilla, tipo de pago, expiración
- **Cliente**: Opcional (se auto-completa del contacto)

### 3. Validación en Tiempo Real
- ✅ Firma no vacía
- ✅ Servicio seleccionado (catálogo o texto libre)
- ✅ Precio definido (monto o grado)
- ✅ Plantilla seleccionada
- ⚠️ Si subscription: monto debe ser divisible por 100

### 4. Envío de Solicitud
- Botón "Solicitar Código" se habilita cuando todo es válido
- Loading state durante el envío
- Deshabilitar formulario mientras procesa

### 5. Respuesta y Feedback
- **Éxito**: 
  - Mostrar código generado destacado
  - Mensaje: "Código generado exitosamente. Email enviado al administrador."
  - Botón para copiar código
  - Opción para ver detalles del contrato
- **Error**: 
  - Mostrar mensaje de error específico
  - Mantener formulario editable
  - Resaltar campos con error

---

## 🎨 Mejoras de UX

### 1. Auto-completado Inteligente

```typescript
// Si hay oportunidad con tipo_servicio, pre-llenar
if (opportunity?.tipo_servicio) {
  formData.tipo_servicio = opportunity.tipo_servicio;
  formData.tipo_servicio_especificacion = opportunity.tipo_servicio_especificacion;
}

// Si hay contacto, pre-llenar datos del cliente
if (contact) {
  formData.client_name = contact.full_name || contact.name;
  formData.client_email = contact.email;
  // ... otros campos
}
```

### 2. Validación Progresiva

- Validar campos al perder foco (onBlur)
- Mostrar errores inline debajo de cada campo
- Botón de envío deshabilitado hasta que todo sea válido
- Mensajes de error claros y específicos

### 3. Feedback Visual

- **Loading**: Spinner en botón durante envío
- **Éxito**: Modal con código destacado + opción copiar
- **Error**: Mensaje rojo con detalles específicos
- **Confirmación**: "¿Está seguro?" antes de enviar (opcional)

### 4. Mobile-First

- Formulario en steps/wizard para mobile
- Campos grandes y touch-friendly (≥44px)
- Scroll suave entre secciones
- Bottom sheet para selección de catálogo

---

## ✅ Validaciones Frontend

### Validaciones en Tiempo Real

1. **Firma**: No vacía, mínimo 3 caracteres
2. **Servicio**: `catalog_item_id` O `service_name` (uno requerido)
3. **Precio**: `amount` O `grade` (uno requerido, no ambos)
4. **Subscription**: Si `payment_type === "subscription"` y hay `amount`, debe ser divisible por 100
5. **Plantilla**: Requerida
6. **Cliente**: `client_name` y `client_email` requeridos (se obtienen del contacto si no se proporcionan)

### Mensajes de Error

```typescript
const errorMessages = {
  agent_signature: "La firma del agente es requerida",
  service_info: "Debe seleccionar un servicio del catálogo o escribir el nombre del servicio",
  pricing: "Debe especificar un monto fijo o seleccionar el grado del cliente",
  pricing_both: "No puede especificar monto y grado simultáneamente",
  subscription_amount: "Para pagos de suscripción, el monto debe ser divisible por 100",
  contract_template: "La plantilla del contrato es requerida",
  client_info: "Se requiere nombre y email del cliente",
};
```

---

## 🎯 Estados del Componente

### Estados Posibles

1. **Initial**: Formulario vacío, listo para completar
2. **Filling**: Usuario completando campos
3. **Validating**: Validación en tiempo real
4. **Submitting**: Enviando solicitud (loading)
5. **Success**: Código generado, mostrar resultado
6. **Error**: Error en la solicitud, mostrar mensaje

---

## 📊 Integración con Oportunidad

### Pre-llenado desde Oportunidad

```typescript
// Si la oportunidad tiene tipo_servicio, usarlo
if (opportunity?.tipo_servicio) {
  formData.tipo_servicio = opportunity.tipo_servicio;
  formData.tipo_servicio_especificacion = opportunity.tipo_servicio_especificacion;
}

// Si hay resumen de llamada, mostrarlo como referencia
if (opportunity?.first_call_summary) {
  // Mostrar en sección de referencia/contexto
}
```

---

## 🔔 Notificaciones y Feedback

### Después de Solicitar

1. **Modal de Éxito**:
   - Código destacado y grande
   - Botón "Copiar Código"
   - Mensaje: "Email enviado al administrador"
   - Botón "Ver Detalles del Contrato"
   - Botón "Cerrar"

2. **Actualización de UI**:
   - Pipeline stage actualizado a `admin_contract`
   - Badge/indicador de "Código Generado"
   - Historial en notas del pipeline

---

## 📚 Documentación Relacionada

- `docs/FRONTEND_AGENT_HIRING_CODE_REQUEST_TECHNICAL.md` - Guía técnica detallada
- `docs/FRONTEND_AGENT_HIRING_CODE_REQUEST_INTEGRATION.md` - Guía de integración
- `docs/FRONTEND_AGENT_HIRING_CODE_REQUEST_TESTING.md` - Guía de testing
- `docs/FRONTEND_AGENT_HIRING_CODE_REQUEST_QUICK_START.md` - Quick start guide
- **Backend**: `docs/agent_hiring_code_request_system.md`

---

## ✅ Checklist de Implementación Frontend

- [ ] Crear componente `RequestHiringCodeForm`
- [ ] Implementar validaciones en tiempo real
- [ ] Pre-llenar datos desde oportunidad/contacto
- [ ] Manejar estados (loading, success, error)
- [ ] Mostrar código generado destacado
- [ ] Implementar copia al portapapeles
- [ ] Diseño mobile-first
- [ ] Testing en dispositivos móviles
- [ ] Validar accesibilidad
- [ ] Integrar en ficha de oportunidad

---

**Última actualización**: 2025-01-28
