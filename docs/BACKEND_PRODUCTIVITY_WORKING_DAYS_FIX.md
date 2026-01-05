# 🔧 Backend: Calcular Métricas de Productividad Solo con Días Laborales

**Fecha**: 2025-01-29  
**Problema**: Las métricas de productividad se calculan usando todos los días del calendario  
**Solución**: Calcular solo con días laborales (lunes a viernes)

---

## 🎯 Problema Identificado

Actualmente, cuando se calcula el `productivity_score` y se determina si un agente cumple con las métricas de productividad para ser aprobado, el sistema está contando **todos los días del calendario** (incluyendo sábados y domingos).

Sin embargo, según el contrato de colaboración (cláusula 3.1 y 3.2), los días laborales efectivos son **solo de lunes a viernes**. Los sábados solo se usan para recuperación de horas pendientes y no deben contar como días laborales regulares para el cálculo de métricas de aprobación.

---

## ✅ Solución Requerida

Modificar el cálculo del `productivity_score` y cualquier métrica relacionada con la aprobación de productividad para que **solo considere días laborales** (lunes a viernes).

---

## 📋 Cambios Necesarios

### 1. Endpoints Afectados

Los siguientes endpoints deben modificarse para excluir sábados y domingos en los cálculos:

- **GET `/api/agent-journal/daily-report`**
  - El `productivity_score` debe calcularse solo considerando días laborales

- **GET `/api/agent-journal/performance-dashboard`**
  - Las comparaciones y promedios deben excluir fines de semana

- **GET `/api/agent-journal/metrics/{user_id}`**
  - Las métricas de aprobación deben usar solo días laborales

### 2. Función Helper Requerida

Crear una función helper para determinar si una fecha es día laboral:

```python
from datetime import datetime, date

def is_working_day(date_obj: date) -> bool:
    """
    Determina si una fecha es día laboral (lunes a viernes).
    
    Args:
        date_obj: Fecha a verificar (date object)
    
    Returns:
        True si es día laboral (lunes=0 a viernes=4), False si es fin de semana
    """
    # weekday() retorna: 0=lunes, 1=martes, ..., 6=domingo
    return date_obj.weekday() < 5  # 0-4 son lunes a viernes
```

### 3. Contar Días Laborales en un Rango

Función para contar días laborales en un período:

```python
def count_working_days(start_date: date, end_date: date) -> int:
    """
    Cuenta los días laborales (lunes a viernes) entre dos fechas, inclusive.
    
    Args:
        start_date: Fecha de inicio
        end_date: Fecha de fin
    
    Returns:
        Número de días laborales en el rango
    """
    count = 0
    current = start_date
    while current <= end_date:
        if is_working_day(current):
            count += 1
        current += timedelta(days=1)
    return count
```

### 4. Filtrado de Journals por Días Laborales

Al calcular promedios, comparaciones o métricas de aprobación, filtrar los journals para incluir solo días laborales:

```python
from sqlalchemy.orm import Session
from app.models.agent_daily_journal import AgentDailyJournal
from datetime import date, timedelta

def get_working_days_journals(
    db: Session,
    user_id: UUID,
    start_date: date,
    end_date: date
) -> List[AgentDailyJournal]:
    """
    Obtiene los journals solo de días laborales en un rango de fechas.
    
    Args:
        db: Sesión de base de datos
        user_id: ID del usuario
        start_date: Fecha de inicio
        end_date: Fecha de fin
    
    Returns:
        Lista de journals solo de días laborales
    """
    journals = db.query(AgentDailyJournal).filter(
        AgentDailyJournal.user_id == user_id,
        AgentDailyJournal.date >= start_date,
        AgentDailyJournal.date <= end_date
    ).all()
    
    # Filtrar solo días laborales
    return [j for j in journals if is_working_day(j.date)]
```

---

## 🔍 Ejemplo de Implementación

### Antes (Incorrecto):

```python
# Calcula promedio usando TODOS los días
journals = db.query(AgentDailyJournal).filter(
    AgentDailyJournal.user_id == user_id,
    AgentDailyJournal.date >= start_date,
    AgentDailyJournal.date <= end_date
).all()

total_days = len(journals)  # ❌ Incluye sábados y domingos
avg_calls = sum(j.total_calls for j in journals) / total_days if total_days > 0 else 0
```

### Después (Correcto):

