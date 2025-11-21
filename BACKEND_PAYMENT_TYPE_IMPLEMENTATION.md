# 💳 Guía Backend - Implementación de Tipo de Pago en Hiring Code

**Fecha**: 2025-01-20  
**Endpoint**: `POST /api/v1/admin/hiring/create`

---

## 📋 Resumen

El frontend ahora envía un campo `payment_type` que indica si el hiring code debe usar:
- **Pago Único (`one_time`)**: 2 pagos (50% inicial + 50% después de comunicación favorable)
- **Suscripción (`subscription`)**: 10 pagos mensuales automáticos

El backend debe calcular automáticamente los montos según el `grade` y `payment_type` seleccionados.

---

## 🎯 Precios por Tipo de Pago

### Grado A o B

| Tipo de Pago | Monto Total | Estructura |
|--------------|-------------|------------|
| **Pago Único** | 400 EUR (40000 centavos) | 2 pagos de 200 EUR (20000 centavos) |
| **Suscripción** | 480 EUR (48000 centavos) | 10 pagos de 48 EUR (4800 centavos) |

### Grado C

| Tipo de Pago | Monto Total | Estructura |
|--------------|-------------|------------|
| **Pago Único** | 600 EUR (60000 centavos) | 2 pagos de 300 EUR (30000 centavos) |
| **Suscripción** | 680 EUR (68000 centavos) | 10 pagos de 68 EUR (6800 centavos) |

### Grado T (Testing)

| Tipo de Pago | Monto Total | Estructura |
|--------------|-------------|------------|
| **Pago Único** | 1 EUR (100 centavos) | 2 pagos de 0.50 EUR (50 centavos) |
| **Suscripción** | 1 EUR (100 centavos) | 10 pagos de 0.10 EUR (10 centavos) |

---

## 📡 Endpoint

### `POST /api/v1/admin/hiring/create`

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "catalog_item_id": 1,
  "contract_template": "standard",
  "grade": "A",
  "payment_type": "one_time",  // ⭐ NUEVO: "one_time" o "subscription"
  "service_name": "Visa de Trabajo",
  "service_description": "Tramitación de visa de trabajo",
  "client_name": "Juan Pérez",
  "client_email": "juan@example.com",
  "expires_in_days": 30,
  "amount": 40000,  // ⭐ Opcional: Si no se envía, calcular según grade + payment_type
  "currency": "EUR"
}
```

---

## 🔑 Campo Nuevo: `payment_type`

### Especificación

- **Nombre**: `payment_type`
- **Tipo**: `string` (enum)
- **Valores permitidos**: 
  - `"one_time"` (default si no se especifica)
  - `"subscription"`
- **Requerido**: ❌ No (default: `"one_time"`)
- **Descripción**: Tipo de estructura de pagos para el hiring code

---

## 💰 Lógica de Cálculo de Precios

### Tabla de Precios Base

```python
GRADE_PRICING_ONE_TIME = {
    "A": 40000,  # 400 EUR en centavos
    "B": 40000,  # 400 EUR en centavos
    "C": 60000,  # 600 EUR en centavos
    "T": 100,    # 1 EUR en centavos (testing)
}

GRADE_PRICING_SUBSCRIPTION = {
    "A": 48000,  # 480 EUR en centavos
    "B": 48000,  # 480 EUR en centavos
    "C": 68000,  # 680 EUR en centavos
    "T": 100,    # 1 EUR en centavos (testing)
}
```

### Algoritmo de Cálculo

```python
def calculate_amount(grade: str, payment_type: str) -> int:
    """
    Calcula el monto total según el grade y payment_type.
    
    Args:
        grade: "A", "B", "C", o "T"
        payment_type: "one_time" o "subscription"
    
    Returns:
        Monto total en centavos
    """
    if payment_type == "subscription":
        return GRADE_PRICING_SUBSCRIPTION.get(grade, 40000)
    else:  # one_time (default)
        return GRADE_PRICING_ONE_TIME.get(grade, 40000)
