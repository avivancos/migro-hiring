# Bug Encontrado: Falta de Sanitización en ContactForm

## Descripción del Bug

El formulario `ContactForm` no sanitiza caracteres peligrosos como null bytes (`\x00`) y newlines (`\n\r`) antes de enviar los datos al backend.

### Error Encontrado

Los caracteres peligrosos se envían tal cual al backend sin sanitización, lo que puede:
- Causar problemas de seguridad en la base de datos
- Permite inyección de caracteres especiales
- Puede romper validaciones del backend

### Ejemplos de Caracteres No Sanitizados

- `\x00` (Null byte) - Puede causar problemas en bases de datos y sistemas de archivos
- `\n\r` (Newlines) - Pueden romper validaciones o ser usados en ataques

### Impacto

- **Severidad**: Media-Alta
- **Riesgo**: Permite inyección de caracteres especiales que pueden causar problemas de seguridad
- **Escenario**: Usuario malicioso intenta enviar caracteres peligrosos

### Solución Recomendada

Agregar sanitización en `handleSubmit`:

```typescript
const sanitizeString = (str: string | undefined | null): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/\x00/g, '') // Remover null bytes
    .replace(/[\r\n]/g, ' ') // Reemplazar newlines con espacios
    .replace(/\t/g, ' ') // Reemplazar tabs con espacios
    .trim();
};

// En handleSubmit
if (formData.name) {
  cleanedData.name = sanitizeString(formData.name);
}
```

O usar una librería de sanitización como `dompurify` o `validator`.

### Tests que Detectaron el Bug

Los tests de seguridad en `ContactForm.security.test.tsx` detectaron este problema al intentar enviar caracteres peligrosos.

### Estado

- ✅ Bug detectado por tests de seguridad
- ⏳ Pendiente de corrección
- 📝 Documentado
