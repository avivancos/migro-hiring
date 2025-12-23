# Caja de Responsable en Oportunidades

## Resumen
Se agregó una caja visual destacada para mostrar el responsable asignado de una oportunidad tanto en la lista de oportunidades como en la página de detalle.

## Cambios Realizados

### 1. OpportunityCard.tsx
**Ubicación:** `src/components/opportunities/OpportunityCard.tsx`

Se agregó una caja visual destacada que muestra el responsable cuando una oportunidad está asignada.

**Características:**
- Fondo azul claro (`bg-blue-50`) con borde azul (`border-blue-200`)
- Icono de usuario en un círculo azul
- Etiqueta "Responsable" en azul
- Nombre del responsable en negrita
- Se muestra solo cuando `opportunity.assigned_to` existe

**Código agregado:**
```tsx
{/* Responsable asignado */}
{contact && opportunity.assigned_to && (
  <div className="pt-2 border-t">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
          <User className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-blue-600 font-medium mb-0.5">Responsable</p>
          <p className="text-sm text-blue-900 font-semibold truncate">
            {opportunity.assigned_to.name || 'Sin asignar'}
          </p>
        </div>
      </div>
    </div>
  </div>
)}
```

### 2. CRMOpportunityDetail.tsx
**Ubicación:** `src/pages/CRMOpportunityDetail.tsx`

Se agregó un card completo en el sidebar que muestra el responsable asignado.

**Características:**
- Card independiente en el sidebar
- Mismo estilo visual que en la lista (fondo azul claro, borde azul)
- Icono de usuario más grande (10x10) para mejor visibilidad
- Etiqueta "Asignado a"
- Nombre del responsable en negrita
- Se muestra solo cuando `opportunity.assigned_to` existe

**Código agregado:**
```tsx
{/* Responsable asignado */}
{opportunity.assigned_to && (
  <Card>
    <CardHeader>
      <CardTitle>Responsable</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-600 font-medium mb-1">Asignado a</p>
            <p className="text-sm text-blue-900 font-semibold truncate">
              {opportunity.assigned_to.name || 'Sin asignar'}
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

**Import agregado:**
```tsx
import { ArrowLeft, Phone, Mail, MapPin, User } from 'lucide-react';
```

## Diseño Visual

### Colores Utilizados
- Fondo de la caja: `bg-blue-50` (azul muy claro)
- Borde: `border-blue-200` (azul claro)
- Fondo del icono: `bg-blue-100` (azul claro)
- Color del icono: `text-blue-600` (azul medio)
- Color del texto de etiqueta: `text-blue-600` (azul medio)
- Color del nombre: `text-blue-900` (azul oscuro)

### Estructura
1. **En la lista (OpportunityCard):**
   - Se muestra dentro del contenido de la tarjeta
   - Separado por un borde superior
   - Tamaño compacto para no ocupar mucho espacio

2. **En el detalle (CRMOpportunityDetail):**
   - Card independiente en el sidebar
   - Ubicado después del card de "Estado"
   - Tamaño más grande para mejor visibilidad

## Condiciones de Visualización

La caja del responsable se muestra cuando:
- `opportunity.assigned_to` existe y no es `null` o `undefined`
- En el caso de `OpportunityCard`, también requiere que `contact` exista

## Fecha de Implementación
2024-12-19

