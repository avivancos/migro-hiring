# Backend: Implementación de Anexos al Contrato

**Fecha**: 2025-01-30  
**Prioridad**: 🔴 Alta  
**Estado**: ✅ Backend Implementado - ✅ Frontend Integrado  
**Módulo**: Backend - Hiring Codes / Contratos

**NOTA IMPORTANTE**: ✅ Todos los endpoints admin están implementados y funcionando. El frontend está integrado y listo para usar los endpoints.

---

## 📋 Resumen

Este documento describe la implementación completa del sistema de anexos al contrato. Los anexos son documentos adicionales que pueden ser digitados manualmente por el administrador y se asocian a un código de contratación (hiring code).

**Documentación relacionada**: Ver `docs/BACKEND_ANEXOS_CONTRATO.md` para detalles técnicos completos.

---

## 🎯 Endpoints de API

### Endpoints Admin (requieren `X-Admin-Password: Pomelo2005.1`)

#### 1. GET `/api/admin/hiring/{hiring_code}/annexes`
Listar todos los anexos de un código de contratación.

**Response**:
```json
[
  {
    "id": 1,
    "hiring_code": "ABC123",
    "title": "Anexo I - Condiciones Especiales",
    "content": "Contenido del anexo...",
    "created_at": "2025-01-30T10:00:00Z",
    "updated_at": "2025-01-30T10:00:00Z",
    "created_by": null
  }
]
```

#### 2. POST `/api/admin/hiring/{hiring_code}/annexes`
Crear un nuevo anexo.

**Request Body**:
```json
{
  "title": "Anexo I - Condiciones Especiales",
  "content": "Contenido completo del anexo que puede ser digitado manualmente..."
}
```

**Response**: `ContractAnnexResponse` (ver schemas abajo)

#### 3. PATCH `/api/admin/hiring/annexes/{annex_id}`
Actualizar un anexo existente.

**Request Body**:
```json
{
  "title": "Anexo I - Condiciones Especiales (Actualizado)",
  "content": "Contenido actualizado del anexo..."
}
```

**Nota**: Ambos campos son opcionales, pero al menos uno debe estar presente.

**Response**: `ContractAnnexResponse`

#### 4. DELETE `/api/admin/hiring/annexes/{annex_id}`
Eliminar un anexo.

**Response**: `204 No Content`

---

## 📦 Schemas

### ContractAnnexResponse
```typescript
interface ContractAnnexResponse {
  id: number;
  hiring_code: string;
  title: string;
  content: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  created_by: string | null;
}
```

### ContractAnnexCreate
```typescript
interface ContractAnnexCreate {
  title: string; // min 1, max 255 caracteres
  content: string; // min 1 carácter
}
```

### ContractAnnexUpdate
```typescript
interface ContractAnnexUpdate {
  title?: string; // min 1, max 255 caracteres
  content?: string; // min 1 carácter
}
```

---

## 🔐 Autenticación

Todos los endpoints admin requieren el header:
```
X-Admin-Password: Pomelo2005.1
```

---

## ✅ Estado de Implementación

### Backend ✅ COMPLETADO
- [x] Modelo de base de datos `contract_annexes`
- [x] Modelo SQLAlchemy `ContractAnnex`
- [x] Schemas Pydantic
- [x] Endpoints admin implementados
- [x] Validaciones de entrada
- [x] Logging

### Frontend ✅ COMPLETADO
- [x] Tipos TypeScript
- [x] Servicios API
- [x] Componente `ContractAnnexes.tsx`
- [x] Integración en `AdminContractDetail.tsx`

---

## 📚 Documentación Completa

Para detalles técnicos completos, esquemas de base de datos, ejemplos de código y casos de prueba, consulta:

**`docs/BACKEND_ANEXOS_CONTRATO.md`**

---

**Última actualización**: 2025-01-30
