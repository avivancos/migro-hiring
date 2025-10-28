# 🔴 URGENTE - Desactivar Informe de Cola

## 🎯 Problema

El sistema está enviando **muchos correos** de informe de cola.  
Necesitamos **desactivar estos informes** y dejar solo **un email diario al final del día**.

---

## ✅ Solución

### **1. Desactivar Informes de Cola** (Inmediato)

Buscar en el backend cualquier sistema de notificaciones por email que se ejecute automáticamente y desactivarlo temporalmente.

#### **Archivos a revisar:**
```
backend/
├── app/
│   ├── core/
│   │   ├── scheduler.py           ← Buscar cron jobs
│   │   └── tasks.py               ← Buscar tareas automáticas
│   ├── ul/api/endpoints/
│   │   ├── admin.py               ← Buscar endpoints de reportes
│   │   └── reports.py             ← Buscar sistema de reportes
│   └── services/
│       └── email_service.py       ← Buscar envío de emails
```

#### **Código a buscar:**

```python
# Buscar por estos patrones en el código:
- "queue"
- "informe"
- "cola"
- "email" + "automático"
- "cron"
- "schedule"
- APScheduler
- Celery (si usa colas de tareas)
```

---

### **2. Configurar Solo UN Email Diario**

#### **Opción A: Si usa APScheduler**

```python
# En app/core/scheduler.py

# ❌ DESACTIVAR (comentar o eliminar):
@scheduler.scheduled_job(
    CronTrigger(minute='*'),  # Cada minuto
    id='queue_report'
)
async def send_queue_report():
    # Desactivado
    pass

# ✅ SOLO MANTENER:
@scheduler.scheduled_job(
    CronTrigger(hour=23, minute=59),  # Al final del día (11:59 PM)
    id='daily_summary'
)
async def send_daily_summary():
    """Enviar resumen diario único al final del día"""
    # Tu código de resumen diario
    pass
```

#### **Opción B: Si usa Celery**

```python
# En app/core/tasks.py

# ❌ DESACTIVAR:
@celery_app.task(name='queue_monitor')
def send_queue_reports():
    pass  # Desactivado

# ✅ SOLO MANTENER:
@celery_app.task(name='daily_summary', run_every=timedelta(hours=24))
def send_daily_summary():
    """Enviar resumen diario único"""
    # Tu código
    pass
```

---

### **3. Configuración por Variables de Entorno** (Recomendado)

```bash
# .env del backend

# ❌ DESACTIVAR reportes de cola
ENABLE_QUEUE_REPORTS=false

# ✅ Habilitar solo reporte diario
ENABLE_DAILY_SUMMARY=true
DAILY_SUMMARY_TIME=23:59  # Hora del reporte diario (formato HH:MM)
```

**Código Python:**
```python
import os

# En tu sistema de reportes
ENABLE_QUEUE_REPORTS = os.getenv('ENABLE_QUEUE_REPORTS', 'false').lower() == 'true'
ENABLE_DAILY_SUMMARY = os.getenv('ENABLE_DAILY_SUMMARY', 'true').lower() == 'true'

if ENABLE_QUEUE_REPORTS:
    # Este código NO se ejecutará
    send_queue_report()

if ENABLE_DAILY_SUMMARY:
    # Este SÍ se ejecutará
    send_daily_summary()
```

---

## 🧪 Verificar

Después de hacer los cambios:

### **1. Revisar logs del backend**
```bash
# Deberías ver:
# ❌ NO más: "Enviando informe de cola..."
# ✅ SÍ ver: "Enviando resumen diario a las 23:59"
```

### **2. Confirmar en emails**
- ✅ Ya no recibes emails cada X minutos/horas
- ✅ Recibes UN email al final del día

---

## 📋 Checklist de Implementación

- [ ] Buscar en código fuente cualquier sistema de "cola" o "queue reports"
- [ ] Desactivar cron jobs frecuentes (cada minuto/hora)
- [ ] Configurar variable `ENABLE_QUEUE_REPORTS=false` en .env
- [ ] Verificar que solo hay UN cron job diario
- [ ] Configurar hora del reporte diario (23:59 recomendado)
- [ ] Testing: verificar que ya no llegan emails frecuentes
- [ ] Testing: verificar que llega UN email al final del día

---

## 🚨 Solución Temporal (Si se necesita ahora)

### **Desactivar APScheduler completamente:**

```python
# En main.py o donde se inicialice el scheduler

scheduler = AsyncIOScheduler()

# ✅ DESCOMENTAR esta línea para DESACTIVAR todo:
# scheduler.start()

# O mejor:
ENABLE_SCHEDULER = os.getenv('ENABLE_SCHEDULER', 'false')
if ENABLE_SCHEDULER == 'true':
    scheduler.start()
```

**Variables de entorno:**
```bash
ENABLE_SCHEDULER=false  # Desactiva todos los cron jobs
```

---

## 📧 Destinatarios del Reporte Diario

Asegúrate de que el reporte diario se envíe a:
- agustin@migro.es
- info@migro.es

**Y NO a más emails.**

---

## ⚠️ Importante

1. **No eliminar código**: Solo comentar o usar variables de entorno
2. **Backup**: Guardar la configuración anterior antes de cambiar
3. **Testing**: Verificar que funciona antes de pasar a producción
4. **Documentar**: Dejar comentarios de por qué está desactivado

---

**Prioridad:** 🔴 URGENTE  
**Estado:** ⏳ Pendiente implementar en backend  
**Contacto:** Desarrollador backend

