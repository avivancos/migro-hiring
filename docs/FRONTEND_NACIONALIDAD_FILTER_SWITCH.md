# Frontend: Switch Rápido de Filtro de Nacionalidad

**Fecha**: 2025-01-29  
**Módulo**: Frontend - CRM Contactos y Oportunidades  
**Prioridad**: 🟡 Media  
**Estado**: ✅ Completado

---

## 📋 Resumen Ejecutivo

Se ha implementado un switch rápido para filtrar contactos y oportunidades por nacionalidad, permitiendo filtrar rápidamente entre "Solo nacionalidad" (con nacionalidad) y "todos".

---

## 🎯 Objetivo

Agregar un switch rápido en las vistas de contactos y oportunidades que permita filtrar rápidamente:
- **Solo nacionalidad**: Contactos/oportunidades que tienen nacionalidad registrada
- **Todos**: Mostrar todos los contactos/oportunidades sin filtrar por nacionalidad

---

## 📍 Componentes Afectados

### 1. `src/pages/CRMContactList.tsx`

**Cambios realizados:**

1. **Nuevo estado para el filtro de nacionalidad:**
   ```typescript
   const [nacionalidadFilter, setNacionalidadFilter] = useState<'todos' | 'nacionalidad'>(
     searchParams.get('nacionalidad_filter') === 'nacionalidad' ? 'nacionalidad' : 'todos'
   );
   ```

2. **Switch rápido agregado en la UI:**
   - Ubicado junto al switch "Solo mis contactos"
   - Permite activar/desactivar el filtro de nacionalidad
   - Cuando se activa, deshabilita el select de nacionalidad específica

3. **Lógica de filtrado:**
   - Si `nacionalidadFilter === 'nacionalidad'`, se filtran localmente los contactos que tienen nacionalidad registrada
   - El filtro se aplica después de recibir los datos del backend
   - Se sincroniza con la URL mediante el parámetro `nacionalidad_filter`

4. **Integración con el select de nacionalidad:**
   - Cuando se activa el switch de nacionalidad, se limpia el select de nacionalidad
   - Cuando se selecciona una nacionalidad específica, se desactiva el switch de nacionalidad
   - Ambos filtros son mutuamente excluyentes

5. **Cálculo del total:**
   - Cuando el filtro de irregulares está activo, se usa el count filtrado localmente
   - Similar al comportamiento del filtro "Solo mis contactos"

### 2. `src/components/opportunities/OpportunityFilters.tsx`

**Cambios realizados:**

1. **Nuevo estado para el filtro:**
   ```typescript
   const [filterNacionalidad, setFilterNacionalidad] = useState(false);
   ```

2. **Switch rápido agregado:**
   - Ubicado junto al switch "Solo mis oportunidades"
   - Permite activar/desactivar el filtro de nacionalidad

3. **Lógica de filtrado:**
   - Filtra oportunidades cuyo contacto asociado tiene nacionalidad registrada
   - Se aplica localmente en el `useMemo` que procesa las oportunidades
   - El filtro se aplica sobre `opp.contact?.nacionalidad`

4. **Integración con otros filtros:**
   - Se incluye en el conteo de filtros activos
   - Se limpia cuando se ejecuta `clearAllFilters`

---

## 🔧 Detalles de Implementación

### Filtrado de Contactos

El filtro de nacionalidad se aplica localmente después de recibir los datos del backend:

```typescript
// Aplicar filtro de nacionalidad "Solo nacionalidad" localmente
if (nacionalidadFilter === 'nacionalidad') {
  filteredContacts = filteredContacts.filter(contact => {
    return contact.nacionalidad && contact.nacionalidad.trim() !== '';
  });
}
```

### Filtrado de Oportunidades

El filtro se aplica en el `useMemo` que procesa las oportunidades:

```typescript
// Filtro: Solo nacionalidad (con nacionalidad)
if (filterNacionalidad) {
  result = result.filter(opp => {
    const contact = opp.contact;
    return contact?.nacionalidad && contact.nacionalidad.trim() !== '';
  });
}
```

### Sincronización con URL

El estado del filtro se sincroniza con la URL para permitir compartir enlaces con el filtro aplicado:

