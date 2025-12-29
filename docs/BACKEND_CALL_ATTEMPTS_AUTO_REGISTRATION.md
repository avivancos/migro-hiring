# Registro Automático de Intentos de Llamada en Oportunidades

**Fecha**: 2025-01-29  
**Módulo**: CRM - Opportunities  
**Prioridad**: Alta  
**Estado**: ✅ Implementado

---

## 📋 Resumen Ejecutivo

Cuando se registra una llamada en el sistema, automáticamente se registra el intento en la oportunidad asociada (si existe) para verificar el seguimiento posterior. Los 5 intentos aparecen en el frontend con sus colores correspondientes y marcados según su estado.

---

## 🎯 Objetivo

Registrar automáticamente los intentos de llamada en las oportunidades cuando se crea o actualiza una llamada, permitiendo:

1. Seguimiento automático de los 5 intentos de primera llamada
2. Visualización en el frontend con colores y estados correspondientes
3. Actualización automática de `first_call_completed` cuando hay un intento exitoso

---

## 🔄 Flujo de Funcionamiento

### 1. Registro Automático

Cuando se registra una llamada (creación o actualización), el sistema:

1. Verifica si la llamada está asociada a un contacto (`entity_id` y `entity_type == CONTACTS`)
2. Verifica si la llamada es **OUTBOUND** (solo las llamadas salientes se registran como intentos)
3. Busca oportunidades activas para ese contacto con:
   - `status` en `["pending", "assigned", "contacted"]`
   - `first_call_completed == False` (solo si aún no se completó la primera llamada)
4. Si encuentra una oportunidad activa:
   - Determina el siguiente número de intento disponible (1-5)
   - Determina el estado del intento basado en el estado de la llamada
   - Registra el intento en `first_call_attempts`
   - Actualiza `first_call_completed` y `first_call_successful_attempt` si corresponde

### 2. Determinación del Estado del Intento

El estado del intento se determina automáticamente según el estado de la llamada:

| Estado de Llamada | Estado del Intento | Color | Descripción |
|-------------------|-------------------|-------|-------------|
| `completed`, `answered` | `green` | 🟢 Verde | Llamada exitosa, información completa obtenida |
| `failed`, `no_answer`, `busy` | `orange` | 🟠 Naranja | No hay comunicación / llamada fallida |
| `rejected` | `red` | 🔴 Rojo | Cliente descartó interés de contratar |
| Sin estado o no procesado | `pending` | 🟣 Morado | Aún no intentado (siempre el primero) |

### 3. Estructura de Datos

Cada intento se guarda en `first_call_attempts` con la siguiente estructura:

```json
{
  "1": {
    "status": "orange",
    "call_id": "uuid-del-call",
    "attempted_at": "2025-01-29T10:00:00Z",
    "notes": "No contestó"
  },
  "2": {
    "status": "green",
    "call_id": "uuid-del-call-exitoso",
    "attempted_at": "2025-01-30T10:00:00Z",
    "notes": "Llamada exitosa, información completa"
  }
}
```

---

## 🔧 Implementación Técnica

### 1. Método Principal: `register_call_attempt`

**Ubicación**: `app/services/lead_opportunity_service.py`

```python
async def register_call_attempt(
    self,
    call_id: uuid.UUID,
    contact_id: uuid.UUID,
    call_status: Optional[str] = None,
    call_direction: Optional[str] = None,
    attempted_at: Optional[datetime] = None,
    notes: Optional[str] = None,
) -> Optional[LeadOpportunity]:
```

**Funcionalidad**:
- Busca oportunidades activas para el contacto
- Solo procesa llamadas OUTBOUND
- Determina el número de intento (1-5)
- Determina el estado del intento según el estado de la llamada
- Actualiza `first_call_attempts`, `first_call_completed` y `first_call_successful_attempt`
- Actualiza `last_contact_attempt_at` y `status` (si corresponde)

### 2. Puntos de Integración

El registro de intentos se ha integrado en los siguientes lugares:

#### a) ZadarmaService.create_or_update_call

**Archivo**: `app/services/zadarma_service.py`

Se llama después de crear/actualizar una llamada desde webhook de Zadarma:

```python
# Register call attempt in opportunity if applicable
try:
    from app.services.lead_opportunity_service import LeadOpportunityService
    opportunity_service = LeadOpportunityService(self.db)
    await opportunity_service.register_call_attempt(
        call_id=call.id,
        contact_id=contact.id,
        call_status=call.call_status,
        call_direction=call.direction,
        attempted_at=call.started_at or call.created_at,
        notes=call.resumen_llamada or call.call_result,
    )
except Exception as e:
    # Don't fail the call creation if opportunity registration fails
    logger.warning(f"Error registering call attempt for opportunity: {e}")
```

#### b) ZadarmaRecordingEmailService.process_zadarma_recording_email

**Archivo**: `app/services/zadarma_recording_email_service.py`

Se llama después de procesar un email de Zadarma con grabación:

```python
# Register call attempt in opportunity if applicable
if call.entity_id and call.entity_type == EntityType.CONTACTS.value:
    try:
        from app.services.lead_opportunity_service import LeadOpportunityService
        opportunity_service = LeadOpportunityService(self.db)
        await opportunity_service.register_call_attempt(
            call_id=call.id,
            contact_id=call.entity_id,
            call_status=call.call_status,
            call_direction=call.direction,
            attempted_at=call.started_at or call.created_at,
            notes=call.resumen_llamada or call.call_result,
        )
    except Exception as e:
        logger.warning(f"Error registering call attempt for opportunity: {e}")
```

