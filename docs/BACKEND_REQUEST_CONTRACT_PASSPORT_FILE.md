# Backend: Soporte para Archivo de Pasaporte en Solicitud de Contrato

**Fecha**: 2026-01-20  
**Endpoint**: `POST /api/pipelines/stages/{entity_type}/{entity_id}/request-hiring-code`  
**Estado**: ✅ **IMPLEMENTADO**

---

## 🎯 Objetivo

El backend ahora soporta la subida de archivo de copia de pasaporte al solicitar un contrato desde una oportunidad. El backend implementa:

1. ✅ **Acepta FormData** (multipart/form-data) - **ÚNICO FORMATO ACEPTADO**
2. ✅ **Procesa el archivo** `passport_file`
3. ✅ **Almacena el archivo** en Cloudinary
4. ✅ **Asocia el archivo** con el hiring code generado (en notas del pipeline stage)

---

## ⚠️ Breaking Change

**IMPORTANTE**: El endpoint ahora **SOLO acepta FormData** (multipart/form-data). Ya **NO acepta JSON**.

El frontend debe actualizarse para enviar FormData siempre, incluso cuando no hay archivo.

---

## 📋 Implementación en el Backend

### 1. Endpoint Solo Acepta FormData

El endpoint ahora **solo acepta FormData** (multipart/form-data):

#### Formato Requerido: FormData
```json
{
  "agent_signature": "Juan Pérez",
  "contract_template": "standard",
  "service_name": "Visado de Estudiante",
  "grade": "B",
  "payment_type": "one_time",
  "amount": 40000,
  "currency": "EUR",
  "expires_in_days": 30,
  "client_name": "María García",
  "client_email": "maria@ejemplo.com",
  "client_passport": "X1234567Z",
  "client_nie": null,
  "client_address": "Calle Mayor 123",
  "client_province": "Madrid",
  "client_postal_code": "28001"
}
```

```
Content-Type: multipart/form-data

agent_signature: "Juan Pérez"
contract_template: "standard"
service_name: "Visado de Estudiante"
grade: "B"
payment_type: "one_time"
amount: "40000"
currency: "EUR"
expires_in_days: "30"
client_name: "María García"
client_email: "maria@ejemplo.com"
client_passport: "X1234567Z" (opcional)
client_nie: "" (opcional)
client_address: "Calle Mayor 123"
client_province: "Madrid"
client_postal_code: "28001"
passport_file: [File] (opcional, JPG, PNG o PDF, máx. 10MB)
```

**Nota**: El campo `passport_file` es opcional. El endpoint acepta FormData con o sin archivo.

---

## 🔧 Implementación Realizada

### Endpoint con FormData (Implementado)

```python
from fastapi import FastAPI, File, UploadFile, Form, Depends
from fastapi.responses import JSONResponse
from typing import Optional
import boto3  # o el servicio de almacenamiento que uses
from datetime import datetime
import uuid

```python
@app.post("/api/pipelines/stages/{entity_type}/{entity_id}/request-hiring-code")
async def request_hiring_code_from_opportunity(
    entity_type: EntityType,
    entity_id: uuid.UUID,
    # Campos del formulario (FormData) - TODOS REQUERIDOS excepto los opcionales
    agent_signature: str = Form(...),
    contract_template: str = Form(...),
    catalog_item_id: Optional[int] = Form(None),
    service_name: Optional[str] = Form(None),
    grade: Optional[str] = Form(None),
    amount: Optional[int] = Form(None),
    payment_type: str = Form(...),
    currency: str = Form("EUR"),
    expires_in_days: int = Form(30),
    client_name: str = Form(...),
    client_email: str = Form(...),
    client_passport: Optional[str] = Form(None),
    client_nie: Optional[str] = Form(None),
    client_address: str = Form(...),
    client_province: str = Form(...),
    client_postal_code: str = Form(...),
    passport_file: Optional[UploadFile] = File(None),  # 🆕 Archivo opcional
    current_user: User = Depends(get_current_user)
):
    """
    Solicitar código de contratación desde oportunidad.
    
    ⚠️ IMPORTANTE: Solo acepta FormData (multipart/form-data).
    Ya NO acepta JSON.
    """
    
    # Validar archivo de pasaporte si se proporciona
    passport_file_url = None
    if passport_file and passport_file.filename:
        # Validar tipo de archivo
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
        if passport_file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de archivo no permitido. Formatos aceptados: JPG, PNG, PDF.",
            )
        
        # Validar tamaño (10MB máximo)
        MAX_FILE_SIZE = 10 * 1024 * 1024
        file_content = await passport_file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="El archivo es demasiado grande. Tamaño máximo: 10MB",
            )
        
        # Subir a Cloudinary
        is_image = passport_file.content_type.startswith("image/")
        if is_image:
            result = await upload_image(file_content, f"passports/{entity_id}/")
        else:
            result = await upload_document(file_content, f"passports/{entity_id}/")
        
        passport_file_url = result.get("secure_url") or result.get("url")
    
    # Validar que al menos uno de: passport, NIE o passport_file esté presente
    if not client_passport and not client_nie and not passport_file_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar al menos uno de: número de pasaporte, NIE o copia de pasaporte",
        )
    
    # Pre-llenar grading desde contacto si no se proporciona
    # (lógica implementada en el backend)
    
    # Crear hiring code con datos de FormData
    # ... resto de la lógica ...
    
    return {
        "hiring_code": hiring_code.code,
        "hiring_code_id": hiring_code.id,
        "pipeline_stage_id": hiring_code.pipeline_stage_id,
        "email_sent": True,
    }
