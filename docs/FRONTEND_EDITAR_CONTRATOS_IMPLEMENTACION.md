# 📝 Implementación: Editar Contratos en Página de Detalle Admin

**Fecha**: 2025-01-28  
**Ruta**: `/admin/contracts/{code}` (ej: `https://crm.migro.es/admin/contracts/J2WLE`)  
**Estado**: ✅ Implementado

---

## 🎯 Objetivo

Agregar funcionalidad de edición completa de contratos en la página de detalle del admin (`/admin/contracts/{code}`), permitiendo editar cualquier campo del contrato mediante un modal de edición completo.

---

## 📋 Archivos Modificados/Creados

### 1. Tipos TypeScript
**Archivo**: `src/types/contracts.ts`

Se actualizó la interfaz `ContractUpdateRequest` para incluir todos los campos editables:

```typescript
export interface ContractUpdateRequest {
  // Estado y configuración
  status?: ContractStatus;
  payment_type?: PaymentType;
  grade?: ClientGrade;
  currency?: string;
  amount?: number; // En centavos
  kyc_status?: KYCStatus;
  
  // Cliente
  client_name?: string;
  client_email?: string;
  client_passport?: string;
  client_nie?: string;
  client_nationality?: string;
  client_address?: string;
  client_city?: string;
  client_province?: string;
  client_postal_code?: string;
  
  // Servicio
  service_name?: string;
  service_description?: string;
  
  // Pago manual
  manual_payment_confirmed?: boolean;
  manual_payment_method?: string;
  manual_payment_note?: string;
  
  // Suscripción
  subscription_id?: string;
  subscription_status?: string;
  
  // Pago parcial
  first_payment_amount?: number;
  
  // Expiración
  expires_in_days?: number;
  
  // Notas
  notes?: string;
}
```

### 2. Servicio de API
**Archivo**: `src/services/contractsService.ts`

Se actualizó el método `updateContract` para manejar todos los campos nuevos, incluyendo:
- `kyc_status`
- `client_nationality`
- `expires_in_days`

El método ya estaba implementado y funcionando, solo se agregaron los campos faltantes.

### 3. Componente Modal de Edición
**Archivo**: `src/components/contracts/EditContractModal.tsx` (NUEVO)

Componente modal completo que permite editar todos los campos del contrato:

**Características**:
- Formulario organizado en secciones:
  - Estado y Configuración
  - Información del Cliente
  - Servicio
  - Pago Manual
  - Suscripción (condicional)
  - Expiración
- Conversión automática entre euros y centavos
- Validaciones básicas
- Cálculo automático de días hasta expiración
- UI responsive con scroll para contenido largo

**Props**:
```typescript
interface EditContractModalProps {
  contract: Contract;
  visible: boolean;
  onClose: () => void;
  onSuccess?: (updatedContract: Contract) => void;
}
```

### 4. Integración en Página de Detalle
**Archivo**: `src/pages/admin/AdminContractDetail.tsx`

**Cambios realizados**:
1. Import del componente `EditContractModal`
2. Estado `showEditModal` para controlar visibilidad
3. Botón "Editar Contrato" en el header (verde, con icono de lápiz)
4. Handler `onSuccess` que actualiza el contrato y recarga los datos

**Ubicación del botón**:
- En el header, junto a los botones "Copiar Link", "Abrir", "Descargar"
- Estilo: `bg-green-600 hover:bg-green-700 text-white`
- Icono: `Pencil` de lucide-react

---

## 🔧 Funcionalidades Implementadas

### Campos Editables

#### Estado y Configuración
- ✅ Estado del contrato (pending, paid, completed, expired, cancelled)
- ✅ Tipo de pago (one_time, subscription)
- ✅ Grado (A, B, C, T)
- ✅ Moneda (EUR, USD)
- ✅ Monto total (en euros, se convierte a centavos)
- ✅ Estado KYC (null, pending, verified, failed)

#### Información del Cliente
- ✅ Nombre
- ✅ Email
- ✅ Pasaporte
- ✅ NIE
- ✅ Nacionalidad
- ✅ Dirección
- ✅ Ciudad
- ✅ Provincia
- ✅ Código Postal

#### Servicio
- ✅ Nombre del servicio
- ✅ Descripción del servicio

#### Pago Manual
- ✅ Pago confirmado (checkbox)
- ✅ Método de pago
- ✅ Nota de pago

#### Suscripción (solo si payment_type === 'subscription')
- ✅ ID de suscripción (Stripe)
- ✅ Estado de suscripción

#### Expiración
- ✅ Días hasta expiración (1-365 días)

---

## 🎨 UI/UX

