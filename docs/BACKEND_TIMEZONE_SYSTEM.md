# Sistema de Gestión de Zonas Horarias

## Resumen

El sistema de gestión de zonas horarias permite que los agentes trabajen desde cualquier ubicación mientras el sistema interno siempre utiliza la zona horaria de Madrid (Europe/Madrid) como referencia base.

**Fecha de implementación:** 2025-01-28  
**Estado:** ✅ Implementado

---

## Arquitectura

### Zona Horaria del Sistema

- **Zona horaria base**: `Europe/Madrid`
- **Almacenamiento**: Todas las fechas se almacenan en UTC en la base de datos
- **Procesamiento**: El sistema procesa todas las fechas usando Madrid como referencia

### Zona Horaria del Usuario

- Los usuarios pueden configurar su zona horaria personal en sus ajustes
- Esta configuración solo afecta la visualización de fechas en el frontend
- El backend siempre procesa fechas usando Madrid como referencia

---

## Componentes Implementados

### 1. Módulo de Utilidades (`app/utils/timezone.py`)

Proporciona funciones para:
- Obtener la zona horaria del sistema (Madrid)
- Convertir fechas entre zonas horarias
- Formatear fechas para mostrar al usuario
- Obtener lista de zonas horarias disponibles

**Funciones principales:**
- `now_madrid()`: Obtiene la fecha/hora actual en Madrid
- `to_madrid(dt)`: Convierte un datetime a Madrid
- `to_user_timezone(dt, user_tz)`: Convierte a zona horaria del usuario
- `from_user_timezone_to_madrid(dt, user_tz)`: Convierte desde zona del usuario a Madrid
- `format_datetime_for_user(dt, user_tz)`: Formatea para mostrar al usuario
- `get_available_timezones()`: Obtiene lista de zonas horarias disponibles
- `validate_timezone(timezone)`: Valida que una zona horaria sea válida

**Ejemplo de uso:**
```python
from app.utils.timezone import now_madrid, to_user_timezone

# Obtener hora actual en Madrid
current_time = now_madrid()

# Convertir a zona del usuario
user_time = to_user_timezone(current_time, "America/New_York")
```

### 2. Servicio de Timezone (`app/services/timezone_service.py`)

Servicio para gestionar conversiones de timezone con acceso a base de datos:

**Métodos principales:**
- `get_user_timezone_str(user_id)`: Obtiene la zona horaria configurada del usuario
- `get_user_timezone(user_id)`: Obtiene la zona horaria o retorna Madrid por defecto
- `set_user_timezone(user_id, timezone)`: Establece la zona horaria del usuario
- `reset_user_timezone(user_id)`: Restablece a la zona horaria del sistema
- `convert_to_user_timezone(dt, user_id)`: Convierte datetime a zona del usuario
- `convert_from_user_timezone_to_madrid(dt, user_id)`: Convierte desde zona del usuario a Madrid
- `format_datetime_for_user(dt, user_id, format_str)`: Formatea datetime para mostrar

**Ejemplo de uso:**
```python
from app.services.timezone_service import TimezoneService

service = TimezoneService(db)
user_tz = await service.get_user_timezone_str(user_id)
formatted = await service.format_datetime_for_user(dt, user_id)
```

### 3. Endpoints de API (`app/api/endpoints/timezone.py`)

#### GET `/api/v1/timezone/`
Obtiene la zona horaria configurada del usuario.

**Autenticación:** Requerida (JWT)

**Respuesta:**
```json
{
  "timezone": "America/New_York",
  "system_timezone": "Europe/Madrid"
}
```

**Códigos de respuesta:**
- `200 OK`: Zona horaria obtenida correctamente
- `401 Unauthorized`: Token inválido o faltante

#### PUT `/api/v1/timezone/`
Actualiza la zona horaria del usuario.

**Autenticación:** Requerida (JWT)

**Request:**
```json
{
  "timezone": "America/New_York"
}
```

**Respuesta:**
```json
{
  "timezone": "America/New_York",
  "system_timezone": "Europe/Madrid"
}
```

**Códigos de respuesta:**
- `200 OK`: Zona horaria actualizada correctamente
- `400 Bad Request`: Zona horaria inválida
- `401 Unauthorized`: Token inválido o faltante

#### GET `/api/v1/timezone/available`
Obtiene la lista de zonas horarias disponibles.

**Autenticación:** Requerida (JWT)

**Respuesta:**
```json
{
  "timezones": [
    {
      "code": "Europe/Madrid",
      "name": "Madrid (España)",
      "offset": "+01:00"
    },
    {
      "code": "America/New_York",
      "name": "Nueva York (EE.UU.)",
      "offset": "-05:00"
    },
    ...
  ]
}
```