```

### Cálculo de Primer Pago

```python
def calculate_first_payment(grade: str, payment_type: str, total_amount: int) -> int:
    """
    Calcula el monto del primer pago.
    
    Args:
        grade: "A", "B", "C", o "T"
        payment_type: "one_time" o "subscription"
        total_amount: Monto total en centavos
    
    Returns:
        Monto del primer pago en centavos
    """
    if payment_type == "subscription":
        # Suscripción: 10 pagos mensuales iguales
        return total_amount // 10
    else:  # one_time
        # Pago único: 50% inicial
        return total_amount // 2
```

---

## 📤 Response Esperado

El endpoint debe retornar el `payment_type` en la respuesta:

```json
{
  "id": 123,
  "hiring_code": "ABC123",
  "client_name": "Juan Pérez",
  "client_email": "juan@example.com",
  "service_name": "Visa de Trabajo",
  "service_description": "Tramitación de visa de trabajo",
  "amount": 40000,  // Total en centavos
  "first_payment_amount": 20000,  // Primer pago en centavos
  "currency": "EUR",
  "status": "pending",
  "payment_type": "one_time",  // ⭐ Tipo de pago seleccionado
  "grade": "A",
  "expires_at": "2025-02-20T00:00:00Z",
  "short_url": "https://migro.to/ABC123"
}
```

---

## 🔄 Comportamiento del Backend

### 1. Si `payment_type` NO se envía en el request

- **Default**: `"one_time"`
- **Cálculo**: Usar `GRADE_PRICING_ONE_TIME[grade]`
- **Comportamiento**: Igual que antes (retrocompatibilidad)

### 2. Si `payment_type = "one_time"`

- **Monto total**: `GRADE_PRICING_ONE_TIME[grade]`
- **Primer pago**: `total_amount // 2` (50%)
- **Segundo pago**: `total_amount // 2` (50%)
- **Número de pagos**: 2
- **Estructura**: 
  - Pago 1: Al contratar (50%)
  - Pago 2: Después de comunicación favorable (50%)

### 3. Si `payment_type = "subscription"`

- **Monto total**: `GRADE_PRICING_SUBSCRIPTION[grade]`
- **Pago mensual**: `total_amount // 10`
- **Número de pagos**: 10
- **Estructura**: 
  - Pago 1: Al contratar (1/10 del total)
  - Pagos 2-10: Automáticos cada mes (1/10 del total cada uno)

### 4. Si `amount` se envía explícitamente

- **Prioridad**: Usar el `amount` enviado (el frontend puede calcularlo)
- **Validación**: Verificar que sea razonable según `grade` y `payment_type`
- **Recomendación**: Calcular automáticamente si no se envía

---

## 🗄️ Cambios en la Base de Datos

### Nueva Columna: `payment_type`

**Tabla**: `hiring_payments` (o la tabla correspondiente)

```sql
ALTER TABLE hiring_payments
ADD COLUMN payment_type VARCHAR(20) NOT NULL DEFAULT 'one_time';

-- Crear índice para búsquedas rápidas
CREATE INDEX ix_hiring_payments_payment_type ON hiring_payments(payment_type);
```

**Especificación**:
- **Tipo**: `VARCHAR(20)` o `ENUM('one_time', 'subscription')`
- **Default**: `'one_time'`
- **Nullable**: ❌ No
- **Valores**: `'one_time'` o `'subscription'`

### Migración Alembic (Ejemplo)

```python
# migrations/versions/xxxxx_add_payment_type_to_hiring_payments.py

"""Add payment_type to hiring_payments

Revision ID: xxxxx
Revises: previous_revision
Create Date: 2025-01-20
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'xxxxx'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None

def upgrade():
    # Agregar columna payment_type
    op.add_column('hiring_payments', 
        sa.Column('payment_type', sa.String(20), nullable=False, server_default='one_time')
    )
    
    # Crear índice
    op.create_index(
        'ix_hiring_payments_payment_type',
        'hiring_payments',
        ['payment_type']
    )

def downgrade():
    # Eliminar índice
    op.drop_index('ix_hiring_payments_payment_type', table_name='hiring_payments')
    
    # Eliminar columna
    op.drop_column('hiring_payments', 'payment_type')
```

