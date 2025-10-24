# 🔧 Backend: Endpoint Admin para Crear Códigos de Contratación

## 🎯 Endpoint Requerido

### **POST `/admin/hiring/create`**

Este endpoint permite a los administradores crear nuevos códigos de contratación.

---

## 📋 Parámetros del Request

### **JSON Body**

```json
{
  "user_name": "Juan Pérez",
  "user_email": "juan@ejemplo.com",
  "user_passport": "X1234567Z",
  "user_nie": "X1234567Z",
  "user_address": "Calle Mayor 123",
  "user_city": "Madrid",
  "grade": "A",
  "service_name": "Visado de Estudiante",
  "notes": "Cliente prioritario"
}
```

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `user_name` | String | Nombre completo del cliente | ✅ |
| `user_email` | String | Email del cliente | ✅ |
| `user_passport` | String | Número de pasaporte | ⚠️ |
| `user_nie` | String | Número de NIE | ⚠️ |
| `user_address` | String | Dirección del cliente | ✅ |
| `user_city` | String | Ciudad del cliente | ✅ |
| `grade` | String | Grado (A, B, o C) | ✅ |
| `service_name` | String | Nombre del servicio | ✅ |
| `notes` | String | Notas adicionales | ❌ |

**Nota:** Se requiere al menos uno de `user_passport` o `user_nie`.

---

## 🔧 Implementación Backend

### **1. Endpoint Principal**

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
import secrets
import string
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class CreateHiringRequest(BaseModel):
    user_name: str = Field(..., min_length=2, max_length=100)
    user_email: str = Field(..., regex=r'^[^@]+@[^@]+\.[^@]+$')
    user_passport: Optional[str] = Field(None, max_length=20)
    user_nie: Optional[str] = Field(None, max_length=20)
    user_address: str = Field(..., min_length=5, max_length=200)
    user_city: str = Field(..., min_length=2, max_length=50)
    grade: str = Field(..., regex=r'^[ABC]$')
    service_name: str = Field(..., min_length=5, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)

class HiringCodeResponse(BaseModel):
    hiring_code: str
    user_name: str
    user_email: str
    grade: str
    amount: int
    currency: str
    expires_at: str
    created_at: str
    status: str

def generate_hiring_code() -> str:
    """Generar código único de contratación"""
    # Generar código de 6 caracteres alfanuméricos
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(6))

def get_amount_for_grade(grade: str) -> int:
    """Obtener monto según el grado"""
    grade_pricing = {
        'A': 40000,  # 400€ en centavos
        'B': 40000,  # 400€ en centavos
        'C': 60000,  # 600€ en centavos
    }
    return grade_pricing.get(grade, 40000)

