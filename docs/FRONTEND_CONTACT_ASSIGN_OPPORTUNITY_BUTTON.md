# Botón "Asignarme Oportunidad" en Ficha de Contacto

**Fecha**: 2025-01-29  
**Módulo**: Frontend - CRM Contact Detail  
**Prioridad**: 🟡 Media  
**Estado**: ✅ Implementado  

---

## 📋 Resumen Ejecutivo

Se ha implementado un botón "Asignarme Oportunidad" en la ficha de contacto que permite a los agentes asignarse automáticamente como responsables de una oportunidad de venta cuando no hay otro responsable asignado o cuando el responsable es diferente al agente actual.

---

## 🎯 Objetivo

Permitir que los agentes puedan asignarse rápidamente como responsables de oportunidades de venta directamente desde la ficha de contacto, sin necesidad de navegar a otras páginas o usar funcionalidades de asignación masiva.

---

## ✅ Funcionalidades Implementadas

### 1. Detección de Estado de Oportunidad

El sistema verifica automáticamente:
- Si existe una oportunidad relacionada con el contacto
- Si la oportunidad tiene un responsable asignado
- Si el responsable asignado es diferente al agente actual

### 2. Botón Condicional

El botón aparece en dos escenarios:

#### Escenario 1: Sin Responsable Asignado
- **Ubicación**: Sección de información del contacto (columna de información básica)
- **Estilo**: Botón primario (`variant="default"`) con ancho completo
- **Texto**: "Asignarme Oportunidad"
- **Condición**: `relatedOpportunities.length > 0 && !relatedOpportunities[0]?.assigned_to && user?.id`

#### Escenario 2: Responsable Diferente al Agente Actual
- **Ubicación**: Misma sección, junto al nombre del responsable actual
- **Estilo**: Botón outline (`variant="outline"`) alineado a la derecha
- **Texto**: "Asignarme"
- **Condición**: `relatedOpportunities.length > 0 && relatedOpportunities[0]?.assigned_to_id !== user.id`

### 3. Funcionalidad de Asignación

**Proceso:**
1. Verifica que exista usuario autenticado y oportunidad relacionada
2. Si la oportunidad ya tiene otro responsable, muestra confirmación antes de reasignar
3. Llama al endpoint `POST /api/crm/opportunities/{id}/assign` con el ID del agente actual
4. Obtiene la oportunidad actualizada completa usando `opportunityApi.get(id)` para asegurar que todos los datos expandidos estén disponibles
5. Actualiza directamente el estado `relatedOpportunities` con la oportunidad actualizada (evita recargar todos los datos y actualiza la UI inmediatamente)
6. Muestra mensajes de error si la asignación falla

**Validaciones:**
- Verifica que el usuario esté autenticado (`user?.id`)
- Verifica que exista una oportunidad relacionada
- Confirma reasignación si ya hay otro responsable

---

## 🔧 Implementación Técnica

### Archivos Modificados

#### `src/pages/CRMContactDetail.tsx`

**Cambios realizados:**

1. **Estado adicional:**
```typescript
const [assigningOpportunity, setAssigningOpportunity] = useState(false);
```

2. **Obtener usuario actual:**
```typescript
const { isAdmin, user } = useAuth();
```

3. **Función de asignación:**
```typescript
const handleAssignOpportunityToMe = async () => {
  // Verificaciones
  // Confirmación si hay otro responsable
  // Llamada a API para asignar
  // Obtener oportunidad actualizada completa
  // Actualizar estado directamente (evita recarga completa)
  // Manejo de errores
}
```

**Nota importante**: Después de asignar, se obtiene la oportunidad completa actualizada y se actualiza directamente el estado `relatedOpportunities`. Esto evita el problema de que `loadContactData()` tenga una protección que evita recargas muy frecuentes, asegurando que la UI se actualice inmediatamente.

4. **UI del botón:**
- Sección de información del contacto (líneas ~1013-1026)
- Renderizado condicional basado en estado de oportunidad y usuario

### Servicios Utilizados

- **`opportunityApi.assign(id, userId)`**: Asigna una oportunidad a un usuario
- **`opportunityApi.get(id)`**: Obtiene una oportunidad completa con todos los datos expandidos
- **`useAuth()`**: Hook para obtener usuario actual
- **`setRelatedOpportunities()`**: Actualiza directamente el estado de oportunidades relacionadas (más eficiente que recargar todos los datos)

---

## 📊 Flujo de Usuario

### Caso 1: Contacto sin Oportunidad Asignada

