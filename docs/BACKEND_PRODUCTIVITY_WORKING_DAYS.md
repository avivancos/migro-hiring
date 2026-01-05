# 📊 Backend: Cálculo de Días Laborales para Métricas de Productividad

**Fecha**: 2025-01-29  
**Requisito**: Para aprobar las métricas de productividad, se debe calcular solo los días laborales (lunes a viernes)

---

## 🎯 Resumen

El cálculo de las métricas de productividad y la aprobación de las mismas debe considerar únicamente los **días laborales** (lunes a viernes), excluyendo fines de semana (sábados y domingos).

Según el Convenio de Colaboración (Cláusula 3.1 y 3.2):
- Los días laborales efectivos son de **lunes a viernes**
- Se permite trabajar los sábados para recuperar horas, pero esto no afecta el cálculo de días para aprobar métricas
- Para efectos de aprobación de métricas de productividad, solo se cuentan los días laborales

---

## 📋 Requisitos

### Cálculo de Días para Aprobar Métricas

Cuando se calculen las métricas de productividad o se determine si un agente cumple con los requisitos mínimos, se debe:

1. **Contar solo días laborales** (lunes a viernes) en el período evaluado
2. **Excluir sábados y domingos** del conteo de días
3. Aplicar este cálculo en:
   - Cálculo del `productivity_score`
   - Determinación de días mínimos requeridos para aprobar
   - Cualquier métrica que dependa del número de días trabajados

### Ejemplo

Si se evalúa un período de 14 días calendario:
- **Días totales**: 14 días
- **Días laborales** (lunes-viernes): ~10 días (dependiendo del inicio del período)
- **Días a usar para cálculo**: 10 días laborales (NO 14 días calendario)

---

## 🔧 Implementación Backend

### Función para Calcular Días Laborales

```python
from datetime import datetime, timedelta
from typing import Optional

def count_working_days(start_date: datetime, end_date: datetime) -> int:
    """
    Calcula el número de días laborales (lunes a viernes) entre dos fechas.
    
    Args:
        start_date: Fecha de inicio (incluida)
        end_date: Fecha de fin (incluida)
    
    Returns:
        Número de días laborales entre las fechas
    """
    if start_date > end_date:
        return 0
    
    working_days = 0
    current_date = start_date.date() if isinstance(start_date, datetime) else start_date
    end = end_date.date() if isinstance(end_date, datetime) else end_date
    
    while current_date <= end:
        # 0 = lunes, 4 = viernes
        weekday = current_date.weekday()
        if weekday < 5:  # Lunes a viernes (0-4)
            working_days += 1
        current_date += timedelta(days=1)
    
    return working_days


def is_working_day(date: datetime | date) -> bool:
    """
    Verifica si una fecha es un día laboral (lunes a viernes).
    
    Args:
        date: Fecha a verificar
    
    Returns:
        True si es día laboral, False si es fin de semana
    """
    if isinstance(date, datetime):
        date = date.date()
    
    weekday = date.weekday()
    return weekday < 5  # 0-4 = lunes a viernes
```

### Uso en Cálculo de Productivity Score

```python
from datetime import date, timedelta
from app.utils.working_days import count_working_days

def calculate_productivity_score(
    user_id: str,
    start_date: date,
    end_date: date,
    db: Session
) -> float | None:
    """
    Calcula el productivity_score considerando solo días laborales.
    """
    # Contar días laborales en el período
    working_days_count = count_working_days(start_date, end_date)
    
    if working_days_count == 0:
        return None
    
    # Obtener journals del período (solo días laborales)
    journals = db.query(AgentDailyJournal).filter(
        AgentDailyJournal.user_id == user_id,
        AgentDailyJournal.date >= start_date,
        AgentDailyJournal.date <= end_date
    ).all()
    
    # Filtrar solo días laborales (por si acaso)
    working_journals = [
        j for j in journals 
        if is_working_day(j.date)
    ]
    
    if not working_journals:
        return None
    
    # Calcular métricas promedio por día laboral
    total_call_time = sum(j.total_call_time_seconds for j in working_journals)
    total_calls = sum(j.total_calls for j in working_journals)
    total_tasks = sum(j.tasks_completed for j in working_journals)
    
    # Promedio por día laboral
    avg_call_time = total_call_time / working_days_count
    avg_calls = total_calls / working_days_count
    avg_tasks = total_tasks / working_days_count
    
    # Calcular score basado en promedios por día laboral
    # (lógica específica según requisitos de negocio)
    score = calculate_score_from_metrics(avg_call_time, avg_calls, avg_tasks)
    
    return score
```

---

## 📝 Cambios Requeridos en el Backend

### Endpoints Afectados

1. **GET `/api/agent-journal/daily-report`**
   - El cálculo de `productivity_score` debe usar días laborales

2. **GET `/api/agent-journal/performance-dashboard`**
   - Las métricas del período deben calcularse usando días laborales

3. **GET `/api/agent-journal/metrics/{user_id}`**
   - Las métricas del agente deben usar días laborales

### Validación

Cuando se determine si un agente cumple con los requisitos mínimos:

```python
# ❌ INCORRECTO - Cuenta todos los días
total_days = (end_date - start_date).days + 1
min_required_days = total_days * 0.8  # 80% de días calendario

# ✅ CORRECTO - Cuenta solo días laborales
working_days = count_working_days(start_date, end_date)
min_required_days = working_days * 0.8  # 80% de días laborales
```

---

## 📚 Referencias

- **Convenio de Colaboración**: Cláusula 3.1 y 3.2
  - Días laborales: Lunes a viernes
  - Sábados: Solo para recuperación de horas, no cuentan para aprobación

---

## ✅ Checklist de Implementación

- [ ] Crear función `count_working_days()` en utils
- [ ] Crear función `is_working_day()` en utils
- [ ] Actualizar cálculo de `productivity_score` para usar días laborales
- [ ] Actualizar endpoint `daily-report` para calcular con días laborales
- [ ] Actualizar endpoint `performance-dashboard` para calcular con días laborales
- [ ] Actualizar endpoint `metrics/{user_id}` para calcular con días laborales
- [ ] Agregar tests unitarios para funciones de días laborales
- [ ] Actualizar documentación de API si es necesario

---

**Última actualización**: 2025-01-29  
**Versión**: 1.0
