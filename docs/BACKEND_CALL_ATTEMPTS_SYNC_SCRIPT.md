# Script de Sincronización: Registro de Intentos desde Llamadas Históricas

**Fecha**: 2025-01-29  
**Módulo**: CRM - Opportunities - Data Migration  
**Prioridad**: Media  
**Estado**: 📋 Requiere implementación

---

## 📋 Resumen Ejecutivo

Script de sincronización para procesar todas las oportunidades existentes y registrar intentos de primera llamada basándose en las llamadas OUTBOUND históricas asociadas a cada contacto. Este script corrige inconsistencias donde las llamadas fueron creadas antes de implementar el registro automático de intentos.

---

## 🎯 Objetivo

Procesar todas las oportunidades activas y, para cada una, registrar automáticamente los intentos de primera llamada basándose en las llamadas OUTBOUND existentes asociadas al contacto de la oportunidad (relación 1:1).

---

## 🔄 Lógica del Script

### Paso 1: Obtener Todas las Oportunidades Activas

```python
# Oportunidades que necesitan sincronización
opportunities = db.query(LeadOpportunity).filter(
    LeadOpportunity.status.in_(["pending", "assigned", "contacted"]),
    LeadOpportunity.first_call_completed == False
).all()
```

### Paso 2: Para Cada Oportunidad

1. **Obtener el contacto** asociado (`contact_id`)
2. **Buscar todas las llamadas OUTBOUND** del contacto:
   - `entity_type == 'contacts'`
   - `entity_id == contact_id`
   - `direction == 'outbound'`
   - Ordenadas por `started_at` o `created_at` (ascendente)
3. **Filtrar llamadas**:
   - Solo llamadas realizadas ANTES de que la oportunidad se marque como completada (si aplica)
   - Máximo 5 llamadas
   - Excluir llamadas ya registradas como intentos (verificar por `call_id` en `first_call_attempts`)
4. **Registrar cada llamada como intento** en orden cronológico (1-5)
5. **Actualizar campos** de la oportunidad:
   - `first_call_attempts`
   - `first_call_completed` (si hay intento exitoso)
   - `first_call_successful_attempt`
   - `last_contact_attempt_at`

---

## 🔧 Implementación del Script

### Ubicación Sugerida

**Archivo**: `scripts/sync_call_attempts_from_history.py`

### Estructura del Script

