# 🚨 SOLUCIÓN INMEDIATA - Dejar de recibir emails

## El problema

Los emails de "informe de cola" vienen del **BACKEND** (servidor Python), NO del frontend (este repositorio).

---

## ⚡ SOLUCIÓN EN 2 MINUTOS

### **Acceso al backend:**
1. Abre el repositorio/archivos del **BACKEND** (Python/FastAPI)
2. Busca el archivo que maneja cron jobs o schedulers
3. Comenta o elimina las líneas que envían emails frecuentes

### **Archivos a buscar en el backend:**
```
backend/
├── app/core/scheduler.py    ← Buscar aquí
├── app/core/tasks.py        ← O aquí
├── app/main.py              ← O aquí (donde se inicia el scheduler)
└── .env                     ← Agregar: ENABLE_SCHEDULER=false
```

### **Código a comentar:**
```python
# ❌ COMENTAR ESTO:
@scheduler.scheduled_job(CronTrigger(minute='*'), id='queue_report')
@scheduler.scheduled_job(CronTrigger(hour='*'), id='hourly_report')
```

### **O agregar en .env:**
```bash
ENABLE_SCHEDULER=false
```

---

## 📧 ¿Quién tiene acceso al backend?

Si no tienes acceso, contacta a quien maneja el código del backend en:
- `https://api.migro.es` (servidor del backend)

---

## ✅ Ver documentación completa

- `INSTRUCCIONES_INMEDIATAS_BACKEND.md` ⚡
- `BACKEND_DESACTIVAR_INFORME_COLA.md`