```

---

## 💾 Almacenamiento del Archivo

### Implementación: Cloudinary

El backend utiliza **Cloudinary** para almacenar los archivos:

- **Imágenes** (JPG, PNG): Se suben como imágenes optimizadas
- **PDFs**: Se suben como documentos raw
- **Carpeta**: `passports/{entity_id}/`
- **URL**: Se almacena en las notas del pipeline stage

**Funciones utilizadas**:
- `upload_image()`: Para imágenes (JPG, PNG)
- `upload_document()`: Para PDFs

**Ejemplo de URL generada**:
```
https://res.cloudinary.com/{cloud_name}/image/upload/v1234567890/passports/{entity_id}/passport_xxx.pdf
```

---

## 📊 Almacenamiento de la URL del Archivo

### Implementación Actual

La URL del archivo se almacena en las **notas del pipeline stage**:

```
[SOLICITUD DE HIRING CODE - 2026-01-20T10:30:00Z]
Agente: Juan Pérez
Firma: Juan Pérez
Tipo de Servicio: Hoja 1 (hoja_1)
Archivo de Pasaporte: https://res.cloudinary.com/.../passport_xxx.pdf
Hiring Code: ABC12
Payment ID: 123
El código ha sido generado automáticamente y está listo para ser usado.
```

### Futura Mejora (Opcional)

Se puede agregar un campo dedicado en la tabla de hiring codes:

```sql
ALTER TABLE hiring_codes 
ADD COLUMN client_passport_file_url VARCHAR(500) NULL;
```

Por ahora, la URL está disponible en las notas del pipeline stage y se incluye en el email al administrador.

---

## ✅ Validaciones Implementadas

### Validación de Archivo ✅

```python
# Validar tipo de archivo
allowed_types = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
if passport_file.content_type not in allowed_types:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Tipo de archivo no permitido. Formatos aceptados: JPG, PNG, PDF.",
    )

# Validar tamaño (10MB máximo)
MAX_FILE_SIZE = 10 * 1024 * 1024
file_content = await passport_file.read()
if len(file_content) > MAX_FILE_SIZE:
    raise HTTPException(
        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        detail="El archivo es demasiado grande. Tamaño máximo: 10MB",
    )
```

### Validación de Campos ✅

El backend valida que **al menos uno de**:
- `client_passport` (número)
- `client_nie` (número)
- `passport_file` (archivo)

```python
if not client_passport and not client_nie and not passport_file_url:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Debe proporcionar al menos uno de: número de pasaporte, NIE o copia de pasaporte",
    )
```

### Pre-llenado de Grading ✅

El backend pre-llena el grading desde el contacto si está disponible:

```python
def map_contact_grading_to_contract_grade(grading: Optional[str]) -> Optional[str]:
    """Mapea el grading del contacto al formato del contrato."""
    if not grading:
        return None
    
    grading_map = {
        "A": "A",      # Sin cambios
        "B+": "B",     # B+ y B- se mapean a B
        "B-": "B",
        "C": "C",      # Sin cambios
        "D": "C",      # D se mapea a C
    }
    
    return grading_map.get(grading, None)
