# 🔧 Backend: Solución Error CORS

## 🎯 Problema Identificado

**Error CORS en endpoint de pago:**
```
Access to XMLHttpRequest at 'https://api.migro.es/api/hiring/LIVE1/payment' 
from origin 'https://contratacion.migro.es' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## 🔧 Solución Backend

### **1. Configurar CORS en FastAPI**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://contratacion.migro.es",  # ← Dominio de producción
        "http://localhost:5173",          # ← Desarrollo local
        "http://localhost:3000",          # ← Alternativo local
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

### **2. Configuración Específica para Endpoints de Pago**

```python
@app.post("/hiring/{hiring_code}/payment")
async def create_payment(hiring_code: str):
    """Crear Payment Intent - CON CORS HEADERS"""
    
    # Agregar headers CORS manualmente si es necesario
    response = {
        "payment_intent_id": "...",
        "client_secret": "...",
        "test_mode": False
    }
    
    return JSONResponse(
        content=response,
        headers={
            "Access-Control-Allow-Origin": "https://contratacion.migro.es",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    )
```

### **3. Middleware CORS Personalizado (Alternativa)**

```python
from fastapi import Request
from fastapi.responses import Response

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    """Middleware personalizado para CORS"""
    
    # Permitir origen específico
    allowed_origins = [
        "https://contratacion.migro.es",
        "http://localhost:5173",
        "http://localhost:3000"
    ]
    
    origin = request.headers.get("origin")
    
    response = await call_next(request)
    
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Admin-Token"
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response
```

---

## 🧪 Testing CORS

### **Verificar Headers CORS**

```bash
# Verificar headers CORS
curl -H "Origin: https://contratacion.migro.es" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.migro.es/api/hiring/LIVE1/payment

# Respuesta esperada:
# Access-Control-Allow-Origin: https://contratacion.migro.es
# Access-Control-Allow-Methods: POST, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization
```

### **Test desde Frontend**

```javascript
// En la consola del navegador
fetch('https://api.migro.es/api/hiring/LIVE1/payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({})
})
.then(response => console.log('CORS OK:', response))
.catch(error => console.log('CORS Error:', error));
```

---

## 🔍 Debugging CORS

### **1. Verificar Headers en Network Tab**

En las herramientas de desarrollador del navegador:

1. **Network Tab** → Buscar request a `/payment`
2. **Verificar Headers de Response:**
   - ✅ `Access-Control-Allow-Origin: https://contratacion.migro.es`
   - ✅ `Access-Control-Allow-Methods: POST, OPTIONS`
   - ✅ `Access-Control-Allow-Headers: Content-Type`

### **2. Logs del Backend**

```python
import logging

logger = logging.getLogger(__name__)

@app.post("/hiring/{hiring_code}/payment")
async def create_payment(hiring_code: str, request: Request):
    """Crear Payment Intent con logging CORS"""
    
    origin = request.headers.get("origin")
    logger.info(f"CORS Request from origin: {origin}")
    
    # ... lógica del endpoint ...
    
    return response
```

---

## ⚠️ Consideraciones de Seguridad

### **✅ Configuración Segura:**

```python
# ✅ CORRECTO - Orígenes específicos
allow_origins=[
    "https://contratacion.migro.es",  # Solo dominio de producción
    "http://localhost:5173",          # Solo desarrollo local
]

# ❌ INCORRECTO - Permitir todo
allow_origins=["*"]  # ¡NUNCA hacer esto en producción!
```

### **🔒 Headers Seguros:**

```python
# ✅ CORRECTO - Headers específicos
allow_headers=[
    "Content-Type",
    "Authorization", 
    "X-Admin-Token"
]

# ❌ INCORRECTO - Todos los headers
allow_headers=["*"]  # Puede ser inseguro
```

---

## 🚀 Implementación Paso a Paso

### **1. Identificar el Framework**
- ✅ **FastAPI**: Usar `CORSMiddleware`
- ✅ **Flask**: Usar `flask-cors`
- ✅ **Express**: Usar `cors` middleware

### **2. Configurar Orígenes Permitidos**
```python
allowed_origins = [
    "https://contratacion.migro.es",  # Producción
    "http://localhost:5173",          # Desarrollo
]
```

### **3. Probar Endpoint**
```bash
curl -X POST https://api.migro.es/api/hiring/LIVE1/payment \
  -H "Origin: https://contratacion.migro.es" \
  -H "Content-Type: application/json"
```

### **4. Verificar en Frontend**
- Abrir `https://contratacion.migro.es/contratacion/LIVE1`
- Ir al Paso 4 (Pago)
- Verificar que no hay error CORS

---

## 📋 Checklist de Implementación

### **Backend:**
- [ ] Agregar `CORSMiddleware` a FastAPI
- [ ] Configurar `allow_origins` con `https://contratacion.migro.es`
- [ ] Permitir métodos `POST` y `OPTIONS`
- [ ] Permitir headers `Content-Type` y `Authorization`
- [ ] Probar endpoint con curl
- [ ] Verificar logs del servidor

### **Frontend:**
- [ ] Probar con código `LIVE1`
- [ ] Verificar Network Tab en DevTools
- [ ] Confirmar que no hay errores CORS
- [ ] Probar flujo completo de pago

---

**Estado:** ⚠️ **Problema CORS identificado - Solución documentada**  
**Última actualización:** 15 de Enero de 2024  
**Versión:** 1.0.0
