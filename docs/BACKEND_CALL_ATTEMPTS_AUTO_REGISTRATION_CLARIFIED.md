# Registro Automático de Intentos de Llamada - Clarificación e Instrucciones Backend

**Fecha**: 2025-01-29  
**Módulo**: CRM - Opportunities - Call Registration  
**Prioridad**: Alta  
**Estado**: 📋 Requiere implementación/verificación

---

## 📋 Resumen Ejecutivo

**IMPORTANTE**: Cuando se registra una llamada (creación o actualización) asociada a un contacto que tiene una oportunidad activa, el sistema DEBE registrar automáticamente el intento en la oportunidad asociada. NO se requiere callback adicional, el registro debe hacerse directamente en el evento de creación/actualización de la llamada.

---

## 🎯 Objetivo Principal

**Registro Automático en Tiempo Real**: Cada vez que se crea o actualiza una llamada en el sistema, si esa llamada está asociada a un contacto que tiene una oportunidad activa (1:1 relación), el sistema debe automáticamente:

1. **Detectar la oportunidad asociada** al contacto
2. **Determinar el número de intento** (1-5) basado en los intentos ya registrados
3. **Registrar el intento** en `first_call_attempts` de la oportunidad
4. **Actualizar el estado** de la oportunidad (`first_call_completed`, `first_call_successful_attempt`, etc.)

---

## 🔄 Flujo de Registro Automático

### 1. Evento de Creación/Actualización de Llamada

Cuando se crea o actualiza una llamada (en cualquier endpoint o servicio):

1. **Verificar condiciones**:
   - ✅ `call.entity_type == 'contacts'` (o `EntityType.CONTACTS.value`)
   - ✅ `call.entity_id` existe (ID del contacto)
   - ✅ `call.direction == 'outbound'` (solo llamadas salientes)
   - ✅ `call.call_status` existe o puede determinarse

2. **Buscar oportunidad activa**:
   - Buscar oportunidad con `contact_id == call.entity_id`
   - Filtros adicionales:
     - `status IN ['pending', 'assigned', 'contacted']`
     - `first_call_completed == False` (solo si aún no se completó)

3. **Si se encuentra oportunidad activa**:
   - Determinar número de intento siguiente (1-5)
   - Determinar estado del intento según `call.call_status`
   - Registrar en `first_call_attempts`
   - Actualizar campos de la oportunidad

4. **Si NO se encuentra oportunidad activa**:
   - No hacer nada (la llamada se guarda normalmente)

### 2. Determinación del Estado del Intento

| Estado de Llamada (`call_status`) | Estado del Intento | Descripción |
|-----------------------------------|-------------------|-------------|
| `completed`, `answered` | `green` | Llamada exitosa, información completa obtenida |
| `failed`, `no_answer`, `busy` | `orange` | No hay comunicación / llamada fallida |
| `rejected` | `red` | Cliente descartó interés de contratar |
| Sin estado o desconocido | `orange` (fallback) | Por defecto, tratar como fallida |

### 3. Estructura de Datos del Intento

Cada intento se guarda en `first_call_attempts` (JSONB) con la estructura:

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

## 📍 Puntos de Integración OBLIGATORIOS

El registro automático DEBE estar implementado en los siguientes lugares:

### 1. Endpoint POST /api/crm/calls

**Archivo**: `app/api/endpoints/crm.py`

**Después de crear la llamada**:

```python
# Después de crear/guardar la llamada en la BD
call = create_call_function(...)

# ⚠️ OBLIGATORIO: Registrar intento en oportunidad si aplica
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
        # ⚠️ NO fallar la creación de la llamada si falla el registro de intento
        logger.warning(f"Error registering call attempt for opportunity: {e}")
        # La llamada se guarda exitosamente aunque falle el registro de intento
```

### 2. Endpoint PUT/PATCH /api/crm/calls/{call_id}

**Archivo**: `app/api/endpoints/crm.py`

**Después de actualizar la llamada**:

```python
# Después de actualizar la llamada en la BD
call = update_call_function(...)

# ⚠️ OBLIGATORIO: Re-registrar intento si cambió el estado de la llamada
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
        logger.warning(f"Error updating call attempt for opportunity: {e}")
```

### 3. ZadarmaService.create_or_update_call

