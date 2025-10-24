# 🔍 Debug KYC - Instrucciones

## 📝 Problema Reportado

El KYC no funciona cuando Stripe redirige de vuelta con `session_id`:
```
https://contratacion.migro.es/contratacion/TEST1?session_id=vs_test_123456789
```

---

## 🧪 Diagnóstico

### Paso 1: Abrir Consola del Navegador

1. Ve a: `https://contratacion.migro.es/contratacion/TEST1?session_id=vs_test_123456789`
2. Abre **DevTools** (F12)
3. Ve a la pestaña **Console**

### Paso 2: Verificar Logs

Deberías ver estos mensajes en la consola:

```javascript
✅ CORRECTO (KYC funciona):
🔍 Detectado session_id en URL: vs_test_123456789
📍 Hiring code actual: TEST1
🔄 Verificando estado de KYC...
   - Hiring code: TEST1
   - Session ID: vs_test_123456789
✅ KYC completado exitosamente

❌ ERROR (KYC no funciona):
🔍 Detectado session_id en URL: vs_test_123456789
📍 Hiring code actual: TEST1
🔄 Verificando estado de KYC...
   - Hiring code: TEST1
   - Session ID: vs_test_123456789
❌ Error al verificar KYC: [ERROR AQUÍ]
   - Status: 404 / 400 / 500
   - Data: {...}
   - Message: ...
```

---

## 🎯 Escenarios Posibles

### Escenario A: Error 404 - Endpoint no existe

```
❌ Error al verificar KYC
   - Status: 404
   - Data: {"detail":"Not Found"}
```

**Causa:** El endpoint `/api/hiring/TEST1/kyc/complete` no existe en el backend.

**Solución:**
1. Verificar que el backend tenga el endpoint implementado
2. URL esperada: `POST https://api.migro.es/api/hiring/TEST1/kyc/complete`
3. Body esperado: `{ "session_id": "vs_test_123456789" }`

### Escenario B: Error 400 - Stripe aún procesando

```
❌ Error al verificar KYC
   - Status: 400
   - Data: {"detail":"Verification not complete yet"}
⏳ KYC aún en proceso, iniciando polling...
```

**Causa:** Stripe aún está procesando la verificación.

**Solución:** 
- **Automática** - El sistema inicia polling cada 3 segundos
- **Esperar** - Debería completarse en 10-30 segundos

### Escenario C: Error CORS

```
Access to XMLHttpRequest at 'https://api.migro.es/api/hiring/TEST1/kyc/complete' 
from origin 'https://contratacion.migro.es' has been blocked by CORS policy
```

**Causa:** El backend no permite el dominio `contratacion.migro.es`.

**Solución:** Configurar en el backend (FastAPI):
```python
# backend main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://contratacion.migro.es",
        "https://migro-hiring.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Escenario D: session_id NO detectado

```
(Sin logs en consola)
```

**Causa:** El componente KYC no está detectando el `session_id` en la URL.

**Solución:**
1. Verificar que la URL tiene el formato correcto
2. Verificar que React Router está configurado correctamente

---

## 🔧 Testing Manual

### 1. Simular Retorno de Stripe

Visita manualmente:
```
https://contratacion.migro.es/contratacion/TEST1?session_id=vs_test_FAKE123
```

**Deberías ver:**
- Spinner de carga
- Mensaje "Verificando Identidad..."
- Logs en consola

### 2. Verificar API Directamente

```bash
# Desde terminal o Postman
curl -X POST https://api.migro.es/api/hiring/TEST1/kyc/complete \
  -H "Content-Type: application/json" \
  -d '{"session_id":"vs_test_123456789"}'
```

**Respuesta esperada:**
```json
{
  "status": "verified",
  "message": "KYC verification completed"
}
```

---

## 📊 Tabla de Diagnóstico

| Síntoma | Causa Probable | Solución |
|---------|---------------|----------|
| Sin logs en consola | session_id no detectado | Verificar URL |
| Error 404 | Endpoint no existe | Implementar en backend |
| Error 400 + Polling | Stripe procesando | Esperar (automático) |
| Error CORS | Backend no permite origen | Configurar CORS |
| Error 500 | Error interno backend | Revisar logs backend |

---

## 🆘 Información para Reportar

Si el problema persiste, envía:

1. **Screenshot** de la consola completa
2. **URL completa** que estás visitando
3. **Hiring code** que estás probando
4. **Session ID** de Stripe
5. **Mensaje de error** completo (si hay)

---

## ✅ Verificación de Deploy

Una vez que Render complete el deploy (commit `5ca9868`):

1. Visita: `https://contratacion.migro.es/contratacion/TEST1?session_id=vs_test_123`
2. Abre consola (F12)
3. Busca los logs mejorados
4. Reporta qué ves

---

**Última actualización:** 24 de Octubre de 2025 - Commit `5ca9868`

