## Corrección de bugs: FormData header y consistencia de filtros

### Fecha
2026-01-20

### Bugs corregidos

#### Bug 1: Header Content-Type explícito en FormData
**Archivo**: `src/components/opportunities/RequestContractModal.tsx`
**Líneas**: 183-191

**Problema**: Al enviar `FormData` a axios, se establecía explícitamente el header `Content-Type: multipart/form-data`. Esto impide que axios genere automáticamente el parámetro `boundary` requerido para el formato multipart, causando que el cuerpo de la petición esté mal formado en el servidor y potencialmente falle o sea rechazado.

**Solución**: Se eliminó el header explícito para permitir que axios establezca automáticamente el `Content-Type` correcto con el `boundary` generado.

**Cambio**:
```typescript
// Antes
const response = await api.post(
  `/pipelines/stages/${entityType}/${entityId}/request-hiring-code`,
  formDataToSend,
  {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
);

// Después
// No establecer Content-Type explícitamente - axios lo genera automáticamente con el boundary correcto
const response = await api.post(
  `/pipelines/stages/${entityType}/${entityId}/request-hiring-code`,
  formDataToSend
);
```

**Nota técnica**: Cuando axios detecta un objeto `FormData`, automáticamente establece el header `Content-Type` con el formato `multipart/form-data; boundary=----WebKitFormBoundary...`. Si se establece manualmente sin el boundary, el servidor no puede parsear correctamente el cuerpo de la petición.

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
