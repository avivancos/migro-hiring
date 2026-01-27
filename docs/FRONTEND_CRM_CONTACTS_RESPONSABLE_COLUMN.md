# CRM Contactos: columna Responsable en tabla

## Contexto
La tabla de contactos del CRM no mostraba la columna de responsable, lo que impedía identificar rápidamente a quién está asignado cada contacto en la vista de tabla.

## Cambios aplicados
- Se agregó la columna **Responsable** en la tabla de `CRMContactList`.
- La columna se incluye en el orden y configuración de columnas (visibilidad, orden y ancho).
- Se muestra el nombre/email del usuario responsable usando el catálogo de usuarios cargado en la página.
- Fallbacks:
  - Si no hay `responsible_user_id`, se muestra **"Sin asignar"**.
  - Si no hay nombre/email en el mapa, se muestra el `responsible_user_id`.

## Archivos tocados
- `src/pages/CRMContactList.tsx`
- `src/components/CRM/ContactTableRow.tsx`

## Pruebas sugeridas
1. Abrir CRM → Contactos (vista tabla).
2. Verificar que aparece la columna **Responsable**.
3. Confirmar que:
   - Contactos con responsable muestran nombre/email.
   - Contactos sin responsable muestran **"Sin asignar"**.
4. Abrir configuración de columnas y validar que **Responsable** se puede ocultar/ordenar.
