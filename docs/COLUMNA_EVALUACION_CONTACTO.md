# Columna de Evaluación en Ficha de Contacto

## Resumen
Se ha agregado información adicional en la columna de evaluación de la ficha de contacto, incluyendo el trámite sugerido y la fecha de nueva llamada/acción.

## Funcionalidades Implementadas

### 1. Trámite Sugerido
- **Campo**: `custom_fields.servicio_propuesto`
- **Descripción**: Muestra el trámite sugerido para el contacto basado en la información recopilada
- **Fuente de datos**: Se obtiene de `contact.custom_fields.servicio_propuesto`
- **Visualización**: 
  - Se muestra en la columna de evaluación
  - Icono de documento (FileText)
  - Fondo azul claro con borde azul
  - Formato legible (mapeo de códigos a nombres)

#### Valores Posibles
- `asilo_proteccion_internacional` → "Asilo/Protección Internacional"
- `arraigo` → "Arraigo"
- `reagrupacion_familiar` → "Reagrupación Familiar"
- `nacionalidad` → "Nacionalidad"

### 2. Fecha de Nueva Llamada / Acción
- **Campos**: 
  - `calls.proxima_accion_fecha` (prioridad)
  - `calls.proxima_llamada_fecha` (fallback)
  - `tasks.complete_till` (tareas pendientes)
- **Descripción**: Muestra la fecha más próxima programada para una nueva llamada o acción
- **Fuente de datos**: 
  - Se busca primero en `proxima_accion_fecha` de las llamadas
  - Si no existe, se busca en `proxima_llamada_fecha` de las llamadas
  - También se busca en tareas pendientes (`tasks.complete_till`)
  - Se toma la fecha más próxima en el futuro
- **Visualización**:
  - Se muestra en la columna de evaluación
  - Icono de calendario (Calendar)
  - Si la fecha ya pasó, se muestra en rojo y negrita como advertencia
  - Si la fecha está en el futuro, se muestra en verde
  - Formato: Fecha localizada en español

## Ubicación
- **Archivo**: `src/pages/CRMContactDetail.tsx`
- **Sección**: Columna 3 - Evaluación (en la tarjeta de datos básicos destacados)

## Funciones Helper

### `getTramiteSugerido()`
Obtiene el trámite sugerido del contacto y lo convierte a formato legible.

```typescript
const getTramiteSugerido = (): string | null => {
  const servicioPropuesto = contact?.custom_fields?.servicio_propuesto;
  if (!servicioPropuesto) return null;
  
  const tramiteMap: Record<string, string> = {
    'asilo_proteccion_internacional': 'Asilo/Protección Internacional',
    'arraigo': 'Arraigo',
    'reagrupacion_familiar': 'Reagrupación Familiar',
    'nacionalidad': 'Nacionalidad',
  };
  
  return tramiteMap[servicioPropuesto] || servicioPropuesto;
};
```

### `getProximaAccionFecha()`
Obtiene la fecha más próxima de nueva llamada/acción de las llamadas y tareas del contacto.

```typescript
const getProximaAccionFecha = (): string | null => {
  // Busca en calls.proxima_accion_fecha (prioridad)
  // Luego en calls.proxima_llamada_fecha
  // Finalmente en tasks.complete_till (tareas pendientes)
  // Retorna la fecha más próxima en el futuro
};
```

## Cambios Realizados

### Antes
- La columna de evaluación solo mostraba gradings (Interés y Situación Administrativa)
- Solo se mostraba si había llamadas previas y gradings

### Después
- La columna de evaluación siempre se muestra
- Incluye:
  1. Gradings (si existen)
  2. Trámite Sugerido (si existe)
  3. Fecha de Nueva Llamada / Acción (si existe)
- Muestra mensaje informativo si no hay datos de evaluación

## Estilos

### Trámite Sugerido
- Fondo: `bg-blue-50`
- Borde: `border-blue-200`
- Texto: `text-gray-900`
- Icono: `text-blue-600`

### Fecha de Nueva Llamada / Acción
- **Fecha futura**:
  - Fondo: `bg-green-50`
  - Borde: `border-green-200`
  - Texto: `text-green-700`
  - Icono: `text-green-600`
  
- **Fecha vencida**:
  - Fondo: `bg-red-50`
  - Borde: `border-red-200`
  - Texto: `text-red-700 font-semibold`
  - Icono: `text-red-600`

## Notas Técnicas

1. La función `getProximaAccionFecha()` busca en múltiples fuentes:
   - Primero en `proxima_accion_fecha` (más específico)
   - Luego en `proxima_llamada_fecha`
   - Finalmente en tareas pendientes
   - Siempre toma la fecha más próxima en el futuro

2. El trámite sugerido se obtiene de `custom_fields.servicio_propuesto` que se establece durante la primera llamada.

3. Si no hay información de evaluación disponible, se muestra un mensaje informativo.

## Archivos Modificados

- `src/pages/CRMContactDetail.tsx` - Agregadas funciones helper y actualizada la UI de evaluación
- `src/components/CRM/ContactForm.tsx` - Agregados campos de trámite sugerido y detalle en el formulario de edición

