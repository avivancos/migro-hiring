# Backend: Portal Cliente - Billing (requisitos técnicos)

## Objetivo
Implementar endpoints para que **clientes autenticados** (JWT) puedan consultar sus contratos, suscripciones, facturas y acceder al Stripe Billing Portal **sin usar X-Admin-Password**.

## Endpoints requeridos

### 1) `GET /client/contracts` (o `/me/contracts`)
**Auth**: JWT (Bearer token)

**Respuesta 200**:
```json
[
  {
    "id": "123",
    "hiring_code": "AB12C",
    "client_name": "Juan Pérez",
    "client_email": "juan@email.com",
    "service_name": "Autorización inicial de Residencia y Trabajo",
    "amount": 48000,
    "currency": "eur",
    "status": "paid",
    "payment_type": "subscription",
    "subscription_id": "sub_123",
    "subscription_status": "active",
    "created_at": "2025-01-01T00:00:00Z",
    "contract_accepted_at": "2025-01-02T00:00:00Z",
    ...
  }
]
```

**Notas**:
- Filtrar **solo contratos del usuario autenticado** (por `client_email` o relación `user_id` si existe).
- Retornar array vacío `[]` si no hay contratos.

---

### 2) `GET /client/contracts/{code}/stripe/summary`
**Auth**: JWT (Bearer token)

**Respuesta 200** (igual shape que admin):
```json
{
  "subscription": { "id": "sub_123", "status": "active", ... },
  "customer": { "id": "cus_123", "email": "...", ... },
  "default_payment_method": { "id": "pm_123", "brand": "visa", ... },
  "invoices": [...],
  "transactions": [...]
}
```

**Errores**:
- **403**: El contrato no pertenece al usuario autenticado.
- **404**: Contrato no existe o no tiene datos de Stripe.

---

### 3) `POST /client/contracts/{code}/stripe/portal`
**Auth**: JWT (Bearer token)

**Body**: `{}` (vacío)

**Respuesta 200**:
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

**Notas**:
- Verificar que el contrato pertenece al usuario autenticado (403 si no).
- `return_url` debe apuntar a `/clientes` (o `/clientes/dashboard`).

---

## Alternativa: endpoints `/me/...`
Si prefieres usar `/me/contracts` en lugar de `/client/contracts`, el frontend ya tiene fallback implementado.

## Seguridad
- **Solo contratos del usuario autenticado**: filtrar por `client_email` o `user_id` del JWT.
- **No exponer datos de otros clientes**: validar ownership antes de retornar.
- **Rate limiting**: aplicar límites razonables (ej: 100 req/min por usuario).

## Implementación sugerida
```python
# Ejemplo FastAPI
@router.get("/client/contracts")
async def get_client_contracts(
    current_user: User = Depends(get_current_user)
) -> List[Contract]:
    # Filtrar por email del usuario autenticado
    contracts = db.query(Contract).filter(
        Contract.client_email == current_user.email
    ).all()
    return contracts

@router.get("/client/contracts/{code}/stripe/summary")
async def get_client_stripe_summary(
    code: str,
    current_user: User = Depends(get_current_user)
) -> StripeBillingSummary:
    # Verificar ownership
    contract = db.query(Contract).filter(
        Contract.hiring_code == code,
        Contract.client_email == current_user.email
    ).first()
    
    if not contract:
        raise HTTPException(status_code=403, detail="Contrato no encontrado o no autorizado")
    
    # Llamar a Stripe y retornar summary (igual lógica que admin)
    ...
```
