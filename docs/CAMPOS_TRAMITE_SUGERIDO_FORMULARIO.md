# Campos de Trámite Sugerido en Formulario de Contacto

## Resumen
Se han agregado los campos de trámite sugerido y detalle del trámite al formulario de edición/creación de contactos.

## Funcionalidades Implementadas

### 1. Trámite Sugerido (Select)
- **Campo**: `servicio_propuesto` (en `custom_fields`)
- **Ubicación**: Sección "Información Migro" del formulario
- **Tipo**: Select con opciones predefinidas
- **Opciones**:
  - Asilo/Protección Internacional (`asilo_proteccion_internacional`)
  - Arraigo (`arraigo`)
  - Reagrupación Familiar (`reagrupacion_familiar`)
  - Nacionalidad (`nacionalidad`)
- **Valor por defecto**: Vacío (opción "Seleccionar trámite...")
- **Guardado**: Se guarda en `contact.custom_fields.servicio_propuesto`

### 2. Detalle del Trámite (Textarea)
- **Campo**: `servicio_detalle` (en `custom_fields`)
- **Ubicación**: Sección "Información Migro" del formulario
- **Tipo**: Textarea multilínea
- **Placeholder**: "Explicar mejor el trámite sugerido, detalles específicos, requisitos, etc."
- **Filas**: 3
- **Guardado**: Se guarda en `contact.custom_fields.servicio_detalle`

## Ubicación en el Formulario

Los campos se encuentran en la sección "Información Migro", después de los checkboxes y antes de los botones de acción:

```
Información Migro
├── Grading Llamada
├── Grading Situación
├── Nacionalidad
├── Tiempo en España
├── Edad
├── Lugar de Residencia
├── Checkboxes (Empadronado, Ingresos, Trabaja B, Familiares)
├── Trámite Sugerido (NUEVO) ← Select
└── Detalle del Trámite (NUEVO) ← Textarea
```

## Lógica de Guardado

### Al Crear Contacto
- Si se completa `servicio_propuesto` o `servicio_detalle`, se crea el objeto `custom_fields` con estos valores
- Si ambos están vacíos, no se envía `custom_fields`

### Al Editar Contacto
- Se preservan todos los `custom_fields` existentes del contacto
- Se actualizan solo `servicio_propuesto` y `servicio_detalle` si tienen valores
- Si un campo estaba lleno y se borra, se elimina del objeto `custom_fields`

### Ejemplo de Datos Enviados

```typescript
{
  name: "Juan Pérez",
  // ... otros campos ...
  custom_fields: {
    servicio_propuesto: "arraigo",
    servicio_detalle: "Arraigo social con 3 años de residencia continuada",
    // ... otros custom_fields existentes ...
  }
}
```

## Carga de Datos Existentes

Al editar un contacto existente:
- Si el contacto tiene `custom_fields.servicio_propuesto`, se carga en el select
- Si el contacto tiene `custom_fields.servicio_detalle`, se carga en el textarea
- Si no existen, los campos quedan vacíos

## Archivos Modificados

- `src/components/CRM/ContactForm.tsx`
  - Agregados campos `servicio_propuesto` y `servicio_detalle` al estado inicial
  - Agregados campos al formulario (select y textarea)
  - Actualizada lógica de guardado para manejar `custom_fields` correctamente

## Relación con Otras Funcionalidades

- **Ficha de Contacto**: El trámite sugerido se muestra en la columna de evaluación (ver `docs/COLUMNA_EVALUACION_CONTACTO.md`)
- **Formulario de Llamada**: Estos campos también se pueden establecer durante la primera llamada (ver `src/components/CRM/CallForm.tsx`)

## Notas Técnicas

1. Los campos se guardan en `custom_fields` para mantener flexibilidad y compatibilidad con el backend
2. La lógica de guardado preserva otros `custom_fields` existentes para no perder información
3. Si se borra un campo que tenía valor, se elimina del objeto `custom_fields` al guardar
4. El select usa los mismos valores que el formulario de llamada para mantener consistencia