### Modal de Edición
- **Tamaño**: `xl` (max-width: 1280px)
- **Scroll**: Contenido con scroll vertical si es muy largo
- **Secciones**: Divididas con títulos y bordes
- **Responsive**: Grid adaptativo (1 columna móvil, 2-3 columnas desktop)

### Botón de Edición
- **Ubicación**: Header de la página de detalle
- **Estilo**: Verde (`bg-green-600`) para destacar acción principal
- **Icono**: Lápiz (`Pencil`)
- **Texto**: "Editar Contrato"

### Feedback al Usuario
- **Loading**: Botón muestra "Guardando..." durante la actualización
- **Éxito**: El modal se cierra y se recarga el contrato automáticamente
- **Error**: Muestra alerta con el mensaje de error del backend

---

## 🔌 Integración con Backend

### Endpoint Utilizado
```
PATCH /api/admin/contracts/{code}
```

### Headers Requeridos
```
X-Admin-Password: Pomelo2005.1
```

### Conversión de Datos
- **Euros → Centavos**: `amount` y `first_payment_amount` se convierten multiplicando por 100
- **Centavos → Euros**: Para mostrar en el formulario, se divide por 100
- **Días de expiración**: Se calcula desde `expires_at` al abrir el modal

### Manejo de Errores
- Si `PATCH` falla con 405 (Method Not Allowed), se intenta con `PUT`
- Errores se muestran en alerta al usuario
- Logs en consola para debugging

---

## 📝 Flujo de Uso

1. **Usuario navega a**: `/admin/contracts/{code}`
2. **Usuario hace clic en**: Botón "Editar Contrato" (verde, en el header)
3. **Se abre modal** con todos los campos del contrato prellenados
4. **Usuario edita** los campos deseados
5. **Usuario hace clic en**: "Guardar Cambios"
6. **Sistema envía** PATCH request al backend
7. **Si éxito**:
   - Modal se cierra
   - Contrato se actualiza en la UI
   - Se recarga el contrato desde el backend para asegurar datos actualizados
8. **Si error**: Se muestra alerta con el mensaje de error

---

## ✅ Checklist de Implementación

- [x] Actualizar tipos TypeScript (`ContractUpdateRequest`)
- [x] Actualizar servicio de API (`updateContract`)
- [x] Crear componente `EditContractModal`
- [x] Integrar modal en página de detalle
- [x] Agregar botón "Editar Contrato" en el header
- [x] Manejar actualización del estado después de editar
- [x] Probar conversión euros/centavos
- [x] Probar cálculo de días hasta expiración
- [x] Verificar validaciones
- [x] Probar manejo de errores
- [x] Documentar implementación

---

## 🧪 Testing

### Casos de Prueba Recomendados

1. **Edición básica**:
   - Editar nombre del cliente
   - Editar email
   - Guardar y verificar cambios

2. **Edición de montos**:
   - Cambiar monto total
   - Verificar conversión euros/centavos
   - Verificar que se guarda correctamente

3. **Edición de estado**:
   - Cambiar estado del contrato
   - Cambiar estado KYC
   - Verificar que se actualiza

4. **Edición de suscripción**:
   - Cambiar a tipo de pago "subscription"
   - Agregar subscription_id
   - Cambiar estado de suscripción
   - Verificar que se guarda

5. **Edición de expiración**:
   - Cambiar días hasta expiración
   - Verificar que se calcula correctamente la nueva fecha

6. **Validaciones**:
   - Intentar guardar sin campos requeridos
   - Verificar mensajes de error

7. **Manejo de errores**:
   - Simular error del backend
   - Verificar que se muestra mensaje de error

---

## 🔗 Referencias

- **Endpoint Backend**: `PATCH /api/admin/contracts/{code}`
- **Documentación Backend**: Ver documentación del endpoint PATCH en el backend
- **Tipos**: `src/types/contracts.ts`
- **Servicio**: `src/services/contractsService.ts`
- **Componente**: `src/components/contracts/EditContractModal.tsx`
- **Página**: `src/pages/admin/AdminContractDetail.tsx`

---

## 🚀 Próximas Mejoras (Opcional)

1. **Validaciones avanzadas**:
   - Validar formato de email
   - Validar formato de NIE/pasaporte
   - Validar rangos de montos según grado

2. **Confirmación de cambios**:
   - Mostrar diff de cambios antes de guardar
   - Confirmación para cambios importantes

3. **Historial de cambios**:
   - Guardar historial de ediciones
   - Mostrar quién y cuándo editó cada campo

4. **Campos calculados**:
   - Auto-calcular monto según grado y tipo de pago
   - Auto-calcular primer pago en suscripciones

---

**Última actualización**: 2025-01-28  
**Implementado por**: Auto (AI Assistant)  
**Estado**: ✅ Completado y funcional
