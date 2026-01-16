# Implementación de Paginador Mobile-First para Oportunidades

## Fecha
2025-01-15

## Resumen
Se implementó un paginador mobile-first para oportunidades similar al de contactos, se agregó el paginador en la parte superior de la página de contactos, y se cambió el modo por defecto de oportunidades a vista de tabla.

## Cambios Realizados

### 1. Paginador Superior en Contactos (`src/pages/CRMContactList.tsx`)
- Se agregó un paginador en la parte superior de la página, después de los filtros y antes de la tabla
- El paginador incluye:
  - Información de rango (Mostrando X - Y de Z)
  - Selector de items por página (25, 50, 100, 200)
  - Botones de navegación (Anterior/Siguiente) con diseño mobile-first
  - Indicador de página actual

### 2. Modo por Defecto de Oportunidades (`src/components/opportunities/OpportunityList.tsx`)
- Se cambió el modo por defecto de `'cards'` a `'table'`
- La vista de tabla ahora es la predeterminada al cargar la página

### 3. Paginador Mobile-First para Oportunidades
- Se implementó un paginador completo similar al de contactos con:
  - **Paginador Superior**: Ubicado después de los filtros, antes de la lista
  - **Paginador Inferior**: Ubicado después de la tabla/cards
  - **Diseño Mobile-First**:
    - En móvil: Los botones muestran solo iconos, el texto se oculta
    - En desktop: Se muestran iconos y texto completo
    - Layout responsive con `flex-col sm:flex-row`
  - **Funcionalidades**:
    - Selector de items por página (25, 50, 100, 200)
    - Información de rango calculada correctamente
    - Botones de navegación con estados disabled apropiados
    - Indicador de página actual y total de páginas

### 4. Vista de Tabla Mobile-First
- Se mejoró la vista de tabla para ser completamente mobile-first:
  - En móvil (`block md:hidden`): Se muestran cards individuales
  - En desktop (`hidden md:block`): Se muestra la tabla completa
  - La tabla incluye scroll horizontal en pantallas pequeñas

## Características del Paginador

### Diseño Mobile-First
- **Móvil**: 
  - Botones compactos con solo iconos
  - Layout vertical (`flex-col`)
  - Texto adaptativo que se oculta en pantallas pequeñas
- **Desktop**:
  - Botones con iconos y texto
  - Layout horizontal (`flex-row`)
  - Información completa visible

### Funcionalidades
1. **Selector de Items por Página**
   - Opciones: 25, 50, 100, 200
   - Al cambiar, se resetea a la página 1
   - Disponible tanto en paginador superior como inferior

2. **Navegación de Páginas**
   - Botón "Anterior" deshabilitado en la primera página
   - Botón "Siguiente" deshabilitado en la última página
   - Indicador de página actual y total

3. **Información de Rango**
   - Muestra: "Mostrando X - Y de Z"
   - Calcula correctamente el rango basado en página y límite
   - Incluye indicador si hay filtros aplicados

## Archivos Modificados

1. `src/pages/CRMContactList.tsx`
   - Agregado paginador superior después de los filtros

2. `src/components/opportunities/OpportunityList.tsx`
   - Cambiado modo por defecto a 'table'
   - Agregado paginador superior e inferior
   - Mejorada vista de tabla con soporte mobile-first
   - Agregadas funciones `handleLimitChange` y cálculo de rangos
   - Importado componente `Label` para el selector

## Componentes Utilizados

- `Card` y `CardContent`: Contenedores del paginador
- `Button`: Botones de navegación
- `Label`: Etiqueta para el selector
- `ChevronLeftIcon` y `ChevronRightIcon`: Iconos de navegación
- Select nativo HTML: Selector de items por página

## Consideraciones Técnicas

1. **Cálculo de Rangos**:
   ```typescript
   const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
   const endItem = Math.min(page * limit, total);
   ```

2. **Manejo de Límites**:
   - Al cambiar el límite, se resetea a la página 1
   - Se actualiza el filtro con el nuevo límite

3. **Estados Disabled**:
   - Botón "Anterior": `disabled={page <= 1}`
   - Botón "Siguiente": `disabled={page >= totalPages}`

4. **Responsive Design**:
   - Uso de clases Tailwind: `flex-col sm:flex-row`
   - Ocultación condicional: `hidden sm:inline`
   - Tamaños adaptativos: `text-sm sm:text-base`

## Próximos Pasos Sugeridos

1. Considerar agregar navegación directa a página específica
2. Agregar atajos de teclado para navegación (flechas izquierda/derecha)
3. Considerar persistir la preferencia de items por página en localStorage
4. Agregar indicador visual cuando hay filtros activos en el paginador

## Notas

- El paginador de oportunidades ahora es consistente con el de contactos
- La vista de tabla es ahora la predeterminada para mejor experiencia de usuario
- El diseño mobile-first asegura una buena experiencia en todos los dispositivos
