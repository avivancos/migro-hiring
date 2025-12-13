# 🔧 Solución: Error NameError en catalog.py

## ❌ Error

```
File "/opt/render/project/src/app/api/endpoints/catalog.py", line 44, in <module>
    db: Session = Depends(deps.get_db),
                          ^^^^
NameError: name 'deps' is not defined
```

## 🔍 Problema

En el archivo `app/api/endpoints/catalog.py`, se está usando `deps.get_db` pero el módulo `deps` no está importado.

## ✅ Solución

Agregar el import de `deps` al inicio del archivo `catalog.py`.

### **Archivo:** `app/api/endpoints/catalog.py`

**Antes (con error):**

```python
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
# ... otros imports ...

@router.get("/catalog")
async def get_catalog(
    db: Session = Depends(deps.get_db),  # ❌ ERROR: deps no está importado
    # ...
):
    # ...
```

**Después (corregido):**

```python
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core import deps  # ✅ AGREGAR ESTE IMPORT
# ... otros imports ...

@router.get("/catalog")
async def get_catalog(
    db: Session = Depends(deps.get_db),  # ✅ Ahora funciona
    # ...
):
    # ...
```

## 📝 Pasos para Corregir

1. **Abrir el archivo:** `app/api/endpoints/catalog.py`

2. **Agregar el import al inicio del archivo:**
   ```python
   from app.core import deps
   ```
   
   O si `deps` está en otro lugar:
   ```python
   from app.api import deps
   ```
   
   O si está en el mismo directorio:
   ```python
   from . import deps
   ```

3. **Verificar que el import esté antes de usar `deps.get_db`**

4. **Verificar la estructura del proyecto:**
   - Si `deps.py` está en `app/core/` → usar `from app.core import deps`
   - Si `deps.py` está en `app/api/` → usar `from app.api import deps`
   - Si `deps.py` está en `app/api/deps.py` → usar `from app.api.deps import get_db` y cambiar `deps.get_db` por `get_db`

## 🔍 Verificar Ubicación de deps.py

Para saber dónde está `deps.py`, buscar en el proyecto:

```bash
find . -name "deps.py" -type f
```

O buscar en el código:

```bash
grep -r "def get_db" app/
```

## 📋 Ejemplo Completo Corregido

```python
# app/api/endpoints/catalog.py

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core import deps  # ✅ IMPORT AGREGADO
from app.schemas.catalog import CatalogItem, CatalogItemCreate
from app.models.catalog import CatalogItem as CatalogItemModel
# ... otros imports ...

router = APIRouter(prefix="/catalog", tags=["Catalog"])

@router.get("/", response_model=List[CatalogItem])
async def get_catalog(
    db: Session = Depends(deps.get_db),  # ✅ Ahora funciona
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
):
    """Obtener lista de items del catálogo"""
    items = db.query(CatalogItemModel).offset(skip).limit(limit).all()
    return items

# ... resto del código ...
```

## ⚠️ Nota Importante

Si después de agregar el import sigue dando error, verificar:

1. **Que `deps.py` existe** en la ubicación especificada
2. **Que `get_db` está definido** en `deps.py`:
   ```python
   # app/core/deps.py (o donde esté)
   def get_db():
       # ... código de get_db
   ```
3. **Que la estructura de directorios es correcta**

## 🚀 Después de Corregir

1. **Hacer commit:**
   ```bash
   git add app/api/endpoints/catalog.py
   git commit -m "Fix: Agregar import de deps en catalog.py"
   git push
   ```

2. **Render desplegará automáticamente** y el error debería desaparecer

---

**Última actualización:** 2025-01-20  
**Error:** NameError: name 'deps' is not defined  
**Solución:** Agregar `from app.core import deps` (o la ruta correcta)




























