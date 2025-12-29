# 📝 Prompt para Agente Backend: Almacenamiento de Análisis de Pili

## 🎯 Tarea Principal

El endpoint `POST /api/crm/opportunities/{opportunity_id}/analyze` está dando timeout (30 segundos) porque cada vez que se llama, está generando un análisis completo y llamando a Pili (que puede tardar mucho).

**Solución:** Almacenar los análisis en la base de datos del backend para evitar llamadas redundantes a Pili.

---

## ✅ Requisitos

1. **Crear tabla `case_analyses`** en PostgreSQL para almacenar análisis:
   - `id`, `opportunity_id`, `score`, `grading`
   - `sales_feasibility` (JSONB), `human_analysis_issues` (JSONB), `analysis_summary` (TEXT)
   - `pili_analysis` (JSONB, nullable), `pili_payload` (JSONB, nullable)
   - `analysis_version`, `created_at`, `updated_at`, `created_by`

2. **Modificar endpoint `POST /opportunities/{id}/analyze`:**
   - Agregar parámetro query `force_reanalyze` (boolean, default: false)
   - Si `force_reanalyze=False` y existe análisis previo → retornar el existente (sin llamar a Pili)
   - Si `force_reanalyze=True` o no existe → generar nuevo análisis y guardarlo en DB
   - **SIEMPRE guardar** el análisis generado en la tabla `case_analyses`

3. **Manejo de timeout de Pili:**
   - Si Pili tarda más de 25 segundos, guardar análisis básico sin Pili
   - Incluir error en `pili_analysis.error` si falla

4. **Relación con oportunidad:**
   - Cada análisis está vinculado a `opportunity_id`
   - Si se elimina la oportunidad, eliminar sus análisis (CASCADE)

---

## 📋 Estructura de Datos

```python
# Modelo SQLAlchemy
class CaseAnalysis(Base):
    __tablename__ = "case_analyses"
    
    id: UUID
    opportunity_id: UUID (FK -> lead_opportunities.id, CASCADE)
    score: int (1-100)
    grading: str ('A' | 'B+' | 'B-' | 'C')
    sales_feasibility: JSONB
    human_analysis_issues: JSONB
    analysis_summary: TEXT
    pili_analysis: JSONB (nullable)
    pili_payload: JSONB (nullable)
    analysis_version: str
    created_at: TIMESTAMP
    updated_at: TIMESTAMP
    created_by: UUID (FK -> users.id)
```

---

## 🔄 Flujo de Lógica

```
POST /opportunities/{id}/analyze?force_reanalyze=false

1. ¿Existe análisis previo para esta oportunidad?
   └─ SÍ → Retornar análisis existente (fin, < 100ms)
   └─ NO → Continuar

2. Generar análisis básico (sin Pili)

3. Intentar llamar a Pili (con timeout de 25s)
   └─ Éxito → Incluir análisis de Pili
   └─ Timeout/Error → Incluir error en pili_analysis.error

4. Guardar análisis completo en tabla case_analyses

5. Retornar análisis generado
```

---

## 📚 Documentación Completa

Ver archivo: `docs/BACKEND_PILI_ANALYSIS_STORAGE.md` para:
- Esquema SQL completo
- Código de ejemplo del endpoint
- Estructura de JSONB esperada
- Endpoints adicionales recomendados

---

**Prioridad:** ALTA  
**Impacto:** Mejora rendimiento de 30+ segundos a < 100ms cuando existe análisis previo

