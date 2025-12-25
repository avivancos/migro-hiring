# Implementación Backend - Tipos de Llamadas

## 📋 Resumen

Este documento describe la implementación del sistema de gestión de tipos de llamadas en el backend. A diferencia de los campos personalizados, los tipos de llamadas son un componente **fundamental** del sistema CRM, ya que se utilizan en todas las operaciones de registro de llamadas.

---

## 🎯 Importancia del Sistema

Los tipos de llamadas son **esenciales** para la operación del CRM porque:

1. **Clasificación de llamadas**: Permiten categorizar todas las llamadas registradas
2. **Reportes y análisis**: Facilitan la generación de estadísticas por tipo de llamada
3. **Flujos de trabajo**: Diferentes tipos pueden tener diferentes flujos de seguimiento
4. **Configuración centralizada**: Los administradores pueden gestionar los tipos disponibles sin modificar código

---

## 📊 Modelo de Datos

### Tabla: `call_types`

```sql
CREATE TABLE call_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT call_types_code_format CHECK (code ~ '^[a-z0-9_]+$')
);

CREATE INDEX idx_call_types_active ON call_types(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_call_types_sort ON call_types(sort_order);
```

### Modelo SQLAlchemy (Python)

```python
from sqlalchemy import Column, String, Boolean, Integer, Text, TIMESTAMP, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class CallType(Base):
    __tablename__ = "call_types"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("code ~ '^[a-z0-9_]+$'", name="call_types_code_format"),
    )
```

### Schema Pydantic

```python
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from uuid import UUID

class CallTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    is_active: bool = True
    sort_order: int = Field(default=0, ge=0)

    @validator('code')
    def validate_code(cls, v):
        import re
        if not re.match(r'^[a-z0-9_]+$', v):
            raise ValueError('El código solo puede contener letras minúsculas, números y guiones bajos')
        return v

class CallTypeCreate(CallTypeBase):
    pass

class CallTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = Field(None, ge=0)

    @validator('code')
    def validate_code(cls, v):
        if v is not None:
            import re
            if not re.match(r'^[a-z0-9_]+$', v):
                raise ValueError('El código solo puede contener letras minúsculas, números y guiones bajos')
        return v

class CallTypeResponse(CallTypeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

---

## 🔌 Endpoints API

### Base Path: `/api/admin/call-types`

Todos los endpoints requieren autenticación y rol de administrador.

---

### 1. Listar Tipos de Llamadas

**Endpoint:** `GET /api/admin/call-types`

**Descripción:** Obtiene todos los tipos de llamadas configurados.

**Query Parameters:**
- `is_active` (opcional, boolean): Filtrar por estado activo/inactivo
- `sort_by` (opcional, string): Campo para ordenar (`sort_order`, `name`, `created_at`)
- `sort_order` (opcional, string): Orden (`asc`, `desc`)

**Respuesta:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Primera Llamada",
    "code": "primera_llamada",
    "description": "Primera llamada de contacto con el cliente",
    "is_active": true,
    "sort_order": 0,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "name": "Seguimiento",
    "code": "seguimiento",
    "description": "Llamada de seguimiento con el cliente",
    "is_active": true,
    "sort_order": 1,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "323e4567-e89b-12d3-a456-426614174002",
    "name": "Llamada de Venta",
    "code": "venta",
    "description": "Llamada enfocada en cerrar una venta",
    "is_active": true,
    "sort_order": 2,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
]
```

**Implementación:**
```python
@router.get("/call-types", response_model=List[CallTypeResponse])
async def get_call_types(
    is_active: Optional[bool] = None,
    sort_by: str = "sort_order",
    sort_order: str = "asc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    query = db.query(CallType)
    
    if is_active is not None:
        query = query.filter(CallType.is_active == is_active)
    
    # Ordenamiento
    if sort_by == "name":
        order_by = CallType.name.asc() if sort_order == "asc" else CallType.name.desc()
    elif sort_by == "created_at":
        order_by = CallType.created_at.asc() if sort_order == "asc" else CallType.created_at.desc()
    else:  # sort_order por defecto
        order_by = CallType.sort_order.asc() if sort_order == "asc" else CallType.sort_order.desc()
    
    query = query.order_by(order_by)
    
    call_types = query.all()
    return call_types
```

---

### 2. Crear Tipo de Llamada

**Endpoint:** `POST /api/admin/call-types`

**Descripción:** Crea un nuevo tipo de llamada.

**Body:**
```json
{
  "name": "Primera Llamada",
  "code": "primera_llamada",
  "description": "Primera llamada de contacto con el cliente",
  "is_active": true,
  "sort_order": 0
}
```

**Validaciones:**
- `name`: Requerido, 1-100 caracteres
- `code`: Requerido, 1-50 caracteres, único, formato: solo letras minúsculas, números y guiones bajos
- `description`: Opcional
- `is_active`: Opcional, default: `true`
- `sort_order`: Opcional, default: `0`, debe ser >= 0

