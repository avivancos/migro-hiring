# Fix: Reglas de Tipo de Pago por Grado de Expediente

**Fecha**: 2025-01-20  
**Estado**: ✅ Completado  
**Módulo**: Admin - Contratos

---

## 📋 Problema

El modal de edición de estado y pago permitía seleccionar cualquier tipo de pago independientemente del grado del expediente, pero según las reglas de negocio:

- **Grado A y B**: Permiten tanto "Pago Único" (2 pagos de 200€ = 400€ total) como "Suscripción" (10 pagos de 48€ = 480€ total)
- **Grado C**: **NO existe pago único**, solo permite "Suscripción" (10 pagos de 68€ = 680€ total)

---

## 💰 Estructura de Pagos por Grado

### Grado A y B
- **Pago Único**: 2 pagos de 200€ cada uno = **400€ total**
- **Suscripción**: 10 pagos mensuales de 48€ = **480€ total**

### Grado C
- **Pago Único**: ❌ **NO DISPONIBLE**
- **Suscripción**: 10 pagos mensuales de 68€ = **680€ total** (única opción)

---

## 🔧 Solución Implementada

### 1. Restricción en el Modal de Edición

**Archivo modificado**: `src/pages/admin/AdminContractDetail.tsx`

**Cambios realizados**:

1. **Selector de tipo de pago condicional**:
   - Si el grado es C, solo se muestra la opción "Suscripción"
   - Si el grado es A o B, se muestran ambas opciones: "Pago Único" y "Suscripción"

2. **Inicialización automática**:
   - Al abrir el modal, si el contrato es grado C y tiene `payment_type = 'one_time'`, se cambia automáticamente a `'subscription'`

3. **Mensajes informativos**:
   - Para grado C: Muestra advertencia indicando que solo está disponible suscripción
   - Para grados A y B: Muestra información sobre ambos tipos de pago disponibles

4. **Validación en tiempo real**:
   - Si el usuario intenta cambiar a "Pago Único" cuando el grado es C, se fuerza automáticamente a "Suscripción"

---

## 📁 Cambios Específicos

### `src/pages/admin/AdminContractDetail.tsx`

#### 1. Función `handleOpenUpdateStatusModal`

```typescript
const handleOpenUpdateStatusModal = () => {
  if (!contract) return;
  
  // Para grado C, solo permitir suscripción (no existe pago único)
  const defaultPaymentType = contract.grade === 'C' 
    ? 'subscription' 
    : (contract.payment_type || 'one_time');
  
  // Si es grado C y tiene payment_type 'one_time', cambiarlo a 'subscription'
  const paymentType = contract.grade === 'C' && contract.payment_type === 'one_time'
    ? 'subscription'
    : defaultPaymentType;
  
  setUpdateForm({
    // ... otros campos
    payment_type: paymentType as 'one_time' | 'subscription',
    // ... resto del formulario
  });
  setShowUpdateStatusModal(true);
};
```

#### 2. Selector de Tipo de Pago en el Modal

```typescript
<select
  id="payment_type"
  value={updateForm.payment_type}
  onChange={(e) => {
    const newPaymentType = e.target.value as 'one_time' | 'subscription';
    // Si es grado C, forzar subscription siempre
    if (contract?.grade === 'C') {
      setUpdateForm(prev => ({ ...prev, payment_type: 'subscription' }));
    } else {
      setUpdateForm({ ...updateForm, payment_type: newPaymentType });
    }
  }}
>
  {contract?.grade !== 'C' && (
    <option value="one_time">Pago Único (2 pagos: 200€ + 200€ = 400€ total)</option>
  )}
  <option value="subscription">
    Suscripción ({contract?.grade === 'C' 
      ? '10 pagos de 68€ = 680€ total' 
      : '10 pagos de 48€ = 480€ total'})
  </option>
</select>
```

#### 3. Mensajes Informativos

```typescript
{contract?.grade === 'C' && (
  <p className="text-xs text-amber-600 mt-1">
    ⚠️ Para expedientes grado C solo está disponible la opción de Suscripción 
    (10 pagos mensuales de 68€ = 680€ total)
  </p>
)}
{contract?.grade !== 'C' && (
  <p className="text-xs text-gray-500 mt-1">
    Pago Único: 2 pagos (200€ + 200€ = 400€ total) | 
    Suscripción: 10 pagos de 48€ = 480€ total
  </p>
)}
```

---

## ✅ Validaciones Implementadas

1. ✅ **Grado C**: Solo muestra opción de Suscripción
2. ✅ **Grado A y B**: Muestra ambas opciones (Pago Único y Suscripción)
3. ✅ **Corrección automática**: Si un contrato grado C tiene `payment_type = 'one_time'`, se corrige automáticamente a `'subscription'` al abrir el modal
4. ✅ **Prevención de cambios incorrectos**: No permite cambiar a "Pago Único" cuando el grado es C

---

## 🎯 Comportamiento por Grado

### Grado A o B
- ✅ Puede seleccionar "Pago Único" (2 pagos de 200€ = 400€)
- ✅ Puede seleccionar "Suscripción" (10 pagos de 48€ = 480€)
- ✅ Muestra información de ambos tipos de pago

### Grado C
- ❌ **NO puede** seleccionar "Pago Único" (opción no disponible)
- ✅ Solo puede seleccionar "Suscripción" (10 pagos de 68€ = 680€)
- ⚠️ Muestra advertencia explicando que solo está disponible suscripción

---

## 📝 Notas Importantes

1. **Retrocompatibilidad**: Si existen contratos grado C con `payment_type = 'one_time'` en la base de datos, el modal los corrige automáticamente al abrirlos

2. **Backend**: Estas reglas deberían aplicarse también en el backend al crear contratos nuevos. El backend debería rechazar la creación de contratos grado C con `payment_type = 'one_time'`

3. **Documentación relacionada**:
   - `BACKEND_PAYMENT_TYPE_IMPLEMENTATION.md`: Estructura de precios y tipos de pago
   - `CONTRATO_PAGO_APLAZADO.md`: Documentación sobre pagos aplazados

---

## 🔄 Próximos Pasos Recomendados

1. **Backend**: Agregar validación en el endpoint de creación/actualización de contratos para rechazar `payment_type = 'one_time'` cuando `grade = 'C'`

2. **Migración de datos**: Si existen contratos grado C con `payment_type = 'one_time'`, considerar una migración de datos para corregirlos

3. **Documentación**: Actualizar la documentación del backend para reflejar esta restricción



