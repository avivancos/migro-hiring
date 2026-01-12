# 🔴 Backend: Endpoint Público para Anexos - REQUERIDO

**Fecha**: 2025-01-30  
**Prioridad**: 🔴 CRÍTICA  
**Estado**: ⏳ Pendiente  
**Módulo**: Backend - Hiring Codes / Contratos

---

## 📋 Resumen

El backend **YA TIENE** los endpoints admin implementados, pero **FALTA** un endpoint público para que los clientes puedan ver los anexos en el flujo de contratación (`/contratacion/{code}`).

---

## 🎯 Problema Actual

El frontend intenta cargar anexos en el flujo público usando:
- `GET /hiring/{code}/annexes` (endpoint público - **NO EXISTE**)
- Fallback a `GET /admin/hiring/{code}/annexes` (requiere autenticación admin)

**Problema**: En el flujo público no podemos usar el endpoint admin porque requiere `X-Admin-Password`.

---

## ✅ Solución Recomendada (Opción 1 - MEJOR)

### Incluir anexos en `GET /hiring/{code}`

**Modificar el endpoint existente** `GET /hiring/{code}` para incluir los anexos en la respuesta.

**Ubicación**: `app/api/endpoints/hiring.py` (o donde esté el endpoint público)

**Cambio necesario**:
```python
@router.get("/hiring/{code}", response_model=schemas.HiringDetailsResponse)
async def get_hiring_details(code: str, db: Session = Depends(get_db)):
    """Obtener detalles de un código de contratación (público)"""
    # ... código existente ...
    
    # Obtener anexos asociados
    annexes = db.query(models.ContractAnnex).filter(
        models.ContractAnnex.hiring_code == code
    ).order_by(models.ContractAnnex.created_at.asc()).all()
    
    # Convertir anexos a formato simple
    annexes_data = [
        {
            "id": annex.id,
            "title": annex.title,
            "content": annex.content
        }
        for annex in annexes
    ]
    
    # Incluir anexos en la respuesta
    response_data = {
        # ... todos los campos existentes ...
        "annexes": annexes_data  # ← AGREGAR ESTE CAMPO
    }
    
    return response_data
```

**Schema a actualizar**: `schemas.HiringDetailsResponse` debe incluir:
```python
annexes: Optional[List[ContractAnnexSimple]] = None
```

Donde `ContractAnnexSimple` es:
```python
class ContractAnnexSimple(BaseModel):
    id: int
    title: str
    content: str
```

**Ventajas**:
- ✅ Una sola llamada al backend
- ✅ Los anexos ya vienen con los detalles del contrato
- ✅ No requiere endpoint adicional
- ✅ Mejor rendimiento

---

## ✅ Solución Alternativa (Opción 2)

### Crear endpoint público `GET /hiring/{code}/annexes`

Si no es posible modificar el endpoint existente, crear un endpoint público nuevo.

**Ubicación**: `app/api/endpoints/hiring.py` (o donde esté el router público)

**Implementación**:
```python
@router.get("/hiring/{hiring_code}/annexes", response_model=List[schemas.ContractAnnexPublicResponse])
async def get_annexes_public(
    hiring_code: str,
    db: Session = Depends(get_db)
):
    """Obtener todos los anexos de un código de contratación (endpoint público)"""
    # Verificar que el hiring code existe
    hiring = db.query(models.Hiring).filter(models.Hiring.hiring_code == hiring_code).first()
    if not hiring:
        raise HTTPException(status_code=404, detail="Código de contratación no encontrado")
    
    # Obtener anexos
    annexes = db.query(models.ContractAnnex).filter(
        models.ContractAnnex.hiring_code == hiring_code
    ).order_by(models.ContractAnnex.created_at.asc()).all()
    
    return annexes
```

**Schema**:
```python
class ContractAnnexPublicResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

**Nota**: Este endpoint NO debe requerir autenticación.

---

## 🔍 Verificación

### Verificar que funciona:

1. **Opción 1 (Recomendada)**:
   ```bash
   curl -X GET "https://api.migro.es/api/hiring/69GS3"
   ```
   Debe incluir campo `annexes` en la respuesta.

2. **Opción 2 (Alternativa)**:
   ```bash
   curl -X GET "https://api.migro.es/api/hiring/69GS3/annexes"
   ```
   Debe retornar lista de anexos sin requerir autenticación.

---

## 📝 Notas Importantes

1. **Orden de anexos**: Los anexos deben ordenarse por `created_at` ascendente (más antiguos primero) para mantener el orden de creación.

2. **Seguridad**: El endpoint público solo debe devolver anexos asociados al hiring code. No debe permitir acceso a anexos de otros contratos.

3. **Performance**: Si hay muchos anexos, considerar paginación (aunque normalmente serán pocos).

---

## ✅ Checklist de Implementación Backend

- [ ] **Opción 1 (Recomendada)**: Modificar `GET /hiring/{code}` para incluir `annexes` en la respuesta
  - [ ] Actualizar schema `HiringDetailsResponse` para incluir `annexes`
  - [ ] Crear schema `ContractAnnexSimple` (solo id, title, content)
  - [ ] Modificar endpoint para cargar y devolver anexos
  - [ ] Probar que los anexos aparecen en la respuesta

- [ ] **Opción 2 (Alternativa)**: Crear endpoint público `GET /hiring/{code}/annexes`
  - [ ] Crear schema `ContractAnnexPublicResponse`
  - [ ] Implementar endpoint sin autenticación
  - [ ] Registrar ruta en router público
  - [ ] Probar que funciona sin autenticación

---

**Prioridad**: 🔴 CRÍTICA  
**Estimación**: 30 minutos - 1 hora  
**Dependencias**: Tabla `contract_annexes` debe existir (migración aplicada)