```python
"""
Script para sincronizar intentos de primera llamada desde llamadas históricas.

Uso:
    python scripts/sync_call_attempts_from_history.py [--dry-run] [--limit N] [--contact-id UUID]

Opciones:
    --dry-run: Solo muestra lo que haría, no modifica la BD
    --limit N: Procesa solo las primeras N oportunidades
    --contact-id UUID: Procesa solo la oportunidad de un contacto específico
"""

import asyncio
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.lead_opportunity import LeadOpportunity
from app.models.call import Call
from app.models.entity_type import EntityType


async def sync_call_attempts_for_opportunity(
    db: AsyncSession,
    opportunity: LeadOpportunity,
    dry_run: bool = False
) -> Dict[str, Any]:
    """
    Sincroniza intentos de llamada para una oportunidad específica.
    
    Returns:
        Dict con información sobre los intentos registrados
    """
    result = {
        "opportunity_id": str(opportunity.id),
        "contact_id": str(opportunity.contact_id),
        "attempts_registered": [],
        "errors": [],
    }
    
    # 1. Obtener llamadas OUTBOUND del contacto
    calls_query = select(Call).where(
        and_(
            Call.entity_type == EntityType.CONTACTS.value,
            Call.entity_id == opportunity.contact_id,
            Call.direction == "outbound"
        )
    ).order_by(
        Call.started_at.asc().nullsfirst(),
        Call.created_at.asc()
    ).limit(5)
    
    calls_result = await db.execute(calls_query)
    calls = calls_result.scalars().all()
    
    if not calls:
        result["message"] = "No hay llamadas OUTBOUND para este contacto"
        return result
    
    # 2. Obtener intentos existentes
    existing_attempts = opportunity.first_call_attempts or {}
    existing_call_ids = {
        attempt_data.get("call_id")
        for attempt_data in existing_attempts.values()
        if attempt_data.get("call_id")
    }
    
    # 3. Filtrar llamadas que no están ya registradas
    new_calls = [call for call in calls if str(call.id) not in existing_call_ids]
    
    if not new_calls:
        result["message"] = "Todas las llamadas ya están registradas como intentos"
        return result
    
    # 4. Determinar números de intento disponibles
    existing_numbers = {int(k) for k in existing_attempts.keys() if k.isdigit()}
    available_numbers = [i for i in range(1, 6) if i not in existing_numbers]
    
    # Limitar a 5 intentos totales
    max_new_attempts = min(len(new_calls), len(available_numbers), 5 - len(existing_numbers))
    calls_to_register = new_calls[:max_new_attempts]
    
    # 5. Registrar cada llamada como intento
    for call, attempt_number in zip(calls_to_register, available_numbers[:max_new_attempts]):
        # Determinar estado del intento
        attempt_status = _determine_attempt_status(call.call_status)
        
        # Crear estructura del intento
        attempt_data = {
            "status": attempt_status,
            "call_id": str(call.id),
            "attempted_at": (call.started_at or call.created_at).isoformat(),
            "notes": (call.resumen_llamada or call.call_result or ""),
        }
        
        if not dry_run:
            # Registrar en first_call_attempts
            existing_attempts[str(attempt_number)] = attempt_data
            
            result["attempts_registered"].append({
                "attempt_number": attempt_number,
                "call_id": str(call.id),
                "status": attempt_status,
                "call_date": attempt_data["attempted_at"],
            })
        else:
            result["attempts_registered"].append({
                "attempt_number": attempt_number,
                "call_id": str(call.id),
                "status": attempt_status,
                "call_date": attempt_data["attempted_at"],
                "dry_run": True,
            })
    
    if not dry_run:
        # 6. Actualizar oportunidad
        opportunity.first_call_attempts = existing_attempts
        
        # Marcar como completada si hay intento exitoso
        for attempt_num, attempt_data in existing_attempts.items():
            if attempt_data.get("status") == "green":
                opportunity.first_call_completed = True
                opportunity.first_call_successful_attempt = int(attempt_num)
                break
        
        # Actualizar última fecha de contacto
        if existing_attempts:
            last_attempt = max(
                existing_attempts.values(),
                key=lambda x: x.get("attempted_at", "")
            )
            if last_attempt.get("attempted_at"):
                opportunity.last_contact_attempt_at = datetime.fromisoformat(
                    last_attempt["attempted_at"].replace("Z", "+00:00")
                )
        
        # Actualizar status si corresponde
        if opportunity.status == "pending" and len(existing_attempts) > 0:
            opportunity.status = "contacted"
        
        await db.commit()
        
        result["message"] = f"Registrados {len(result['attempts_registered'])} intentos"
    else:
        result["message"] = f"[DRY RUN] Se registrarían {len(result['attempts_registered'])} intentos"
    
    return result


def _determine_attempt_status(call_status: Optional[str]) -> str:
    """Determina el estado del intento según el estado de la llamada."""
    if not call_status:
        return "orange"
    
    call_status_lower = call_status.lower()
    
    if call_status_lower in ["completed", "answered"]:
        return "green"
    elif call_status_lower == "rejected":
        return "red"
    else:  # failed, no_answer, busy, etc.
        return "orange"


async def sync_all_opportunities(
    db: AsyncSession,
    dry_run: bool = False,
    limit: Optional[int] = None,
    contact_id: Optional[uuid.UUID] = None
):
    """
    Sincroniza intentos para todas las oportunidades activas.
    """
    # Construir query
    query = select(LeadOpportunity).where(
        and_(
            LeadOpportunity.status.in_(["pending", "assigned", "contacted"]),
            LeadOpportunity.first_call_completed == False
        )
    )
    
    if contact_id:
        query = query.where(LeadOpportunity.contact_id == contact_id)
    
    query = query.order_by(LeadOpportunity.created_at.desc())
    
    if limit:
        query = query.limit(limit)
    
    result = await db.execute(query)
    opportunities = result.scalars().all()
    
    print(f"📊 Procesando {len(opportunities)} oportunidades...")
    print(f"{'[DRY RUN]' if dry_run else ''} Modo: {'Simulación' if dry_run else 'Ejecución real'}")
    print("-" * 80)
    
    total_attempts_registered = 0
    total_errors = 0
    results = []
    
    for idx, opportunity in enumerate(opportunities, 1):
        try:
            result = await sync_call_attempts_for_opportunity(db, opportunity, dry_run)
            results.append(result)
            
            if result.get("attempts_registered"):
                total_attempts_registered += len(result["attempts_registered"])
                print(f"✅ [{idx}/{len(opportunities)}] Oportunidad {opportunity.id}: "
                      f"{len(result['attempts_registered'])} intentos registrados")
            else:
                print(f"ℹ️  [{idx}/{len(opportunities)}] Oportunidad {opportunity.id}: "
                      f"{result.get('message', 'Sin cambios')}")
            
            if result.get("errors"):
                total_errors += len(result["errors"])
                print(f"   ⚠️  Errores: {result['errors']}")
        
        except Exception as e:
            total_errors += 1
            print(f"❌ [{idx}/{len(opportunities)}] Oportunidad {opportunity.id}: Error - {e}")
            results.append({
                "opportunity_id": str(opportunity.id),
                "errors": [str(e)],
            })
    
    print("-" * 80)
    print(f"📈 Resumen:")
    print(f"   Total oportunidades procesadas: {len(opportunities)}")
    print(f"   Total intentos registrados: {total_attempts_registered}")
    print(f"   Total errores: {total_errors}")
    
    return results


async def main():
    """Función principal del script."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Sincronizar intentos de primera llamada desde llamadas históricas"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Solo mostrar lo que haría, no modificar la BD"
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Procesar solo las primeras N oportunidades"
    )
    parser.add_argument(
        "--contact-id",
        type=str,
        help="Procesar solo la oportunidad de un contacto específico (UUID)"
    )
    
    args = parser.parse_args()
    
    contact_id = None
    if args.contact_id:
        try:
            contact_id = uuid.UUID(args.contact_id)
        except ValueError:
            print(f"❌ Error: {args.contact_id} no es un UUID válido")
            return
    
    async with AsyncSessionLocal() as db:
        try:
            await sync_all_opportunities(
                db,
                dry_run=args.dry_run,
                limit=args.limit,
                contact_id=contact_id
            )
        except Exception as e:
            print(f"❌ Error fatal: {e}")
            raise
        finally:
            await db.close()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## 🚀 Uso del Script

### Ejecución Básica (Dry Run - Simulación)

```bash
python scripts/sync_call_attempts_from_history.py --dry-run
```

### Ejecución Real (Modifica la BD)

```bash
python scripts/sync_call_attempts_from_history.py
```

### Procesar Solo un Contacto Específico

```bash
python scripts/sync_call_attempts_from_history.py --contact-id "uuid-del-contacto"
```

### Limitar Número de Oportunidades

```bash
python scripts/sync_call_attempts_from_history.py --limit 100 --dry-run
```

---

## ⚠️ Consideraciones Importantes

### 1. Orden de Llamadas

- **Orden cronológico**: Las llamadas se procesan en orden cronológico (`started_at` o `created_at` ascendente)
- **Números de intento**: Se asignan números de intento (1-5) en orden cronológico

### 2. Evitar Duplicados

- **Verificar `call_id`**: Antes de registrar, verificar que la llamada no esté ya registrada como intento
- **Usar números disponibles**: Solo usar números de intento que no estén ya ocupados

### 3. Límite de 5 Intentos

- **Máximo 5 intentos**: No registrar más de 5 intentos por oportunidad
- **Respetar intentos existentes**: Si ya hay intentos registrados, solo agregar los faltantes

### 4. Estados de Intentos

- **Misma lógica**: Usar la misma lógica de determinación de estados que en `register_call_attempt`:
  - `completed`, `answered` → `green`
  - `failed`, `no_answer`, `busy` → `orange`
  - `rejected` → `red`

### 5. Actualización de Campos

- **`first_call_completed`**: Marcar como `True` si hay algún intento con `status = 'green'`
- **`first_call_successful_attempt`**: Asignar el número del primer intento exitoso
- **`last_contact_attempt_at`**: Actualizar con la fecha del último intento
- **`status`**: Cambiar a `'contacted'` si estaba en `'pending'` y hay intentos

### 6. Transacciones

- **Una oportunidad por transacción**: Cada oportunidad se procesa en su propia transacción
- **Rollback en error**: Si falla una oportunidad, no afecta a las demás
- **Commit explícito**: Solo hacer commit si no es dry-run

---

## 🧪 Testing

### Ejecutar en Dry Run Primero

**SIEMPRE** ejecutar primero con `--dry-run` para ver qué haría el script:

```bash
python scripts/sync_call_attempts_from_history.py --dry-run --limit 10
```

### Verificar Resultados

Después de ejecutar, verificar en la BD:

```sql
-- Ver oportunidades con intentos registrados
SELECT 
    id,
    contact_id,
    first_call_attempts,
    first_call_completed,
    first_call_successful_attempt,
    status