#### c) Endpoint POST /api/crm/calls

**Archivo**: `app/api/endpoints/crm.py`

Se llama después de crear una llamada manualmente desde el frontend:

```python
# Register call attempt in opportunity if applicable
if call.entity_id and call.entity_type == EntityType.CONTACTS.value and call.direction == "outbound":
    try:
        from app.services.lead_opportunity_service import LeadOpportunityService
        opportunity_service = LeadOpportunityService(db)
        await opportunity_service.register_call_attempt(
            call_id=call.id,
            contact_id=call.entity_id,
            call_status=call.call_status,
            call_direction=call.direction,
            attempted_at=call.started_at or call.created_at,
            notes=call.resumen_llamada or call.call_result,
        )
    except Exception as e:
        logger.warning(f"Error registering call attempt for opportunity: {e}")
```

---

## 🎨 Visualización en el Frontend

Los intentos se muestran en el frontend según la guía establecida en `docs/FRONTEND_FIRST_CALL_ATTEMPTS_IMPLEMENTATION.md`:

- **5 círculos** representando los 5 intentos
- **Colores** según el estado:
  - 🟣 Morado (PENDING): Aún no intentado
  - 🟠 Naranja (ORANGE): No hay comunicación / llamada fallida
  - 🔴 Rojo (RED): Cliente descartó interés de contratar
  - 🟢 Verde (GREEN): Primera llamada exitosa, información completa obtenida

### Estructura de Datos del API

El endpoint `GET /api/crm/opportunities/{opportunity_id}` devuelve:

```json
{
  "id": "uuid-opportunity",
  "first_call_attempts": {
    "1": {
      "status": "orange",
      "call_id": "uuid-call",
      "attempted_at": "2025-01-29T10:00:00Z",
      "notes": "No contestó"
    },
    "2": {
      "status": "green",
      "call_id": "uuid-call-success",
      "attempted_at": "2025-01-30T10:00:00Z",
      "notes": "Llamada exitosa, información completa"
    }
  },
  "first_call_completed": true,
  "first_call_successful_attempt": 2
}
```

---

## ⚠️ Consideraciones Importantes

### 1. Solo Llamadas Salientes

- Solo se registran intentos para llamadas **OUTBOUND**
- Las llamadas entrantes (INBOUND) no se registran como intentos

### 2. Oportunidades Activas

- Solo se registran intentos en oportunidades con `status` en `["pending", "assigned", "contacted"]`
- No se registran en oportunidades convertidas o expiradas

### 3. Primera Llamada Completada

- Solo se registran intentos si `first_call_completed == False`
- Una vez completada la primera llamada (intento verde), no se registran más intentos

### 4. Máximo 5 Intentos

- Se registran máximo 5 intentos (1-5)
- Si ya se usaron los 5 intentos, no se registran nuevos intentos

### 5. Manejo de Errores

- Si falla el registro de intentos, **NO** falla la creación/actualización de la llamada
- Los errores se registran en los logs para debugging

---

## 🔍 Ejemplo de Flujo Completo

1. **Usuario realiza llamada saliente** desde Zadarma
2. **Zadarma envía webhook** → `ZadarmaService.create_or_update_call`
3. **Se crea/actualiza la llamada** en la base de datos
4. **Se verifica** si hay contacto asociado
5. **Se busca** oportunidad activa para ese contacto
6. **Se registra el intento** en `first_call_attempts`:
   - Si la llamada fue completada → estado `green`
   - Si la llamada falló → estado `orange`
   - Si el cliente rechazó → estado `red`
7. **Se actualiza** `first_call_completed` si el intento fue exitoso (`green`)
8. **Frontend muestra** los intentos con sus colores correspondientes

---

## 📊 Impacto

### Beneficios

- ✅ Seguimiento automático de intentos sin intervención manual
- ✅ Visualización clara del estado de los intentos en el frontend
- ✅ Mejor trazabilidad del proceso de primera llamada
- ✅ Datos consistentes entre llamadas y oportunidades

### Casos de Uso

1. **Llamadas desde Zadarma**: Se registran automáticamente al recibir webhooks
2. **Llamadas desde email**: Se registran al procesar emails de Zadarma con grabaciones
3. **Llamadas manuales**: Se registran al crear llamadas desde el frontend

---

## 🧪 Testing

Para probar la funcionalidad:

1. Crear una oportunidad para un contacto
2. Realizar una llamada saliente a ese contacto (o crear una manualmente)
3. Verificar que el intento se registre en `first_call_attempts`
4. Verificar que los colores y estados se muestren correctamente en el frontend

---

## 📝 Notas Adicionales

- El registro es **idempotente**: si ya existe un intento para esa llamada, no se duplica
- Los intentos se ordenan numéricamente (1, 2, 3, 4, 5)
- El estado se determina automáticamente según el estado de la llamada
- Los intentos pueden tener notas adicionales del `resumen_llamada` o `call_result`

---

## 📚 Referencias Relacionadas

- [Implementación Frontend: Seguimiento de 5 Intentos](./FRONTEND_FIRST_CALL_ATTEMPTS_IMPLEMENTATION.md)
- [Servicio de Oportunidades](./BACKEND_OPPORTUNITIES_PIPELINE_AUTO_CREATE.md)
- [Integración con Zadarma](./BACKEND_CRM_INTEGRATION.md)

---

**Última actualización**: 2025-01-29

