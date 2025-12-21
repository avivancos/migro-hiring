# Restricción de Visualización del Total de Contactos para Agentes

## Resumen

Se ha implementado una restricción para que los agentes no puedan ver fácilmente el número total de contactos en el sistema. Esta medida de privacidad y seguridad limita la información visible a los agentes, mostrando solo los contactos que están viendo actualmente.

## Cambios Implementados

### 1. Dashboard CRM (`src/pages/CRMDashboardPage.tsx`)

#### Card de "Contactos Totales"
- **Antes**: Mostraba el número exacto de contactos totales
- **Después**: Para agentes, muestra "---" en lugar del número total
- **Ubicación**: Líneas 373-385

```373:385:src/pages/CRMDashboardPage.tsx
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Contactos Totales</p>
                  {user?.role === 'agent' ? (
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">---</p>
                  ) : (
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalContactsCount}</p>
                  )}
                </div>
```

#### Sección de Pipeline de Ventas
- **Antes**: Mostraba "{total} contactos" en el encabezado del pipeline
- **Después**: Para agentes, muestra solo "contactos" sin el número
- **Ubicación**: Líneas 820-826

```820:826:src/pages/CRMDashboardPage.tsx
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm text-gray-600">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
              {user?.role === 'agent' ? (
                <span>contactos</span>
              ) : (
                <span>{totalContactsCount > 0 ? totalContactsCount : filteredLeads.length} contactos</span>
              )}
            </div>
```

### 2. Lista de Contactos (`src/pages/CRMContactList.tsx`)

#### Encabezado de la Lista
- **Antes**: Mostraba "{total} contactos total (mostrando X de {total})"
- **Después**: Para agentes, muestra solo "{X} contactos mostrados" sin el total
- **Ubicación**: Líneas 873-883

```873:883:src/pages/CRMContactList.tsx
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-gray-900">Contactos</h1>
            {user?.role === 'agent' ? (
              <p className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base font-sans">
                {filteredAndSortedContacts.length} {filteredAndSortedContacts.length === 1 ? 'contacto' : 'contactos'} mostrados
              </p>
            ) : (
              <p className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base font-sans">
                {totalContacts} {totalContacts === 1 ? 'contacto' : 'contactos'} total{filteredAndSortedContacts.length < totalContacts ? ` (mostrando ${filteredAndSortedContacts.length} de ${totalContacts})` : ''}
              </p>
            )}
          </div>
```

#### Información de Paginación
- **Antes**: Mostraba "Mostrando X - Y de {total}" y "Página N de {total_pages}"
- **Después**: Para agentes, usa el número de contactos filtrados en lugar del total
- **Ubicación**: Líneas 1369-1414

```1369:1414:src/pages/CRMContactList.tsx
        {/* Controles de Paginación */}
        {!loading && (user?.role === 'agent' ? filteredAndSortedContacts.length > 0 : totalContacts > 0) && (
          <Card className="mt-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {user?.role === 'agent' ? (
                    <div className="text-sm text-gray-600">
                      Mostrando {pagination.skip + 1} - {Math.min(pagination.skip + pagination.limit, filteredAndSortedContacts.length)} de {filteredAndSortedContacts.length}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Mostrando {pagination.skip + 1} - {Math.min(pagination.skip + pagination.limit, totalContacts)} de {totalContacts}
                    </div>
                  )}
                  ...
                  {user?.role === 'agent' ? (
                    <span className="text-sm text-gray-600 px-3 min-w-[100px] text-center">
                      Página {Math.floor(pagination.skip / pagination.limit) + 1} de {Math.ceil(filteredAndSortedContacts.length / pagination.limit)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-600 px-3 min-w-[100px] text-center">
                      Página {Math.floor(pagination.skip / pagination.limit) + 1} de {Math.ceil(totalContacts / pagination.limit)}
                    </span>
                  )}
                  ...
                  disabled={user?.role === 'agent' ? pagination.skip + pagination.limit >= filteredAndSortedContacts.length : pagination.skip + pagination.limit >= totalContacts}
```

## Comportamiento por Rol

### Agentes (`role === 'agent'`)
- ❌ No ven el número total de contactos en el dashboard
- ❌ No ven el número total de contactos en la lista
- ✅ Ven solo el número de contactos que están visualizando actualmente
- ✅ La paginación se basa en los contactos filtrados/visibles

### Otros Roles (admin, lawyer, etc.)
- ✅ Ven el número total de contactos en todas las vistas
- ✅ La paginación se basa en el total real de contactos

## Consideraciones Técnicas

1. **Frontend Only**: Esta restricción se implementa solo en el frontend. El backend aún permite que los agentes llamen al endpoint `/contacts/count`, pero el frontend no muestra esta información.

2. **Filtrado**: Los agentes aún pueden ver y filtrar contactos normalmente, pero no verán el total global del sistema.

3. **Paginación**: La paginación para agentes se basa en los contactos filtrados y ordenados que están viendo, no en el total del sistema.

## Mejoras Futuras (Opcional)

Si se requiere una restricción más estricta, se podría:
- Implementar la restricción también en el backend, bloqueando el endpoint `/contacts/count` para agentes
- Retornar un error 403 o un valor genérico cuando un agente intente obtener el total

## Fecha de Implementación

Implementado: {{ fecha_actual }}


