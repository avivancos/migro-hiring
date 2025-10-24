# 🔬 Debug Completo: Respuestas de Stripe API

## 📋 Instrucciones para el Usuario

### Paso 1: Preparar la Prueba

1. Abre el navegador en **modo incógnito/privado**
2. Ve a: `https://contratacion.migro.es/contratacion/TEST1`
3. **Abre DevTools (F12)** → pestaña **Console**
4. Click en el icono ⚙️ (Settings) y activa **"Preserve log"** (Preservar registro)

### Paso 2: Completar el Flujo KYC

1. Sigue el flujo normal hasta llegar al paso 3 (Verificación KYC)
2. Click en **"Iniciar Verificación"**
3. **Observa la consola** → deberías ver:

```javascript
🚀 Iniciando sesión KYC:
   URL: /hiring/TEST1/kyc/start
   Return URL: https://contratacion.migro.es/contratacion/TEST1

✅ POST /hiring/TEST1/kyc/start → 200

📥 Respuesta de startKYC:
   Session ID: vs_1XXXXXXXXXXXXXXXXX
   URL: https://verify.stripe.com/start/test_XXXXXXXXX
   Data completa: {session_id: "...", url: "..."}
```

4. Stripe te redirigirá para la verificación
5. Completa la verificación con **datos de prueba de Stripe**
6. Stripe te redirigirá de vuelta con `?session_id=vs_XXXXX`

### Paso 3: Observar la Verificación Automática

Cuando regreses, deberías ver en la consola:

```javascript
🔍 Detectado session_id en URL: vs_1XXXXXXXXXXXXXXXXX
📍 Hiring code actual: TEST1

🔄 Verificando estado de KYC...
   - Hiring code: TEST1
   - Session ID: vs_1XXXXXXXXXXXXXXXXX

📡 Enviando request a API:
   URL: /hiring/TEST1/kyc/complete
   Body: {session_id: "vs_1XXXXXXXXXXXXXXXXX"}
```

### Paso 4A: Si Funciona ✅

```javascript
✅ POST /hiring/TEST1/kyc/complete → 200

📥 Respuesta recibida de API:
   Status: 200
   Data: {status: "verified", message: "KYC verification completed"}
   Headers: {content-type: "application/json", ...}

✅ KYC completado exitosamente
```

### Paso 4B: Si Falla ❌

```javascript
❌ API Error Details:
   URL: /hiring/TEST1/kyc/complete
   Method: post
   Status: 404 / 400 / 500
   Response Data: {detail: "..."}
   Full Error: AxiosError {...}

❌ Error al verificar KYC: [Error]
   - Status: 404
   - Data: {detail: "Endpoint not found"}
   - Message: Request failed with status code 404
```

---

## 📊 Posibles Respuestas de la API

### ✅ Respuesta Exitosa (200 OK)

```json
{
  "status": "verified",
  "message": "KYC verification completed",
  "verification_id": "vs_1XXXXXXXXXXXXXXXXX",
  "verified_at": "2025-10-24T14:30:00Z"
}
```

### ⏳ Verificación Pendiente (400 Bad Request)

```json
{
  "detail": "Verification not complete yet",
  "status": "processing"
}
```

**Acción del frontend:** Inicia polling automático cada 3 segundos.

### ❌ Endpoint No Existe (404 Not Found)

```json
{
  "detail": "Not Found"
}
```

**Causa:** El endpoint `/api/hiring/TEST1/kyc/complete` no está implementado en el backend.

**Solución:** Implementar endpoint en el backend.

### ❌ Session ID Inválido (400 Bad Request)

```json
{
  "detail": "Invalid session_id",
  "error": "Session not found in Stripe"
}
```

**Causa:** El `session_id` no existe en Stripe o ya expiró.

### ❌ Error de Stripe (500 Internal Server Error)

```json
{
  "detail": "Stripe API error",
  "error": "Connection to Stripe failed"
}
```

**Causa:** El backend no pudo conectarse con Stripe API.

---

## 🎯 Qué Información Necesitamos

Por favor captura **TODA** la consola desde que haces click en "Iniciar Verificación" hasta que termina (o falla).

### Información Crítica:

1. **Session ID generado por Stripe:**
   ```
   Session ID: vs_XXXXXXXXXXXXXXXXX
   ```

2. **URL de verificación de Stripe:**
   ```
   URL: https://verify.stripe.com/start/test_XXXXXXXXX
   ```

3. **Código de hiring usado:**
   ```
   Hiring code actual: TEST1
   ```

4. **Respuesta del endpoint `/kyc/complete`:**
   - Status HTTP
   - Body de respuesta
   - Mensaje de error (si hay)

5. **Cualquier error en rojo en la consola**

---

## 📸 Cómo Capturar los Logs

### Opción 1: Screenshot

1. Abre DevTools (F12) → Console
2. Activa "Preserve log"
3. Completa el flujo KYC
4. Haz scroll hasta el inicio de los logs
5. Toma varios screenshots cubriendo todos los mensajes

### Opción 2: Exportar Logs (Recomendado)

1. En la consola, click derecho
2. **"Save as..."** → Guarda como `console-logs.txt`
3. Envía el archivo

### Opción 3: Copiar/Pegar

1. Selecciona todos los logs en la consola
2. Click derecho → **"Copy"**
3. Pega en un archivo de texto
4. Envía

---

## 🔧 Botón de Emergencia

Si quedas atascado en "Esperando Verificación", ahora hay un botón:

**🔧 Forzar Verificación Manual**

Este botón:
1. Lee el `session_id` de la URL
2. Intenta verificar nuevamente
3. Muestra logs detallados en consola

---

## 🆘 Checklist de Troubleshooting

Antes de reportar, verifica:

- [ ] ¿Llegaste al paso 3 (KYC)?
- [ ] ¿Se abrió la ventana de Stripe Identity?
- [ ] ¿Completaste la verificación en Stripe?
- [ ] ¿Te redirigió de vuelta a contratacion.migro.es?
- [ ] ¿La URL tiene `?session_id=vs_XXXXX`?
- [ ] ¿Abriste DevTools y ves los logs?
- [ ] ¿Hay algún error en rojo en la consola?
- [ ] ¿La pestaña Network muestra el request a `/kyc/complete`?

---

## 📞 Cómo Reportar el Problema

Incluye:

1. **URL completa** (con el session_id)
2. **Hiring code** usado
3. **Logs de consola** completos
4. **Screenshot** de la pantalla atascada
5. **Network tab** (opcional pero útil):
   - F12 → Network
   - Filtrar por "kyc"
   - Screenshot de los requests

---

**Última actualización:** 24 de Octubre de 2025 - Commit `6ad89a2`

**Deploy en progreso:** Render debe deployar en 5-8 minutos

