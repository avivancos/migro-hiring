# 🔧 Requisitos Backend: Persistencia de Sesión de 15 Días

**Fecha:** 2025-01-28  
**Prioridad:** 🔴 CRÍTICA  
**Para:** Equipo Backend

---

## 📋 Resumen

El frontend está configurado para mantener sesiones de **15 días** sin pedir login. Para que esto funcione correctamente, el backend debe cumplir con los siguientes requisitos.

---

## 🎯 Requisitos Principales

### 1. ⏱️ Duración de Tokens

**Access Token:**
- **Duración:** 14 días (1,209,600 segundos)
- **Propósito:** Token principal para autenticación en requests
- **Refresh automático:** El frontend lo refresca proactivamente antes de expirar

**Refresh Token:**
- **Duración:** 30 días (2,592,000 segundos)
- **Propósito:** Renovar access tokens sin pedir login
- **Crítico:** Este token NO debe expirar antes de 30 días

**Configuración requerida:**
```python
# En la configuración de JWT o tokens
ACCESS_TOKEN_EXPIRE_SECONDS = 1209600  # 14 días
REFRESH_TOKEN_EXPIRE_SECONDS = 2592000  # 30 días
```

### 2. 📤 Respuesta del Endpoint `/api/auth/login`

**Debe incluir:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1209600,          // ⚠️ CRÍTICO: 14 días en segundos
  "refresh_expires_in": 2592000   // ⚠️ CRÍTICO: 30 días en segundos
}
```

**⚠️ IMPORTANTE:**
- `expires_in` debe ser **exactamente 1,209,600 segundos** (14 días)
- `refresh_expires_in` debe ser **exactamente 2,592,000 segundos** (30 días)
- Estos valores son usados por el frontend para calcular cuándo expiran los tokens
- NO usar valores diferentes o la sesión expirará antes de tiempo

### 3. 🔄 Endpoint `/api/auth/refresh`

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Success (200):**
```json
{
  "access_token": "nuevo_access_token...",
  "refresh_token": "nuevo_refresh_token...",  // ⚠️ Opcional: puede ser el mismo o nuevo
  "token_type": "bearer",
  "expires_in": 1209600,          // ⚠️ CRÍTICO: 14 días
  "refresh_expires_in": 2592000   // ⚠️ CRÍTICO: 30 días
}
```

**Response Error (400/401/403) - Token Inválido:**
```json
{
  "detail": "Invalid refresh token"
}
```
o
```json
{
  "detail": "Refresh token expired"
}
```

**⚠️ CRÍTICO:**
- Si el refresh token es inválido/expirado, el mensaje DEBE incluir las palabras "token", "invalid" o "expired"
- Esto permite al frontend distinguir entre errores de autenticación reales y errores temporales
- NO devolver 500, 503, etc. para tokens inválidos (usar 400/401/403)

### 4. 🚫 Errores que NO Deben Invalidar Sesión

El backend NO debe invalidar tokens en estos casos:

- ❌ **500 Internal Server Error** - Error del servidor
- ❌ **502 Bad Gateway** - Error de gateway
- ❌ **503 Service Unavailable** - Servicio no disponible
- ❌ **504 Gateway Timeout** - Timeout de gateway
- ❌ **Timeout** - Error de red o timeout
- ❌ **404 Not Found** - Recurso no encontrado (NO de autenticación)
- ❌ **422 Unprocessable Entity** - Error de validación
- ❌ **403 Forbidden** - Error de permisos (NO de autenticación)

**Comportamiento esperado:**
- Estos errores NO deben limpiar tokens en el servidor
- El frontend mantendrá los tokens y la sesión activa
- Solo errores 401/403 específicos de autenticación invalidan la sesión

### 5. ✅ Códigos de Estado Correctos

**401 Unauthorized:**
- Usar SOLO cuando:
  - El access token está expirado
  - El access token es inválido
  - No se proporcionó token
- NO usar para:
  - Errores de permisos (usar 403)
  - Errores de validación (usar 422)
  - Errores del servidor (usar 500+)

**403 Forbidden:**
- Usar cuando:
  - El usuario está autenticado pero no tiene permisos
  - El token es válido pero el usuario no tiene acceso
- El frontend NO limpiará tokens en 403 (es error de permisos, no de autenticación)

**400 Bad Request:**
- Usar para:
  - Refresh token inválido/expirado (con mensaje claro)
  - Datos de request incorrectos
- NO usar para errores de autenticación de access token (usar 401)

### 6. 🔐 Validación de Tokens

**Access Token:**
- Validar en cada request protegido
- Si está expirado, devolver 401
- El frontend intentará refresh automáticamente

**Refresh Token:**
- Validar SOLO en `/api/auth/refresh`
- Si está expirado, devolver 400/401 con mensaje claro
- NO validar en otros endpoints (solo el access token)

### 7. 📝 Endpoint `/api/users/me`

**Comportamiento:**
- Debe funcionar con access token válido
- Si el token está expirado, devolver 401 (el frontend refrescará automáticamente)
- NO devolver 500, 503, etc. si hay problemas temporales (mantener tokens válidos)

---

## 🔍 Checklist de Verificación Backend

- [ ] Access token expira en **14 días** (1,209,600 segundos)
- [ ] Refresh token expira en **30 días** (2,592,000 segundos)
- [ ] `/api/auth/login` devuelve `expires_in: 1209600` y `refresh_expires_in: 2592000`
- [ ] `/api/auth/refresh` devuelve `expires_in: 1209600` y `refresh_expires_in: 2592000`
- [ ] `/api/auth/refresh` devuelve mensajes claros cuando el token es inválido/expirado
- [ ] Errores 500, 502, 503, 504 NO invalidan tokens
- [ ] Errores 404, 422 NO invalidan tokens
- [ ] Error 403 NO invalida tokens (es error de permisos, no de autenticación)
- [ ] Solo errores 401/403 específicos de autenticación invalidan tokens
- [ ] Los mensajes de error incluyen "token", "invalid" o "expired" cuando es relevante

---

## 📝 Ejemplo de Implementación Backend

### Python (FastAPI)

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt

# Configuración
ACCESS_TOKEN_EXPIRE_SECONDS = 1209600  # 14 días
REFRESH_TOKEN_EXPIRE_SECONDS = 2592000  # 30 días
SECRET_KEY = "tu-secret-key"
ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(seconds=REFRESH_TOKEN_EXPIRE_SECONDS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/auth/login")
async def login(credentials: LoginCredentials):
    # ... validar credenciales ...
    
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_SECONDS,  # ⚠️ CRÍTICO: 1209600
        "refresh_expires_in": REFRESH_TOKEN_EXPIRE_SECONDS,  # ⚠️ CRÍTICO: 2592000
    }

@router.post("/auth/refresh")
async def refresh_token(request: RefreshTokenRequest):
    try:
        # Validar refresh token
        payload = jwt.decode(
            request.refresh_token, 
            SECRET_KEY, 
            algorithms=[ALGORITHM]
        )
        
        # Crear nuevos tokens
        access_token = create_access_token(data={"sub": payload["sub"]})
        refresh_token = create_refresh_token(data={"sub": payload["sub"]})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_SECONDS,  # ⚠️ CRÍTICO: 1209600
            "refresh_expires_in": REFRESH_TOKEN_EXPIRE_SECONDS,  # ⚠️ CRÍTICO: 2592000
        }
    except JWTError:
        # ⚠️ CRÍTICO: Mensaje claro para que el frontend sepa que es error de autenticación
        raise HTTPException(
            status_code=400,
            detail="Invalid refresh token"  # o "Refresh token expired"
        )
```

