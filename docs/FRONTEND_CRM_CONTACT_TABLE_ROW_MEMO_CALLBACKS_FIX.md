## Contexto
`ContactTableRow` está envuelto en `React.memo()` con una función de comparación custom para reducir re-renders en la tabla de contactos.

## Problema
La comparación custom **no incluía** los callbacks `onNavigate` y `onToggleSelected`.

Cuando el componente padre (`CRMContactList`) re-renderiza y crea **nuevas closures** (por ejemplo, `onToggleSelected={(checked) => toggleContactSelected(contact.id, checked)}`), la fila podía **no re-renderizar** y quedarse con referencias **stale**.

Impacto observado:
- Click en checkbox podía ejecutar lógica con estado/cierres previos (selección incorrecta).
- Navegación podía usar un callback viejo (si `onNavigate` se usa desde arriba).

## Fix aplicado
- Archivo: `src/components/CRM/ContactTableRow.tsx`
- Cambio: la función de comparación de `memo()` ahora compara:
  - `prevProps.onNavigate !== nextProps.onNavigate`
  - `prevProps.onToggleSelected !== nextProps.onToggleSelected` (cuando `showSelection` es true)

Con esto, si el padre cambia closures, la fila re-renderiza y queda sincronizada con los callbacks actuales.

## Test de regresión
- Archivo: `src/components/CRM/__tests__/ContactTableRow.memoCallbacks.test.tsx`
- Cubre:
  - cambio de `onNavigate` sin cambios en datos visibles
  - cambio de `onToggleSelected` sin cambios en datos visibles