```

---

## 📝 Campos del Request

### Campos que Vienen en FormData

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `agent_signature` | string | ✅ | Firma del agente |
| `contract_template` | string | ✅ | Plantilla del contrato |
| `service_name` | string | ✅ | Nombre del servicio |
| `grade` | string | ✅ | Grado (A, B, C) |
| `payment_type` | string | ✅ | `one_time` o `subscription` |
| `amount` | int | ✅ | Monto en centavos |
| `currency` | string | ❌ | Default: "EUR" |
| `expires_in_days` | int | ❌ | Default: 30 |
| `client_name` | string | ✅ | Nombre completo |
| `client_email` | string | ✅ | Email del cliente |
| `client_passport` | string | ⚠️ | Número de pasaporte (al menos uno requerido) |
| `client_nie` | string | ⚠️ | Número de NIE (al menos uno requerido) |
| `client_address` | string | ✅ | Dirección completa |
| `client_province` | string | ✅ | Provincia |
| `client_postal_code` | string | ✅ | Código postal |
| `passport_file` | File | ⚠️ | Archivo de pasaporte (al menos uno requerido) |

**Nota**: Al menos uno de `client_passport`, `client_nie` o `passport_file` debe estar presente.

---

## 🔄 Mapeo de Payment Type

El frontend envía:
- `"two_payments"` → Backend debe interpretar como `"one_time"`
- `"deferred"` → Backend debe interpretar como `"subscription"`

O el backend puede aceptar directamente estos valores y mapearlos internamente.

---

## 📤 Response

La respuesta debe incluir información del archivo si se subió:

```json
{
  "hiring_code": "ABC123",
  "hiring_code_id": "uuid",
  "pipeline_stage_id": "uuid",
  "email_sent": true,
  "passport_file_url": "https://s3.amazonaws.com/bucket/passports/uuid.pdf"  // Si se subió archivo
}
```

---

## 🧪 Testing

### Test 1: Solicitud con archivo
```bash
curl -X POST "http://localhost:8000/api/pipelines/stages/leads/{entity_id}/request-hiring-code" \
  -H "Authorization: Bearer {token}" \
  -F "agent_signature=Juan Pérez" \
  -F "contract_template=standard" \
  -F "service_name=Visado" \
  -F "grade=B" \
  -F "payment_type=one_time" \
  -F "amount=40000" \
  -F "client_name=María García" \
  -F "client_email=maria@ejemplo.com" \
  -F "client_address=Calle Mayor 123" \
  -F "client_province=Madrid" \
  -F "client_postal_code=28001" \
  -F "passport_file=@/path/to/passport.pdf"
```

### Test 2: Solicitud sin archivo (FormData)
```bash
curl -X POST "http://localhost:8000/api/pipelines/stages/leads/{entity_id}/request-hiring-code" \
  -H "Authorization: Bearer {token}" \
  -F "agent_signature=Juan Pérez" \
  -F "contract_template=standard" \
  -F "service_name=Visado" \
  -F "grade=B" \
  -F "payment_type=one_time" \
  -F "amount=40000" \
  -F "client_name=María García" \
  -F "client_email=maria@ejemplo.com" \
  -F "client_passport=X1234567Z" \
  -F "client_address=Calle Mayor 123" \
  -F "client_province=Madrid" \
  -F "client_postal_code=28001"
```

**Nota**: El endpoint ya NO acepta JSON. Siempre debe enviarse como FormData.

---

## ⚠️ Consideraciones de Seguridad

1. **Validar tipo MIME** del archivo (no confiar solo en extensión)
2. **Limitar tamaño** (10MB máximo)
3. **Sanitizar nombres de archivo** antes de guardar
4. **Generar nombres únicos** (UUID) para evitar colisiones
5. **Control de acceso**: Solo usuarios autenticados pueden subir archivos
6. **Escaneo de virus**: Considerar escanear archivos subidos (opcional pero recomendado)

---

## 📋 Checklist de Implementación

- [x] Endpoint acepta FormData (multipart/form-data) ✅
- [x] Endpoint ya NO acepta JSON (breaking change) ✅
- [x] Validación de tipo de archivo (JPG, PNG, PDF) ✅
- [x] Validación de tamaño (máximo 10MB) ✅
- [x] Almacenamiento del archivo en Cloudinary ✅
- [x] URL del archivo almacenada en notas del pipeline stage ✅
- [x] Validación: al menos uno de pasaporte/NIE/archivo ✅
- [x] Manejo de errores para archivos inválidos ✅
- [x] Pre-llenado de grading desde contacto ✅
- [x] Email al administrador incluye enlace al archivo ✅
- [ ] Tests unitarios y de integración (pendiente)
- [ ] Campo `client_passport_file_url` en tabla hiring_codes (opcional, futuro)

---

## 🔗 Referencias

- Documentación frontend: `docs/FRONTEND_OPPORTUNITY_REQUEST_CONTRACT_ENHANCEMENTS.md`
- Endpoint: `POST /api/pipelines/stages/{entity_type}/{entity_id}/request-hiring-code`
- Archivo de implementación: `app/api/endpoints/pipelines.py`

---

## ⚠️ Actualización Requerida en Frontend

El frontend debe actualizarse para **siempre enviar FormData**, incluso cuando no hay archivo.

**Estado actual del frontend**: 
- ✅ Envía FormData cuando hay archivo
- ❌ Envía JSON cuando no hay archivo (debe cambiarse)

**Cambio requerido**: El frontend debe enviar FormData siempre, con o sin archivo.
