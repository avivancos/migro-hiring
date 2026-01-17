# Fix: Gradings No Se Guardaban al Editar Contacto

## Problema

Los campos `grading_llamada` y `grading_situacion` no se guardaban correctamente al editar un contacto en el entorno web del CRM.

## Causa del Problema

El código original en `ContactForm.tsx` tenía esta lógica:

```typescript
if (formData.grading_llamada) cleanedData.grading_llamada = formData.grading_llamada;
if (formData.grading_situacion) cleanedData.grading_situacion = formData.grading_situacion;
```

El problema era que cuando el valor de `grading_llamada` o `grading_situacion` es una cadena vacía (`""`), la condición `if (formData.grading_llamada)` evalúa a `false` porque una cadena vacía es falsy en JavaScript.

Esto causaba que:
1. Si el usuario tenía un valor (ej: "A") y lo cambiaba a "Seleccionar..." (valor vacío `""`), el campo no se enviaba, por lo que el backend no actualizaba el valor
2. Si el usuario establecía un nuevo valor, funcionaba correctamente
3. Si el usuario quería deseleccionar un grading existente, no se enviaba para eliminarlo

## Solución

Se modificó la lógica para que los gradings se envíen correctamente en todos los casos:

```typescript
// Los gradings deben enviarse siempre si hay un valor seleccionado o si el contacto original tenía un valor
// Si el valor está vacío ('') y el contacto original tenía un valor, se envía null para eliminar
// Si hay un valor seleccionado, se envía ese valor
if (formData.grading_llamada && formData.grading_llamada.trim()) {
  // Hay un valor seleccionado, enviarlo
  cleanedData.grading_llamada = formData.grading_llamada;
} else if (contact?.grading_llamada) {
  // El contacto original tenía un valor pero ahora está vacío, enviar null para eliminar
  cleanedData.grading_llamada = null;
}

if (formData.grading_situacion && formData.grading_situacion.trim()) {
  // Hay un valor seleccionado, enviarlo
  cleanedData.grading_situacion = formData.grading_situacion;
} else if (contact?.grading_situacion) {
  // El contacto original tenía un valor pero ahora está vacío, enviar null para eliminar
  cleanedData.grading_situacion = null;
}
```

## Comportamiento Después del Fix

Ahora el comportamiento es el siguiente:

1. **Si hay un valor seleccionado**: Se envía ese valor (ej: "A", "B+", "C", etc.)
2. **Si el contacto original tenía un valor y el usuario lo deselecciona**: Se envía `null` para eliminar el grading en el backend
3. **Si el contacto original no tenía un valor y el usuario no selecciona nada**: No se envía el campo (lo cual está bien)

## Archivos Modificados

- `src/components/CRM/ContactForm.tsx`: Líneas 111-124

## Verificación

El test `debe guardar todos los campos al editar un contacto` en `src/components/CRM/__tests__/ContactForm.test.tsx` verifica que los gradings se envían correctamente.

## Valores Válidos para Gradings

Los valores válidos para `grading_llamada` y `grading_situacion` son:
- `'A'`
- `'B+'`
- `'B-'`
- `'C'`
- `'D'`
- `null` (para eliminar el grading)
- `''` (cadena vacía, se convierte en null si el contacto original tenía un valor)

## Notas Adicionales

- El backend debe aceptar `null` para eliminar un grading
- Si el backend no acepta `null`, puede ser necesario enviar una cadena vacía `""` o no enviar el campo
- Este mismo patrón podría aplicarse a otros campos select que tengan valores opcionales

## Relacionado

- Test: `src/components/CRM/__tests__/ContactForm.test.tsx`
- Documentación del test: `docs/TEST_CONTACT_FORM_ALL_FIELDS.md`
