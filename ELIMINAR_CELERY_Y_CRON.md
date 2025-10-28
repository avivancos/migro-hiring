# 🔴 ELIMINAR: Celery y Cron Jobs del Backend

## ⚠️ ACCIÓN URGENTE

El servicio "migrofast" está usando demasiada memoria debido a Celery y cron jobs.
Debes **eliminar o desactivar** todo el código relacionado.

---

## 📍 ARCHIVOS A BUSCAR EN EL BACKEND

### **1. Buscar archivos con Celery:**

```bash
# En el directorio del backend:
cd backend

# Buscar archivos relacionados con Celery
find . -name "*celery*" -type f
find . -name "celery.py"
find . -name "celeryconfig.py"
find . -name "celerybeat*"

# Buscar archivos con cron o scheduler
find . -name "*cron*" -type f
find . -name "*scheduler*" -type f
find . -name "*schedule*" -type f
```

---

## 🗑️ CÓDIGO A ELIMINAR O COMENTAR

### **A. Archivo: `celery.py` o `celeryapp.py`**

```python
# ❌ ELIMINAR O COMENTAR TODO ESTE ARCHIVO:
"""
from celery import Celery

celery_app = Celery('migrofast')

@celery_app.task
def send_queue_report():
    pass

@celery_app.task
def send_daily_reports():
    pass
"""
```

### **B. Archivo: `scheduler.py` o `cron.py`**

```python
# ❌ ELIMINAR O COMENTAR TODO:
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job(CronTrigger(minute='*'), id='queue_report')
async def send_queue_report():
    # Este código envía los emails
    pass

@scheduler.scheduled_job(CronTrigger(hour='*'), id='hourly_report')
async def send_hourly_report():
    pass
"""
```

### **C. En `main.py` o `app.py` (donde se inicia el app)**

Busca y **COMENTA** estas líneas:

```python
# ❌ COMENTAR ESTAS LÍNEAS:
# from app.core.celery import celery_app
# from app.core.scheduler import scheduler

# @app.on_event("startup")
# async def startup_event():
#     scheduler.start()
#     print("Scheduler iniciado")

# @app.on_event("shutdown")
# async def shutdown_event():
#     scheduler.shutdown()
```

### **D. Archivos de configuración**

En cualquier archivo `.env` o configuración, busca y elimina:

```bash
# ❌ ELIMINAR estas líneas:
CELERY_BROKER_URL=redis://localhost:6379
CELERY_RESULT_BACKEND=redis://localhost:6379
CELERY_BEAT_SCHEDULE={...}
```

---

## 🔧 MÉTODO 1: Comentar el Código (Rápido)

### **Archivo: `main.py` o donde se importa scheduler**

```python
# ❌ COMENTAR TODO:
"""
import os
ENABLE_SCHEDULER = os.getenv('ENABLE_SCHEDULER', 'false')

# Desactivar scheduler completamente
if ENABLE_SCHEDULER == 'true':
    from app.core.scheduler import scheduler
    
    @app.on_event("startup")
    async def startup_event():
        scheduler.start()
        
    @app.on_event prohibiting("shutdown")
    async def shutdown_event():
        scheduler.shutdown()
"""
```

### **Archivo: `.env`**

```bash
# Agregar estas líneas:
ENABLE_SCHEDULER=false
ENABLE_CELERY=false
ENABLE_QUEUE_REPORTS=false
```

---

## 🗑️ MÉTODO 2: Eliminar Archivos Completos (Definitivo)

### **Archivos a ELIMINAR:**

```bash
# En el backend:
rm -f celery.py
rm -f celeryapp.py
rm -f celeryconfig.py
rm -rf app/core/scheduler.py
rm -rf app/core/cron.py
rm -rf tasks.py
rm -rf app/tasks.py
```

---

## ✅ VERIFICACIÓN

Después de eliminar/comentar, verifica:

### **1. Buscar referencias restantes:**

```bash
# En el backend:
grep -r "celery" .
grep -r "scheduler" .
grep -r "CronTrigger" .
grep -r "scheduled_job" .

# Si no hay resultados, ¡perfecto!
```

### **2. Verificar en Render:**

1. Ve a **Render Dashboard** → **Service "migrofast"**
2. Click en **"Manual Deploy"**
3. Selecciona **"Clear build cache & deploy"**
4. Espera 5-8 minutos
5. Verifica los logs - NO debe aparecer:
   - "Starting Celery..."
   - "Scheduler started"
   - "Queue report sent"

---

## 🧹 LIMPIAR DEPENDENCIAS

Si eliminas Celery completamente, también elimina de `requirements.txt`:

```bash
# En requirements.txt, eliminar o comentar:
# celery==5.x.x
# redis
# apscheduler
```

---

## 📋 COMANDOS PARA APLICAR

### **Si tienes acceso SSH al backend:**

```bash
cd /ruta/al/backend

# 1. Comentar scheduler en main.py
sed -i 's/scheduler.start()/# scheduler.start()/' app/main.py

# 2. Crear .env con configuración
echo "ENABLE_SCHEDULER=false" >> .env

# 3. Reiniciar servicio
pm2 restart migrofast
# o
systemctl restart migrofast
```

### **Si usas Docker:**

```bash
# Editar Dockerfile o docker-compose.yml
# Comentar líneas relacionadas con Celery

# Rebuild y restart
docker-compose down
docker-compose up --build -d
```

---

## 🎯 RESUMEN

### **Lo que debes hacer:**

1. ❌ **Comentar** o **eliminar** archivos:
   - `celery.py`
   - `scheduler.py`
   - `cron.py`

2. ❌ **Comentar** imports en `main.py`:
   - `from app.core.scheduler import scheduler`
   - `scheduler.start()`

3. ✅ **Agregar** en `.env`:
   ```bash
   ENABLE_SCHEDULER=false
   ```

4. ✅ **Redeploy** en Render

5. ✅ **Verificar** logs que NO aparezca "Scheduler started"

---

**Tiempo estimado:** 5-10 minutos  
**Resultado:** Eliminación total de cron jobs y emails automáticos  
**Backend:** Otro repositorio (NO este frontend)

