# Filtros Rápidos en CRM Opportunities

## 📋 Resumen

Se han agregado los mismos filtros rápidos (tags) que existen en la página de Admin de Oportunidades al visor de oportunidades del CRM. Estos filtros permiten filtrar rápidamente las oportunidades por características específicas.

## 🎯 Filtros Rápidos Disponibles

### 1. Sin situación conocida
- **Descripción**: Filtra oportunidades cuyo contacto no tiene `grading_situacion`
- **Color**: Naranja cuando está activo
- **Uso**: Útil para identificar oportunidades que necesitan análisis inicial

### 2. Intentos disponibles (1-5)
- **Descripción**: Filtra por número exacto de intentos de llamada disponibles (1-5)
- **Color**: Azul cuando está activo
- **Lógica**: Calcula `5 - intentos_usados` y filtra por ese valor exacto
- **Uso**: Útil para priorizar oportunidades según intentos restantes

### 3. Con info asignada
- **Descripción**: Filtra oportunidades que tienen `assigned_to_id` (agente asignado)
- **Color**: Verde cuando está activo
- **Uso**: Ver oportunidades ya asignadas a agentes

### 4. Sin info asignada
- **Descripción**: Filtra oportunidades que NO tienen `assigned_to_id`
- **Color**: Rojo cuando está activo
- **Uso**: Identificar oportunidades que necesitan asignación

## 🔧 Implementación Técnica

### Componentes Modificados

#### 1. `OpportunityFilters.tsx`

**Cambios principales:**

```typescript
interface OpportunityFiltersProps {
  // ... props existentes
  opportunities?: LeadOpportunity[]; // Oportunidades para filtrado local
  onFilteredOpportunitiesChange?: (filtered: LeadOpportunity[]) => void; // Callback para oportunidades filtradas
}
```

**Nuevos estados:**
- `filterSinSituacion`: boolean
- `filterIntentosDisponibles`: number | null
- `filterConInfoAsignada`: boolean | null

**Lógica de filtrado:**
- Los filtros se aplican localmente después de obtener los datos del backend
- Se usa `useEffect` para recalcular las oportunidades filtradas cuando cambian los filtros rápidos
- Los filtros rápidos se combinan con los filtros tradicionales (backend)

#### 2. `OpportunityList.tsx`

**Cambios principales:**

```typescript
// Oportunidades raw del backend
const { opportunities: rawOpportunities, ... } = useOpportunities(filters);

// Oportunidades filtradas localmente (por filtros rápidos)
const [filteredOpportunities, setFilteredOpportunities] = useState(rawOpportunities);

// Usar oportunidades filtradas para mostrar
const opportunities = filteredOpportunities.length > 0 || rawOpportunities.length === 0 
  ? filteredOpportunities 
  : rawOpportunities;
```

**Flujo de datos:**
1. `useOpportunities` obtiene datos del backend con filtros tradicionales
2. `OpportunityFilters` recibe `rawOpportunities` y aplica filtros rápidos locales
3. Las oportunidades filtradas se actualizan via callback
4. La lista muestra las oportunidades filtradas

### UI de Filtros Rápidos

Los filtros rápidos se muestran como tags clickeables en la parte superior del componente de filtros:

```tsx
<div className="pt-2 border-t">
  <Label className="text-sm font-medium text-gray-700 mb-3 block">
    Filtros Rápidos
  </Label>
  <div className="flex flex-wrap gap-2">
    {/* Tags de filtros rápidos */}
  </div>
</div>
```

**Estados visuales:**
- **Inactivo**: Fondo gris claro, texto gris oscuro, borde transparente
- **Activo**: Fondo de color específico, texto de color contrastante, borde visible

## 🎨 Estilos y UX

### Colores por Tipo de Filtro

- **Sin situación conocida**: Naranja (`bg-orange-100 text-orange-700 border-orange-300`)
- **Intentos disponibles**: Azul (`bg-blue-100 text-blue-700 border-blue-300`)
- **Con info asignada**: Verde (`bg-green-100 text-green-700 border-green-300`)
- **Sin info asignada**: Rojo (`bg-red-100 text-red-700 border-red-300`)

### Comportamiento

1. **Click único**: Activa/desactiva el filtro
2. **Múltiples filtros**: Se pueden combinar varios filtros rápidos
3. **Limpiar filtros**: El botón "Limpiar filtros" resetea todos los filtros (rápidos y tradicionales)
4. **Contador de filtros**: Muestra el número total de filtros activos (incluyendo rápidos)

## 📊 Lógica de Filtrado

### Filtro: Sin situación conocida

```typescript
if (filterSinSituacion) {
  filtered = filtered.filter(opp => {
    const contact = opp.contact;
    return !contact?.grading_situacion;
  });
}
```

### Filtro: Intentos disponibles

```typescript
if (filterIntentosDisponibles !== null) {
  filtered = filtered.filter(opp => {
    const attempts = opp.first_call_attempts || {};
    const usedAttempts = Object.keys(attempts).length;
    const availableAttempts = 5 - usedAttempts;
    return availableAttempts === filterIntentosDisponibles;
  });
}
```

### Filtro: Con/Sin info asignada

```typescript
if (filterConInfoAsignada !== null) {
  if (filterConInfoAsignada) {
    filtered = filtered.filter(opp => opp.assigned_to_id);
  } else {
    filtered = filtered.filter(opp => !opp.assigned_to_id);
  }
}
```

## 🔄 Integración con Filtros Tradicionales

Los filtros rápidos se aplican **después** de los filtros del backend:

1. Usuario aplica filtros tradicionales (estado, prioridad, búsqueda, etc.)
2. Backend retorna oportunidades filtradas
3. Componente aplica filtros rápidos localmente a esas oportunidades
4. Se muestran las oportunidades resultantes

**Ventajas:**
- No requiere cambios en el backend
- Filtrado instantáneo (sin llamadas adicionales)
- Combinable con filtros existentes

## 📝 Notas de Implementación

### Compatibilidad

- Los filtros rápidos son **opcionales** - si no se pasan `opportunities` y `onFilteredOpportunitiesChange`, el componente funciona como antes
- No afecta el comportamiento de otros componentes que usan `OpportunityFilters`

### Rendimiento

- Los filtros se aplican localmente en el cliente
- Solo se recalcula cuando cambian los filtros rápidos o las oportunidades raw
- No hay llamadas adicionales al backend

### Limitaciones

- Los filtros rápidos solo se aplican a las oportunidades de la página actual
- Si hay paginación, los filtros se aplican por página, no globalmente
- Para filtrado global, se recomienda usar los filtros tradicionales del backend

## ✅ Testing

### Casos de Prueba Sugeridos

1. **Activar/desactivar filtros rápidos individuales**
2. **Combinar múltiples filtros rápidos**
3. **Combinar filtros rápidos con filtros tradicionales**
4. **Limpiar todos los filtros**
5. **Verificar que el contador de filtros incluye filtros rápidos**
6. **Verificar que funciona sin oportunidades**
7. **Verificar que funciona sin props opcionales**

## 🔗 Archivos Relacionados

- `src/components/opportunities/OpportunityFilters.tsx` - Componente de filtros
- `src/components/opportunities/OpportunityList.tsx` - Lista de oportunidades
- `src/pages/CRMOpportunities.tsx` - Página principal del CRM
- `src/pages/admin/AdminOpportunities.tsx` - Página de admin (ya tenía estos filtros)

---

**Última actualización**: 2025-01-16  
**Implementado por**: Sistema de desarrollo  
**Estado**: ✅ Completado