```typescript
if (nacionalidadFilter !== 'todos') params.set('nacionalidad_filter', nacionalidadFilter);
```

Y se inicializa desde la URL al cargar la página:

```typescript
const [nacionalidadFilter, setNacionalidadFilter] = useState<'todos' | 'irregulares'>(
  searchParams.get('nacionalidad_filter') === 'irregulares' ? 'irregulares' : 'todos'
);
```

---

## 🎨 Interfaz de Usuario

### Contactos

- **Ubicación**: Junto al switch "Solo mis contactos", en la sección de filtros rápidos
- **Etiqueta**: "Solo nacionalidad"
- **Comportamiento**:
  - Al activarse, muestra solo contactos con nacionalidad registrada
  - Deshabilita el select de nacionalidad específica
  - Al desactivarse, permite usar el select de nacionalidad nuevamente
  - Se incluye en el contador de filtros activos

### Oportunidades

- **Ubicación**: Junto al switch "Solo mis oportunidades", en la sección de filtros rápidos
- **Etiqueta**: "Solo nacionalidad"
- **Comportamiento**:
  - Al activarse, muestra solo oportunidades cuyo contacto tiene nacionalidad registrada
  - Funciona independientemente de otros filtros
  - Se incluye en el contador de filtros activos

---

## 📊 Consideraciones Técnicas

### Filtrado Local vs Backend

- **Contactos**: El filtro se aplica localmente porque requiere verificar si la nacionalidad existe y no está vacía, lo cual es más eficiente en el frontend
- **Oportunidades**: El filtro se aplica localmente porque ya se tienen los datos del contacto expandido

### Rendimiento

- El filtrado local es eficiente ya que se aplica sobre los resultados ya paginados
- No requiere llamadas adicionales al backend
- El cálculo del total se ajusta cuando el filtro está activo

### Compatibilidad

- El filtro es compatible con todos los demás filtros existentes
- Se integra correctamente con la paginación
- Se sincroniza con la URL para permitir compartir estados

---

## ✅ Testing

### Casos de Prueba

1. **Activar filtro de nacionalidad:**
   - ✅ Solo muestra contactos/oportunidades con nacionalidad registrada
   - ✅ Deshabilita el select de nacionalidad (en contactos)
   - ✅ Actualiza el contador de filtros activos

2. **Desactivar filtro de nacionalidad:**
   - ✅ Muestra todos los contactos/oportunidades
   - ✅ Habilita el select de nacionalidad (en contactos)
   - ✅ Actualiza el contador de filtros activos

3. **Interacción con select de nacionalidad:**
   - ✅ Al seleccionar una nacionalidad, se desactiva el switch de nacionalidad
   - ✅ Al activar el switch de nacionalidad, se limpia el select de nacionalidad

4. **Sincronización con URL:**
   - ✅ El estado se guarda en la URL
   - ✅ Al recargar la página, el filtro se mantiene
   - ✅ Los enlaces compartidos preservan el estado del filtro

5. **Integración con otros filtros:**
   - ✅ Funciona correctamente con "Solo mis contactos/oportunidades"
   - ✅ Funciona correctamente con otros filtros (grading, fechas, etc.)
   - ✅ Se limpia correctamente con "Limpiar filtros"

---

## 📝 Notas Adicionales

- El filtro "Solo nacionalidad" muestra únicamente contactos/oportunidades que tienen nacionalidad registrada
- El filtro es útil para identificar contactos con documentación completa
- El filtro se aplica de forma consistente en ambas vistas (contactos y oportunidades)

---

## 🔄 Próximos Pasos (Opcional)

- Considerar agregar un filtro similar para otros campos relevantes
- Evaluar si el filtro debería aplicarse también en el backend para mejor rendimiento con grandes volúmenes de datos
- Considerar agregar estadísticas sobre el porcentaje de contactos con/sin nacionalidad

---

## 📚 Referencias

- `src/pages/CRMContactList.tsx` - Implementación en contactos
- `src/components/opportunities/OpportunityFilters.tsx` - Implementación en oportunidades
- `src/types/crm.ts` - Tipos de datos de Contact
- `src/types/opportunity.ts` - Tipos de datos de Opportunity
