# 🚀 Implementación Completa - Backend

## ✅ Tareas a Implementar

Todas las tareas están listas para implementar. **No hay código frontend que crear** ya que todo el trabajo es backend.

---

## 📦 1. Reporte Diario de Contratos

### 📄 Archivo: `app/api/endpoints/daily_reports.py`

**Implementar según:** `BACKEND_DAILY_REPORT_AND_TEST.md` (líneas 16-151)

### Dependencias:
```bash
pip install apscheduler
```

### Variables de entorno:
```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@migro.es
SMTP_PASSWORD=tu_password
```

---

## 🧪 2. Endpoint de Test para Contratos

### 📄 Archivo: `app/api/endpoints/test_contracts.py`

**Implementar según:** `BACKEND_DAILY_REPORT_AND_TEST.md` (líneas 231-334)

### Funcionalidad:
- Busca contratos de "antonio alaejos" y "ebert"
- Descarga PDFs desde Cloudinary
- Envía todos los PDFs a agustin@migro.es

---

## 📧 3. Modificar Emails de Contrato

### 📄 Archivo: `app/api/endpoints/hiring.py` (o similar)

**Modificar función `send_contract_emails()` según:** `BACKEND_FIX_EMAIL_RECIPIENTS.md`

**Cambio clave:**
```python
# ❌ ANTES (solo 2 destinatarios):
recipients = [client_email, 'info@migro.es']

# ✅ DESPUÉS (3 destinatarios):
recipients = [
    client_email,
    'info@migro.es',
    'agustin@migro.es'  # ✅ Agregado
]
```

---

## 🔗 4. Corregir URLs de Contrato

### 📄 Archivos a modificar:
- `app/api/endpoints/hiring.py`

**Según:** `BACKEND_FIX_CONTRACT_URL.md`

### Cambios principales:

1. **Eliminar contract_url del endpoint `/hiring/{code}/confirm`**
2. **Agregar naming correcto en `/hiring/final-contract/upload`:**
   ```python
   filename = f"contrato_{hiring_code}_pago1_{payment_intent_id}.pdf"
   ```

---

## ⏰ 5. Cron Job Automático

### 📄 Archivo: `app/core/scheduler.py`

**Crear según:** `BACKEND_DAILY_REPORT_AND_TEST.md` (líneas 195-229)

### Integración en main.py:

```python
from app.core.scheduler import scheduler

# Al iniciar la app
@app.on_event("startup")
async def startup_event():
    scheduler.start()
    logger.info("✅ Scheduler iniciado - Reporte diario a las 9:00 AM")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
```

---

## 🧪 Testing

### 1. Test Reporte Diario:
```bash
curl -X GET "https://api.migro.es/api/admin/reports/daily?date=2025-01-27" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 2. Test Envío de Contratos:
```bash
curl -X POST "https://api.migro.es/api/admin/test/send-contracts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MEDIA_TOKEN" \
  -d '{"target_email": "agustin@migro.es"}'
```

### 3. Verificar Cron Job:
```bash
# Los logs mostrarán:
# ✅ Reporte diario enviado a agustin@migro.es
# ✅ Reporte diario enviado a info@migro.es
```

---

## ✅ Checklist de Implementación

- [ ] Copiar código de `BACKEND_DAILY_REPORT_AND_TEST.md`
- [ ] Instalar `apscheduler` en requirements.txt
- [ ] Implementar endpoint `/admin/reports/daily`
- [ ] Implementar endpoint `/admin/test/send-contracts`
- [ ] Modificar `send_contract_emails()` para incluir agustin@migro.es
- [ ] Corregir endpoints de contrato según `BACKEND_FIX_CONTRACT_URL.md`
- [ ] Crear y configurar scheduler
- [ ] Testing de todos los endpoints
- [ ] Verificar cron job funcional

---

**Prioridad:** ALTA  
**Tiempo estimado:** 2-3 horas  
**Estado:** ✅ Documentación lista

