# Implementación de Tipo de Llamada

## Resumen

Se ha agregado el campo `call_type` (tipo de llamada) al sistema de registro de llamadas, permitiendo clasificar las llamadas como "primera llamada", "seguimiento" o "llamada de venta".

## Cambios Realizados

### 1. Tipos TypeScript (`src/types/crm.ts`)

Se agregó el campo `call_type` opcional en las interfaces `Call` y `CallCreateRequest`:

```typescript
export interface Call {
  // ... otros campos ...
  call_type?: string; // 'primera_llamada', 'seguimiento', 'venta'
  // ... otros campos ...
}

export interface CallCreateRequest {
  // ... otros campos ...
  call_type?: string; // 'primera_llamada', 'seguimiento', 'venta'
  // ... otros campos ...
}
```

### 2. Formulario de Llamadas (`src/components/CRM/CallForm.tsx`)

Se agregó un campo select para seleccionar el tipo de llamada:

- **Ubicación**: Después del campo "Estado" en el formulario
- **Opciones disponibles**:
  - Vacío (opcional)
  - "Primera Llamada"
  - "Seguimiento"
  - "Llamada de Venta"

El campo se incluye automáticamente en el estado del formulario y se envía al backend cuando se guarda la llamada.

### 3. Gestión de Llamadas (`src/pages/CRMCallHandler.tsx`)

Se agregó el campo de tipo de llamada en el formulario de registro rápido de llamadas:

- **Ubicación**: Después del grid de campos principales (Teléfono, Dirección, Estado, Duración)
- **Opciones disponibles**:
  - Vacío (opcional)
  - "Primera Llamada"
  - "Seguimiento"
  - "Llamada de Venta"

El campo se guarda automáticamente cuando se registra una llamada desde esta página.

## Valores Posibles

El campo `call_type` puede tener los siguientes valores:

- `undefined` o `''` (vacío): No especificado
- `'primera_llamada'`: Primera llamada al contacto
- `'seguimiento'`: Llamada de seguimiento
- `'venta'`: Llamada de venta

## Uso

### En CallForm

El campo aparece automáticamente en todos los formularios de llamadas que usan el componente `CallForm`:

- Registro de llamadas desde detalle de contacto
- Registro de llamadas desde detalle de lead
- Edición de llamadas existentes

### En CRMCallHandler

El campo está disponible en el formulario de registro rápido de llamadas en la página de gestión de llamadas.

## Integración con Backend

El campo `call_type` se envía al backend como parte del objeto `CallCreateRequest` cuando se registra una llamada. El backend debe estar preparado para recibir y almacenar este campo opcional.

## Notas Técnicas

- El campo es **opcional**, por lo que las llamadas existentes sin tipo de llamada seguirán funcionando correctamente
- El valor se almacena como string en la base de datos
- No hay validación de valores en el frontend, pero se recomienda usar solo los valores especificados: `'primera_llamada'`, `'seguimiento'` o `'venta'`

## Próximos Pasos (Opcional)

Si se desea expandir esta funcionalidad en el futuro:

1. Agregar más tipos de llamada según necesidades del negocio
2. Agregar filtros por tipo de llamada en las listas de llamadas
3. Agregar reportes/estadísticas por tipo de llamada
4. Validar el campo en el backend para asegurar que solo se acepten valores válidos

