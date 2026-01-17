# Fix: Tabla de Tareas no se Mostraba en /crm/tasks

## Problema
La página `/crm/tasks` no mostraba el listado en modo tabla compacto, a diferencia de las páginas de oportunidades y contactos que sí lo mostraban correctamente.

## Causa
1. El estado de `loading` estaba fuera de la condición de renderizado de la tabla (`viewMode === 'table'`), lo que causaba que la tabla no se mostrara correctamente durante la carga o cuando no había tareas.
2. El `viewMode` podía estar guardado como 'cards' en localStorage, impidiendo que se mostrara la tabla.
3. La tabla no tenía un estilo compacto como las otras páginas.

## Solución
Se reorganizó el código para que:

1. **El estado de loading está dentro de la vista de tabla**: Ahora cuando `viewMode === 'table'`, la tabla siempre se muestra, y el estado de loading se maneja dentro del componente `Card` de la tabla.

2. **Mensaje cuando no hay tareas**: Se agregó un mensaje dentro del `tbody` de la tabla cuando `tasks.length === 0`, similar a como se maneja en contactos y oportunidades.

3. **Vista móvil mejorada**: También se mejoró la vista móvil para mostrar el estado de loading y el mensaje cuando no hay tareas.

4. **Modo tabla forzado por defecto**: Se agregó lógica para forzar el modo 'table' al cargar, limpiando cualquier valor 'cards' guardado en localStorage.

5. **Altura de celdas igual a contactos**: Se ajustó el padding de las celdas a `px-4 py-3` para que coincida exactamente con la altura de las celdas en la tabla de contactos, asegurando consistencia visual en toda la aplicación.

## Cambios Realizados

### Archivo: `src/components/CRM/Tasks/TaskList.tsx`

- Se movió el manejo del estado `loading` dentro de la condición `viewMode === 'table'`
- Se agregó un mensaje de "No hay tareas que mostrar" dentro del `tbody` cuando no hay tareas
- Se mejoró la experiencia de usuario mostrando un spinner de carga dentro de la tabla
- Se agregó un `useEffect` para forzar el modo 'table' si está guardado como 'cards' en localStorage
- Se ajustó el padding de los headers de tabla a `px-4 py-3` para coincidir con contactos
- Se cambió el breakpoint de `md` a `lg` para mostrar la tabla en pantallas más grandes
- Se mejoró la visibilidad del botón de cambio de vista agregando `w-full sm:w-auto` al contenedor

### Archivo: `src/components/CRM/Tasks/TaskTableRow.tsx`

- Se ajustó el padding de todas las celdas a `px-4 py-3` para coincidir exactamente con contactos
- Se agregó `whitespace-nowrap` a las celdas para evitar saltos de línea
- Se mantuvieron los iconos en `w-4 h-4` y gaps en `gap-2` para consistencia con contactos
- Se mantuvo el padding de los iconos en `p-1.5` para consistencia visual

## Comportamiento Actual

- ✅ La tabla se muestra siempre cuando `viewMode === 'table'` (modo por defecto)
- ✅ Muestra un spinner de carga dentro de la tabla mientras carga
- ✅ Muestra un mensaje cuando no hay tareas
- ✅ Funciona igual que las páginas de contactos y oportunidades
- ✅ Vista móvil muestra cards con el mismo comportamiento
- ✅ Tabla con altura de celdas igual a contactos (`px-4 py-3`)
- ✅ Botón de cambio de vista visible y funcional
- ✅ El modo tabla se fuerza automáticamente al cargar si estaba en modo cards

## Fecha
2025-01-27
