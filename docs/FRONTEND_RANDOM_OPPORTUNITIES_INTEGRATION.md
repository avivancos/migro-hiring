# Integración Frontend: Asignación de Oportunidades Aleatorias

## Resumen

El frontend ha sido adaptado para usar el nuevo endpoint del backend `POST /api/crm/opportunities/assign-random` que permite asignar oportunidades aleatorias no asignadas a un agente.

## Estado de Implementación

✅ **Completado**: El frontend está listo y funcionando con el endpoint del backend.

## Cambios Realizados

### 1. Nuevo Método en `opportunityApi.ts`

Se agregó el método `assignRandom()` que llama al endpoint del backend:

```typescript
async assignRandom(request: {
  assigned_to_id: string;
  count?: number;
}): Promise<{
  success: boolean;
  assigned_count: number;
  available_count: number;
  requested_count: number;
  opportunity_ids: string[];
  assigned_to_id: string;
  assigned_to_name: string;
  assigned_at: string;
  warning?: string;
}>
```

**Ubicación**: `src/services/opportunityApi.ts`

**Endpoint**: `POST /api/crm/opportunities/assign-random`

### 2. Componente Simplificado

El componente `AssignRandomOpportunities` fue completamente simplificado:

**Antes** (implementación temporal):
- Hacía múltiples peticiones para obtener oportunidades (hasta 20 páginas)
- Filbraba localmente las oportunidades no asignadas
- Seleccionaba aleatoriamente en el frontend
- Llamaba a `bulkAssign()` con los IDs seleccionados

**Ahora** (con el endpoint del backend):
- Una sola petición al endpoint `assignRandom()`
- El backend maneja todo el proceso:
  - Obtener oportunidades no asignadas
  - Seleccionar aleatorias
  - Asignar en batch
  - Retornar resultado

**Ubicación**: `src/components/admin/AssignRandomOpportunities.tsx`

### 3. Manejo de Errores

Se implementó manejo específico de errores:

- **404**: No hay oportunidades disponibles
  - Muestra mensaje específico según `available_count`
- **Otros errores**: Muestra el detalle del error del backend

## Flujo de Usuario

1. El admin selecciona un agente del dropdown
2. Click en "Asignar 50 Oportunidades Aleatorias"
3. Se muestra un spinner mientras se procesa
4. El frontend llama a `opportunityApi.assignRandom()` con:
   - `assigned_to_id`: ID del agente seleccionado
   - `count`: 50
5. El backend procesa la asignación y retorna el resultado
6. El frontend muestra:
   - Mensaje de éxito con el número de oportunidades asignadas
   - Warning si se asignaron menos de las solicitadas
   - Error si falló la operación
7. Se recarga automáticamente la lista de oportunidades
8. Las oportunidades asignadas desaparecen de la vista (gracias al filtro por defecto)

## Respuesta del Backend

### Éxito (200 OK)

```json
{
  "success": true,
  "assigned_count": 50,
  "available_count": 150,
  "requested_count": 50,
  "opportunity_ids": ["uuid-1", "uuid-2", ...],
  "assigned_to_id": "uuid-del-usuario-crm",
  "assigned_to_name": "Nombre del Agente",
  "assigned_at": "2024-12-19T10:30:00Z"
}
```

### Con Warning (asignación parcial)

```json
{
  "success": true,
  "assigned_count": 25,
  "available_count": 25,
  "requested_count": 50,
  "opportunity_ids": ["uuid-1", ...],
  "assigned_to_id": "uuid-del-usuario-crm",
  "assigned_to_name": "Nombre del Agente",
  "assigned_at": "2024-12-19T10:30:00Z",
  "warning": "Solo se asignaron 25 oportunidades de las 50 solicitadas..."
}
```

### Error 404 (sin oportunidades)

```json
{
  "detail": "No hay oportunidades no asignadas disponibles",
  "available_count": 0,
  "requested_count": 50
}
```

## Integración en AdminOpportunities

El componente está integrado en `src/pages/admin/AdminOpportunities.tsx`:

```typescript
<AssignRandomOpportunities
  agents={agents}
  onAssignComplete={() => {
    loadOpportunities();
  }}
/>
```

Se muestra en la parte superior de la página, antes de la lista de oportunidades.

## Beneficios de la Nueva Implementación

1. ✅ **Rendimiento**: Una sola petición HTTP en lugar de múltiples
2. ✅ **Simplicidad**: Menos lógica en el frontend
3. ✅ **Eficiencia**: El backend optimiza la consulta SQL con `ORDER BY RANDOM()`
4. ✅ **Confiabilidad**: Transacción atómica en el backend
5. ✅ **UX**: Respuesta más rápida para el usuario
6. ✅ **Mantenibilidad**: Código más simple y fácil de mantener

## Testing

Para probar la funcionalidad:

1. Navegar a `/admin/opportunities`
2. Seleccionar un agente del componente "Asignación Rápida de Oportunidades"
3. Click en "Asignar 50 Oportunidades Aleatorias"
4. Verificar que:
   - Se muestre el spinner mientras se procesa
   - Se muestre un mensaje de éxito con el número de oportunidades asignadas
   - La lista de oportunidades se recargue automáticamente
   - Las oportunidades asignadas desaparezcan de la vista (filtro por defecto)

## Fecha de Integración

2024-12-19

## Referencias

- Documentación del endpoint backend: `docs/BACKEND_RANDOM_OPPORTUNITIES_ASSIGN_ENDPOINT.md`
- Servicio API: `src/services/opportunityApi.ts`
- Componente: `src/components/admin/AssignRandomOpportunities.tsx`
- Página de administración: `src/pages/admin/AdminOpportunities.tsx`

