# 🔐 Rutas de Permisos para Agentes - Gestión de Contratos

**Fecha**: 2025-01-28  
**Módulo**: Frontend - Sistema de Permisos  
**Versión**: 1.0.0

---

## 📋 Resumen

Este documento detalla las rutas que deben habilitarse en el sistema de permisos del admin (`/admin/route-permissions`) para que los agentes puedan gestionar contratos desde el frontend del CRM.

---

## ✅ Rutas Actualmente Habilitadas

### Rutas del CRM con Permisos para Agentes

Según `src/services/localDatabase.ts`, las siguientes rutas ya están habilitadas para agentes:

| Ruta | Descripción | Agente | Abogado |
|------|-------------|--------|---------|
| `/crm` | Dashboard principal del CRM | ✅ | ✅ |
| `/crm/contracts` | Lista de contratos | ✅ | ✅ |

---

## 🚨 Rutas que FALTAN Habilitar

### 1. Detalle de Contrato (CRÍTICO)

**Ruta**: `/admin/contracts/:code`  
**Descripción**: Ver detalles de un contrato específico  
**Estado Actual**: ❌ Solo Admin  
**Necesario para Agentes**: ✅ SÍ

**Razón**: 
- El componente `CRMContracts.tsx` navega a `/admin/contracts/${contract.hiring_code}` cuando un agente hace clic en "Ver Detalle" (líneas 291 y 344)
- Sin esta ruta habilitada, los agentes no pueden ver los detalles de los contratos que gestionan

**Acción Requerida**:
1. Ir a `/admin/route-permissions`
2. Buscar la ruta `/admin/contracts/:code`
3. Activar el checkbox de "Agente" ✅

---

## 📍 Rutas Adicionales Recomendadas

### 2. Solicitud de Código de Contratación (NUEVA)

**Ruta**: `/crm/opportunities/:id` (ya existe, pero verificar permisos)  
**Descripción**: Detalle de oportunidad donde se puede solicitar código de contratación  
**Estado Actual**: ✅ Ya habilitada  
**Verificación**: Confirmar que está activa para agentes

**Nota**: Esta ruta ya debería estar habilitada según la configuración por defecto, pero es importante verificar que el permiso esté activo.

---

## 🔍 Análisis de Navegación

### Flujo Actual de Agentes con Contratos

```
1. Agente accede a /crm/contracts ✅ (habilitado)
   ↓
2. Ve lista de contratos ✅ (funciona)
   ↓
3. Hace clic en "Ver Detalle" ❌ (navega a /admin/contracts/:code)
   ↓
4. Error: Sin permisos o redirección ❌ (PROBLEMA)
```

### Flujo Esperado

```
1. Agente accede a /crm/contracts ✅
   ↓
2. Ve lista de contratos ✅
   ↓
3. Hace clic en "Ver Detalle" ✅
   ↓
4. Ve detalles del contrato ✅ (REQUIERE PERMISO)
```

---

## 📝 Checklist de Rutas para Habilitar

### Rutas Críticas (REQUERIDAS)

- [ ] `/admin/contracts/:code` - **HABILITAR PARA AGENTES** ⚠️ CRÍTICO

### Rutas Opcionales (VERIFICAR)

- [ ] `/crm/opportunities/:id` - Verificar que esté habilitada para agentes
- [ ] `/crm/opportunities` - Verificar que esté habilitada para agentes

---

## 🛠️ Instrucciones para el Administrador

### Paso 1: Acceder a Gestión de Permisos

1. Iniciar sesión como administrador
2. Navegar a `/admin/route-permissions`
3. Buscar rutas relacionadas con contratos

### Paso 2: Habilitar Ruta de Detalle

1. Buscar la ruta `/admin/contracts/:code` en la tabla
2. Si no existe, agregarla manualmente:
   - **Ruta**: `/admin/contracts/:code`
   - **Módulo**: `Admin`
   - **Descripción**: `Detalle de contrato`
   - **Agente**: ✅ Activar
   - **Abogado**: ✅ Activar (opcional, pero recomendado)
   - **Admin**: ✅ Siempre activo

3. Guardar cambios

### Paso 3: Verificar Rutas del CRM

1. Buscar todas las rutas que empiecen con `/crm/`
2. Verificar que las siguientes estén habilitadas para agentes:
   - `/crm/contracts` ✅ (ya debería estar)
   - `/crm/opportunities` ✅ (ya debería estar)
   - `/crm/opportunities/:id` ✅ (ya debería estar)

