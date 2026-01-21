## Corrección de bugs: FormData header y consistencia de filtros

### Fecha
2026-01-20

### Bugs corregidos

#### Bug 1: Header Content-Type explícito en FormData
**Archivo**: `src/services/api.ts`
**Líneas**: 199-210 (interceptor de requests)

**Problema**: El servicio API tiene configurado un header por defecto `Content-Type: application/json`. Cuando se envía `FormData`, axios debería automáticamente sobrescribir este header con `multipart/form-data; boundary=...`, pero si se establece explícitamente sin el boundary, el servidor no puede parsear correctamente el cuerpo de la petición, causando que falle o sea rechazado.

**Solución**: Se agregó lógica en el interceptor de requests de axios para detectar cuando el body es `FormData` y eliminar automáticamente el header `Content-Type`, permitiendo que axios lo establezca correctamente con el boundary generado.

**Cambio**:
```typescript
// Agregado en el interceptor de requests (api.ts)
// IMPORTANTE: Si el body es FormData, eliminar Content-Type para que axios 
// genere automáticamente el boundary correcto. Si se establece explícitamente
// sin boundary, el servidor no puede parsear el cuerpo de la petición.
if (config.data instanceof FormData) {
  // Eliminar Content-Type si está presente (axios lo establecerá automáticamente con boundary)
  if (config.headers && 'Content-Type' in config.headers) {
    delete config.headers['Content-Type'];
  }
  // También eliminar del objeto defaults.headers si está presente
  if (config.headers && 'content-type' in config.headers) {
    delete config.headers['content-type'];
  }
}
```

**Nota técnica**: 
- Esta solución es más robusta que eliminar el header solo en componentes específicos, ya que asegura que cualquier lugar donde se use `FormData` con el servicio API funcionará correctamente
- Cuando axios detecta un objeto `FormData`, automáticamente establece el header `Content-Type` con el formato `multipart/form-data; boundary=----WebKitFormBoundary...`
- Si se establece manualmente sin el boundary, el servidor no puede parsear correctamente el cuerpo de la petición

---

#### Bug 2: Inconsistencia en valores de limpieza de filtros
**Archivos**:
- `src/components/opportunities/OpportunityFilters.tsx` (línea 52)
- `src/pages/CRMContactList.tsx` (líneas 85, 112, 591, 1233)

**Problema**: 
- `OpportunityFilters` limpia el filtro `assigned_to` estableciéndolo a `undefined`
- `CRMContactList` limpia el filtro `responsible_user_id` estableciéndolo a string vacío `''`

Esta inconsistencia puede causar comportamientos inesperados si el manejo de filtros o la API no normaliza estos valores de manera idéntica. Los filtros deberían usar valores centinela consistentes (ambos `undefined` o ambos string vacío) para garantizar un comportamiento predecible.

**Solución**: Se cambió `CRMContactList` para usar `undefined` en lugar de string vacío `''` cuando se limpia el filtro, manteniendo consistencia con `OpportunityFilters`.

**Cambios**:

1. **Tipo del estado** (línea 85):
```typescript
// Antes
const [responsibleUserId, setResponsibleUserId] = useState(searchParams.get('responsible_user_id') || '');

// Después
const [responsibleUserId, setResponsibleUserId] = useState<string | undefined>(searchParams.get('responsible_user_id') || undefined);
```

2. **Toggle handler** (línea 112):
```typescript
// Antes
setResponsibleUserId(checked ? currentUserId : '');

// Después
// Usar undefined en lugar de '' para consistencia con OpportunityFilters
setResponsibleUserId(checked ? currentUserId : undefined);
```

3. **Función clearFilters** (línea 591):
```typescript
// Antes
setResponsibleUserId('');

// Después
setResponsibleUserId(undefined);
```

4. **Select onChange** (línea 1233):
```typescript
// Antes
<select
  value={responsibleUserId}
  onChange={(e) => setResponsibleUserId(e.target.value)}
>
  <option value="">Todos</option>
  ...

// Después
<select
  value={responsibleUserId || ''}
  onChange={(e) => setResponsibleUserId(e.target.value || undefined)}
>
  <option value="">Todos</option>
  ...
```

**Nota técnica**: Usar `undefined` es más semánticamente correcto que string vacío porque:
- Permite que la propiedad no exista en el objeto de filtros
- Es más claro que indica "sin valor" vs "valor vacío"
- Es consistente con el patrón usado en `OpportunityFilters`
- Las verificaciones `if (responsibleUserId)` funcionan correctamente con ambos valores (undefined y string vacío son falsy)

### Validación

- ✅ No hay errores de linter
- ✅ El header Content-Type ya no se establece explícitamente en FormData
- ✅ Los filtros usan `undefined` de manera consistente
- ✅ Las verificaciones condicionales funcionan correctamente con `undefined`
- ✅ El código mantiene la misma funcionalidad

### Notas

- Las verificaciones `if (responsibleUserId)` funcionan correctamente porque tanto `undefined` como string vacío son valores falsy en JavaScript
- El select maneja correctamente la conversión entre string vacío (del option "Todos") y `undefined` (valor del estado)
- Esta consistencia facilita el mantenimiento y reduce la posibilidad de bugs relacionados con el manejo de filtros