FROM lead_opportunities
WHERE first_call_attempts IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

---

## 📊 Ejemplo de Salida

```
📊 Procesando 25 oportunidades...
Modo: Ejecución real
--------------------------------------------------------------------------------
✅ [1/25] Oportunidad abc-123: 3 intentos registrados
ℹ️  [2/25] Oportunidad def-456: Todas las llamadas ya están registradas como intentos
✅ [3/25] Oportunidad ghi-789: 1 intento registrado
❌ [4/25] Oportunidad jkl-012: Error - Contacto no encontrado
...
--------------------------------------------------------------------------------
📈 Resumen:
   Total oportunidades procesadas: 25
   Total intentos registrados: 45
   Total errores: 1
```

---

## 🔗 Relación con Registro Automático

Este script es un **one-time migration** para corregir datos históricos. Una vez ejecutado:

1. **El registro automático** (ver `BACKEND_CALL_ATTEMPTS_AUTO_REGISTRATION_CLARIFIED.md`) se encargará de registrar nuevos intentos en tiempo real
2. **Este script** solo se necesita ejecutar una vez o cuando haya inconsistencias detectadas
3. **Se puede ejecutar periódicamente** como mantenimiento si es necesario

---

## 📝 Notas Adicionales

- **Performance**: Si hay muchas oportunidades, considerar procesar en lotes
- **Logging**: Agregar logging detallado para auditoría
- **Backup**: Hacer backup de la BD antes de ejecutar en producción
- **Monitoreo**: Monitorear logs y métricas durante la ejecución

