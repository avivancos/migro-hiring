# Restricción de Visualización del Total de Contratos para Agentes

## Resumen

Se ha implementado una restricción para que los agentes no puedan ver fácilmente el número total de contratos en el sistema. Esta medida de privacidad y seguridad limita la información visible a los agentes, mostrando solo los contratos que están visualizando actualmente.

## Cambios Implementados

### 1. Dashboard CRM (`src/pages/CRMDashboardPage.tsx`)

#### Cards de Estadísticas de Contratos
- **Antes**: Mostraba dos tarjetas: "Contratos Totales" y "Últimos Contratos"
- **Después**: Para agentes, ambas tarjetas están completamente ocultas
- **Ubicación**: Líneas 457-488

```457:488:src/pages/CRMDashboardPage.tsx
          {/* Ocultar tarjetas de contratos para agentes */}
          {!userIsAgent && (
            <>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Contratos Totales</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalContractsCount}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Últimos Contratos</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{lastContracts.length}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
```

#### Sección Completa de "Últimos Contratos"
- **Antes**: Mostraba una sección completa con la lista detallada de los últimos contratos
- **Después**: Para agentes, toda la sección está oculta
- **Ubicación**: Líneas 688-763

```688:763:src/pages/CRMDashboardPage.tsx
          {/* Últimos Contratos - Oculto para agentes */}
          {!userIsAgent && (
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-base sm:text-lg md:text-xl font-bold">Últimos Contratos</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/crm/contracts')}
                    className="text-xs sm:text-sm"
                  >
                    Ver todos
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                {/* Lista completa de últimos contratos */}
              </CardContent>
            </Card>
          )}
```

#### Optimización de Carga de Datos
- **Antes**: Se cargaban los contratos para todos los usuarios
- **Después**: Para agentes, no se realiza la llamada al backend para obtener contratos
- **Ubicación**: Línea 87

```85:87:src/pages/CRMDashboardPage.tsx
      const loadPromises: Promise<any>[] = [
        crmService.getPipelines().catch(() => []),
        userIsAgent ? Promise.resolve({ items: [], total: 0 }) : contractsService.getContracts({ limit: 10, skip: 0 }).catch(() => ({ items: [], total: 0 })),
```

#### Ajuste de Layout del Grid
- El grid del calendario y últimos contratos se ajusta dinámicamente: cuando es agente, el calendario ocupa todo el ancho disponible
- **Ubicación**: Línea 509

### 2. Lista de Contratos (`src/pages/CRMContracts.tsx`)

#### Tarjeta de Estadísticas "Total"
- **Antes**: Mostraba el número exacto de contratos totales (`stats.total`)
- **Después**: Para agentes, muestra "---" en lugar del número total
- **Ubicación**: Líneas 153-167

```153:167:src/pages/CRMContracts.tsx
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                {user?.role === 'agent' ? (
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">---</p>
                ) : (
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                )}
              </div>
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>
```

#### Información de Paginación
- **Antes**: Mostraba "Mostrando X - Y de {total} contratos"
- **Después**: Para agentes, usa el número de contratos cargados en la página actual (`contracts.length`) en lugar del total
- **Ubicación**: Líneas 362-367

```362:367:src/pages/CRMContracts.tsx
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">
                    {user?.role === 'agent' ? (
                      <>Mostrando {currentSkip + 1} - {Math.min(currentSkip + currentLimit, contracts.length)} de {contracts.length} contratos</>
                    ) : (
                      <>Mostrando {currentSkip + 1} - {Math.min(currentSkip + currentLimit, total)} de {total} contratos</>
                    )}
                  </p>
```

## Comportamiento por Rol

### Agentes (`role === 'agent'`)
- ❌ No ven el número total de contratos en el dashboard
- ❌ No ven la tarjeta de "Últimos Contratos" en el dashboard
- ❌ No ven la sección completa con la lista de últimos contratos en el dashboard
- ❌ No se cargan datos de contratos desde el backend (optimización)
- ❌ No ven el número total de contratos en la lista de contratos
- ✅ Ven solo el número de contratos que están visualizando actualmente en la paginación
- ✅ Las estadísticas de estado (Pendientes, Pagados, Completados) siguen funcionando normalmente porque se basan en los contratos cargados, no en el total

### Otros Roles (admin, lawyer, etc.)
- ✅ Ven el número total de contratos en todas las vistas
- ✅ La paginación se basa en el total real de contratos
- ✅ Tienen acceso completo a todas las estadísticas

## Consideraciones Técnicas

1. **Frontend Only**: Esta restricción se implementa solo en el frontend. El backend aún permite que los agentes llamen al endpoint `/contracts`, pero el frontend:
   - No realiza la llamada para obtener últimos contratos en el dashboard (optimización)
   - Oculta el campo `total` de la respuesta en la lista de contratos

2. **Optimización de Carga**: Para agentes, no se carga la lista de últimos contratos desde el backend en el dashboard, reduciendo las llamadas API innecesarias.

3. **Filtrado y Búsqueda**: Los agentes aún pueden ver y filtrar contratos en la página de lista de contratos normalmente, pero no verán el total global del sistema.

4. **Paginación**: La paginación para agentes se basa en los contratos cargados en la página actual (`contracts.length`), no en el total del sistema. Esto puede causar que la paginación no funcione perfectamente si hay más contratos que los que se cargan, pero limita la visibilidad del total.

5. **Estadísticas de Estado**: Las tarjetas de "Pendientes", "Pagados" y "Completados" siguen mostrando números porque se calculan sobre los contratos cargados en la página actual, no sobre el total del sistema.

6. **Layout Responsive**: El grid del dashboard se ajusta automáticamente cuando se ocultan las secciones de contratos, permitiendo que el calendario ocupe todo el ancho disponible para agentes.

## Mejoras Futuras (Opcional)

Si se requiere una restricción más estricta, se podría:
- Implementar la restricción también en el backend, bloqueando o modificando el endpoint `/contracts` para agentes
- Retornar un error 403 o un valor genérico cuando un agente intente obtener el total
- Implementar un filtro automático en el backend para que los agentes solo vean sus propios contratos

## Relación con Otras Restricciones

Esta implementación sigue el mismo patrón que la restricción de visualización del total de contactos (ver `docs/CRM_AGENT_CONTACTS_COUNT_RESTRICTION.md`), manteniendo consistencia en el comportamiento de restricciones para agentes en el sistema CRM.

## Fecha de Implementación

Implementado: 2024-12-19

