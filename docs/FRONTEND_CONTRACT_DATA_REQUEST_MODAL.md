# 📋 Frontend: Modal de Solicitud de Datos del Contrato

**Fecha**: 2025-01-28  
**Estado**: ✅ Implementado  
**Módulo**: Frontend - CRM Opportunities

---

## 🎯 Objetivo

Permitir que desde el detalle de una oportunidad, cuando hay una solicitud de contrato pendiente con datos faltantes, se muestre un modal que solicite los datos necesarios para completar el contrato:
- Nombre completo del cliente
- Número de pasaporte o NIE
- Dirección completa

Una vez completados, estos datos se envían al backend y la solicitud queda pendiente de aprobación por un administrador.

---

## 🏗️ Arquitectura

### Componentes Creados

1. **`ContractDataRequestModal`** (`src/components/opportunities/ContractDataRequestModal.tsx`)
   - Modal que muestra el formulario para completar los datos faltantes
   - Valida que los campos requeridos estén completos
   - Envía los datos al backend usando el servicio de contratos

2. **`useContractRequest`** (`src/hooks/useContractRequest.ts`)
   - Hook que detecta si hay una solicitud de contrato pendiente
   - Obtiene el hiring code desde las acciones del pipeline
   - Verifica si faltan datos en el contrato

### Integración

El modal se integra en la página de detalle de oportunidad (`CRMOpportunityDetail.tsx`):
- Se muestra una alerta cuando hay una solicitud de contrato pendiente con datos faltantes
- Al hacer clic en "Completar Datos del Contrato", se abre el modal
- El modal pre-llena los campos con datos existentes del contrato o del contacto

---

## 📡 Endpoints API Utilizados

### 1. Obtener Detalles del Contrato

```http
GET /api/hiring/{hiring_code}
```

**Uso**: Obtener los detalles del contrato para verificar qué datos faltan y pre-llenar el formulario.

### 2. Actualizar Datos del Contrato

```http
PATCH /api/admin/contracts/{hiring_code}
```

**Headers**:
```
X-Admin-Password: {admin_password}
```

**Body**:
```json
{
  "client_name": "Juan Pérez García",
  "client_passport": "X1234567Z",
  "client_nie": "",
  "client_address": "Calle Mayor 123, 2º B",
  "client_city": "Madrid",
  "client_province": "Madrid",
  "client_postal_code": "28001"
}
```

**Uso**: Actualizar los datos del contrato con la información proporcionada por el usuario.

---

## 🎨 Flujo de Usuario

### 1. Detección de Solicitud Pendiente

1. El usuario abre el detalle de una oportunidad
2. El hook `useContractRequest` verifica si hay un `hiring_code_id` en el pipeline stage
3. Busca el hiring code en las acciones del pipeline
4. Obtiene los detalles del contrato usando el hiring code
5. Verifica si faltan datos (nombre, pasaporte/NIE, dirección)

### 2. Mostrar Alerta

Si hay datos faltantes, se muestra una tarjeta de alerta en el detalle de la oportunidad:
- Indicador visual (borde amarillo)
- Lista de datos faltantes
- Botón "Completar Datos del Contrato"

### 3. Completar Formulario

1. El usuario hace clic en "Completar Datos del Contrato"
2. Se abre el modal con el formulario
3. El formulario se pre-llena con:
   - Datos existentes del contrato
   - Datos del contacto (si están disponibles)
4. El usuario completa los campos faltantes:
   - Nombre completo (obligatorio)
   - Pasaporte o NIE (al menos uno obligatorio)
   - Dirección completa (obligatorio)
   - Ciudad, Provincia, Código Postal (opcionales)

### 4. Envío y Aprobación

1. El usuario hace clic en "Enviar Solicitud"
2. Se validan los campos requeridos
3. Se envían los datos al backend
4. Se muestra un mensaje de éxito
5. El modal se cierra automáticamente después de 2 segundos
6. La solicitud queda pendiente de aprobación por un administrador

---

## 🔧 Implementación Técnica

### Validaciones

El modal valida:
- ✅ Nombre completo no vacío
- ✅ Al menos uno de: Pasaporte o NIE
- ✅ Dirección completa no vacía

### Pre-llenado de Datos

El formulario se pre-llena en este orden de prioridad:
1. Datos existentes del contrato (`hiringDetails`)
2. Datos del contacto (`contactName`, `contactEmail`)
3. Campos vacíos si no hay datos disponibles

### Manejo de Errores

- Si hay un error al cargar los detalles del contrato, se muestra un mensaje de error
- Si hay un error al actualizar los datos, se muestra un mensaje de error específico
- Los errores se muestran en un componente de alerta dentro del modal

---

## 📝 Campos del Formulario

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `client_name` | string | ✅ | Nombre completo del cliente |
| `client_passport` | string | ⚠️ | Número de pasaporte (al menos uno con NIE) |
| `client_nie` | string | ⚠️ | Número de NIE (al menos uno con pasaporte) |
| `client_address` | string | ✅ | Dirección completa |
| `client_city` | string | ❌ | Ciudad |
| `client_province` | string | ❌ | Provincia |
| `client_postal_code` | string | ❌ | Código postal |

---

## 🔄 Estados del Modal

### 1. Cargando Detalles
- Muestra un spinner mientras carga los detalles del contrato
- Deshabilita el formulario

### 2. Formulario Listo
- Muestra el formulario con los datos pre-llenados
- Permite editar los campos
- Valida en tiempo real

### 3. Enviando
- Muestra "Guardando..." en el botón
- Deshabilita todos los campos
- Muestra un spinner

### 4. Éxito
- Muestra un mensaje de éxito con un ícono de check
- Cierra automáticamente después de 2 segundos
- Recarga los datos de la oportunidad

### 5. Error
- Muestra un mensaje de error con detalles
- Permite reintentar el envío

---

## 🎯 Próximos Pasos

### Mejoras Futuras

1. **Endpoint Específico**: Crear un endpoint en el backend para obtener el hiring code desde el `hiring_code_id` del pipeline stage
2. **Validación en Tiempo Real**: Agregar validación de formato para pasaporte/NIE
3. **Autocompletado**: Integrar con servicios de geocodificación para autocompletar dirección
4. **Historial**: Mostrar historial de cambios en los datos del contrato
5. **Notificaciones**: Enviar notificación al administrador cuando se completen los datos

---

## 📚 Referencias

- **Componente Modal**: `src/components/opportunities/ContractDataRequestModal.tsx`
- **Hook**: `src/hooks/useContractRequest.ts`
- **Página de Detalle**: `src/pages/CRMOpportunityDetail.tsx`
- **Servicio de Contratos**: `src/services/contractsService.ts`
- **Servicio de Hiring**: `src/services/hiringService.ts`

---

**Última actualización**: 2025-01-28