**Respuesta:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Primera Llamada",
  "code": "primera_llamada",
  "description": "Primera llamada de contacto con el cliente",
  "is_active": true,
  "sort_order": 0,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Implementación:**
```python
@router.post("/call-types", response_model=CallTypeResponse, status_code=201)
async def create_call_type(
    call_type: CallTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    # Verificar que el código no exista
    existing = db.query(CallType).filter(CallType.code == call_type.code).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un tipo de llamada con el código '{call_type.code}'"
        )
    
    db_call_type = CallType(**call_type.dict())
    db.add(db_call_type)
    db.commit()
    db.refresh(db_call_type)
    
    return db_call_type
```

---

### 3. Actualizar Tipo de Llamada

**Endpoint:** `PATCH /api/admin/call-types/{call_type_id}`

**Descripción:** Actualiza un tipo de llamada existente.

**Path Parameters:**
- `call_type_id` (UUID): ID del tipo de llamada

**Body (todos los campos son opcionales):**
```json
{
  "name": "Primera Llamada Actualizada",
  "description": "Nueva descripción",
  "is_active": false,
  "sort_order": 5
}
```

**Validaciones:**
- Si se proporciona `code`, debe ser único y seguir el formato válido
- `sort_order` debe ser >= 0

**Respuesta:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Primera Llamada Actualizada",
  "code": "primera_llamada",
  "description": "Nueva descripción",
  "is_active": false,
  "sort_order": 5,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-16T10:30:00.000Z"
}
```

**Implementación:**
```python
@router.patch("/call-types/{call_type_id}", response_model=CallTypeResponse)
async def update_call_type(
    call_type_id: UUID,
    updates: CallTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_call_type = db.query(CallType).filter(CallType.id == call_type_id).first()
    if not db_call_type:
        raise HTTPException(status_code=404, detail="Tipo de llamada no encontrado")
    
    # Si se actualiza el código, verificar que no exista otro con el mismo código
    if updates.code and updates.code != db_call_type.code:
        existing = db.query(CallType).filter(
            CallType.code == updates.code,
            CallType.id != call_type_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un tipo de llamada con el código '{updates.code}'"
            )
    
    # Actualizar campos
    update_data = updates.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_call_type, field, value)
    
    db.commit()
    db.refresh(db_call_type)
    
    return db_call_type
```

---

### 4. Eliminar Tipo de Llamada

**Endpoint:** `DELETE /api/admin/call-types/{call_type_id}`

**Descripción:** Elimina un tipo de llamada.

**Path Parameters:**
- `call_type_id` (UUID): ID del tipo de llamada

**Validaciones:**
- No se puede eliminar si hay llamadas asociadas (opcional, según requerimientos)

**Respuesta:**
```json
{
  "message": "Tipo de llamada eliminado exitosamente"
}
```

**Implementación:**
```python
@router.delete("/call-types/{call_type_id}")
async def delete_call_type(
    call_type_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_call_type = db.query(CallType).filter(CallType.id == call_type_id).first()
    if not db_call_type:
        raise HTTPException(status_code=404, detail="Tipo de llamada no encontrado")
    
    # Opcional: Verificar si hay llamadas asociadas
    from app.models.crm import Call
    calls_count = db.query(Call).filter(Call.call_type == db_call_type.code).count()
    if calls_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar el tipo de llamada porque hay {calls_count} llamada(s) asociada(s). "
                   "Primero desactívalo en lugar de eliminarlo."
        )
    
    db.delete(db_call_type)
    db.commit()
    
    return {"message": "Tipo de llamada eliminado exitosamente"}
```

---

## 🔗 Integración con Modelo Call

### Actualizar Modelo Call

El modelo `Call` debe incluir una relación con `CallType`:

```python
# En app/models/crm.py

class Call(Base):
    __tablename__ = "calls"
    
    # ... campos existentes ...
    call_type = Column(String(50), ForeignKey("call_types.code"), nullable=True, index=True)
    
    # Relación opcional
    call_type_obj = relationship("CallType", foreign_keys=[call_type], primaryjoin="Call.call_type == CallType.code")
```

### Actualizar Schema Call

```python
# En app/schemas/crm.py

class CallCreateRequest(BaseModel):
    # ... campos existentes ...
    call_type: Optional[str] = None  # Código del tipo de llamada

class CallResponse(BaseModel):
    # ... campos existentes ...
    call_type: Optional[str] = None
    call_type_name: Optional[str] = None  # Nombre legible del tipo
    
    @validator('call_type_name', pre=True, always=True)
    def get_call_type_name(cls, v, values):
        # Se puede obtener del objeto relacionado si está disponible
        return v
