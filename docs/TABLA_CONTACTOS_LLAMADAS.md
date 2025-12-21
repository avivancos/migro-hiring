# Tabla de Contactos - Columnas de Llamadas

## Resumen
Se han agregado columnas de última llamada, próxima llamada y fecha de creación del lead a la tabla de contactos, junto con filtros y ordenamiento inteligente.

## Funcionalidades Implementadas

### 1. Nuevas Columnas

#### Última Llamada
- **Campo**: `ultima_llamada_fecha`
- **Descripción**: Fecha de la última llamada realizada al contacto
- **Fuente de datos**: Se calcula buscando la llamada más reciente en `calls.started_at` o `calls.created_at`
- **Visualización**: 
  - Se muestra en la tabla (vista desktop)
  - Se muestra en las tarjetas (vista móvil y grid)
  - Icono de teléfono (Phone)
  - Formato: Fecha localizada en español

#### Próxima Llamada
- **Campo**: `proxima_llamada_fecha`
- **Descripción**: Fecha de la próxima llamada programada
- **Fuente de datos**: 
  - Se busca en `calls.proxima_llamada_fecha` (cuando una llamada tiene una próxima fecha programada)
  - Se busca en `tasks.complete_till` donde `task_type === 'call'` y `is_completed === false`
  - Se toma la fecha más próxima en el futuro
- **Visualización**:
  - Se muestra en la tabla (vista desktop)
  - Se muestra en las tarjetas (vista móvil y grid)
  - Icono de calendario (Calendar)
  - Si la fecha ya pasó, se muestra en rojo y negrita como advertencia
  - Formato: Fecha localizada en español

#### Fecha de Creación del Lead
- **Campo**: `created_at` (ya existía, ahora más visible)
- **Descripción**: Fecha de creación del contacto/lead
- **Visualización**: 
  - Siempre visible en la tabla
  - Icono de calendario (Calendar)
  - Formato: Fecha localizada en español

### 2. Ordenamiento

Las nuevas columnas son ordenables:

- **Última Llamada**: Click en el header de la columna para ordenar ascendente/descendente
- **Próxima Llamada**: Click en el header de la columna para ordenar ascendente/descendente
- **Fecha Creación**: Ya era ordenable, ahora más visible

**Lógica de ordenamiento**:
- Última llamada: Los contactos sin llamadas aparecen al final (valor 0)
- Próxima llamada: Los contactos sin próxima llamada aparecen al final (valor MAX_SAFE_INTEGER)
- Se puede alternar entre orden ascendente y descendente haciendo click múltiples veces

### 3. Filtros de Fecha

Se han agregado 4 nuevos filtros de fecha:

#### Filtros de Última Llamada
- **Última Llamada Desde**: Filtra contactos cuya última llamada fue después de esta fecha
- **Última Llamada Hasta**: Filtra contactos cuya última llamada fue antes de esta fecha
- Ambos filtros se pueden combinar para crear un rango de fechas

#### Filtros de Próxima Llamada
- **Próxima Llamada Desde**: Filtra contactos cuya próxima llamada es después de esta fecha
- **Próxima Llamada Hasta**: Filtra contactos cuya próxima llamada es antes de esta fecha
- Ambos filtros se pueden combinar para crear un rango de fechas

**Características**:
- Los filtros se aplican en el frontend después de cargar los datos
- Los contactos sin fecha correspondiente se excluyen cuando se aplica el filtro
- Los filtros se guardan en la URL para poder compartir la vista filtrada

### 4. Optimización de Rendimiento

Para evitar sobrecargar el sistema al cargar muchos contactos:

- **Carga condicional**: Los contactos solo se enriquecen con información de llamadas cuando es necesario:
  - Cuando se ordena por `ultima_llamada` o `proxima_llamada`
  - Cuando se aplican filtros de fecha de llamadas
- **Carga en batches**: Cuando es necesario enriquecer, se hace en lotes de 10 contactos para no bloquear la interfaz
- **Caché implícito**: Los datos enriquecidos se mantienen en el estado mientras no cambien los filtros

## Implementación Técnica

### Archivos Modificados

1. **`src/types/crm.ts`**
   - Se agregaron campos opcionales `ultima_llamada_fecha` y `proxima_llamada_fecha` a `KommoContact`

2. **`src/pages/CRMContactList.tsx`**
   - Función `enrichContactWithCallInfo`: Enriquece un contacto con información de llamadas y tareas
   - Estados para filtros de fecha: `ultimaLlamadaDesde`, `ultimaLlamadaHasta`, `proximaLlamadaDesde`, `proximaLlamadaHasta`
   - Lógica de filtrado en `filteredAndSortedContacts` useMemo
   - Lógica de ordenamiento extendida para incluir `ultima_llamada` y `proxima_llamada`
   - Columnas agregadas a la tabla HTML
   - Información agregada a las vistas de tarjetas (móvil y grid)
   - Controles de filtro agregados en la sección de filtros

### Tipos TypeScript

```typescript
type SortField = 'name' | 'email' | 'phone' | 'created_at' | 'grading_llamada' | 
                 'grading_situacion' | 'nacionalidad' | 'ultima_llamada' | 'proxima_llamada';
```

### Función de Enriquecimiento

```typescript
const enrichContactWithCallInfo = async (contact: KommoContact): Promise<KommoContact> => {
  // Obtiene llamadas y tareas del contacto
  // Calcula última llamada (más reciente)
  // Calcula próxima llamada (más próxima futura, de calls o tasks)
  // Retorna contacto enriquecido
};
```

## Uso

### Ordenar por Última Llamada
1. Click en el header "Última Llamada" en la tabla
2. Los contactos se ordenarán por fecha de última llamada
3. Click nuevamente para invertir el orden

### Filtrar por Rango de Últimas Llamadas
1. Abrir panel de filtros
2. Establecer "Última Llamada Desde" (ej: 2024-01-01)
3. Establecer "Última Llamada Hasta" (ej: 2024-12-31)
4. Se mostrarán solo contactos con última llamada en ese rango

### Filtrar Próximas Llamadas Próximas
1. Abrir panel de filtros
2. Establecer "Próxima Llamada Desde" como hoy
3. Se mostrarán contactos con próxima llamada programada para hoy o después

### Buscar Contactos con Próxima Llamada Vencida
1. Establecer "Próxima Llamada Hasta" como hoy
2. Los contactos con próxima llamada vencida aparecerán en rojo

## Notas de Rendimiento

- Con muchos contactos (>100), la carga inicial puede ser más lenta si se ordena o filtra por llamadas
- Se recomienda usar filtros para reducir la cantidad de contactos antes de ordenar por llamadas
- El sistema carga en batches de 10 contactos para evitar bloquear la UI

## Mejoras Futuras

- [ ] Optimizar con endpoint del backend que devuelva esta información directamente
- [ ] Agregar caché de resultados de enriquecimiento
- [ ] Lazy loading de información de llamadas solo cuando se hace scroll
- [ ] Indicadores visuales de llamadas próximas (badges, colores)
- [ ] Exportar vista filtrada a CSV/Excel

## Ejemplos de Casos de Uso

1. **Encontrar contactos sin llamadas recientes**: Ordenar por última llamada ascendente
2. **Contactos con llamadas programadas para hoy**: Filtrar próxima llamada desde hoy hasta hoy
3. **Contactos con próxima llamada vencida**: Filtrar próxima llamada hasta hoy (aparecerán en rojo)
4. **Contactos llamados en el último mes**: Filtrar última llamada desde hace 30 días hasta hoy
5. **Leads nuevos sin primera llamada**: Filtrar última llamada vacía y ordenar por fecha creación










