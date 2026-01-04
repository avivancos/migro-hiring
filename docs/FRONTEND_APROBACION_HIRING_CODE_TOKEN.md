# 🔐 Frontend: Aprobación de Hiring Code con Token Hash - Implementación

**Fecha**: 2025-01-28  
**Estado**: ✅ Implementado  
**Ruta**: `/admin/approve-hiring-code?token={token_hash}`

---

## 📋 Resumen Ejecutivo

Implementación completa de la ruta pública de aprobación de hiring code que permite a los administradores aprobar solicitudes de código de contratación desde un enlace en el email, usando un token hash seguro en la URL.

---

## 🎯 Características Implementadas

### ✅ Funcionalidades

- [x] Ruta pública `/admin/approve-hiring-code` (no requiere autenticación)
- [x] Extracción de token desde query params
- [x] Validación de token al cargar la página
- [x] Visualización de información de la solicitud
- [x] Botón de aprobación con confirmación
- [x] Manejo de estados (loading, error, success, review)
- [x] Diseño mobile-first responsive
- [x] Redirección automática después de aprobar
- [x] Manejo de errores (token inválido, expirado, usado)

---

## 📁 Archivos Creados/Modificados

### Archivos Nuevos

1. **`src/pages/admin/ApproveHiringCode.tsx`**
   - Componente principal de la página de aprobación
   - Maneja todos los estados y flujos de la aprobación

### Archivos Modificados

1. **`src/services/pipelineApi.ts`**
   - Agregados métodos:
     - `validateHiringCodeApprovalToken(token: string)`
     - `approveHiringCodeWithToken(token: string)`

2. **`src/App.tsx`**
   - Agregada ruta pública `/admin/approve-hiring-code`
   - Importación lazy del componente

3. **`src/config/pageTitles.ts`**
   - Agregado título para la ruta de aprobación

---

## 🔄 Flujo de Usuario

### 1. Admin Recibe Email

```
Email contiene:
- Información de la solicitud
- Botón "Aprobar Solicitud"
- Enlace: https://crm.migro.es/admin/approve-hiring-code?token={hash}
```

### 2. Admin Hace Clic en el Enlace

```
Frontend carga la página:
/admin/approve-hiring-code?token={hash}
```

### 3. Frontend Valida Token

```
GET /api/pipelines/admin/approve-hiring-code/validate?token={hash}
→ Muestra información de la solicitud
→ Si error: muestra mensaje y opción de volver
```

### 4. Admin Revisa y Aprueba

```
POST /api/pipelines/admin/approve-hiring-code?token={hash}
→ Marca solicitud como aprobada
→ Retorna confirmación con código
```

### 5. Frontend Muestra Confirmación

```
- Mensaje de éxito
- Código de contratación destacado
- Redirección automática a /admin/opportunities después de 5 segundos
```

---

## 🎨 Estados de la Página

### 1. Loading (Validando Token)

```tsx
- Spinner centrado
- Mensaje "Validando token..."
- Fondo gris claro
```

### 2. Error (Token Inválido/Expirado/Usado)

```tsx
- Icono de error (XCircle)
- Mensaje de error descriptivo
- Botones: "Volver al Dashboard" y "Reintentar"
```

### 3. Review (Revisión de Solicitud)

```tsx
- Información del token (email, expiración)
- Detalles del contrato (código, monto, tipo de pago)
- Botones: "Cancelar" y "Aprobar Solicitud"
```

### 4. Success (Aprobado Exitosamente)

```tsx
- Icono de éxito (CheckCircle)
- Mensaje de confirmación
- Código de contratación destacado
- Información de monto
- Redirección automática en 5 segundos
```

---

## 🔧 Implementación Técnica

### Servicio API

**Archivo**: `src/services/pipelineApi.ts`

```typescript
// Validar token
async validateHiringCodeApprovalToken(token: string): Promise<TokenValidationData>

// Aprobar solicitud
async approveHiringCodeWithToken(token: string): Promise<ApprovalResponse>
```

**Características**:
- Endpoints públicos (no requieren autenticación)
- No incluyen headers de autenticación
- Manejo de errores HTTP (404, 400)

### Componente Principal

**Archivo**: `src/pages/admin/ApproveHiringCode.tsx`

**Hooks utilizados**:
- `useSearchParams()` - Extraer token de URL
- `useNavigate()` - Navegación después de aprobar
- `usePageTitle()` - Actualizar título de página
- `useEffect()` - Validar token al cargar
- `useState()` - Manejar estados

**Estados del componente**:
- `loading`: Validando token inicial
- `validating`: Procesando aprobación
- `data`: Datos de validación del token
- `error`: Mensaje de error
- `approved`: Solicitud aprobada
- `approvalResult`: Resultado de la aprobación

### Rutas

**Archivo**: `src/App.tsx`

```tsx
<Route 
  path="/admin/approve-hiring-code" 
  element={<LazyLoadWrapper fallback="spinner"><ApproveHiringCode /></LazyLoadWrapper>} 
/>
```