@app.post("/admin/hiring/create", response_model=HiringCodeResponse)
async def create_hiring_code(
    request: CreateHiringRequest,
    admin_token: str = Depends(verify_admin_token)
):
    """Crear nuevo código de contratación"""
    
    try:
        # Validar que al menos uno de passport o NIE esté presente
        if not request.user_passport and not request.user_nie:
            raise HTTPException(
                status_code=400, 
                detail="Se requiere al menos un documento (pasaporte o NIE)"
            )
        
        # Generar código único
        hiring_code = generate_hiring_code()
        
        # Verificar que el código no exista
        existing_hiring = await db.query(Hiring).filter(
            Hiring.hiring_code == hiring_code
        ).first()
        
        if existing_hiring:
            # Si existe, generar uno nuevo
            hiring_code = generate_hiring_code()
        
        # Calcular monto según grado
        amount = get_amount_for_grade(request.grade)
        
        # Fecha de expiración (30 días desde hoy)
        expires_at = datetime.utcnow() + timedelta(days=30)
        
        # Crear registro en base de datos
        new_hiring = Hiring(
            hiring_code=hiring_code,
            user_name=request.user_name,
            user_email=request.user_email,
            user_passport=request.user_passport,
            user_nie=request.user_nie,
            user_address=request.user_address,
            user_city=request.user_city,
            grade=request.grade,
            service_name=request.service_name,
            amount=amount,
            currency='eur',
            status='pending',
            expires_at=expires_at,
            notes=request.notes,
            created_at=datetime.utcnow()
        )
        
        db.add(new_hiring)
        await db.commit()
        await db.refresh(new_hiring)
        
        logger.info(f"Código de contratación creado: {hiring_code} para {request.user_name}")
        
        return HiringCodeResponse(
            hiring_code=hiring_code,
            user_name=request.user_name,
            user_email=request.user_email,
            grade=request.grade,
            amount=amount,
            currency='eur',
            expires_at=expires_at.isoformat(),
            created_at=new_hiring.created_at.isoformat(),
            status='pending'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando código de contratación: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
```

### **2. Middleware de Autenticación Admin**

```python
from fastapi import HTTPException, Depends, Header
import jwt
import os
from datetime import datetime

async def verify_admin_token(x_admin_token: str = Header(None)):
    """Verificar token de administrador"""
    
    if not x_admin_token:
        raise HTTPException(status_code=401, detail="Token de admin requerido")
    
    try:
        # Decodificar token (en producción, usar JWT real)
        decoded = jwt.decode(x_admin_token, os.getenv('ADMIN_SECRET_KEY', 'secret'), algorithms=['HS256'])
        
        # Verificar que el token no haya expirado
        if datetime.utcnow().timestamp() > decoded.get('exp', 0):
            raise HTTPException(status_code=401, detail="Token expirado")
        
        return decoded
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
```

### **3. Modelo de Base de Datos**

```python
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Hiring(Base):
    __tablename__ = "hirings"
    
    id = Column(Integer, primary_key=True)
    hiring_code = Column(String(10), unique=True, nullable=False)
    user_name = Column(String(100), nullable=False)
    user_email = Column(String(100), nullable=False)
    user_passport = Column(String(20), nullable=True)
    user_nie = Column(String(20), nullable=True)
    user_address = Column(String(200), nullable=False)
    user_city = Column(String(50), nullable=False)
    grade = Column(String(1), nullable=False)  # A, B, o C
    service_name = Column(String(100), nullable=False)
    amount = Column(Integer, nullable=False)  # En centavos
    currency = Column(String(3), default='eur')
    status = Column(String(20), default='pending')
    expires_at = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Campos adicionales para el flujo
    kyc_verified = Column(Boolean, default=False)
    kyc_session_id = Column(String(100), nullable=True)
    kyc_verified_at = Column(DateTime, nullable=True)
    contract_accepted = Column(Boolean, default=False)
    contract_accepted_at = Column(DateTime, nullable=True)
    payment_confirmed = Column(Boolean, default=False)
    payment_confirmed_at = Column(DateTime, nullable=True)
    final_contract_sent = Column(Boolean, default=False)
    final_contract_sent_at = Column(DateTime, nullable=True)
```

---

## 🧪 Testing del Endpoint

### **Request de Prueba**

```bash
curl -X POST "https://api.migro.es/api/admin/hiring/create" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: tu_token_de_admin" \
  -d '{
    "user_name": "Juan Pérez",
    "user_email": "juan@ejemplo.com",
    "user_passport": "X1234567Z",
    "user_address": "Calle Mayor 123",
    "user_city": "Madrid",
    "grade": "A",
    "service_name": "Visado de Estudiante",
    "notes": "Cliente prioritario"
  }'
```

### **Respuesta Esperada**

```json
{
  "hiring_code": "ABC123",
  "user_name": "Juan Pérez",
  "user_email": "juan@ejemplo.com",
  "grade": "A",
  "amount": 40000,
  "currency": "eur",
  "expires_at": "2024-02-15T10:30:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "status": "pending"
}
```

---

## 🔍 Logs Esperados

```bash
INFO: Código de contratación creado: ABC123 para Juan Pérez
```

---

## ⚠️ Consideraciones Importantes

### **Seguridad:**
- ✅ Validar token de administrador
- ✅ Validar formato de email
- ✅ Sanitizar datos de entrada
- ✅ Generar códigos únicos

### **Validaciones:**
- ✅ Al menos un documento (pasaporte o NIE)
- ✅ Grado válido (A, B, o C)
- ✅ Email válido
- ✅ Código único

### **Base de Datos:**
- ✅ Código único generado automáticamente
- ✅ Fecha de expiración (30 días)
- ✅ Monto calculado según grado
- ✅ Estado inicial 'pending'

---

**Estado:** ✅ **Endpoint documentado para implementación**  
**Última actualización:** 15 de Enero de 2024  
**Versión:** 1.0.0
