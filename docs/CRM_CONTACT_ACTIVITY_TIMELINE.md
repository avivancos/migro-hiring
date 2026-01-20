## Línea de tiempo de actividades en ficha de contacto

### Objetivo
Unificar en una sola línea temporal los eventos pasados y futuros asociados al contacto en el CRM, con enfoque mobile-first y lectura rápida.

### Fuentes de datos (frontend)
- Contacto: `contact.created_at` → evento "Contacto creado".
- Llamadas:
  - Históricas: `call.started_at || call.created_at` → evento "Llamada".
  - Futuras: `call.proxima_accion_fecha` y `call.proxima_llamada_fecha` → eventos "Próxima acción" / "Próxima llamada".
- Tareas:
  - Históricas: `task.created_at` → evento "Tarea creada".
  - Futuras o vencidas: `task.complete_till` → evento "Vence tarea".
- Notas: `note.created_at` → evento "Nota".
- Oportunidades relacionadas: `opportunity.detected_at || opportunity.created_at` → evento "Oportunidad detectada".

### Reglas de ordenamiento
- Todos los eventos se ordenan por `date` descendente.
- Los eventos futuros se marcan visualmente con badge “Próximo”.

### Comportamiento UI (mobile-first)
- Línea vertical con hitos y tarjetas compactas.
- Iconos y colores por tipo de evento.
- Header con fecha, responsable (si aplica) y badge “Próximo”.
- Acciones rápidas para navegar al contacto desde eventos de llamadas/tareas.

### Mapeo de iconos y labels (propuesto)
- `contact_created`: UserIcon — "Contacto creado"
- `call`: PhoneIcon — "Llamada"
- `call_scheduled`: PhoneIcon — "Llamada programada"
- `task`: ClockIcon — "Tarea"
- `task_due`: ClockIcon — "Vence tarea"
- `note`: DocumentTextIcon — "Nota"
- `opportunity`: StarIcon — "Oportunidad detectada"

### Consideraciones
- No depende de un endpoint unificado del backend; se construye en el frontend combinando llamadas, tareas, notas y oportunidades ya disponibles.
- Si el backend expone más eventos (pagos, contratos, etc.), se pueden agregar como tipos adicionales en la misma línea temporal.
