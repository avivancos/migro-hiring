# Fix: Error 422 en Endpoint de Contactos CRM - Parámetros de Ordenamiento

**Fecha**: 2026-01-16  
**Estado**: ✅ Resuelto  
**Prioridad**: 🔴 Alta  
**Módulo**: Backend - CRM Contacts

---

## 🐛 Problema

El endpoint `GET /api/crm/contacts` estaba devolviendo un error **422 (Unprocessable Entity)** cuando el frontend enviaba los parámetros `sort_by` y `sort_order` en la query string.

### Error Observado

```
GET /api/crm/contacts?skip=0&limit=200&sort_by=created_at&sort_order=desc
```

El endpoint rechazaba estos parámetros porque no estaban definidos en la firma de la función, causando que FastAPI los rechazara como parámetros desconocidos.

---

## ✅ Solución Implementada

### 1. Agregados Parámetros de Ordenamiento

**Archivo**: `app/api/endpoints/crm.py`

Se agregaron los parámetros `sort_by` y `sort_order` al endpoint `list_contacts`:

```python
@router.get("/contacts", response_model=List[ContactResponse])
async def list_contacts(
    ...
    # Sorting parameters
    sort_by: Optional[str] = Query("created_at", description="Field to sort by (created_at, updated_at, name, email, etc.)"),
    sort_order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),
) -> List[ContactResponse]:
```

### 2. Validación de Parámetros

Se agregó validación estricta para ambos parámetros:

- **`sort_order`**: Solo acepta valores `"asc"` o `"desc"` (case-insensitive)
- **`sort_by`**: Solo acepta campos válidos del modelo Contact:
  - `created_at`, `updated_at`, `name`, `email`, `phone`, `mobile`
  - `company`, `city`, `state`, `country`, `nacionalidad`
  - `grading_llamada`, `grading_situacion`, `status`, `priority`, `score`

Si se envía un valor inválido, se devuelve un error 422 con un mensaje descriptivo.

### 3. Lógica de Ordenamiento

#### Sin Búsqueda (`search` no proporcionado)
- Se aplica el ordenamiento según `sort_by` y `sort_order`
- Por defecto: `created_at` descendente

#### Con Búsqueda (`search` proporcionado)
- **Primero**: Se ordena por relevancia (score de búsqueda) - siempre descendente
- **Segundo**: Se aplica el ordenamiento secundario según `sort_by` y `sort_order`
- Esto asegura que los resultados más relevantes aparezcan primero, pero dentro de la misma relevancia se respeta el ordenamiento personalizado

### 4. Documentación Actualizada

**Archivo**: `docs/frontend-contacts-list-endpoint.md`

Se agregó una sección completa sobre los parámetros de ordenamiento con:
- Descripción de cada parámetro
- Valores permitidos
- Comportamiento con y sin búsqueda

---

## 📋 Campos Válidos para `sort_by`

| Campo | Descripción |
|-------|-------------|
| `created_at` | Fecha de creación (default) |
| `updated_at` | Fecha de última actualización |
| `name` | Nombre completo del contacto |
| `email` | Correo electrónico |
| `phone` | Teléfono fijo |
| `mobile` | Teléfono móvil |
| `company` | Nombre de la empresa |
| `city` | Ciudad |
| `state` | Estado/Provincia |
| `country` | País |
| `nacionalidad` | Nacionalidad |
| `grading_llamada` | Grading de llamada (A, B+, B-, C) |
| `grading_situacion` | Grading de situación (A, B+, B-, C) |
| `status` | Estado del lead/contacto |
| `priority` | Prioridad |
| `score` | Score del lead |

---

## 🧪 Ejemplos de Uso

### Ordenar por fecha de creación (descendente - default)
```http
GET /api/crm/contacts?sort_by=created_at&sort_order=desc
```

### Ordenar por nombre (ascendente)
```http
GET /api/crm/contacts?sort_by=name&sort_order=asc
```

### Ordenar por email con búsqueda
```http
GET /api/crm/contacts?search=john&sort_by=email&sort_order=asc
```
**Nota**: Los resultados se ordenarán primero por relevancia de búsqueda, luego por email.

### Error: Campo inválido
```http
GET /api/crm/contacts?sort_by=invalid_field&sort_order=desc
```
**Respuesta**: `422 - Invalid sort_by: 'invalid_field'. Allowed fields: ...`

### Error: Orden inválido
```http
GET /api/crm/contacts?sort_by=name&sort_order=invalid
```
**Respuesta**: `422 - Invalid sort_order: 'invalid'. Must be 'asc' or 'desc'`

---

## ✅ Resultado

- ✅ El endpoint ahora acepta los parámetros `sort_by` y `sort_order`
- ✅ Se valida que los valores sean correctos antes de procesar
- ✅ El ordenamiento funciona correctamente con y sin búsqueda
- ✅ Los errores 422 se resuelven cuando se envían parámetros válidos
- ✅ Documentación actualizada

---

## 🔄 Compatibilidad Frontend

### Estado Actual del Frontend

El frontend ya está correctamente configurado para usar estos parámetros:

**Archivo**: `src/types/crm.ts`
```typescript
export interface ContactFilters {
  sort_by?: string; // 'name', 'created_at', 'grading_llamada'
  sort_order?: 'asc' | 'desc';
  // ... otros filtros
}
```

**Archivo**: `src/pages/CRMContactList.tsx`
```typescript
const [sortField, setSortField] = useState<SortField>((searchParams.get('sort_by') as SortField) || 'created_at');
const [sortOrder, setSortOrder] = useState<SortOrder>((searchParams.get('sort_order') as SortOrder) || 'desc');

// En loadContacts:
if (sortField) {
  filters.sort_by = sortField;
  filters.sort_order = sortOrder;
}
```

**Archivo**: `src/services/crmService.ts`
```typescript
async getContacts(filters?: ContactFilters): Promise<ContactsListResponse> {
  const params: any = { ...filters };
  // sort_by y sort_order se envían automáticamente si están en filters
  const { data } = await api.get<any>(`${CRM_BASE_PATH}/contacts`, {
    params,
  });
  // ...
}
```

### Verificación

- ✅ El frontend envía `sort_by` y `sort_order` correctamente
- ✅ Los valores por defecto coinciden con el backend (`created_at`, `desc`)
- ✅ Los tipos TypeScript están correctamente definidos
- ✅ No se requieren cambios en el frontend

---

## 📝 Notas Técnicas

1. **Validación temprana**: Los parámetros se validan antes de construir la query, evitando errores en tiempo de ejecución
2. **Ordenamiento con búsqueda**: Cuando hay búsqueda, la relevancia siempre tiene prioridad sobre el ordenamiento personalizado
3. **Campos seguros**: Solo se permiten campos que existen en el modelo Contact y que son seguros para ordenar
4. **Case-insensitive**: `sort_order` acepta "ASC", "asc", "DESC", "desc" indistintamente
5. **Backward compatible**: Si no se envían los parámetros, se usa el comportamiento por defecto (`created_at` descendente)

---

## 🔗 Referencias

- `src/types/crm.ts` - Definición de tipos TypeScript
- `src/services/crmService.ts` - Servicio de API
- `src/pages/CRMContactList.tsx` - Componente de lista de contactos
- `app/api/endpoints/crm.py` - Endpoint del backend (implementación)

---

## 📅 Fecha de Creación

2026-01-16
