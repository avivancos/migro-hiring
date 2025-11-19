# 📥 Backend: Endpoint para Descargar Contrato Definitivo

## 🎯 Problema

Actualmente, el endpoint `GET /hiring/{code}/contract/download` devuelve el contrato del **Paso 3** (contrato con firma pero puede incluir marca de agua "BORRADOR").

Necesitamos un endpoint separado que devuelva el **contrato definitivo** (Paso 4) que fue subido mediante `POST /hiring/final-contract/upload`.

---

## ✅ Solución: Nuevo Endpoint

### **GET `/hiring/{code}/final-contract/download`**

Este endpoint debe devolver el contrato definitivo (sin marca de agua) que fue subido en el paso 4.

---

## 📋 Especificación del Endpoint

### **Request**

```http
GET /hiring/{code}/final-contract/download
```

**Path Parameters:**
- `code` (string, requerido): Código de contratación

**Headers:**
- `Authorization`: Bearer token (si es requerido)

### **Response**

**Success (200 OK):**
- **Content-Type**: `application/pdf`
- **Body**: PDF binario del contrato definitivo

**Errors:**
- **404 Not Found**: No se encontró el código de contratación o el contrato definitivo no ha sido subido aún
- **401 Unauthorized**: Token inválido o expirado

---

## 🔧 Implementación Backend

### **Opción 1: Usar Base de Datos para Rastrear Contratos**

Si tienes una tabla `contracts` que almacena los contratos subidos:

```python
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
import os

router = APIRouter()

@router.get("/hiring/{hiring_code}/final-contract/download")
async def download_final_contract(hiring_code: str, db: Session = Depends(get_db)):
    """
    Descargar el contrato definitivo (sin marca de agua) del paso 4
    """
    # Buscar el contrato definitivo en la base de datos
    contract = db.query(Contract).filter(
        Contract.hiring_code == hiring_code,
        Contract.contract_type == "final"  # Solo contratos definitivos
    ).order_by(Contract.uploaded_at.desc()).first()
    
    if not contract:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró contrato definitivo para el código {hiring_code}"
        )
    
    # Opción A: Si el PDF está almacenado en Cloudinary/S3
    if contract.contract_url:
        import requests
        pdf_response = requests.get(contract.contract_url)
        return StreamingResponse(
            io.BytesIO(pdf_response.content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=contrato_{hiring_code}.pdf"
            }
        )
    
    # Opción B: Si el PDF está almacenado localmente
    if contract.file_path and os.path.exists(contract.file_path):
        return FileResponse(
            path=contract.file_path,
            media_type="application/pdf",
            filename=f"contrato_{hiring_code}.pdf"
        )
    
    raise HTTPException(
        status_code=404,
        detail="El archivo PDF del contrato no se encuentra disponible"
    )
```

### **Opción 2: Usar Convención de Nombres en Cloudinary/S3**

Si los PDFs se almacenan con un naming pattern predecible:

```python
@router.get("/hiring/{hiring_code}/final-contract/download")
async def download_final_contract(hiring_code: str):
    """
    Descargar el contrato definitivo desde Cloudinary/S3
    """
    # Construir URL del contrato definitivo
    # Ejemplo: https://res.cloudinary.com/migro/raw/upload/v1/contracts/contrato_G6QKL_final.pdf
    contract_url = f"https://res.cloudinary.com/migro/raw/upload/v1/contracts/contrato_{hiring_code}_final.pdf"
    
    try:
        import requests
        pdf_response = requests.get(contract_url, timeout=10)
        pdf_response.raise_for_status()
        
        return StreamingResponse(
            io.BytesIO(pdf_response.content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=contrato_{hiring_code}.pdf"
            }
        )
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=f"No se encontró contrato definitivo para el código {hiring_code}"
            )
        raise HTTPException(status_code=500, detail="Error al obtener el contrato")
    except Exception as e:
        logger.error(f"Error descargando contrato: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")
```

---

## 📊 Diferencias entre Endpoints

| Endpoint | Descripción | Cuándo se Genera | Marca de Agua |
|----------|-------------|------------------|---------------|
| `GET /hiring/{code}/contract/download` | Contrato del Paso 3 (con firma) | Después de la firma del cliente | ✅ Sí (BORRADOR) |
| `GET /hiring/{code}/final-contract/download` | **Contrato Definitivo** del Paso 4 | Después del pago confirmado | ❌ No |

---

## 🗄️ Estructura Recomendada de Base de Datos

Si usas una tabla `contracts`:

```sql
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    hiring_code VARCHAR(10) NOT NULL,
    contract_type VARCHAR(20) NOT NULL,  -- 'draft' o 'final'
    contract_url TEXT,                   -- URL de Cloudinary/S3
    file_path TEXT,                      -- Ruta local (si aplica)
    payment_intent_id VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_hiring_code (hiring_code),
    INDEX idx_contract_type (contract_type)
);
```

**Datos de ejemplo:**

| id | hiring_code | contract_type | contract_url | uploaded_at |
|----|-------------|---------------|--------------|-------------|
| 1  | G6QKL       | draft         | https://...borrador.pdf | 2025-11-19 18:10:00 |
| 2  | G6QKL       | final         | https://...definitivo.pdf | 2025-11-19 18:15:00 |

---

## 🔍 Flujo Completo

### **Paso 3: Firma del Contrato**
```
Frontend genera borrador con marca de agua "BORRADOR"
POST /hiring/{code}/contract/accept (sube borrador)
Backend guarda:
  - contract_type = "draft"
  - contract_url = "https://cloudinary.com/.../contrato_G6QKL_draft.pdf"
```

### **Paso 4: Pago**
```
Frontend genera contrato definitivo SIN marca de agua
POST /hiring/final-contract/upload (sube contrato definitivo)
Backend guarda:
  - contract_type = "final"
  - contract_url = "https://cloudinary.com/.../contrato_G6QKL_final.pdf"
Backend envía email con contrato definitivo
```

### **Paso 5: Descarga**
```
Frontend solicita:
  GET /hiring/{code}/final-contract/download
Backend devuelve:
  - PDF definitivo (sin marca de agua)
```

---

## ✅ Testing

### **Test 1: Descargar contrato definitivo existente**

```bash
curl -X GET 'https://api.migro.es/api/hiring/G6QKL/final-contract/download' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  --output contrato_G6QKL.pdf
```

**Resultado esperado**: PDF definitivo sin marca de agua

### **Test 2: Código sin contrato definitivo**

```bash
curl -X GET 'https://api.migro.es/api/hiring/XXXXX/final-contract/download' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Resultado esperado**: 
```json
{
  "detail": "No se encontró contrato definitivo para el código XXXXX"
}
```

---

## 🚀 Prioridad

**ALTA** - Este endpoint es crítico para que los clientes puedan descargar el contrato definitivo sin marca de agua.

---

## 📌 Notas Importantes

1. El contrato definitivo **DEBE** ser diferente del borrador del Paso 3
2. El contrato definitivo **NO DEBE** tener marca de agua "BORRADOR"
3. El contrato definitivo **DEBE** incluir la firma del cliente
4. El contrato definitivo **DEBE** incluir los detalles del pago
5. Si el contrato definitivo no existe, devolver 404 (no devolver el borrador)

---

## 📚 Referencias

- Endpoint de subida: `POST /hiring/final-contract/upload`
- Documentación: `BACKEND_ENDPOINT_FINAL_CONTRACT.md`
- Frontend: `src/services/hiringService.ts` (método `downloadFinalContract`)

