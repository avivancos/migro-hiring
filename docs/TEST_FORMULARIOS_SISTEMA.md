# Sistema de Tests de Formularios

## Descripción

Sistema completo de tests para todos los formularios del proyecto que verifica:
- Renderizado correcto
- Validaciones funcionan
- Todos los campos se guardan correctamente
- Integración correcta con el backend

## Formularios con Tests

### 1. ContactForm ✅
- **Archivo**: `src/components/CRM/__tests__/ContactForm.test.tsx`
- **Verificaciones**:
  - Renderizado del formulario
  - Validación de campos requeridos
  - Guardado de todos los campos al editar contacto
  - Campos básicos (name, email, phone, etc.)
  - Campos Migro específicos (gradings, nacionalidad, etc.)
  - Custom fields (servicio_propuesto, servicio_detalle, fecha_llegada_espana)
  - Checkboxes (empadronado, tiene_ingresos, etc.)

### 2. CallForm ✅
- **Archivo**: `src/components/CRM/__tests__/CallForm.test.tsx`
- **Verificaciones**:
  - Renderizado del formulario
  - Validación de teléfono requerido
  - Guardado de campos al editar llamada
  - Campos: phone, duration, call_type, resumen_llamada, etc.

### 3. NoteForm ✅
- **Archivo**: `src/components/CRM/__tests__/NoteForm.test.tsx`
- **Verificaciones**:
  - Renderizado del formulario
  - Validación de contenido requerido
  - Guardado de todos los campos al editar nota
  - Campos: content, note_type, entity_type, entity_id

### 4. TaskForm ⚠️ (Básico)
- **Archivo**: `src/components/CRM/__tests__/TaskForm.test.tsx`
- **Estado**: Tests básicos existentes, necesita mejoras para verificar todos los campos
- **Verificaciones actuales**:
  - Renderizado del formulario
  - Validación de campos requeridos
  - Envío con datos válidos básicos

### 5. LeadForm ❌
- **Estado**: Sin tests completos
- **Campos a verificar**:
  - name (requerido)
  - price
  - service_type
  - source (select)
  - priority (select)
  - responsible_user_id (select)
  - contact_id (select)
  - service_description (textarea)
  - description (textarea)

### 6. CompanyForm ⚠️ (Básico)
- **Archivo**: `src/components/CRM/__tests__/CompanyForm.test.tsx`
- **Estado**: Tests básicos existentes, necesita mejoras para verificar todos los campos
- **Verificaciones actuales**:
  - Renderizado del formulario
  - Validación de nombre requerido
  - Envío con datos válidos básicos

### 7. ExpedienteForm ⚠️ (Básico)
- **Archivo**: `src/components/expedientes/__tests__/ExpedienteForm.test.tsx`
- **Estado**: Tests básicos existentes, necesita mejoras para verificar todos los campos
- **Verificaciones actuales**:
  - Renderizado del formulario
  - Validación de título requerido (mínimo 10 caracteres)
  - Envío con datos válidos básicos

## Ejecutar Tests

### Ejecutar tests individuales

```bash
# ContactForm
npm test -- src/components/CRM/__tests__/ContactForm.test.tsx

# CallForm
npm test -- src/components/CRM/__tests__/CallForm.test.tsx

# NoteForm
npm test -- src/components/CRM/__tests__/NoteForm.test.tsx

# TaskForm
npm test -- src/components/CRM/__tests__/TaskForm.test.tsx

# CompanyForm
npm test -- src/components/CRM/__tests__/CompanyForm.test.tsx

# ExpedienteForm
npm test -- src/components/expedientes/__tests__/ExpedienteForm.test.tsx
```

### Ejecutar todos los tests de formularios

```bash
npm test -- --run --reporter=verbose "**/__tests__/*Form*.test.tsx"
```

### Generar reporte completo

```bash
# Ejecutar script de reporte
node scripts/test-forms-report.js

# Esto generará:
# - test-reports/forms-test-report-[timestamp].json
# - test-reports/forms-test-report.html
```

El reporte HTML muestra:
- Resumen de tests (total, pasados, fallidos, omitidos)
- Detalles de cada formulario
- Campos que fallan y dónde
- Errores específicos de validación

## Estructura de Tests

Cada test de formulario verifica:

### 1. Renderizado
```typescript
it('debe renderizar el formulario', async () => {
  // Verifica que todos los campos se renderizan correctamente
});
```

### 2. Validaciones
```typescript
it('debe validar campos requeridos', async () => {
  // Verifica que las validaciones funcionan
});
```

### 3. Guardado de Campos
```typescript
it('debe guardar todos los campos al editar', async () => {
  // Verifica que todos los campos se guardan correctamente
  // Identifica campos que no se envían o se pierden
});
```

### 4. Integración
```typescript
it('debe enviar el formulario con datos válidos', async () => {
  // Verifica la integración con el backend
});
```

## Campos que Frecuentemente Fallan

Basado en el fix de gradings, estos son campos que suelen tener problemas:

1. **Campos de Select vacíos**: Cuando el valor es `""`, no se envían si solo se verifica `if (field)`
   - **Solución**: Verificar también si el contacto original tenía un valor
   - **Ejemplo**: `grading_llamada`, `grading_situacion`

2. **Checkboxes desmarcados**: Cuando están desmarcados, el valor es `undefined` y no se envían
   - **Solución**: Manejar `undefined` vs `false` correctamente
   - **Ejemplo**: `empadronado`, `tiene_ingresos`

3. **Custom Fields**: Pueden no enviarse si el objeto `custom_fields` no existe
   - **Solución**: Siempre inicializar `custom_fields` si el contacto original lo tenía
   - **Ejemplo**: `servicio_propuesto`, `fecha_llegada_espana`

## Script de Reporte

El script `scripts/test-forms-report.js` genera un reporte completo que:

1. **Ejecuta todos los tests de formularios**
2. **Parse la salida JSON de vitest**
3. **Identifica campos que fallan**:
   - Tests que fallan
   - Campos específicos que no se guardan
   - Errores de validación
4. **Genera reportes en JSON y HTML**

### Uso del Reporte

1. Ejecutar: `node scripts/test-forms-report.js`
2. Abrir el reporte HTML: `test-reports/forms-test-report.html`
3. Revisar qué campos fallan en cada formulario
4. Corregir los problemas identificados
5. Ejecutar de nuevo para verificar

## Mejoras Futuras

- [ ] Crear tests completos para LeadForm
- [ ] Mejorar tests de TaskForm para verificar todos los campos
- [ ] Mejorar tests de CompanyForm para verificar todos los campos
- [ ] Mejorar tests de ExpedienteForm para verificar todos los campos
- [ ] Agregar tests de integración E2E
- [ ] Agregar tests de validación de esquemas
- [ ] Agregar tests de manejo de errores del backend

## Relacionado

- `docs/TEST_CONTACT_FORM_ALL_FIELDS.md` - Documentación detallada del test de ContactForm
- `docs/FIX_GRADINGS_EDIT_CONTACT.md` - Fix de gradings que no se guardaban
