## Mejoras en Solicitud de Contrato desde Oportunidad

### Fecha
2026-01-20

### Objetivo
Mejorar el modal de solicitud de contrato desde la vista de oportunidad para incluir:
- Campo de subida de archivo para copia de pasaporte
- Pre-llenado y verificación del grading desde el contacto
- Opciones de pago más claras: "Aplazada" y "En dos pagos"

---

## Cambios Implementados

### 1. Campo de Subida de Archivo para Copia de Pasaporte

**Ubicación**: `src/components/opportunities/RequestContractModal.tsx`

**Funcionalidad**:
- Se agregó un campo de subida de archivo para la copia del pasaporte
- Acepta formatos: JPG, PNG, PDF
- Tamaño máximo: 10MB
- El archivo se muestra con preview y opción de eliminar antes de enviar
- Si se proporciona archivo, se envía usando `FormData` (multipart/form-data)
- Si no hay archivo, se envía como JSON normal

**Validación**:
- El formulario requiere al menos uno de: número de pasaporte, NIE o copia de pasaporte
- Validación de tipo de archivo (solo imágenes y PDF)
- Validación de tamaño (máximo 10MB)

**Código relevante**:
```typescript
interface RequestContractForm {
  // ... otros campos
  passport_file?: File; // Archivo de copia de pasaporte
}
```

### 2. Pre-llenado y Verificación del Grading

**Funcionalidad**:
- El grading se pre-llena automáticamente desde el contacto si está disponible
- Se usa `grading_situacion` o `grading_llamada` del contacto
- Se muestra un indicador visual cuando el grading está pre-llenado
- El usuario puede verificar y modificar el grading antes de enviar

**Mapeo de Gradings**:
- `A` → `A` (sin cambios)
- `B+` o `B-` → `B`
- `C` o `D` → `C`
- Si no hay grading → `B` (por defecto)

**Código relevante**:
```typescript
const mapContactGradingToContractGrade = (grading?: 'A' | 'B+' | 'B-' | 'C' | 'D'): 'A' | 'B' | 'C' => {
  if (!grading) return 'B';
  
  switch (grading) {
    case 'A': return 'A';
    case 'B+':
    case 'B-': return 'B';
    case 'C':
    case 'D': return 'C';
    default: return 'B';
  }
};
```

### 3. Opciones de Pago Mejoradas

**Cambios**:
- Se cambió el label de "Tipo de Pago" a "Forma de Pago"
- Opciones actualizadas:
  - "En dos pagos" (valor: `two_payments` → backend: `one_time`)
  - "Aplazada" (valor: `deferred` → backend: `subscription`)

**Mapeo al Backend**:
- `deferred` → `subscription` (pago aplazado/suscripción)
- `two_payments` → `one_time` (pago único en dos cuotas)

---

## Flujo de Envío

### Con Archivo de Pasaporte
1. Se crea un `FormData` con todos los campos
2. Se agrega el archivo como `passport_file`
3. Se envía con `Content-Type: multipart/form-data`

### Sin Archivo de Pasaporte
1. Se envía como JSON normal
2. Solo se incluyen los campos de texto

---

## Validaciones

### Campos Obligatorios
- Firma del agente
- Nombre del servicio
- Nombre completo del cliente
- Al menos uno de: número de pasaporte, NIE o copia de pasaporte
- Dirección completa
- Provincia
- Código postal

### Validaciones de Archivo
- Tipo: solo JPG, PNG, PDF
- Tamaño: máximo 10MB
- Si el archivo no cumple los requisitos, se muestra un error y no se permite continuar

---

## Interfaz de Usuario

### Campo de Grading
- Muestra el grading pre-llenado desde el contacto (si existe)
- Indica visualmente que el valor viene del contacto
- Permite modificar el valor antes de enviar

### Campo de Archivo
- Botón para seleccionar archivo
- Preview del archivo seleccionado con nombre y tamaño
- Botón para eliminar el archivo seleccionado
- Mensaje informativo sobre los formatos aceptados

### Opciones de Pago
- Dropdown con dos opciones claras
- Labels descriptivos: "En dos pagos" y "Aplazada"

---

## Archivos Modificados

- `src/components/opportunities/RequestContractModal.tsx`
  - Agregado campo de archivo
  - Agregada función de mapeo de grading
  - Actualizado tipo de pago
  - Actualizado envío para soportar FormData

---

## Notas Técnicas

### Backend
- El endpoint `/pipelines/stages/{entity_type}/{entity_id}/request-hiring-code` debe soportar:
  - JSON normal (sin archivo)
  - FormData con archivo (multipart/form-data)
  - Campo `passport_file` en FormData

### Frontend
- El componente detecta automáticamente si hay archivo y usa el formato apropiado
- Si el backend no acepta archivos aún, el frontend está preparado para cuando se implemente

---

## Próximos Pasos (Backend)

Para que el archivo de pasaporte funcione completamente, el backend debe:

1. Aceptar `FormData` en el endpoint de solicitud de contrato
2. Procesar el campo `passport_file`
3. Almacenar el archivo (S3, sistema de archivos, etc.)
4. Asociar el archivo con el contrato/hiring code

---

## Testing

### Casos de Prueba Sugeridos

1. **Solicitud sin archivo**:
   - Verificar que se envía como JSON
   - Verificar que funciona con número de pasaporte o NIE

2. **Solicitud con archivo**:
   - Verificar que se envía como FormData
   - Verificar validación de tipo de archivo
   - Verificar validación de tamaño

3. **Grading pre-llenado**:
   - Verificar que se pre-llena desde el contacto
   - Verificar mapeo correcto (B+/B- → B, D → C)
   - Verificar que se puede modificar

4. **Opciones de pago**:
   - Verificar que "Aplazada" mapea a `subscription`
   - Verificar que "En dos pagos" mapea a `one_time`