**Códigos de respuesta:**
- `200 OK`: Lista obtenida correctamente
- `401 Unauthorized`: Token inválido o faltante

#### DELETE `/api/v1/timezone/`
Restablece la zona horaria del usuario a la del sistema (elimina configuración personalizada).

**Autenticación:** Requerida (JWT)

**Respuesta:**
```json
{
  "timezone": null,
  "system_timezone": "Europe/Madrid"
}
```

**Códigos de respuesta:**
- `200 OK`: Zona horaria restablecida correctamente
- `401 Unauthorized`: Token inválido o faltante

### 4. Schemas (`app/schemas/timezone.py`)

**Schemas implementados:**
- `TimezoneUpdate`: Schema para actualizar timezone
- `TimezoneResponse`: Schema de respuesta con timezone del usuario y sistema
- `TimezoneOption`: Schema para opciones de timezone
- `TimezoneListResponse`: Schema para lista de timezones

**Ejemplo de schema:**
```python
class TimezoneUpdate(BaseModel):
    timezone: str  # Código IANA (ej: "America/New_York")
```

### 5. Modelo de Base de Datos

El campo `timezone` se almacena en la tabla `user_profiles`:

**Modelo SQLAlchemy (ejemplo):**
```python
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    timezone = Column(String(100), nullable=True)  # Ej: "America/New_York"
    # ... otros campos del perfil
```

**Migración SQL (ejemplo):**
```sql
-- Agregar columna timezone a user_profiles si no existe
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100);

-- Crear índice para búsquedas rápidas (opcional)
CREATE INDEX IF NOT EXISTS idx_user_profiles_timezone 
ON user_profiles(timezone);
```

**Nota:** Si la tabla `user_profiles` no existe, debe crearse con el campo `timezone` como parte de la estructura inicial.

---

## Uso en el Frontend

### Configuración en Ajustes

El frontend debe permitir al usuario:
1. Ver su zona horaria actual configurada
2. Seleccionar una nueva zona horaria de la lista disponible
3. Ver que el sistema usa Madrid como zona horaria base
4. Restablecer a la zona horaria del sistema

### Visualización de Fechas

Cuando el frontend reciba fechas del backend:
1. El backend siempre envía fechas en UTC o Madrid
2. El frontend debe convertir estas fechas a la zona horaria del usuario para mostrarlas
3. Al enviar fechas al backend, el frontend debe enviarlas en UTC o Madrid

**Ejemplo en JavaScript/TypeScript:**
```typescript
// Obtener timezone del usuario
const response = await fetch('/api/v1/timezone/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { timezone } = await response.json();

// Convertir fecha del backend a zona del usuario
const backendDate = new Date('2024-01-15T10:00:00Z'); // UTC
const userDate = new Date(backendDate.toLocaleString('en-US', {
  timeZone: timezone || 'Europe/Madrid'
}));
```

**Ejemplo con librería (recomendado):**
```typescript
import { format, utcToZonedTime } from 'date-fns-tz';

// Convertir UTC a zona del usuario
const userDate = utcToZonedTime(backendDate, timezone || 'Europe/Madrid');
const formatted = format(userDate, 'yyyy-MM-dd HH:mm:ss zzz', { timeZone: timezone });
```

---

## Flujo de Trabajo

### 1. Usuario Configura su Timezone

```
Usuario → Frontend → PUT /api/v1/timezone/ → Backend
                                    ↓
                            Guarda en user_profiles.timezone
                                    ↓
                            Retorna confirmación
```

### 2. Visualización de Fechas

```
Backend (UTC/Madrid) → Frontend → Convierte a zona del usuario → Muestra
```

### 3. Envío de Fechas al Backend

```
Frontend (zona del usuario) → Convierte a UTC/Madrid → Backend
```

---

## Ejemplos de Uso

### Backend: Obtener fecha actual del sistema

```python
from app.utils.timezone import now_madrid

current_time = now_madrid()  # datetime en zona horaria de Madrid
```

### Backend: Convertir fecha para usuario

```python
from app.services.timezone_service import TimezoneService

service = TimezoneService(db)
user_datetime = await service.convert_to_user_timezone(
    datetime.now(),
    user_id
)
```

### Backend: Formatear fecha para mostrar

```python
formatted = await service.format_datetime_for_user(
    datetime.now(),
    user_id,
    format_str="%Y-%m-%d %H:%M:%S %Z"
)
```

---

## Zonas Horarias Disponibles

El sistema incluye las siguientes zonas horarias comunes:

