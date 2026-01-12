# Backend: Gestión de Anexos al Contrato

**Fecha**: 2025-01-30  
**Prioridad**: 🔴 Alta  
**Estado**: ✅ Backend Implementado - ✅ Frontend Integrado  
**Módulo**: Backend - Hiring Codes / Contratos

**NOTA IMPORTANTE**: ✅ Todos los endpoints admin están implementados y funcionando. El frontend está integrado y listo para usar los endpoints.

---

## 📋 Resumen

Implementar funcionalidad para gestionar anexos al contrato desde el CRM admin. Los anexos son documentos adicionales que pueden ser digitados manualmente por el administrador y se asocian a un código de contratación (hiring code).

---

## 🎯 Objetivo

Permitir que los administradores puedan crear, editar, listar y eliminar anexos al contrato desde el CRM admin. Los anexos contienen información adicional que complementa el contrato principal.

---

## ✅ Requerimientos

### 1. Modelo de Datos

Crear una nueva tabla `contract_annexes` en la base de datos:

```sql
CREATE TABLE contract_annexes (
    id SERIAL PRIMARY KEY,
    hiring_code VARCHAR(10) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255), -- ID del usuario que creó el anexo (opcional)
    
    -- Índices
    CONSTRAINT fk_hiring_code FOREIGN KEY (hiring_code) REFERENCES hirings(hiring_code) ON DELETE CASCADE,
    INDEX idx_hiring_code (hiring_code),
    INDEX idx_created_at (created_at)
);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_contract_annexes_updated_at 
    BEFORE UPDATE ON contract_annexes
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Modelo SQLAlchemy

**Archivo sugerido**: `app/models/hiring.py` (o crear `app/models/contract_annex.py`)

```python
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class ContractAnnex(Base):
    __tablename__ = "contract_annexes"
    
    id = Column(Integer, primary_key=True, index=True)
    hiring_code = Column(String(10), ForeignKey("hirings.hiring_code", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(String(255), nullable=True)
    
    # Relación opcional con Hiring
    hiring = relationship("Hiring", back_populates="annexes")
```

Si agregas la relación en el modelo `Hiring`:

```python
# En app/models/hiring.py
annexes = relationship("ContractAnnex", back_populates="hiring", cascade="all, delete-orphan")
```

### 3. Esquemas Pydantic

**Archivo sugerido**: `app/schemas/hiring.py` (o crear `app/schemas/contract_annex.py`)

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ContractAnnexBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Título del anexo")
    content: str = Field(..., min_length=1, description="Contenido del anexo")

class ContractAnnexCreate(ContractAnnexBase):
    hiring_code: str = Field(..., min_length=1, max_length=10, description="Código de contratación")

class ContractAnnexUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)

class ContractAnnexResponse(ContractAnnexBase):
    id: int
    hiring_code: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True
```

### 4. Endpoints de API

**Archivo sugerido**: `app/api/endpoints/admin_hiring.py` (o crear `app/api/endpoints/contract_annexes.py`)

#### 4.1. GET `/hiring/{hiring_code}/annexes` (ENDPOINT PÚBLICO - PRIORITARIO)

**IMPORTANTE**: Este endpoint debe ser público (sin autenticación) para que los clientes puedan ver los anexos en el flujo de contratación.

Listar todos los anexos de un código de contratación.

**Autenticación**: ❌ NO requiere autenticación (endpoint público)

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

**Implementación**:
```python
@router.get("/hiring/{hiring_code}/annexes", response_model=List[schemas.ContractAnnexResponse])
async def get_annexes_public(
    hiring_code: str,
    db: Session = Depends(get_db)
):
    """Obtener todos los anexos de un código de contratación (endpoint público)"""
    # Verificar que el hiring code existe
    hiring = db.query(models.Hiring).filter(models.Hiring.hiring_code == hiring_code).first()
    if not hiring:
        raise HTTPException(status_code=404, detail="Código de contratación no encontrado")
    
    # Obtener anexos
    annexes = db.query(models.ContractAnnex).filter(
        models.ContractAnnex.hiring_code == hiring_code
    ).order_by(models.ContractAnnex.created_at.asc()).all()
    
    return annexes
```

**Alternativa recomendada**: Incluir los anexos directamente en la respuesta de `GET /hiring/{hiring_code}` para evitar una llamada adicional.

---

#### 4.2. GET `/admin/hiring/{hiring_code}/annexes` (ENDPOINT ADMIN)

Listar todos los anexos de un código de contratación.

**Autenticación**: Requiere header `X-Admin-Password: Pomelo2005.1`

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

**Implementación**:
```python
@router.get("/admin/hiring/{hiring_code}/annexes", response_model=List[schemas.ContractAnnexResponse])
async def get_annexes(
    hiring_code: str,
    db: Session = Depends(get_db),
    admin_token: str = Depends(verify_admin_token)
):
    """Obtener todos los anexos de un código de contratación"""
    # Verificar que el hiring code existe
    hiring = db.query(models.Hiring).filter(models.Hiring.hiring_code == hiring_code).first()
    if not hiring:
        raise HTTPException(status_code=404, detail="Código de contratación no encontrado")
    
    # Obtener anexos
    annexes = db.query(models.ContractAnnex).filter(
        models.ContractAnnex.hiring_code == hiring_code
    ).order_by(models.ContractAnnex.created_at.desc()).all()
    
    return annexes
```

#### 4.3. POST `/admin/hiring/{hiring_code}/annexes`

Crear un nuevo anexo.

**Autenticación**: Requiere header `X-Admin-Password: Pomelo2005.1`

**Request Body**:
```json
{
  "title": "Anexo I - Condiciones Especiales",
  "content": "Contenido completo del anexo que puede ser digitado manualmente..."
}
```

**Response**:
```json
{
  "id": 1,
  "hiring_code": "ABC123",
  "title": "Anexo I - Condiciones Especiales",
  "content": "Contenido completo del anexo...",
  "created_at": "2025-01-30T10:00:00Z",
  "updated_at": "2025-01-30T10:00:00Z",
  "created_by": null
}
```

**Implementación**:
```python
@router.post("/admin/hiring/{hiring_code}/annexes", response_model=schemas.ContractAnnexResponse, status_code=status.HTTP_201_CREATED)
async def create_annex(
    hiring_code: str,
    annex_data: schemas.ContractAnnexCreate,
    db: Session = Depends(get_db),
    admin_token: str = Depends(verify_admin_token)
):
    """Crear un nuevo anexo para un código de contratación"""
    # Verificar que el hiring code existe
    hiring = db.query(models.Hiring).filter(models.Hiring.hiring_code == hiring_code).first()
    if not hiring:
        raise HTTPException(status_code=404, detail="Código de contratación no encontrado")
    
    # Validar que el hiring_code del body coincida con el de la URL
    if annex_data.hiring_code != hiring_code:
        raise HTTPException(status_code=400, detail="El código de contratación no coincide")
    
    # Crear anexo
    new_annex = models.ContractAnnex(
        hiring_code=hiring_code,
        title=annex_data.title,
        content=annex_data.content,
        created_by=admin_token  # O el ID del usuario si está disponible
    )
    
    db.add(new_annex)
    db.commit()
    db.refresh(new_annex)
    
    logger.info(f"Anexo creado: ID {new_annex.id} para hiring_code {hiring_code}")
    
    return new_annex
```

#### 4.4. PATCH `/admin/hiring/annexes/{annex_id}`

Actualizar un anexo existente.

**Autenticación**: Requiere header `X-Admin-Password: Pomelo2005.1`

**Request Body**:
```json
{
  "title": "Anexo I - Condiciones Especiales (Actualizado)",
  "content": "Contenido actualizado del anexo..."
}
```

**Nota**: Ambos campos son opcionales, pero al menos uno debe estar presente.

**Response**:
```json
{
  "id": 1,
  "hiring_code": "ABC123",
  "title": "Anexo I - Condiciones Especiales (Actualizado)",
  "content": "Contenido actualizado del anexo...",
  "created_at": "2025-01-30T10:00:00Z",
  "updated_at": "2025-01-30T10:05:00Z",
  "created_by": null
}
```

**Implementación**:
```python
@router.patch("/admin/hiring/annexes/{annex_id}", response_model=schemas.ContractAnnexResponse)
async def update_annex(
    annex_id: int,
    annex_data: schemas.ContractAnnexUpdate,
    db: Session = Depends(get_db),
    admin_token: str = Depends(verify_admin_token)
):
    """Actualizar un anexo existente"""
    # Obtener anexo
    annex = db.query(models.ContractAnnex).filter(models.ContractAnnex.id == annex_id).first()
    if not annex:
        raise HTTPException(status_code=404, detail="Anexo no encontrado")
    
    # Validar que al menos un campo esté presente
    update_data = annex_data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Al menos un campo debe ser proporcionado")
    
    # Actualizar campos
    if "title" in update_data:
        annex.title = update_data["title"]
    if "content" in update_data:
        annex.content = update_data["content"]
    
    db.commit()
    db.refresh(annex)
    
    logger.info(f"Anexo actualizado: ID {annex_id}")
    
    return annex
```

#### 4.5. DELETE `/admin/hiring/annexes/{annex_id}`

Eliminar un anexo.

**Autenticación**: Requiere header `X-Admin-Password: Pomelo2005.1`

**Response**: `204 No Content`

**Implementación**:
```python
@router.delete("/admin/hiring/annexes/{annex_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_annex(
    annex_id: int,
    db: Session = Depends(get_db),
    admin_token: str = Depends(verify_admin_token)
):
    """Eliminar un anexo"""
    # Obtener anexo
    annex = db.query(models.ContractAnnex).filter(models.ContractAnnex.id == annex_id).first()
    if not annex:
        raise HTTPException(status_code=404, detail="Anexo no encontrado")
    
    db.delete(annex)
    db.commit()
    
    logger.info(f"Anexo eliminado: ID {annex_id}")
    
    return None
```

---

## 🔍 Validaciones

### Validaciones de Entrada

1. **Título del anexo**:
   - Requerido
   - Mínimo 1 carácter, máximo 255 caracteres
   - No puede estar vacío

2. **Contenido del anexo**:
   - Requerido
   - Mínimo 1 carácter
   - No puede estar vacío

3. **Hiring Code**:
   - Debe existir en la tabla `hirings`
   - Debe coincidir entre URL y body (si aplica)

### Validaciones de Negocio

1. Al actualizar un anexo, al menos uno de los campos (`title` o `content`) debe estar presente
2. Al eliminar un anexo, debe existir previamente
3. Los anexos se eliminan en cascada si se elimina el hiring code (según la foreign key)

---

## 🧪 Testing

### Casos de Prueba

1. **Crear anexo exitosamente**:
   ```bash
   curl -X POST "https://api.migro.es/api/admin/hiring/ABC123/annexes" \
     -H "X-Admin-Password: Pomelo2005.1" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Anexo I - Condiciones Especiales",
       "content": "Contenido del anexo..."
     }'
   ```

3. **Listar anexos de un hiring code (admin)**:
   ```bash
   curl -X GET "https://api.migro.es/api/admin/hiring/ABC123/annexes" \
     -H "X-Admin-Password: Pomelo2005.1"
   ```

4. **Actualizar anexo**:
   ```bash
   curl -X PATCH "https://api.migro.es/api/admin/hiring/annexes/1" \
     -H "X-Admin-Password: Pomelo2005.1" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Anexo I - Condiciones Especiales (Actualizado)",
       "content": "Contenido actualizado..."
     }'
   ```

5. **Eliminar anexo**:
   ```bash
   curl -X DELETE "https://api.migro.es/api/admin/hiring/annexes/1" \
     -H "X-Admin-Password: Pomelo2005.1"
   ```

6. **Error: Hiring code no existe**:
   ```bash
   curl -X POST "https://api.migro.es/api/admin/hiring/INVALID/annexes" \
     -H "X-Admin-Password: Pomelo2005.1" \
     -H "Content-Type: application/json" \
     -d '{"title": "Test", "content": "Test"}'
   ```
   **Esperado**: `404 Not Found`

7. **Error: Campos vacíos**:
   ```bash
   curl -X POST "https://api.migro.es/api/admin/hiring/ABC123/annexes" \
     -H "X-Admin-Password: Pomelo2005.1" \
     -H "Content-Type: application/json" \
     -d '{"title": "", "content": ""}'
   ```
   **Esperado**: `422 Validation Error`

---

## 📝 Notas Técnicas

### Autenticación

Todos los endpoints requieren el header `X-Admin-Password: Pomelo2005.1` para autenticación. Esto debe ser verificado usando la función `verify_admin_token` existente.

### Orden de Resultados

Al listar anexos, se deben ordenar por `created_at` descendente (más recientes primero).

### Eliminación en Cascada

Si se elimina un hiring code, todos sus anexos se eliminan automáticamente gracias a la foreign key con `ON DELETE CASCADE`.

### Logging

Se recomienda agregar logging para:
- Creación de anexos
- Actualización de anexos
- Eliminación de anexos
- Errores de validación

---

## 🔗 Referencias

- [BACKEND_ENDPOINT_ADMIN_CREATE.md](../BACKEND_ENDPOINT_ADMIN_CREATE.md) - Endpoint de creación de hiring codes
- [BACKEND_CRM_INTEGRATION.md](../BACKEND_CRM_INTEGRATION.md) - Integración con CRM
- [docs/FRONTEND_EDITAR_CONTRATOS_IMPLEMENTACION.md](../docs/FRONTEND_EDITAR_CONTRATOS_IMPLEMENTACION.md) - Implementación frontend de contratos

---

## ✅ Checklist de Implementación

### Backend ✅ COMPLETADO
- [x] Crear migración de base de datos para tabla `contract_annexes`
- [x] Crear modelo SQLAlchemy `ContractAnnex`
- [x] Crear esquemas Pydantic para anexos
- [x] Implementar endpoint admin GET `/admin/hiring/{hiring_code}/annexes`
- [x] Implementar endpoint POST `/admin/hiring/{hiring_code}/annexes`
- [x] Implementar endpoint PATCH `/admin/hiring/annexes/{annex_id}`
- [x] Implementar endpoint DELETE `/admin/hiring/annexes/{annex_id}`
- [x] Agregar validaciones de entrada
- [x] Agregar logging
- [x] Documentar cambios en el código

### Frontend ✅ COMPLETADO
- [x] Tipos TypeScript para anexos
- [x] Servicios para CRUD de anexos
- [x] Componente de gestión de anexos en admin
- [x] Integración en generador de PDF
- [x] Integración en flujo público de contratación

### Pendiente (Opcional - Mejora)
- [ ] **Opcional**: Implementar endpoint público GET `/hiring/{hiring_code}/annexes` (sin autenticación)
- [ ] **Opcional**: Incluir anexos en la respuesta de `GET /hiring/{hiring_code}` (alternativa al endpoint público)
- [ ] Escribir tests unitarios
- [ ] Escribir tests de integración

---

**Prioridad**: Alta  
**Estimación**: 3-4 horas  
**Dependencias**: Modelo Hiring existente, sistema de autenticación admin