```

### Validación en Endpoint de Crear Llamada

```python
@router.post("/calls", response_model=Call)
async def create_call(
    call: CallCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Si se proporciona call_type, validar que exista y esté activo
    if call.call_type:
        call_type = db.query(CallType).filter(
            CallType.code == call.call_type,
            CallType.is_active == True
        ).first()
        if not call_type:
            raise HTTPException(
                status_code=400,
                detail=f"El tipo de llamada '{call.call_type}' no existe o no está activo"
            )
    
    # ... resto de la lógica de creación ...
```

---

## 📝 Datos Iniciales (Seed)

Se recomienda crear tipos de llamadas por defecto al inicializar la base de datos:

```python
# En app/database/seed.py o similar

def seed_call_types(db: Session):
    default_call_types = [
        {
            "name": "Primera Llamada",
            "code": "primera_llamada",
            "description": "Primera llamada de contacto con el cliente",
            "is_active": True,
            "sort_order": 0
        },
        {
            "name": "Seguimiento",
            "code": "seguimiento",
            "description": "Llamada de seguimiento con el cliente",
            "is_active": True,
            "sort_order": 1
        },
        {
            "name": "Llamada de Venta",
            "code": "venta",
            "description": "Llamada enfocada en cerrar una venta",
            "is_active": True,
            "sort_order": 2
        }
    ]
    
    for call_type_data in default_call_types:
        existing = db.query(CallType).filter(CallType.code == call_type_data["code"]).first()
        if not existing:
            call_type = CallType(**call_type_data)
            db.add(call_type)
    
    db.commit()
```

---

## 🔄 Migración de Datos Existentes

Si ya existen llamadas en el sistema sin tipo, se puede crear una migración para asignar tipos por defecto:

```python
# Migración: asignar tipos por defecto a llamadas existentes
def migrate_existing_calls(db: Session):
    # Obtener llamadas sin tipo
    calls_without_type = db.query(Call).filter(Call.call_type.is_(None)).all()
    
    # Asignar "seguimiento" por defecto (o el tipo que corresponda)
    default_type = "seguimiento"
    for call in calls_without_type:
        call.call_type = default_type
    
    db.commit()
```

---

## 📊 Endpoint Público para Obtener Tipos Activos

Para que el frontend pueda cargar los tipos disponibles en los formularios:

**Endpoint:** `GET /api/crm/call-types`

**Descripción:** Obtiene solo los tipos de llamadas activos, ordenados por `sort_order`.

**Permisos:** Cualquier usuario autenticado del CRM

**Respuesta:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Primera Llamada",
    "code": "primera_llamada",
    "description": "Primera llamada de contacto con el cliente"
  },
  {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "name": "Seguimiento",
    "code": "seguimiento",
    "description": "Llamada de seguimiento con el cliente"
  }
]
```

**Implementación:**
```python
@router.get("/crm/call-types", response_model=List[CallTypeResponse])
async def get_active_call_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_crm_user)
):
    call_types = db.query(CallType).filter(
        CallType.is_active == True
    ).order_by(CallType.sort_order.asc()).all()
    
    return call_types
```

---

## ✅ Checklist de Implementación

- [ ] Crear tabla `call_types` en la base de datos
- [ ] Crear modelo SQLAlchemy `CallType`
- [ ] Crear schemas Pydantic (`CallTypeBase`, `CallTypeCreate`, `CallTypeUpdate`, `CallTypeResponse`)
- [ ] Implementar endpoint `GET /api/admin/call-types`
- [ ] Implementar endpoint `POST /api/admin/call-types`
- [ ] Implementar endpoint `PATCH /api/admin/call-types/{id}`
- [ ] Implementar endpoint `DELETE /api/admin/call-types/{id}`
- [ ] Implementar endpoint público `GET /api/crm/call-types`
- [ ] Actualizar modelo `Call` para incluir `call_type`
- [ ] Actualizar schema `CallCreateRequest` para incluir `call_type`
- [ ] Agregar validación de `call_type` en endpoint de crear llamada
- [ ] Crear seed de datos iniciales
- [ ] Crear migración para datos existentes (si aplica)
- [ ] Agregar índices para optimización
- [ ] Agregar tests unitarios
- [ ] Agregar tests de integración

---

## 🎯 Notas Importantes

1. **No es un campo personalizado**: Los tipos de llamadas son parte del modelo core del sistema, no un campo personalizado opcional.

2. **Validación estricta**: El código debe seguir un formato específico (solo letras minúsculas, números y guiones bajos) para mantener consistencia.

3. **Integridad referencial**: Considerar si se debe permitir eliminar tipos de llamadas que tienen llamadas asociadas, o solo desactivarlos.

4. **Performance**: Los tipos de llamadas se cargan frecuentemente en formularios, considerar cache si es necesario.

5. **Ordenamiento**: El campo `sort_order` permite controlar el orden de visualización en los selects del frontend.











