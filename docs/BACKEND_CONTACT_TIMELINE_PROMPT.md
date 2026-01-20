## Línea de tiempo unificada por contacto

### Endpoint
`GET /api/crm/contacts/{contact_id}/timeline`

### Objetivo
Unificar la línea de tiempo de un contacto (eventos pasados y futuros) para evitar
lógica duplicada en frontend.

### Query params
- `limit` (int, default `50`, max `200`).
- `page` (int, default `1`).
- `skip` (int, opcional, legacy; si viene, anula `page`).
- `include_future` (bool, default `true`).
- `include_related` (bool, default `true`).

### Tipos de eventos (type)
- `contact_created`
- `call`
- `call_scheduled`
- `task`
- `task_due`
- `note`
- `opportunity`

### Fuentes de eventos
- `contacts.created_at` → `contact_created`
- `calls.started_at || calls.created_at` → `call`
- `calls.proxima_accion_fecha`, `calls.proxima_llamada_fecha` → `call_scheduled`
- `tasks.created_at` → `task`
- `tasks.complete_till` → `task_due`
- `notes.created_at` → `note`
- `lead_opportunities.detected_at || created_at` → `opportunity`

### Reglas importantes
- Ordenado por `date` descendente.
- `is_future` viene calculado por backend (UTC).
- `entity_id` siempre es el `contact_id`; el origen real está en `metadata.source_*`.
- `include_related` hoy incluye oportunidades.

### Ejemplo de respuesta
```json
{
  "items": [
    {
      "id": "call:9f4e...:started_at",
      "type": "call",
      "date": "2026-01-20T09:30:00+00:00",
      "is_future": false,
      "entity_id": "contact_id",
      "entity_type": "contacts",
      "title": "Llamada",
      "description": "Cliente interesado",
      "user_id": "uuid",
      "metadata": {
        "source_id": "uuid",
        "source_type": "call",
        "field": "started_at",
        "phone": "+34600111222",
        "duration": 120
      }
    }
  ],
  "total": 123
}
```