**Archivo**: `app/services/zadarma_service.py`

**Después de crear/actualizar desde webhook de Zadarma**:

```python
# Después de crear/actualizar la llamada desde webhook
call = create_or_update_from_webhook(...)

# ⚠️ OBLIGATORIO: Registrar intento en oportunidad si aplica
if call.entity_id and call.entity_type == EntityType.CONTACTS.value and call.direction == "outbound":
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

### 4. ZadarmaRecordingEmailService.process_zadarma_recording_email

**Archivo**: `app/services/zadarma_recording_email_service.py`

**Después de procesar email con grabación**:

```python
# Después de crear/actualizar la llamada desde email
call = process_email_recording(...)

# ⚠️ OBLIGATORIO: Registrar intento en oportunidad si aplica
if call.entity_id and call.entity_type == EntityType.CONTACTS.value and call.direction == "outbound":
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

---

## 🔧 Método Principal: `register_call_attempt`

**Ubicación**: `app/services/lead_opportunity_service.py`

### Lógica de Implementación

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
    """
    Registra un intento de llamada en la oportunidad asociada al contacto.
    
    IMPORTANTE: 
    - Solo procesa llamadas OUTBOUND
    - Solo registra en oportunidades activas (status: pending, assigned, contacted)
    - Solo registra si first_call_completed == False
    - Determina automáticamente el número de intento (1-5)
    - Determina el estado según call_status
    """
    
    # 1. Validar que sea llamada OUTBOUND
    if call_direction != "outbound":
        return None
    
    # 2. Buscar oportunidad activa para el contacto (relación 1:1)
    opportunity = await self.db.execute(
        select(LeadOpportunity)
        .where(
            LeadOpportunity.contact_id == contact_id,
            LeadOpportunity.status.in_(["pending", "assigned", "contacted"]),
            LeadOpportunity.first_call_completed == False
        )
        .order_by(LeadOpportunity.created_at.desc())
        .limit(1)
    )
    
    opportunity = opportunity.scalar_one_or_none()
    
    if not opportunity:
        # No hay oportunidad activa, no hacer nada
        return None
    
    # 3. Obtener intentos existentes
    attempts = opportunity.first_call_attempts or {}
    
    # 4. Verificar si esta llamada ya está registrada como intento
    # (Evitar duplicados)
    for attempt_num, attempt_data in attempts.items():
        if attempt_data.get("call_id") == str(call_id):
            # Ya está registrada, actualizar estado si cambió
            attempt_data["status"] = self._determine_attempt_status(call_status)
            attempt_data["attempted_at"] = (attempted_at or datetime.utcnow()).isoformat()
            if notes:
                attempt_data["notes"] = notes
            # Guardar y retornar
            opportunity.first_call_attempts = attempts
            await self._update_opportunity_fields(opportunity, attempts)
            return opportunity
    
    # 5. Determinar número de intento siguiente (1-5)
    existing_numbers = [int(k) for k in attempts.keys() if k.isdigit()]
    if existing_numbers:
        next_attempt = max(existing_numbers) + 1
    else:
        next_attempt = 1
    
    # Verificar que no exceda 5 intentos
    if next_attempt > 5:
        return None  # Ya se usaron los 5 intentos
    
    # 6. Determinar estado del intento
    attempt_status = self._determine_attempt_status(call_status)
    
    # 7. Registrar el intento
    attempts[str(next_attempt)] = {
        "status": attempt_status,
        "call_id": str(call_id),
        "attempted_at": (attempted_at or datetime.utcnow()).isoformat(),
        "notes": notes or "",
    }
    
    # 8. Actualizar oportunidad
    opportunity.first_call_attempts = attempts
    await self._update_opportunity_fields(opportunity, attempts, next_attempt, attempt_status)
    
    return opportunity

def _determine_attempt_status(self, call_status: Optional[str]) -> str:
    """Determina el estado del intento según el estado de la llamada."""
    if not call_status:
        return "orange"  # Por defecto, fallida
    
    call_status_lower = call_status.lower()
    
    if call_status_lower in ["completed", "answered"]:
        return "green"
    elif call_status_lower == "rejected":
        return "red"
    else:  # failed, no_answer, busy, etc.
        return "orange"

