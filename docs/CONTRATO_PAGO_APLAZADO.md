# 📄 Documentación: Pago Aplazado en Contrato Marco Cliente-Migro

**Fecha**: 2025-01-21  
**Archivo modificado**: `src/utils/contractPdfGenerator.ts`

---

## 📋 Resumen

Se ha implementado la inclusión de los supuestos de pago aplazado en el contrato marco entre cliente y Migro. El contrato ahora diferencia entre dos modalidades de pago:

1. **Pago Único** (`one_time`): 2 pagos (50% inicial + 50% después de comunicación favorable)
2. **Pago Aplazado** (`subscription`): 10 pagos mensuales automáticos

---

## 💰 Estructura de Pagos Aplazados

### Grading A y B
- **Pago mensual**: 48 €
- **Número de pagos**: 10
- **Total**: 480 € (IVA incluido)

### Grading C
- **Pago mensual**: 68 €
- **Número de pagos**: 10
- **Total**: 680 € (IVA incluido)

---

## 🔧 Implementación Técnica

### Detección del Tipo de Pago

El generador de PDF detecta el tipo de pago mediante el campo `payment_type` en los `HiringDetails`:

```typescript
const paymentType = details.payment_type || 'one_time';
const grade = details.grade || 'B';
const isSubscription = paymentType === 'subscription';
```

### Cálculo de Montos

Para pagos aplazados:
```typescript
const monthlyPayment = (grade === 'C') ? 68 : 48;
const totalSubscription = monthlyPayment * 10;
```

### Texto del Contrato

Cuando `payment_type === 'subscription'`, el contrato incluye:

1. **Monto total en palabras**: Se indica el importe total del servicio (480 € o 680 €)
2. **Estructura de pagos**: Se especifica que son 10 pagos mensuales iguales
3. **Primer pago**: En el momento de la contratación
4. **Pagos sucesivos**: 9 pagos mensuales automáticos restantes
5. **Autorización**: Cargo automático en tarjeta bancaria

---

## 📝 Cláusula TERCERA - CONTRAPRESTACIÓN

La cláusula TERCERA del contrato se genera dinámicamente según el tipo de pago:

### Pago Aplazado (Subscription)

> El precio del servicio contratado descrito en la cláusula primera se concreta correspondiente a la cantidad de [CUATROCIENTOS OCHENTA / SEISCIENTOS OCHENTA] EUROS (480/680 €), IVA incluido. El CLIENTE podrá optar por abonar dicho importe mediante un plan de pago aplazado en diez (10) plazos mensuales iguales de [CUARENTA Y OCHO / SESENTA Y OCHO] EUROS (48/68 €) cada uno.
>
> El CLIENTE abonará las siguientes cantidades mediante cargo automático en la tarjeta bancaria que éste autoriza de forma expresa y al efecto como medio de abono y garantía para la prestación del servicio:
>
> • [CUARENTA Y OCHO / SESENTA Y OCHO] EUROS (48/68 €) en el momento de la contratación (primer pago).
> • Nueve (9) pagos mensuales sucesivos de [CUARENTA Y OCHO / SESENTA Y OCHO] EUROS (48/68 €) cada uno, que se cargarán automáticamente en la tarjeta bancaria autorizada el mismo día de cada mes sucesivo hasta completar los diez (10) pagos.

### Pago Único (One Time)

Mantiene la estructura tradicional de 2 pagos (50% + 50%).

---

## 🔄 Flujo de Datos

### Backend → Frontend

El backend debe proporcionar en `HiringDetails`:

```typescript
{
  payment_type: 'subscription' | 'one_time',
  grade: 'A' | 'B' | 'C',
  amount: 48000 | 68000,  // Total en centavos según tipo y grade
  // ... otros campos
}
```

### Frontend → PDF

El generador de PDF (`contractPdfGenerator.ts`) utiliza estos campos para generar la cláusula TERCERA apropiada.

---

## ✅ Validaciones

1. **Tipo de pago por defecto**: Si `payment_type` no está presente, se asume `'one_time'`
2. **Grading por defecto**: Si `grade` no está presente, se asume `'B'`
3. **Montos calculados**: Los montos se calculan automáticamente según el grade y tipo de pago

---

## 🎯 Casos de Uso

### Caso 1: Cliente con Grading A - Pago Aplazado
- **Grado**: A
- **Tipo de pago**: subscription
- **Resultado**: Contrato con 10 pagos de 48 € cada uno (total 480 €)

### Caso 2: Cliente con Grading C - Pago Aplazado
- **Grado**: C
- **Tipo de pago**: subscription
- **Resultado**: Contrato con 10 pagos de 68 € cada uno (total 680 €)

### Caso 3: Cliente con Grading B - Pago Único
- **Grado**: B
- **Tipo de pago**: one_time (o no especificado)
- **Resultado**: Contrato con 2 pagos de 200 € cada uno (total 400 €)

---

## 📌 Notas Importantes

1. Los montos mostrados en el contrato incluyen IVA
2. Los pagos mensuales se cargan automáticamente en la tarjeta autorizada
3. El primer pago se realiza en el momento de la contratación
4. Los 9 pagos restantes se ejecutan mensualmente de forma automática
5. En caso de impago, el contrato prevé el desistimiento del expediente administrativo

---

## 🔍 Archivos Relacionados

- `src/utils/contractPdfGenerator.ts`: Generador de PDF del contrato
- `src/types/hiring.ts`: Tipos TypeScript para `HiringDetails` y `PaymentType`
- `BACKEND_PAYMENT_TYPE_IMPLEMENTATION.md`: Documentación del backend sobre tipos de pago

---

## 🚀 Próximos Pasos

Si se requiere modificar los montos o la estructura de pagos aplazados, se debe actualizar:
1. Los valores de `monthlyPayment` en `contractPdfGenerator.ts`
2. La documentación de precios en `BACKEND_PAYMENT_TYPE_IMPLEMENTATION.md`
3. Cualquier lógica de cálculo en el backend relacionada