---

## 📝 Cambios en el Schema (Pydantic)

### Schema de Request: `HiringPaymentCreate`

```python
from pydantic import BaseModel, Field
from typing import Optional, Literal

class HiringPaymentCreate(BaseModel):
    # ... campos existentes ...
    
    payment_type: Optional[Literal["one_time", "subscription"]] = Field(
        default="one_time",
        description="Tipo de pago: 'one_time' (2 pagos) o 'subscription' (10 pagos mensuales)"
    )
    
    # ... otros campos ...
```

### Schema de Response: `HiringPaymentDetails`

```python
class HiringPaymentDetails(BaseModel):
    # ... campos existentes ...
    
    payment_type: Literal["one_time", "subscription"] = Field(
        description="Tipo de pago seleccionado"
    )
    
    # ... otros campos ...
```

---

## 🔍 Validaciones Requeridas

### 1. Validar `payment_type`

```python
def validate_payment_type(payment_type: str) -> str:
    """Valida que payment_type sea válido"""
    valid_types = ["one_time", "subscription"]
    if payment_type not in valid_types:
        raise ValueError(f"payment_type debe ser uno de: {valid_types}")
    return payment_type
```

### 2. Validar `grade`

```python
def validate_grade(grade: str) -> str:
    """Valida que grade sea válido"""
    valid_grades = ["A", "B", "C", "T"]
    if grade not in valid_grades:
        raise ValueError(f"grade debe ser uno de: {valid_grades}")
    return grade
```

### 3. Validar Consistencia `amount` vs `payment_type`

```python
def validate_amount_consistency(
    amount: int,
    grade: str,
    payment_type: str
) -> bool:
    """Valida que el amount sea consistente con grade y payment_type"""
    expected_amount = calculate_amount(grade, payment_type)
    
    # Permitir pequeñas diferencias por redondeo
    tolerance = 100  # 1 EUR de tolerancia
    
    if abs(amount - expected_amount) > tolerance:
        raise ValueError(
            f"El amount ({amount}) no coincide con el esperado "
            f"para grade={grade} y payment_type={payment_type} "
            f"(esperado: {expected_amount})"
        )
    return True
```

---

## 🧪 Ejemplos de Testing

### Test 1: Pago Único - Grado A

```bash
curl -X POST 'https://api.migro.es/api/v1/admin/hiring/create' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "catalog_item_id": 1,
    "contract_template": "standard",
    "grade": "A",
    "payment_type": "one_time",
    "service_name": "Visa de Trabajo",
    "client_name": "Juan Pérez",
    "client_email": "juan@example.com"
  }'
```

**Resultado esperado**:
- `amount`: `40000` (400 EUR)
- `first_payment_amount`: `20000` (200 EUR)
- `payment_type`: `"one_time"`

### Test 2: Suscripción - Grado B

```bash
curl -X POST 'https://api.migro.es/api/v1/admin/hiring/create' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "catalog_item_id": 1,
    "contract_template": "standard",
    "grade": "B",
    "payment_type": "subscription",
    "service_name": "Visa de Trabajo",
    "client_name": "Juan Pérez",
    "client_email": "juan@example.com"
  }'
```

**Resultado esperado**:
- `amount`: `48000` (480 EUR)
- `first_payment_amount`: `4800` (48 EUR)
- `payment_type`: `"subscription"`

### Test 3: Suscripción - Grado C

```bash
curl -X POST 'https://api.migro.es/api/v1/admin/hiring/create' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "catalog_item_id": 1,
    "contract_template": "standard",
    "grade": "C",
    "payment_type": "subscription",
    "service_name": "Visa de Trabajo",
    "client_name": "Juan Pérez",
    "client_email": "juan@example.com"
  }'
```

