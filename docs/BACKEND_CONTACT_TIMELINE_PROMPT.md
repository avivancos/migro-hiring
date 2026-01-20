## Línea de tiempo unificada por contacto

### Endpoint
`GET /api/crm/contacts/{contact_id}/timeline`

### Objetivo
Unificar la línea de tiempo de un contacto (eventos pasados y futuros) para evitar
lógica duplicada en frontend.

### Parámetros (query)
- `limit` (int, default `50`, max `200`): cantidad de eventos.
- `page` (int, default `1`): paginación basada en página.
- `skip` (int, opcional): offset legacy (anula `page` si se envía).
- `include_future` (bool, default `true`): incluye eventos futuros.
- `include_related` (bool, default `true`): incluye eventos relacionados (oportunidades).

### Fuentes de eventos
- **Contacto**: `contacts.created_at` → `contact_created`
- **Llamadas**: `calls.started_at || calls.created_at` → `call`
- **Llamadas programadas**: `calls.proxima_accion_fecha`, `calls.proxima_llamada_fecha` → `call_scheduled`
- **Tareas**: `tasks.created_at` → `task`
- **Vencimiento de tareas**: `tasks.complete_till` → `task_due`
- **Notas**: `notes.created_at` → `note`
- **Oportunidades**: `lead_opportunities.detected_at || created_at` → `opportunity`

### Respuesta (ejemplo)
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

### Notas
- `is_future` se calcula comparando contra `now()` en UTC.
- `entity_id` siempre es el `contact_id`; el origen real está en `metadata.source_*`.
- `include_related` actualmente agrega oportunidades asociadas al contacto.