**Características**:
- Ruta pública (fuera de `ProtectedRoute`)
- Lazy loading para optimización
- No requiere autenticación

---

## 🎨 Diseño y UX

### Mobile-First

- Layout responsive con breakpoints
- Botones full-width en mobile, flex en desktop
- Cards adaptativos
- Texto legible en todos los tamaños

### Componentes UI Utilizados

- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Button` (variantes: default, outline)
- `Badge` (para tipo de pago)
- `LoadingSpinner` (tamaños: sm, lg)
- Iconos de `lucide-react`

### Colores y Estilos

- **Éxito**: Verde (`green-600`, `green-50`)
- **Error**: Rojo (`red-600`, `red-50`)
- **Información**: Azul (`blue-600`, `blue-50`)
- **Fondo**: Gris claro (`gray-50`)

---

## 🔒 Seguridad

### Validaciones Frontend

1. **Token requerido**: Si no hay token, muestra error inmediatamente
2. **Validación antes de mostrar**: No muestra información si token inválido
3. **Mensajes de error seguros**: No revelan información sensible
4. **No almacenamiento**: Token solo en URL, no en localStorage

### Validaciones Backend

- Token existe en base de datos
- Token no expirado (7 días)
- Token no usado previamente
- Pipeline stage existe

---

## 📡 Endpoints API Utilizados

### 1. Validar Token

```http
GET /api/pipelines/admin/approve-hiring-code/validate?token={token_hash}
```

**Response (200 OK)**:
```json
{
  "valid": true,
  "token_id": "uuid",
  "pipeline_stage_id": "uuid",
  "hiring_payment": {
    "id": 123,
    "hiring_code": "ABC12",
    "amount": 40000,
    "currency": "EUR",
    "payment_type": "one_time"
  },
  "expires_at": "2025-02-04T12:00:00Z",
  "admin_email": "agustin@migro.es"
}
```

**Errores**:
- `404`: Token no encontrado
- `400`: Token ya usado o expirado

### 2. Aprobar Solicitud

```http
POST /api/pipelines/admin/approve-hiring-code?token={token_hash}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Solicitud aprobada exitosamente",
  "pipeline_stage_id": "uuid",
  "hiring_payment": {
    "id": 123,
    "hiring_code": "ABC12",
    "amount": 40000,
    "currency": "EUR"
  },
  "approved_at": "2025-01-28T12:00:00Z"
}
```

**Errores**:
- `404`: Token no encontrado
- `400`: Token ya usado o expirado

---

## 🧪 Testing

### Casos de Prueba

1. **Token válido**
   - ✅ Muestra información de solicitud
   - ✅ Permite aprobar
   - ✅ Muestra confirmación

2. **Token inválido**
   - ✅ Muestra error 404
   - ✅ Opción de volver al dashboard

3. **Token expirado**
   - ✅ Muestra error 400
   - ✅ Mensaje descriptivo

4. **Token ya usado**
   - ✅ Muestra error 400
   - ✅ Mensaje descriptivo

5. **Sin token en URL**
   - ✅ Muestra error inmediatamente
   - ✅ No hace llamada a API

6. **Error de red**
   - ✅ Muestra mensaje de error genérico
   - ✅ Opción de reintentar

### Pruebas Manuales

1. Abrir URL con token válido
2. Verificar que carga información correctamente
3. Aprobar solicitud
4. Verificar redirección
5. Intentar usar el mismo token dos veces (debe fallar)

---

## 📝 Notas de Implementación

### Decisiones de Diseño

1. **Ruta pública**: No requiere autenticación porque el token es la autenticación
2. **Lazy loading**: Optimización de bundle
3. **Redirección a oportunidades**: Lugar lógico después de aprobar
4. **Timeout de 5 segundos**: Tiempo suficiente para leer confirmación

### Mejoras Futuras

- [ ] Agregar historial de aprobaciones
- [ ] Notificación push cuando se aprueba
- [ ] Exportar información de aprobación
- [ ] Agregar comentarios al aprobar
- [ ] Soporte para múltiples aprobaciones simultáneas

---

## 🔗 Referencias

- **Backend Endpoint**: `app/api/endpoints/pipelines.py` - `approve_hiring_code_with_token`
- **Modelo**: `app/models/hiring_code_approval_token.py`
- **Config**: `app/core/config.py` - `FRONTEND_URL`
- **Documentación Backend**: `docs/FRONTEND_APROBACION_ADMIN_TOKEN.md`

---

## ✅ Checklist de Implementación

- [x] Crear componente `ApproveHiringCode.tsx`
- [x] Agregar métodos al servicio `pipelineApi.ts`
- [x] Agregar ruta pública en `App.tsx`
- [x] Agregar título en `pageTitles.ts`
- [x] Implementar validación de token
- [x] Implementar aprobación de solicitud
- [x] Manejar estados (loading, error, success)
- [x] Diseño mobile-first
- [x] Redirección después de aprobar
- [x] Documentación completa

---

**Última actualización**: 2025-01-28
