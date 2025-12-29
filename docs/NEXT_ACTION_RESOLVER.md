# Sistema de Siguiente Acción para Oportunidades

## 📋 Resumen

Se ha implementado un sistema que garantiza que **cada oportunidad siempre tenga una acción siguiente disponible**. El sistema determina automáticamente cuál es la siguiente acción más apropiada basándose en el estado actual de la oportunidad: llamadas, ventas, seguimientos, etc.

## 🎯 Objetivo

Garantizar que todas las oportunidades tengan una ruta clara hacia adelante, desde el primer contacto hasta la construcción de una relación de confianza o el descarte del caso.

## 🔄 Flujo de Acciones Siguientes

### 1. Primera Llamada (Prioridad Alta)

**Si la primera llamada no está completada:**
- **Acción**: Realizar Primera Llamada (Intento X/5)
- **Prioridad**: Alta
- **Requerida**: Sí
- **Razón**: La primera llamada es fundamental para iniciar la relación

**Si se agotaron los 5 intentos sin éxito:**
- **Acción**: Seguimiento Post-Llamadas Fallidas
- **Prioridad**: Alta
- **Requerida**: Sí
- **Razón**: Todos los intentos se agotaron, requiere seguimiento alternativo

### 2. Análisis de Pili (Si llamada fue exitosa)

**Si la primera llamada fue exitosa pero no hay análisis:**
- **Acción**: Solicitar Análisis de Pili
- **Prioridad**: Alta
- **Requerida**: Sí
- **Razón**: La primera llamada fue exitosa, ahora se requiere análisis

### 3. Elevación a Abogado

**Si estamos en etapa inicial y no se ha elevado:**
- **Acción**: Elevar Caso a Abogado
- **Prioridad**: Alta
- **Requerida**: Sí
- **Razón**: El caso requiere validación legal antes de continuar

**Si está pendiente de validación:**
- **Acción**: Esperar Validación del Abogado
- **Prioridad**: Alta
- **Requerida**: Sí

### 4. Validación Legal

**Si estamos en lawyer_validation:**
- **Acción**: Validar Análisis de Pili
- **Prioridad**: Alta
- **Requerida**: Sí

**Después de validar:**
- **Acción**: Aprobar o Rechazar Trámite
- **Prioridad**: Alta
- **Requerida**: Sí

### 5. Caso Rechazado

**Si el caso fue rechazado:**
- **Acción**: Seguimiento de Caso Rechazado
- **Prioridad**: Media
- **Requerida**: No
- **Razón**: Considera seguimiento alternativo o descarte

### 6. Generación de Contrato

**Si está en admin_contract:**
- **Acción**: Generar Contrato
- **Prioridad**: Alta
- **Requerida**: Sí
- **Razón**: El trámite fue aprobado, se requiere generar contrato

### 7. Firma y Pago

**Si está en client_signature:**
- **Acción**: Esperar Firma y Pago
- **Prioridad**: Alta
- **Requerida**: Sí

**Después de firma:**
- **Acción**: Crear Expediente
- **Prioridad**: Alta
- **Requerida**: Sí

### 8. Construcción de Relación

**Si el expediente está creado y no hay seguimiento reciente (30 días):**
- **Acción**: Seguimiento de Relación
- **Prioridad**: Media
- **Requerida**: No
- **Razón**: Importante mantener relación activa con el cliente

### 9. Oportunidades Perdidas/Expiradas

**Si la oportunidad está perdida o expirada:**
- **Acción**: Reactivar Oportunidad
- **Prioridad**: Baja
- **Requerida**: No
- **Razón**: Podría reactivarse

### 10. Seguimiento General (Fallback)

**Si no hay ninguna acción específica:**
- **Acción**: Seguimiento General
- **Prioridad**: Media
- **Requerida**: No
- **Razón**: Mantener contacto activo con el cliente

## 🔧 Implementación Técnica

### Archivos Creados

1. **`src/utils/nextActionResolver.ts`**
   - Función `getSuggestedNextAction()`: Determina la siguiente acción
   - Función `hasNextAction()`: Verifica si hay acción disponible
   - Función `getOpportunityStatusMessage()`: Mensaje de estado

2. **`src/components/opportunities/SuggestedNextAction.tsx`**
   - Componente visual para mostrar la siguiente acción sugerida
   - Muestra icono, nombre, descripción, prioridad y botón de acción

### Integración

**En `CRMOpportunityDetail.tsx`:**
- Se carga el componente `SuggestedNextAction` en el sidebar
- Se integra con `usePipelineActions` para obtener acciones completadas
- Se pasa el stage actual del pipeline
- Maneja clicks para redirigir a acciones específicas (llamadas, análisis, etc.)

### Estructura de Datos

```typescript
interface SuggestedNextAction {
  action_code: string;
  action_name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  required: boolean;
}
```

## 📊 Lógica de Decisión

La función `getSuggestedNextAction` evalúa las condiciones en orden de prioridad:

1. ✅ Estado de primera llamada
2. ✅ Análisis de Pili (si llamada exitosa)
3. ✅ Elevación a abogado
4. ✅ Validación legal
5. ✅ Caso rechazado
6. ✅ Generación de contrato
7. ✅ Firma y pago
8. ✅ Creación de expediente
9. ✅ Seguimiento de relación
10. ✅ Oportunidades perdidas/expiradas
11. ✅ Seguimiento general (fallback)

**Garantía**: Siempre retorna una acción (nunca `null`)

## 🎨 UI/UX

### Componente SuggestedNextAction

- **Card destacado**: Borde izquierdo de color primario
- **Badge de prioridad**: Colores según prioridad (rojo/amarillo/azul)
- **Icono de acción**: Diferente según tipo de acción
- **Descripción**: Explica qué hacer y por qué
- **Badge de requerido**: Si la acción es requerida, muestra advertencia
- **Botón de acción**: Permite ejecutar la acción sugerida

### Acciones del Botón

- **Realizar Llamada**: Redirige a `/crm/call-handler` con contact_id y opportunity_id
- **Solicitar Análisis**: Redirige a `/crm/opportunities/{id}/analyze`
- **Otras acciones**: Usa callback `onActionClick` con el código de acción

## ✅ Garantías del Sistema

1. **Siempre hay una acción siguiente**: El sistema nunca retorna `null`
2. **Acciones en orden de prioridad**: Las más importantes primero
3. **Contextual**: Las acciones dependen del estado actual
4. **Requeridas vs Opcionales**: Identifica acciones críticas
5. **Progresión lógica**: Sigue el flujo natural del proceso

## 🔄 Actualización Automática

La siguiente acción se actualiza automáticamente cuando:
- Cambia el estado de la oportunidad
- Se completan acciones del pipeline
- Cambia el stage del pipeline
- Se registran intentos de llamada

## 📝 Ejemplos de Uso

### Oportunidad nueva sin llamadas
```
Siguiente Acción: Realizar Primera Llamada (Intento 1/5)
Prioridad: Alta
Requerida: Sí
```

### Llamada exitosa, sin análisis
```
Siguiente Acción: Solicitar Análisis de Pili
Prioridad: Alta
Requerida: Sí
```

### Expediente creado, sin seguimiento reciente
```
Siguiente Acción: Seguimiento de Relación
Prioridad: Media
Requerida: No
```

## 🚀 Próximos Pasos

- [ ] Integrar acciones del botón con el sistema de pipeline
- [ ] Agregar tracking de acciones completadas
- [ ] Mejorar visualización de progreso
- [ ] Agregar notificaciones para acciones requeridas

---

**Última actualización**: 2025-01-16  
**Estado**: ✅ Implementado  
**Versión**: 1.0.0

