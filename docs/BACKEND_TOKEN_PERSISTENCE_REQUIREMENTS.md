# Requisitos de Persistencia de Tokens - Backend

**Fecha:** 2025-01-28  
**Prioridad:** 🔴 CRÍTICA  
**Para:** Equipo de Backend

---

## 📋 Resumen

El frontend está configurado para **NUNCA descartar tokens** por errores de respuesta del backend. Los tokens solo se limpian cuando el refresh token está realmente inválido/expirado.

**IMPORTANTE:** El backend debe seguir estas reglas para garantizar que los tokens se mantengan correctamente.

---

## ✅ Reglas de Códigos de Estado

### 401 Unauthorized

**Usar SOLO cuando:**
- El access token está expirado
- El access token es inválido
- No se proporcionó token
- El token no puede ser verificado

**NO usar para:**
- ❌ Errores de permisos (usar 403)
- ❌ Errores de validación (usar 422)
- ❌ Errores del servidor (usar 500+)
- ❌ Recursos no encontrados (usar 404)

**Ejemplo correcto:**
```python
# Token expirado
if token_expired:
    raise HTTPException(status_code=401, detail="Token expired")

# Token inválido
if not verify_token(token):
    raise HTTPException(status_code=401, detail="Invalid token")
```

---

### 403 Forbidden

**Usar cuando:**
- El usuario está autenticado (token válido)
- Pero NO tiene permisos para acceder al recurso
- El token es válido pero el usuario no tiene acceso

**Ejemplo correcto:**
```python
# Usuario autenticado pero sin permisos
if not user.has_permission(resource):
    raise HTTPException(status_code=403, detail="Access denied")
```

**Comportamiento del frontend:** NO limpia tokens, solo rechaza el error.

---

### 404 Not Found

**Usar cuando:**
- El recurso no existe
- La ruta no existe
- El ID proporcionado no existe

**NO usar para:**
- ❌ Errores de autenticación (usar 401)
- ❌ Errores de permisos (usar 403)

**Ejemplo correcto:**
```python
# Recurso no encontrado
if not resource:
    raise HTTPException(status_code=404, detail="Resource not found")
```

**Comportamiento del frontend:** NO limpia tokens, solo rechaza el error.

---

### 422 Unprocessable Entity

**Usar cuando:**
- Los datos enviados son inválidos
- Faltan campos requeridos
- La validación de datos falla

**Ejemplo correcto:**
```python
# Validación falla
if not validate_data(data):
    raise HTTPException(status_code=422, detail="Validation error")
```

**Comportamiento del frontend:** NO limpia tokens, solo rechaza el error.

---

### 500+ Server Error

**Usar cuando:**
- Error interno del servidor
- Error de base de datos
- Error de servicio externo
- Error inesperado

**Ejemplo correcto:**
```python
# Error del servidor
try:
    result = process_data()
except Exception as e:
    raise HTTPException(status_code=500, detail="Internal server error")
```

**Comportamiento del frontend:** NO limpia tokens, solo rechaza el error.

---

## 🔐 Endpoint `/auth/refresh` - Requisitos Específicos

### Respuestas Requeridas

#### ✅ Token Inválido/Expirado

**Código:** `400` o `401`  
**Mensaje:** Debe incluir las palabras "token", "invalid" o "expired"

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
o
```json
{
  "detail": "Token is invalid or expired"
}
```

**Comportamiento del frontend:** Limpia tokens y redirige al login.

---

#### ✅ Error Temporal

**Código:** `500`, `503`, timeout, etc.  
**Mensaje:** Cualquier mensaje que NO incluya "token", "invalid" o "expired"

```json
{
  "detail": "Internal server error"
}
```
o
```json
{
  "detail": "Service temporarily unavailable"
}
```

**Comportamiento del frontend:** Mantiene tokens y rechaza el error.

---

### Implementación Recomendada

```python
@router.post("/auth/refresh")
async def refresh_token(request: RefreshTokenRequest):
    try:
        # Verificar refresh token
        if not is_valid_refresh_token(request.refresh_token):
            # Token inválido - responder con 400/401 y mensaje claro
            raise HTTPException(
                status_code=400,
                detail="Invalid refresh token"  # IMPORTANTE: Incluir "token" o "invalid"
            )
        
        # Generar nuevo access token
        new_tokens = generate_tokens(user)
        return new_tokens
        
    except HTTPException:
        # Re-lanzar HTTPException (ya tiene el código y mensaje correctos)
        raise
    except Exception as e:
        # Error temporal - responder con 500
        # NO incluir "token" o "invalid" en el mensaje
        raise HTTPException(
            status_code=500,
            detail="Internal server error"  # NO mencionar "token"
        )
```

