# Migración de lucide-react a @heroicons/react

## Resumen
Se ha migrado exitosamente la mayoría de los iconos de `lucide-react` a `@heroicons/react` para reducir el tamaño del bundle y mejorar el rendimiento.

## Estado de la Migración
- ✅ 281 archivos procesados
- ✅ 158+ archivos corregidos automáticamente
- ⚠️ ~30 errores menores restantes que requieren corrección manual

## Cambios Realizados

### 1. Dependencias
- ❌ Removido: `lucide-react@^0.546.0`
- ✅ Agregado: `@heroicons/react@^2.2.0`

### 2. Mapeo de Iconos
Se creó un archivo de mapeo en `src/utils/iconMapping.ts` con todos los iconos migrados.

## Iconos que Requieren Corrección Manual

### Iconos que no existen en Heroicons v2
Los siguientes iconos de lucide-react no tienen equivalente directo en heroicons y necesitan ser reemplazados:

1. **PhoneArrowIncomingIcon** / **PhoneArrowOutgoingIcon**
   - No existen en heroicons
   - Usar: `PhoneIcon` con indicadores visuales adicionales o crear componentes personalizados

2. **CircleIcon**
   - No existe en heroicons v2
   - Alternativa: Usar `XCircleIcon` o crear un componente SVG simple

3. **UserCheckIcon** / **UserXMarkIcon**
   - No existen en heroicons v2 outline
   - Usar: `UserIcon` + `CheckIcon` / `XMarkIcon` como composición o usar solid icons

4. **Bars3VerticalIcon**
   - Nombre incorrecto, debería ser: `Bars3Icon` (vertical es por defecto)
   - O usar: `EllipsisVerticalIcon`

### Archivos que Requieren Atención

1. **src/components/admin/Sidebar.tsx** - ✅ Corregido
2. **src/components/CRM/CRMHeader.tsx** - Referencias a iconos no migrados
3. **src/components/CRM/CRMSidebar.tsx** - Referencias a iconos no migrados
4. **src/pages/CRMDashboardPage.tsx** - Referencias a PhoneIncoming/Outgoing
5. **src/components/CRM/CallHistory.tsx** - PhoneArrowIncoming/Outgoing
6. Archivos con wildcard imports comentados que aún tienen referencias

## Patrones de Migración

### Antes (lucide-react)
```tsx
import { Search, User, Mail } from 'lucide-react';
<Search size={20} />
```

### Después (heroicons)
```tsx
import { MagnifyingGlassIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
<MagnifyingGlassIcon width={20} height={20} />
```

### Cambios Importantes
1. **Prop `size`** → Usar `width` y `height` explícitos
2. **Nombres de iconos** → Todos terminan en `Icon` (ej: `SearchIcon`)
3. **Rutas de importación** → `@heroicons/react/24/outline` o `/24/solid`

## Errores Restantes (por corregir manualmente)

1. **Props `size`**: Reemplazar `size={20}` por `width={20} height={20}` en algunos componentes
2. **Iconos no existentes**:
   - `CheckSquareIcon` → Usar `CheckIcon` o crear componente personalizado
   - `BellIcon` → Existe en heroicons, solo agregar import
   - `PlayIcon` / `PauseIcon` → Existen en heroicons, agregar imports
3. **Referencias a variables**: Algunos archivos usan variables como `Phone`, `Clock` que deben ser `PhoneIcon`, `ClockIcon`
4. **Imports faltantes**: Algunos iconos están siendo usados pero no importados

## Scripts Utilizados

- `scripts/migrate-icons.js` - Migración inicial de lucide a heroicons
- `scripts/fix-double-semicolons.js` - Corrección de dobles punto y coma
- `scripts/fix-icon-references.js` - Corrección de referencias a iconos
- `scripts/fix-imports-and-references.js` - Limpieza de imports duplicados
- `scripts/fix-icon-names.js` - Corrección de nombres incorrectos de iconos

## Próximos Pasos

1. Corregir los errores restantes mencionados arriba
2. Ejecutar: `npm run build` para verificar
3. Verificar que todos los iconos se muestren correctamente en la aplicación

## Scripts Utilizados

- `scripts/migrate-icons.js` - Script de migración automática
- `scripts/fix-double-semicolons.js` - Corrección de dobles punto y coma

## Notas

- Algunos iconos pueden necesitar ajustes visuales después de la migración
- Heroicons tiene menos iconos que lucide-react, algunos pueden requerir composición o alternativas
- Revisar todos los lugares donde se usan iconos de teléfono entrante/saliente
