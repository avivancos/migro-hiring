# 💾 Almacenamiento de Análisis de Pili en Base de Datos del Backend

## 🎯 Objetivo

El backend debe almacenar los análisis de Pili en la **base de datos del backend** (PostgreSQL) para:
- ✅ Evitar llamadas redundantes a Pili cuando ya existe un análisis previo
- ✅ Mejorar rendimiento: retornar análisis existente en < 100ms (vs 30+ segundos)
- ✅ Permitir reanálisis cuando el usuario lo solicite explícitamente
- ✅ Mantener historial de análisis para cada oportunidad

---

## 📊 Esquema de Base de Datos

### **Tabla: `case_analyses`**

```sql
CREATE TABLE case_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relación con oportunidad
    opportunity_id UUID NOT NULL REFERENCES lead_opportunities(id) ON DELETE CASCADE,
    
    -- Calificaciones principales
    score INTEGER NOT NULL, -- 1-100
    grading VARCHAR(10) NOT NULL, -- 'A' | 'B+' | 'B-' | 'C'
    
    -- Análisis estructurado (JSONB)
    sales_feasibility JSONB NOT NULL,
    human_analysis_issues JSONB NOT NULL,
    analysis_summary TEXT NOT NULL,
    
    -- Análisis de Pili (JSONB, nullable si Pili no está disponible)
    pili_analysis JSONB,
    pili_payload JSONB, -- Payload enviado a Pili (para debugging/reanálisis)
    
    -- Versión del algoritmo de análisis
    analysis_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    
    -- Metadatos
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Índices
    CONSTRAINT case_analyses_opportunity_fk FOREIGN KEY (opportunity_id) 
        REFERENCES lead_opportunities(id) ON DELETE CASCADE
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_case_analyses_opportunity_id ON case_analyses(opportunity_id);
CREATE INDEX idx_case_analyses_created_at ON case_analyses(created_at DESC);
CREATE INDEX idx_case_analyses_latest ON case_analyses(opportunity_id, created_at DESC);
```

**Estructura JSONB esperada:**

```json
{
  "sales_feasibility": {
    "can_sell": true,
    "confidence": 0.85,
    "reasons": ["Tiene trabajo", "Lleva más de 2 años"],
    "recommended_service": "Residencia Legal",
    "estimated_price_range": { "min": 500, "max": 1500 }
  },
  "human_analysis_issues": {
    "issues": ["Falta información de nacionalidad"],
    "severity": "low",
    "recommendations": ["Completar datos del contacto"]
  },
  "pili_analysis": {
    "available": true,
    "limited_analysis": { ... },
    "unlimited_analysis": { ... },
    "comparison": { ... },
    "recommended_analysis": "...",
    "processing_time": 15.5
  }
}
```

---

## 🔌 Lógica del Endpoint

### **POST `/api/crm/opportunities/{opportunity_id}/analyze`**

**Comportamiento requerido:**

1. **Si `force_reanalyze=false` (default):**
   - Buscar si existe un análisis previo para esta oportunidad (el más reciente)
   - Si existe → Retornar el análisis existente inmediatamente (sin llamar a Pili)
   - Si no existe → Generar nuevo análisis y guardarlo en DB

2. **Si `force_reanalyze=true`:**
   - Generar nuevo análisis siempre
   - Guardar el nuevo análisis en DB
   - Retornar el nuevo análisis

3. **Guardar siempre en DB:**
   - Cada análisis generado debe guardarse en la tabla `case_analyses`
   - Incluir tanto el análisis básico como el de Pili (si está disponible)
   - Guardar el payload enviado a Pili para debugging

**Código de ejemplo:**

```python
@router.post("/opportunities/{opportunity_id}/analyze")
async def analyze_opportunity(
    opportunity_id: UUID,
    force_reanalyze: bool = Query(False, description="Forzar reanálisis"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Verificar oportunidad existe
    opportunity = await db.get(LeadOpportunity, opportunity_id)
    if not opportunity:
        raise HTTPException(404, "Oportunidad no encontrada")
    
    # 2. Si no se fuerza, buscar análisis existente
    if not force_reanalyze:
        stmt = (
            select(CaseAnalysis)
            .where(CaseAnalysis.opportunity_id == opportunity_id)
            .order_by(desc(CaseAnalysis.created_at))
            .limit(1)
        )
        existing = (await db.execute(stmt)).scalar_one_or_none()
        
        if existing:
            # Retornar análisis existente (rápido, sin llamar a Pili)
            return format_analysis_response(existing, from_cache=True)
    
    # 3. Generar nuevo análisis
    try:
        # Análisis básico
        basic_analysis = await generate_basic_analysis(opportunity, db)
        
        # Análisis de Pili (con timeout)
        pili_analysis = None
        pili_payload = build_pili_payload(opportunity, db)
        
        try:
            pili_analysis = await asyncio.wait_for(
                call_pili_api(pili_payload),
                timeout=25.0
            )
        except asyncio.TimeoutError:
            pili_analysis = {"available": False, "error": "Timeout"}
        except Exception as e:
            pili_analysis = {"available": False, "error": str(e)}
        
        # 4. Guardar en base de datos
        new_analysis = CaseAnalysis(
            opportunity_id=opportunity_id,
            score=basic_analysis['score'],
            grading=basic_analysis['grading'],
            sales_feasibility=basic_analysis['sales_feasibility'],
            human_analysis_issues=basic_analysis['human_analysis_issues'],
            analysis_summary=basic_analysis['analysis_summary'],
            pili_analysis=pili_analysis,
            pili_payload=pili_payload,
            analysis_version='1.0.0',
            created_by=current_user.id,
        )
        
        db.add(new_analysis)
        await db.commit()
        await db.refresh(new_analysis)
        
        return format_analysis_response(new_analysis, from_cache=False)
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(500, f"Error generando análisis: {str(e)}")
```

---

## 📋 Endpoints Adicionales Recomendados

### **GET `/api/crm/opportunities/{opportunity_id}/analysis`**
Retornar el análisis más reciente de una oportunidad.

### **GET `/api/crm/opportunities/{opportunity_id}/analyses`**
Retornar historial de análisis (útil para ver evolución).

---

## ⚠️ Puntos Importantes

1. **Almacenamiento en Backend:** Los análisis se guardan en la base de datos PostgreSQL del backend, NO en el frontend.

2. **Timeout de Pili:** Si Pili tarda más de 25 segundos, guardar el análisis básico sin Pili y retornar error en `pili_analysis.error`.

3. **Reanálisis:** Siempre crear un nuevo registro en DB cuando se fuerza reanálisis (no sobrescribir).

4. **Relaciones:** Cada análisis está vinculado a una oportunidad. Si se elimina la oportunidad, se eliminan sus análisis (CASCADE).

---

## ✅ Checklist de Implementación

- [ ] Crear migración para tabla `case_analyses`
- [ ] Crear modelo SQLAlchemy `CaseAnalysis`
- [ ] Actualizar endpoint `POST /opportunities/{id}/analyze`:
  - [ ] Buscar análisis existente si `force_reanalyze=False`
  - [ ] Retornar análisis existente si existe
  - [ ] Generar y guardar nuevo análisis si no existe o si `force_reanalyze=True`
  - [ ] Manejar timeout de Pili (25 segundos)
- [ ] Testing: Verificar que se retorna análisis existente rápidamente
- [ ] Testing: Verificar que se crea nuevo análisis cuando se fuerza reanálisis

---

**Prioridad:** ALTA  
**Impacto:** Mejora significativa de rendimiento (de 30+ segundos a < 100ms cuando existe análisis previo)