### Europa
- Madrid (España)
- Londres (Reino Unido)
- París (Francia)
- Berlín (Alemania)
- Roma (Italia)
- Ámsterdam (Países Bajos)
- Lisboa (Portugal)

### América del Norte
- Nueva York (EE.UU.)
- Chicago (EE.UU.)
- Denver (EE.UU.)
- Los Ángeles (EE.UU.)
- Ciudad de México (México)
- Toronto (Canadá)

### América del Sur
- Bogotá (Colombia)
- Lima (Perú)
- Santiago (Chile)
- Buenos Aires (Argentina)
- São Paulo (Brasil)

### Asia
- Tokio (Japón)
- Shanghái (China)
- Dubái (Emiratos Árabes)
- Hong Kong
- Singapur

### Oceanía
- Sídney (Australia)
- Melbourne (Australia)

La lista completa está disponible en `get_available_timezones()` y puede extenderse fácilmente agregando más entradas al diccionario.

---

## Consideraciones Importantes

1. **Almacenamiento**: Todas las fechas en la base de datos deben estar en UTC
2. **Procesamiento**: El backend siempre procesa usando Madrid como referencia
3. **Visualización**: Solo la visualización en el frontend usa la zona horaria del usuario
4. **Validación**: El sistema valida que las zonas horarias sean válidas antes de guardarlas
5. **Fallback**: Si un usuario no tiene timezone configurado, se usa Madrid por defecto
6. **Thread Safety**: Las funciones de `timezone.py` son thread-safe y pueden usarse en contextos asíncronos

---

## Migración

Si ya existen usuarios en el sistema:
- Los usuarios existentes no tendrán timezone configurado (None)
- El sistema usará Madrid por defecto para estos usuarios
- Los usuarios pueden configurar su timezone en cualquier momento desde ajustes

**Script de migración (ejemplo):**
```python
# Migración para agregar campo timezone a user_profiles existentes
from app.db.session import SessionLocal
from app.models.user import UserProfile

def migrate_timezone_field():
    db = SessionLocal()
    try:
        # Los usuarios existentes tendrán timezone=None por defecto
        # No se requiere acción adicional ya que el sistema maneja None correctamente
        pass
    finally:
        db.close()
```

---

## Testing

Para probar el sistema:

```bash
# Obtener timezone del usuario
curl -X GET http://localhost:8000/api/v1/timezone/ \
  -H "Authorization: Bearer <token>"

# Actualizar timezone
curl -X PUT http://localhost:8000/api/v1/timezone/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"timezone": "America/New_York"}'

# Obtener lista de timezones disponibles
curl -X GET http://localhost:8000/api/v1/timezone/available \
  -H "Authorization: Bearer <token>"

# Restablecer timezone
curl -X DELETE http://localhost:8000/api/v1/timezone/ \
  -H "Authorization: Bearer <token>"
```

---

## Dependencias

- `pytz>=2024.1`: Biblioteca para manejo de zonas horarias (agregada a `requirements.txt`)

**Instalación:**
```bash
pip install pytz>=2024.1
```

---

## Integración con el Router Principal

Para que los endpoints funcionen, deben registrarse en el router principal de FastAPI:

```python
# En app/api/api.py o app/main.py
from app.api.endpoints import timezone as timezone_endpoints

app.include_router(
    timezone_endpoints.router,
    prefix="/api/v1",
    tags=["Timezone"]
)
```

---

## Referencias

- [Documentación de pytz](https://pythonhosted.org/pytz/)
- [Lista de zonas horarias IANA](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
- [FastAPI Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/)

---

## Notas de Implementación

1. **Estructura de archivos creada:**
   - `backend_implementation/app/utils/timezone.py`
   - `backend_implementation/app/services/timezone_service.py`
   - `backend_implementation/app/schemas/timezone.py`
   - `backend_implementation/app/api/endpoints/timezone.py`

2. **Dependencias actualizadas:**
   - `backend_implementation/requirements.txt` (agregado `pytz>=2024.1`)

3. **Pendiente de implementación:**
   - Agregar campo `timezone` al modelo `UserProfile` en la base de datos
   - Registrar el router de timezone en el router principal de FastAPI
   - Crear migración de base de datos si es necesario

---

## Próximos Pasos

1. ✅ Crear módulo de utilidades timezone
2. ✅ Crear servicio de timezone
3. ✅ Crear schemas de timezone
4. ✅ Crear endpoints de API
5. ✅ Actualizar requirements.txt
6. ⏳ Agregar campo `timezone` al modelo `UserProfile`
7. ⏳ Registrar router en aplicación principal
8. ⏳ Crear migración de base de datos
9. ⏳ Implementar frontend para configuración de timezone
10. ⏳ Testing completo del sistema