```python
# Calcula promedio usando SOLO días laborales
journals = get_working_days_journals(db, user_id, start_date, end_date)

working_days_count = len(journals)  # ✅ Solo lunes a viernes
total_working_days = count_working_days(start_date, end_date)

# Calcular promedio considerando días laborales
avg_calls = sum(j.total_calls for j in journals) / working_days_count if working_days_count > 0 else 0

# O calcular porcentaje de cumplimiento
completed_working_days = working_days_count
completion_rate = (completed_working_days / total_working_days * 100) if total_working_days > 0 else 0
```

---

## 📊 Cálculo de Productivity Score

El `productivity_score` debe calcularse basándose en:

1. **Días laborales completados** (con journal) vs **total de días laborales** en el período
2. **Métricas promedio** calculadas solo con días laborales
3. **Comparaciones** con períodos anteriores usando solo días laborales

Ejemplo:

```python
def calculate_productivity_score(
    db: Session,
    user_id: UUID,
    period_start: date,
    period_end: date
) -> float:
    """
    Calcula el productivity_score (0-100) basado solo en días laborales.
    
    Returns:
        Score de 0 a 100, o None si no hay datos suficientes
    """
    # Obtener journals solo de días laborales
    journals = get_working_days_journals(db, user_id, period_start, period_end)
    
    if not journals:
        return None
    
    # Contar días laborales totales en el período
    total_working_days = count_working_days(period_start, period_end)
    completed_working_days = len(journals)
    
    # Porcentaje de días laborales completados
    completion_rate = (completed_working_days / total_working_days * 100) if total_working_days > 0 else 0
    
    # Calcular métricas promedio (solo días laborales)
    avg_calls = sum(j.total_calls for j in journals) / len(journals)
    avg_call_time = sum(j.total_call_time_seconds for j in journals) / len(journals)
    avg_tasks = sum(j.tasks_completed for j in journals) / len(journals)
    
    # Métricas mínimas requeridas (según contrato)
    MIN_CALL_TIME_SECONDS = 4 * 3600  # 4 horas = 14400 segundos
    MIN_TASKS = 3  # Ejemplo
    
    # Calcular score basado en cumplimiento
    calls_score = min(100, (avg_calls / 20) * 100) if avg_calls > 0 else 0
    time_score = min(100, (avg_call_time / MIN_CALL_TIME_SECONDS) * 100) if avg_call_time > 0 else 0
    tasks_score = min(100, (avg_tasks / MIN_TASKS) * 100) if avg_tasks > 0 else 0
    
    # Score final: promedio ponderado
    final_score = (completion_rate * 0.3 + calls_score * 0.3 + time_score * 0.3 + tasks_score * 0.1)
    
    return round(final_score, 2)
```

---

## 📝 Notas Importantes

1. **Días Laborales Definidos**: Lunes a viernes (weekday 0-4)
   - Sábados y domingos se excluyen completamente de los cálculos

2. **Sábados de Recuperación**: Aunque los sábados pueden usarse para recuperar horas, **NO cuentan como días laborales regulares** para métricas de aprobación

3. **Períodos de Cálculo**:
   - **Hoy**: Solo cuenta si es día laboral
   - **Semana**: Lunes a viernes de la semana actual
   - **Mes**: Todos los días laborales del mes

4. **Compatibilidad**: Mantener compatibilidad con el frontend - el `productivity_score` sigue siendo un número de 0-100 o null

---

## 🧪 Testing

Probar los siguientes escenarios:

1. **Semana completa**: Lunes a viernes debe retornar 5 días laborales
2. **Semana con fin de semana**: Lunes a domingo debe retornar 5 días laborales (excluye sábado y domingo)
3. **Mes completo**: Calcular correctamente días laborales excluyendo fines de semana
4. **Período cruzado**: Calcular correctamente cuando el período cruza semanas

Ejemplo de test:

```python
def test_count_working_days():
    # Lunes a viernes (5 días)
    start = date(2025, 1, 27)  # Lunes
    end = date(2025, 1, 31)    # Viernes
    assert count_working_days(start, end) == 5
    
    # Lunes a domingo (5 días laborales)
    start = date(2025, 1, 27)  # Lunes
    end = date(2025, 2, 2)     # Domingo
    assert count_working_days(start, end) == 5  # Excluye sábado y domingo
```

---

## 🔗 Referencias

- Contrato de colaboración: `src/legal/agente_ventas_agreement.md` (Cláusulas 3.1, 3.2)
- Documentación frontend: `docs/FRONTEND_AGENT_JOURNAL_IMPLEMENTATION.md`
- Endpoints relacionados: `docs/BACKEND_AGENT_JOURNAL_SIGN_AND_EMAIL.md`

---

**Última actualización**: 2025-01-29  
**Prioridad**: Alta  
**Estado**: Pendiente de implementación