```
Usuario abre ficha de contacto
    ↓
Sistema detecta oportunidad sin responsable
    ↓
Muestra botón "Asignarme Oportunidad"
    ↓
Usuario hace clic
    ↓
Sistema asigna oportunidad al agente
    ↓
Recarga datos y muestra responsable actualizado
```

### Caso 2: Contacto con Oportunidad Asignada a Otro Agente

```
Usuario abre ficha de contacto
    ↓
Sistema detecta oportunidad con otro responsable
    ↓
Muestra nombre del responsable + botón "Asignarme"
    ↓
Usuario hace clic
    ↓
Sistema muestra confirmación de reasignación
    ↓
Usuario confirma
    ↓
Sistema reasigna oportunidad al agente actual
    ↓
Recarga datos y muestra nuevo responsable
```

---

## 🎨 Interfaz de Usuario

### Ubicación del Botón

El botón aparece en la sección de **Información de Contacto**, específicamente en la columna de información básica, después de los datos de contacto (email, teléfono, ubicación).

### Estados Visuales

1. **Sin Responsable:**
   - Mensaje: "Sin responsable asignado"
   - Botón primario: "Asignarme Oportunidad"
   - Ancho completo

2. **Con Responsable Diferente:**
   - Muestra nombre del responsable actual
   - Botón outline: "Asignarme"
   - Alineado a la derecha

3. **Durante Asignación:**
   - Botón deshabilitado
   - Texto: "Asignando..."
   - Icono de reloj animado

4. **Ya es Responsable:**
   - No muestra botón
   - Solo muestra nombre del responsable (que es el usuario actual)

---

## 🔒 Seguridad y Validaciones

### Validaciones Frontend

- ✅ Verifica autenticación del usuario
- ✅ Verifica existencia de oportunidad
- ✅ Confirma reasignación si hay otro responsable
- ✅ Maneja errores de API gracefully

### Validaciones Backend

El backend debe validar:
- ✅ Que el usuario tenga permisos para asignar oportunidades
- ✅ Que la oportunidad exista
- ✅ Que el usuario asignado tenga rol válido (agent o lawyer)

---

## 📝 Casos de Uso

### Caso de Uso 1: Agente Ve Contacto Nuevo
**Escenario**: Un agente encuentra un contacto con oportunidad sin asignar  
**Acción**: Hace clic en "Asignarme Oportunidad"  
**Resultado**: La oportunidad queda asignada al agente

### Caso de Uso 2: Agente Quiere Tomar Caso de Otro Agente
**Escenario**: Un agente ve un contacto con oportunidad asignada a otro agente  
**Acción**: Hace clic en "Asignarme" y confirma la reasignación  
**Resultado**: La oportunidad se reasigna al agente actual

### Caso de Uso 3: Agente Ya es Responsable
**Escenario**: Un agente ve un contacto donde ya es el responsable  
**Acción**: No ve el botón (no es necesario)  
**Resultado**: Solo ve su nombre como responsable

---

## 🐛 Manejo de Errores

### Errores Posibles

1. **Usuario no autenticado:**
   - No se muestra el botón
   - El sistema requiere autenticación

2. **Oportunidad no encontrada:**
   - Error en consola
   - Mensaje de error al usuario

3. **Error de permisos:**
   - El backend rechaza la asignación
   - Mensaje de error específico

4. **Error de red:**
   - Mensaje de error genérico
   - El botón se habilita nuevamente

---

## 🔄 Integración con Otros Módulos

### Relación con Oportunidades

- Utiliza el mismo sistema de asignación que la ficha de oportunidad
- Mantiene consistencia con el modal de asignación de oportunidad
- Respeta las mismas reglas de negocio

### Relación con Contactos

- Se muestra en la ficha de contacto
- Actualiza la información del contacto después de asignar
- Mantiene la relación contacto-oportunidad

---

## ✅ Checklist de Implementación

- [x] Obtener usuario actual desde useAuth
- [x] Agregar función para asignar oportunidad
- [x] Agregar botón condicionalmente
- [x] Manejar estados de carga
- [x] Manejar errores
- [x] Confirmar reasignación
- [x] Recargar datos después de asignar
- [x] Documentar funcionalidad

---

## 🎉 Conclusión

La funcionalidad permite a los agentes asignarse rápidamente como responsables de oportunidades directamente desde la ficha de contacto, mejorando la eficiencia del flujo de trabajo y reduciendo la necesidad de navegar entre páginas.

El botón aparece condicionalmente solo cuando es relevante (sin responsable o responsable diferente), manteniendo la interfaz limpia y enfocada.
