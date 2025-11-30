# Debug: Botón "Nuevo Lead" No Funciona

## Flujo Esperado

1. Usuario hace clic en botón "Nuevo Lead"
   - Ubicación: `/crm/leads` o `/crm` (dashboard)
   - Botón: `onClick={() => navigate('/crm/leads/new')}`

2. Navegación a `/crm/leads/new`
   - Ruta configurada: `<Route path="/crm/leads/:id" element={<CRMLeadDetail />} />`
   - Parámetro `id` será `"new"`

3. Componente `CRMLeadDetail` detecta `id === 'new'`
   - En `loadLeadData()`, línea 39-75
   - Carga defaults desde backend (o usa valores por defecto)
   - Crea objeto lead básico
   - Activa modo edición: `setEditing(true)`

4. Renderizado del formulario
   - Si `editing === true`, muestra `LeadForm`
   - Formulario prellenado con defaults

## Verificaciones

- ✅ Ruta configurada en `App.tsx` línea 60
- ✅ Botón navega correctamente en `CRMLeadList.tsx` línea 140
- ✅ Botón navega correctamente en `CRMDashboardPage.tsx` línea 365
- ✅ Componente maneja `id === 'new'` en `CRMLeadDetail.tsx` línea 39-75
- ✅ Formulario se muestra cuando `editing === true` línea 267

## Posibles Problemas

1. **Error en navegación**: Verificar consola del navegador
2. **Error al cargar defaults**: El componente debería usar valores por defecto si falla
3. **Error de renderizado**: Verificar si hay errores de React en consola
4. **Botón no hace clic**: Verificar si hay CSS que bloquea el clic

## Solución Aplicada

- Manejo robusto de errores en `loadLeadData()`
- Valores por defecto si falla la carga de defaults
- Activación automática del modo edición para `id === 'new'`

## Próximos Pasos para Debug

1. Abrir consola del navegador (F12)
2. Hacer clic en botón "Nuevo Lead"
3. Verificar si aparece algún error en consola
4. Verificar si la URL cambia a `/crm/leads/new`
5. Si la URL cambia pero no se muestra el formulario, revisar errores de React

