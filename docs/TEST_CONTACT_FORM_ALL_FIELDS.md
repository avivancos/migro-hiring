# Test: Verificación de Guardado de Todos los Campos en Edición de Contacto

## Descripción

Este documento describe el test `debe guardar todos los campos al editar un contacto` que verifica que todos los campos del formulario de contacto se guardan correctamente cuando se edita un contacto existente.

## Ubicación

- **Archivo de test**: `src/components/CRM/__tests__/ContactForm.test.tsx`
- **Componente probado**: `src/components/CRM/ContactForm.tsx`

## Propósito

El test verifica que:
1. Todos los campos del formulario se cargan correctamente desde un contacto existente
2. Los campos modificados se guardan correctamente
3. Los campos no modificados se mantienen y se envían correctamente
4. Los campos booleanos (checkboxes) se manejan correctamente
5. Los `custom_fields` se actualizan correctamente
6. El campo `responsible_user_id` se mantiene

## Campos Verificados

### Campos Básicos
- `name` (Nombre Completo) - Campo requerido
- `first_name` (Nombre)
- `last_name` (Apellido)
- `email` (Email)
- `phone` (Teléfono)
- `mobile` (Móvil)
- `address` (Dirección)
- `city` (Ciudad)
- `state` (Provincia)
- `postal_code` (Código Postal)
- `country` (País)
- `company` / `company_id` (Empresa)
- `position` (Cargo)
- `notes` (Notas)

### Campos Migro Específicos
- `grading_llamada` (Grading Llamada) - Select con valores: A, B+, B-, C, D
- `grading_situacion` (Grading Situación) - Select con valores: A, B+, B-, C, D
- `nacionalidad` (Nacionalidad)
- `tiempo_espana` (Tiempo en España)
- `lugar_residencia` (Lugar de Residencia)
- `edad` (Edad) - Campo numérico
- `empadronado` (Empadronado) - Checkbox
- `tiene_ingresos` (Tiene Ingresos) - Checkbox
- `trabaja_b` (Trabaja en B) - Checkbox
- `tiene_familiares_espana` (Tiene Familiares en España) - Checkbox

### Custom Fields
- `servicio_propuesto` (Trámite Sugerido) - Select con valores: asilo_proteccion_internacional, arraigo, reagrupacion_familiar, nacionalidad
- `servicio_detalle` (Detalle del Trámite) - Textarea
- `fecha_llegada_espana` (Fecha de Llegada a España) - DateInput

### Campos de Sistema
- `responsible_user_id` - ID del usuario responsable (se mantiene del contacto original)

## Comportamiento Especial de Checkboxes

Los checkboxes en el formulario tienen un comportamiento especial:

- **Cuando un checkbox está marcado (`true`)**: El valor se envía al backend
- **Cuando un checkbox está desmarcado (`false`)**: El valor se convierte en `undefined` mediante `e.target.checked || undefined` y **NO se envía** al backend

Esto significa que:
- Si un checkbox estaba marcado (`true`) y se desmarca, el campo no se enviará en el request, y el backend debería mantener el valor original
- Si un checkbox está marcado (`true`), el valor se envía como `true`
- Si un checkbox tiene valor `false` inicialmente y no se modifica, el valor se mantiene como `false` y se envía

**Nota**: Este comportamiento podría ser un problema si queremos cambiar explícitamente un valor de `true` a `false` a través del formulario. Si necesitas cambiar explícitamente un valor de `true` a `false`, deberías considerar modificar el comportamiento del formulario.

## Ejecutar el Test

```bash
# Ejecutar solo este test específico
npm test -- src/components/CRM/__tests__/ContactForm.test.tsx -t "debe guardar todos los campos al editar un contacto"

# Ejecutar todos los tests del ContactForm
npm test -- src/components/CRM/__tests__/ContactForm.test.tsx
```

## Estructura del Test

1. **Setup**: Crea un contacto existente con todos los campos completos
2. **Render**: Renderiza el formulario con el contacto existente
3. **Modificaciones**: Modifica varios campos para verificar que los cambios se guardan:
   - Cambia campos básicos (name, email, phone, city)
   - Cambia campos Migro específicos (nacionalidad, edad, lugar_residencia)
   - Desmarca checkboxes (empadronado, tiene_ingresos)
   - Cambia selects (grading_llamada, servicio_propuesto)
   - Modifica textarea (servicio_detalle)
   - Modifica fecha (fecha_llegada_espana)
4. **Submit**: Envía el formulario
5. **Verificaciones**: Verifica que todos los campos esperados están presentes en los datos enviados

## Verificaciones Realizadas

El test verifica:
- ✅ Campos modificados se guardan con los nuevos valores
- ✅ Campos no modificados se mantienen con sus valores originales
- ✅ Custom fields se actualizan correctamente
- ✅ Checkboxes desmarcados no se envían (undefined)
- ✅ Checkboxes no modificados mantienen su valor y se envían si están marcados
- ✅ Campo `responsible_user_id` se mantiene
- ✅ Estructura de `custom_fields` es correcta
- ✅ Todos los campos esperados están presentes

## Posibles Problemas Detectados

El test ayuda a detectar:
- Campos que no se guardan al editar
- Campos que se pierden al editar
- Problemas con el manejo de checkboxes
- Problemas con custom_fields
- Problemas con el envío de datos al backend

## Mejoras Futuras

Posibles mejoras al test:
1. Verificar que los valores se persisten correctamente en el backend (integración)
2. Verificar el comportamiento de campos vacíos
3. Verificar validaciones de campos requeridos
4. Verificar el comportamiento de campos que dependen de otros (ej: tiempo_espana se calcula desde fecha_llegada_espana)

## Relación con Otros Tests

Este test complementa:
- Test de validación de campos requeridos
- Test de creación de nuevo contacto
- Test de renderizado del formulario