**Resultado esperado**:
- `amount`: `68000` (680 EUR)
- `first_payment_amount`: `6800` (68 EUR)
- `payment_type`: `"subscription"`

### Test 4: Retrocompatibilidad (sin `payment_type`)

```bash
curl -X POST 'https://api.migro.es/api/v1/admin/hiring/create' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "catalog_item_id": 1,
    "contract_template": "standard",
    "grade": "A",
    "service_name": "Visa de Trabajo",
    "client_name": "Juan Pérez",
    "client_email": "juan@example.com"
  }'
```

**Resultado esperado**:
- `amount`: `40000` (400 EUR) - Comportamiento anterior
- `first_payment_amount`: `20000` (200 EUR)
- `payment_type`: `"one_time"` (default)

---

## 📋 Checklist de Implementación Backend

- [ ] Agregar campo `payment_type` al schema de request (`HiringPaymentCreate`)
- [ ] Agregar campo `payment_type` al schema de response (`HiringPaymentDetails`)
- [ ] Agregar columna `payment_type` a la tabla `hiring_payments`
- [ ] Crear migración Alembic para la nueva columna
- [ ] Implementar función `calculate_amount(grade, payment_type)`
- [ ] Implementar función `calculate_first_payment(grade, payment_type, total_amount)`
- [ ] Actualizar lógica de creación de hiring code para usar `payment_type`
- [ ] Agregar validación de `payment_type` (debe ser "one_time" o "subscription")
- [ ] Agregar validación de consistencia entre `amount`, `grade` y `payment_type`
- [ ] Actualizar endpoint para retornar `payment_type` en la respuesta
- [ ] Actualizar documentación de la API (Swagger/OpenAPI)
- [ ] Agregar tests unitarios para cada combinación de `grade` y `payment_type`
- [ ] Agregar tests de integración para el endpoint completo
- [ ] Verificar retrocompatibilidad (requests sin `payment_type` deben funcionar)

---

## ⚠️ Notas Importantes

1. **Retrocompatibilidad**: Si `payment_type` no se envía, usar `"one_time"` como default
2. **Cálculo automático**: Si `amount` no se envía, calcularlo según `grade` y `payment_type`
3. **Validación**: Verificar que `payment_type` sea uno de los valores permitidos
4. **Base de datos**: El campo debe tener un default de `'one_time'` para registros existentes
5. **Índice**: Crear índice en `payment_type` para búsquedas rápidas si es necesario
6. **Stripe**: Para suscripciones, el backend debe configurar Stripe Subscription en lugar de Checkout Session única

---

## 🔗 Integración con Stripe

### Para `payment_type = "one_time"`

- Usar **Stripe Checkout Session** (comportamiento actual)
- Crear sesión de pago único
- El segundo pago se maneja manualmente después de comunicación favorable

### Para `payment_type = "subscription"`

- Usar **Stripe Subscription**
- Crear suscripción con 10 pagos mensuales
- Configurar `interval: 'month'` y `interval_count: 1`
- El primer pago se cobra inmediatamente
- Los siguientes 9 pagos se cobran automáticamente cada mes

**Ejemplo de creación de suscripción en Stripe**:
```python
import stripe

subscription = stripe.Subscription.create(
    customer=customer_id,
    items=[{
        'price_data': {
            'currency': 'eur',
            'product_data': {
                'name': f'Suscripción {service_name}',
            },
            'unit_amount': monthly_amount,  # Monto mensual en centavos
            'recurring': {
                'interval': 'month',
            },
        },
    }],
    payment_behavior='default_incomplete',
    payment_settings={'save_default_payment_method': 'on_subscribe'},
    expand=['latest_invoice.payment_intent'],
)
```

---

## 📚 Referencias

- **Endpoint**: `POST /api/v1/admin/hiring/create`
- **Schema Request**: `HiringPaymentCreate`
- **Schema Response**: `HiringPaymentDetails`
- **Modelo**: `HiringPayment`
- **Migración**: `xxxxx_add_payment_type_to_hiring_payments`

---

**Última actualización**: 2025-01-20