async def _update_opportunity_fields(
    self,
    opportunity: LeadOpportunity,
    attempts: Dict[str, Any],
    attempt_number: int,
    attempt_status: str,
):
    """Actualiza campos adicionales de la oportunidad."""
    
    # Si el intento es exitoso (green), marcar como completada
    if attempt_status == "green":
        opportunity.first_call_completed = True
        opportunity.first_call_successful_attempt = attempt_number
    
    # Actualizar última fecha de contacto
    if attempts:
        last_attempt = max(attempts.values(), key=lambda x: x.get("attempted_at", ""))
        if last_attempt.get("attempted_at"):
            opportunity.last_contact_attempt_at = datetime.fromisoformat(
                last_attempt["attempted_at"].replace("Z", "+00:00")
            )
    
    # Actualizar status si corresponde
    if opportunity.status == "pending" and len(attempts) > 0:
        opportunity.status = "contacted"
    
    await self.db.commit()
```

---

## ⚠️ Reglas de Negocio CRÍTICAS

### 1. Relación 1:1 Contacto-Oportunidad

- **Una oportunidad por contacto**: Si un contacto tiene múltiples oportunidades, se debe seleccionar la más reciente activa
- **Filtro por status**: Solo oportunidades con `status IN ['pending', 'assigned', 'contacted']`
- **Filtro por completitud**: Solo si `first_call_completed == False`

### 2. Solo Llamadas Salientes

- **OUTBOUND únicamente**: Las llamadas entrantes (INBOUND) NO se registran como intentos
- **Verificar `call.direction`**: Debe ser exactamente `"outbound"`

### 3. Máximo 5 Intentos

- **Límite estricto**: No registrar más de 5 intentos
- **Orden cronológico**: Los intentos se registran en orden (1, 2, 3, 4, 5)
- **Evitar duplicados**: Si una llamada ya está registrada como intento, actualizar en lugar de crear nuevo

### 4. Actualización Automática

- **Si el intento es `green`**: 
  - `first_call_completed = True`
  - `first_call_successful_attempt = attempt_number`
- **Si hay cualquier intento**:
  - `last_contact_attempt_at = attempted_at` (del último intento)
- **Cambio de status**:
  - Si `status == 'pending'` y hay intentos → `status = 'contacted'`

### 5. Manejo de Errores

- **NO fallar la creación de la llamada**: Si el registro de intento falla, la llamada se debe guardar exitosamente
- **Logging**: Registrar errores en logs para debugging
- **Silencioso**: No propagar excepciones al llamador

---

## 🔍 Verificación y Testing

### Casos de Prueba

1. **Llamada nueva → Intento registrado**: Crear llamada OUTBOUND para contacto con oportunidad activa
2. **Llamada existente → Intento actualizado**: Actualizar estado de llamada ya registrada
3. **Llamada INBOUND → No registra**: Verificar que llamadas entrantes no registran intentos
4. **5 intentos completados → No registra más**: Verificar límite de 5 intentos
5. **Oportunidad completada → No registra más**: Verificar que si `first_call_completed = True`, no se registren más intentos
6. **Intento exitoso → Marca completado**: Verificar que intento `green` marca `first_call_completed = True`
7. **Múltiples llamadas → Orden cronológico**: Verificar que se registran en orden (1, 2, 3, 4, 5)

---

## 📊 Impacto Esperado

### Beneficios

- ✅ **Registro automático en tiempo real**: No requiere intervención manual
- ✅ **Datos consistentes**: Llamadas y oportunidades siempre sincronizadas
- ✅ **Trazabilidad completa**: Historial completo de intentos de llamada
- ✅ **Menos errores**: Automatización reduce errores humanos

### Métricas de Éxito

- **100% de llamadas OUTBOUND** asociadas a contactos con oportunidades activas deben registrar intentos automáticamente
- **0% de llamadas duplicadas** registradas como intentos
- **Tiempo de registro < 100ms** (no debe afectar performance de creación de llamadas)

---

## 🔗 Referencias

- Ver también: `docs/BACKEND_CALL_ATTEMPTS_SYNC_SCRIPT.md` (script de sincronización para llamadas históricas)
- Estructura de datos: `docs/BACKEND_CALL_ATTEMPTS_AUTO_REGISTRATION.md` (documentación original)