---

## 🔄 Alternativa: Crear Ruta Específica del CRM

Si no se desea dar acceso a rutas del admin a los agentes, se puede crear una ruta específica del CRM:

### Opción A: Ruta del CRM para Detalle

**Nueva Ruta**: `/crm/contracts/:code`  
**Componente**: Crear `CRMContractDetail.tsx` (similar a `AdminContractDetail.tsx` pero adaptado para agentes)

**Ventajas**:
- Separación clara entre admin y CRM
- Control más granular de permisos
- Mejor organización

**Desventajas**:
- Requiere crear nuevo componente
- Duplicación de código potencial

### Opción B: Modificar Navegación Actual

Modificar `CRMContracts.tsx` para que navegue a `/crm/contracts/:code` en lugar de `/admin/contracts/:code`:

```typescript
// Cambiar línea 291 y 344 de CRMContracts.tsx
onClick={() => navigate(`/crm/contracts/${contract.hiring_code}`)}
```

Luego agregar la ruta en `App.tsx`:

```typescript
<Route path="contracts/:code" element={<LazyLoadWrapper fallback="spinner"><CRMContractDetail /></LazyLoadWrapper>} />
```

---

## 📊 Resumen de Rutas Necesarias

### Rutas que DEBEN estar habilitadas para agentes:

| Ruta | Módulo | Descripción | Estado | Prioridad |
|------|--------|-------------|--------|-----------|
| `/crm/contracts` | CRM | Lista de contratos | ✅ Habilitada | Alta |
| `/admin/contracts/:code` | Admin | Detalle de contrato | ❌ **FALTA** | **CRÍTICA** |
| `/crm/opportunities` | CRM | Lista de oportunidades | ✅ Habilitada | Alta |
| `/crm/opportunities/:id` | CRM | Detalle de oportunidad | ✅ Habilitada | Alta |

---

## 🎯 Recomendación Final

### Opción Recomendada: Habilitar `/admin/contracts/:code` para Agentes

**Razones**:
1. ✅ Solución más rápida (solo cambiar permiso)
2. ✅ No requiere desarrollo adicional
3. ✅ El componente `AdminContractDetail.tsx` ya existe y funciona
4. ✅ Los agentes solo verán contratos relacionados con sus oportunidades (filtrado por backend)

**Pasos**:
1. Ir a `/admin/route-permissions`
2. Buscar `/admin/contracts/:code`
3. Activar checkbox "Agente" ✅
4. Guardar

---

## 🔐 Consideraciones de Seguridad

### Filtrado en el Backend

Es importante que el backend filtre los contratos que los agentes pueden ver:

- Los agentes solo deben ver contratos relacionados con sus oportunidades asignadas
- El backend debe validar que el agente tenga acceso al contrato antes de mostrar detalles
- No mostrar información sensible de otros agentes

### Endpoints del Backend que Deben Validar Permisos

- `GET /api/admin/contracts/{code}` - Debe verificar que el agente tenga acceso
- `GET /api/admin/contracts/` - Debe filtrar por oportunidades del agente

---

## 📚 Referencias

- **Sistema de Permisos**: `docs/SISTEMA_PROTECCION_RUTAS_DINAMICO.md`
- **Componente CRM Contracts**: `src/pages/CRMContracts.tsx`
- **Componente Admin Contract Detail**: `src/pages/admin/AdminContractDetail.tsx`
- **Base de Datos de Permisos**: `src/services/localDatabase.ts`

---

## ✅ Checklist Final

- [ ] Verificar que `/crm/contracts` esté habilitada para agentes
- [ ] **HABILITAR `/admin/contracts/:code` para agentes** ⚠️ CRÍTICO
- [ ] Verificar que `/crm/opportunities` esté habilitada para agentes
- [ ] Verificar que `/crm/opportunities/:id` esté habilitada para agentes
- [ ] Probar flujo completo como agente:
  - [ ] Acceder a `/crm/contracts`
  - [ ] Ver lista de contratos
  - [ ] Hacer clic en "Ver Detalle"
  - [ ] Ver detalles del contrato sin errores
- [ ] Verificar que el backend filtre contratos por agente

---

**Última actualización**: 2025-01-28
