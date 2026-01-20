## Corrección de código muerto en CRMContactList

### Fecha
2026-01-20

### Bug corregido

#### Código muerto en useEffect de validación
**Archivo**: `src/pages/CRMContactList.tsx`
**Líneas**: 112-125 (eliminadas)

**Problema**: El `useEffect` contenía una condición lógica que nunca podía ser verdadera:

```typescript
const isMyContacts = Boolean(currentUserId) && responsibleUserId === currentUserId;

useEffect(() => {
  if (currentUserId) {
    // Esta condición nunca puede ser verdadera
    if (isMyContacts && responsibleUserId !== currentUserId) {
      // Código muerto que nunca se ejecuta
      setResponsibleUserId(currentUserId);
    }
  }
}, [currentUserId, responsibleUserId, isMyContacts]);
```

**Análisis**:
- `isMyContacts` se define como `Boolean(currentUserId) && responsibleUserId === currentUserId`
- Si `isMyContacts` es `true`, entonces por definición `responsibleUserId === currentUserId`
- Por lo tanto, la condición `isMyContacts && responsibleUserId !== currentUserId` nunca puede ser `true`
- Esto hace que el código dentro del `if` sea código muerto (dead code)

**Solución**: Se eliminó el `useEffect` completo porque:
1. La validación que intenta hacer es redundante
2. `isMyContacts` ya se calcula directamente del estado, por lo que no puede haber inconsistencias
3. El `handleMyContactsToggle` ya asegura que cuando el switch está activo, `responsibleUserId` se establece correctamente a `currentUserId`

**Código después de la corrección**:
```typescript
const isMyContacts = Boolean(currentUserId) && responsibleUserId === currentUserId;
const handleMyContactsToggle = (checked: boolean) => {
  if (!currentUserId) {
    console.warn('⚠️ [CRMContactList] No hay currentUserId disponible para filtrar');
    return;
  }
  // Asegurar que siempre usamos el currentUserId, nunca un valor diferente
  setResponsibleUserId(checked ? currentUserId : '');
};
```

### Validación

- ✅ No hay errores de linter
- ✅ El código muerto ha sido eliminado
- ✅ La funcionalidad del switch "Solo mis contactos" se mantiene intacta
- ✅ No hay efectos secundarios negativos

### Notas

- El `handleMyContactsToggle` ya maneja correctamente la sincronización entre el estado del switch y `responsibleUserId`
- No se requiere validación adicional porque `isMyContacts` es una propiedad derivada que siempre refleja el estado actual