---

## 🧪 Pruebas Requeridas

### Test 1: Duración de Tokens
```bash
# Login y verificar expires_in
POST /api/auth/login
# Verificar: expires_in = 1209600, refresh_expires_in = 2592000
```

### Test 2: Refresh Token
```bash
# Usar refresh token después de 13 días
POST /api/auth/refresh
# Verificar: Devuelve nuevos tokens con expires_in = 1209600
```

### Test 3: Refresh Token Expirado
```bash
# Intentar refresh con token expirado (después de 30 días)
POST /api/auth/refresh
# Verificar: Devuelve 400/401 con mensaje "Invalid refresh token" o "Refresh token expired"
```

### Test 4: Errores Temporales
```bash
# Simular error 500 en endpoint protegido
GET /api/users/me
# Verificar: Devuelve 500 pero NO invalida tokens
# El frontend mantiene la sesión
```

---

## 📚 Documentación Relacionada

- [Guía Frontend de Persistencia](./FRONTEND_AUTH_PERSISTENCE_GUIDE.md)
- [Fix de Expulsión de Sesión](./FRONTEND_SESSION_EXPULSION_FIX.md)

---

## 🆘 Contacto

Si hay dudas sobre estos requisitos, consultar:
- Frontend: Ver `docs/FRONTEND_AUTH_PERSISTENCE_GUIDE.md`
- Implementación actual: Ver `src/utils/tokenStorage.ts` y `src/services/api.ts`

---

**Última actualización:** 2025-01-28

