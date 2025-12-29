# Error: ModuleNotFoundError - app.services.pili_integration

## 📋 Resumen

El backend está fallando al iniciar porque el módulo `app.services.pili_integration` no existe o no está disponible.

## 🔍 Error Detectado

```
ModuleNotFoundError: No module named 'app.services.pili_integration'
```

### Stack Trace

```
File "/opt/render/project/src/app/api/endpoints/legal_qa.py", line 24, in <module>
    from app.services.pili_integration import get_pili_response_for_question, auto_respond_to_new_question
ModuleNotFoundError: No module named 'app.services.pili_integration'
```

## 🎯 Soluciones Posibles

### Opción 1: Crear el módulo faltante

Si el módulo debería existir pero falta, crear el archivo:

**Ubicación:** `app/services/pili_integration.py`

**Contenido mínimo:**
```python
"""
PILI Integration Service
Servicio para integración con PILI (sistema de IA legal)
"""

def get_pili_response_for_question(question: str, context: dict = None):
    """
    Obtener respuesta de PILI para una pregunta
    
    Args:
        question: Pregunta del usuario
        context: Contexto adicional (opcional)
    
    Returns:
        str: Respuesta de PILI
    """
    # TODO: Implementar integración con PILI
    return "Respuesta de PILI (no implementado aún)"


def auto_respond_to_new_question(question_id: str, question: str):
    """
    Responder automáticamente a una nueva pregunta usando PILI
    
    Args:
        question_id: ID de la pregunta
        question: Texto de la pregunta
    """
    # TODO: Implementar respuesta automática con PILI
    pass
```

### Opción 2: Hacer la importación opcional

Si PILI es opcional, modificar `app/api/endpoints/legal_qa.py`:

**Antes:**
```python
from app.services.pili_integration import get_pili_response_for_question, auto_respond_to_new_question
```

**Después:**
```python
try:
    from app.services.pili_integration import get_pili_response_for_question, auto_respond_to_new_question
    PILI_AVAILABLE = True
except ImportError:
    PILI_AVAILABLE = False
    # Funciones stub
    def get_pili_response_for_question(question: str, context: dict = None):
        return "Servicio PILI no disponible"
    
    def auto_respond_to_new_question(question_id: str, question: str):
        pass
```

Y luego usar `PILI_AVAILABLE` para verificar si está disponible antes de usar las funciones.

### Opción 3: Comentar temporalmente la importación

Si PILI no es crítico para el funcionamiento, comentar temporalmente:

**En `app/api/endpoints/legal_qa.py`:**
```python
# TODO: Implementar módulo pili_integration
# from app.services.pili_integration import get_pili_response_for_question, auto_respond_to_new_question

# Funciones temporales
def get_pili_response_for_question(question: str, context: dict = None):
    return "Servicio PILI no implementado"

def auto_respond_to_new_question(question_id: str, question: str):
    pass
```

## 🔍 Verificación

Para verificar qué archivos existen en `app/services/`:

```bash
ls -la app/services/
```

O en el servidor:
```bash
find app/services -name "*.py" -type f
```

## 📝 Notas

1. **Ubicación del error**: `app/api/endpoints/legal_qa.py` línea 24
2. **Módulo faltante**: `app.services.pili_integration`
3. **Funciones requeridas**:
   - `get_pili_response_for_question`
   - `auto_respond_to_new_question`

## ✅ Acción Requerida

1. Verificar si el archivo `app/services/pili_integration.py` existe
2. Si no existe, crear el módulo con las funciones requeridas
3. Si PILI es opcional, hacer la importación condicional
4. Si PILI no es necesario ahora, comentar temporalmente la importación

## 🔄 Estado

- ❌ **Error**: Backend no puede iniciar
- ⏳ **Pendiente**: Crear o corregir módulo `pili_integration`












