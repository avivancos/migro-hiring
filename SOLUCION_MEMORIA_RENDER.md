# 🚨 SOLUCIÓN: Web Service migrofast excedió su límite de memoria

## ⚠️ Problema

El servicio **"migrofast"** en Render está excediendo su límite de memoria, causando:
- Reinicios automáticos
- Tiempos de inactividad
- Pérdida de datos temporales

---

## ✅ SOLUCIONES

### **1. Optimizar Uso de Memoria en el Backend** (RECOMENDADO)

#### **A. Limitar Conexiones a Base de Datos**

```python
# En tu archivo de configuración de base de datos
DATABASE_POOL_SIZE = 5      # Reducir de 10 a 5
DATABASE_MAX_OVERFLOW = 10   # Reducir conexiones extra
DATABASE_POOL_RECYCLE = 300  # Reciclar conexiones cada 5 min
```

#### **B. Limpiar Archivos Temporales**

```python
import os
import shutil
from pathlib import Path

# Limpiar archivos temporales periódicamente
def cleanup_temp_files():
    temp_dir = Path("/tmp")
    for file in temp_dir.glob("*.pdf"):
        if file.stat().st_mtime < (time.time() - 3600):  # Archivos > 1 hora
            file.unlink()
    
    # Limpiar caché de contratos
    cache_dir = Path("/tmp/contracts")
    if cache_dir.exists():
        shutil.rmtree(cache_dir, ignore_errors=True)
```

#### **C. Optimizar Generación de PDFs**

```python
# En lugar de generar PDFs en memoria, usar archivos temporales
from tempfile import NamedTemporaryFile

def generate_contract_pdf(data):
    # Crear archivo temporal en disco, no en RAM
    with NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
        # Generar PDF directamente al archivo
        doc.save(temp_file.name)
        return temp_file.name
    
    # IMPORTANTE: Limpiar archivo después de enviarlo
    # os.unlink(temp_file.name)  # Eliminar después de enviar por email
```

---

### **2. Desactivar Cron Jobs que Consumen Memoria**

Los cron jobs automáticos pueden acumular memoria. Desactívalos temporalmente:

```bash
# En el .env del backend:
ENABLE_SCHEDULER=false
ENABLE_QUEUE_REPORTS=false
ENABLE_DAILY_SUMMARY=false
```

O comentar en el código:

```python
# En app/core/scheduler.py

# ❌ DESACTIVAR temporalmente:
# @scheduler.scheduled_job(CronTrigger(minute='*'), id='queue_report')
# def send_queue_report():
#     pass

# ✅ MANTENER SOLO esto si es esencial:
@scheduler.scheduled_job(CronTrigger(hour=23, minute=59), id='daily_summary')
def send_daily_summary():
    # Tu código
    pass
```

---

### **3. Configurar Variables de Entorno en Render**

Ve a **Render Dashboard** → **Service "migrofast"** → **Environment** y agrega:

```bash
# Optimización de memoria
PYTHONUNBUFFERED=1
MALLOC_ARENA_MAX=2

# Desactivar servicios innecesarios
ENABLE_SCHEDULER=false

# Límites para el procesador
WORKERS=1
WORKER_CONNECTIONS=10
```

---

### **4. Cambiar el Plan de Render** (Si es necesario)

Si el problema persiste:

1. Ve a **Render Dashboard** → **Service "migrofast"**
2. Click en **"Settings"**
3. En **"Instance Type"**, cambia de:
   - ❌ **Starter** (512MB RAM)
   - ✅ **Standard** (1GB RAM) - $7/mes
   - O **Pro** (2GB RAM) - $25/mes

---

## 🔍 Identificar la Causa

### **Ver logs de Render:**

```bash
# En Render Dashboard → Logs del servicio "migrofast"
# Busca:
- "Out of memory"
- "Memory limit exceeded"
- "Killed process"
```

### **Agregar logging de memoria:**

```python
import psutil
import logging

logger = logging.getLogger(__name__)

# Monitorear memoria
def log_memory_usage():
    process = psutil.Process()
    memory_mb = process.memory_info().rss / 1024 / 1024
    logger.info(f"Memory usage: {memory_mb:.2f} MB")
```

---

## 📋 Checklist de Acciones Inmediatas

- [ ] Desactivar cron jobs innecesarios (agregar `ENABLE_SCHEDULER=false`)
- [ ] Reducir pool de conexiones a la base de datos
- [ ] Limpiar archivos temporales periódicamente
- [ ] Optimizar generación de PDFs (usar archivos temporales)
- [ ] Configurar variables de entorno en Render
- [ ] Monitorear logs para identificar picos de memoria
- [ ] Considerar upgrade de plan si es necesario

---

## ⏰ Solución Temporal Inmediata

**Agregar en el .env del backend:**

```bash
ENABLE_SCHEDULER=false
ENABLE_QUEUE_REPORTS=false
```

Esto desactivará los cron jobs que pueden estar consumiendo memoria.

---

**Servicio afectado:** migrofast  
**URL Render:** https://dashboard.render.com  
**Archivo de configuración:** Backend `.env`  
**Solución rápida:** UniformlyDeshabilitar scheduler