---

## 🌐 Endpoints Públicos

Los siguientes endpoints **NO deben requerir autenticación**:

- `GET /api/hiring/{code}`
- `POST /api/hiring/{code}/confirm-data`
- `GET /api/hiring/{code}/contract/download`
- `GET /api/hiring/{code}/final-contract/download`

**Implementación:**
```python
# NO agregar dependencia de autenticación
@router.get("/hiring/{code}")
async def get_hiring_details(code: str):
    # No requiere autenticación
    pass
```

**Comportamiento del frontend:** Si estos endpoints devuelven 401, se rechaza el error sin intentar refresh.

---

## 🚫 Errores que NO Deben Limpiar Tokens

El frontend **NUNCA limpia tokens** en los siguientes casos:

1. **404 Not Found** - Recurso no encontrado
2. **403 Forbidden** - Error de permisos
3. **422 Unprocessable Entity** - Error de validación
4. **500+ Server Error** - Error del servidor
5. **Timeout** - Error de red o timeout
6. **Network Error** - Error de conexión
7. **Cualquier otro error de respuesta**

**IMPORTANTE:** El backend NO necesita hacer nada especial para estos casos. El frontend ya maneja estos errores correctamente.

---

## ✅ Errores que SÍ Deben Limpiar Tokens

El frontend **SÍ limpia tokens** SOLO en los siguientes casos:

1. **Refresh token expirado** (verificado localmente)
2. **No hay refresh token disponible**
3. **Servidor responde 400/401/403 en `/auth/refresh`** Y el mensaje indica que el token es inválido/expirado

**IMPORTANTE:** El backend debe responder correctamente en `/auth/refresh` con mensajes claros.

---

## 📝 Checklist de Verificación

- [ ] Endpoint `/auth/refresh` responde con mensajes claros cuando el token es inválido
- [ ] Endpoint `/auth/refresh` NO limpia tokens en errores temporales (500, timeout, etc.)
- [ ] Endpoints protegidos usan 401 SOLO para errores de autenticación
- [ ] Endpoints protegidos usan 403 para errores de permisos (NO de autenticación)
- [ ] Endpoints protegidos usan 404 para recursos no encontrados (NO de autenticación)
- [ ] Endpoints protegidos usan 422 para errores de validación (NO de autenticación)
- [ ] Endpoints protegidos usan 500+ para errores del servidor (NO de autenticación)
- [ ] Endpoints de `/hiring/*` NO requieren autenticación
- [ ] El backend NO devuelve 401 en errores que no sean de autenticación

---

## 🔍 Ejemplos de Testing

### Test 1: Error 404 NO Debe Limpiar Tokens

```bash
# Con token válido
GET /api/crm/nonexistent
# Backend debe responder: 404
# Frontend: NO limpia tokens ✅
```

### Test 2: Error 500 NO Debe Limpiar Tokens

```bash
# Con token válido
GET /api/crm/endpoint-that-crashes
# Backend debe responder: 500
# Frontend: NO limpia tokens ✅
```

### Test 3: Error 422 NO Debe Limpiar Tokens

```bash
# Con token válido
POST /api/crm/leads
{ "invalid": "data" }
# Backend debe responder: 422
# Frontend: NO limpia tokens ✅
```

### Test 4: Error 401 con Refresh Token Válido

```bash
# Con access token expirado pero refresh token válido
GET /api/crm/leads
# Backend debe responder: 401
# Frontend: Intenta refresh → 200 ✅
```

### Test 5: Error 401 con Refresh Token Inválido

```bash
# Con refresh token expirado
GET /api/crm/leads
# Backend debe responder: 401
# Frontend: Intenta refresh → 400 "Invalid refresh token"
# Frontend: Limpia tokens → redirect a login ✅
```

---

## 📚 Referencias

- `docs/TOKEN_PERSISTENCE_ON_ERRORS.md` - Documentación completa del frontend
- `docs/BACKEND_ENDPOINTS_ERRORS_SOLUTION.md` - Errores de endpoints

---

**Última actualización:** 2025-01-28








