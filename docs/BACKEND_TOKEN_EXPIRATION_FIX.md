# Solución: Sesiones que Expiran Prematuramente

## Problema Identificado

Las sesiones de usuario expiraban antes de tiempo debido a que el sistema solo verificaba la validez del token JWT cuando recibía un error 401 del backend. Esto causaba que:

1. Los tokens expiraban sin ser refrescados proactivamente
2. Las sesiones se cerraban inesperadamente durante el uso
3. Los usuarios tenían que volver a iniciar sesión frecuentemente

## Solución Implementada

Se implementó un sistema de **verificación proactiva de expiración de tokens** que:

1. **Verifica la expiración antes de cada petición**: El interceptor de request ahora decodifica el token JWT y verifica su expiración antes de enviar la petición
2. **Refresca tokens proactivamente**: Si el token expirará en menos de 2 minutos, se refresca automáticamente (buffer reducido de 5 a 2 minutos para evitar refreshes demasiado frecuentes)
3. **Maneja tokens expirados**: Si el token ya está expirado, intenta refrescarlo antes de fallar

## Archivos Modificados

### 1. `src/utils/jwt.ts` (NUEVO)
Utilidades para decodificar y verificar tokens JWT:

- `decodeJWT(token)`: Decodifica un token JWT sin verificar la firma
- `isTokenExpired(token)`: Verifica si un token está expirado
- `isTokenExpiringSoon(token, bufferMinutes)`: Verifica si un token expirará pronto (default: 5 minutos)
- `getTokenTimeRemaining(token)`: Obtiene el tiempo restante hasta la expiración

### 2. `src/services/api.ts` (MODIFICADO)

#### Cambios en el Request Interceptor:
- Ahora es `async` para permitir refrescar tokens antes de la petición
- Verifica si el token está expirado o cerca de expirar
- Refresca el token proactivamente si es necesario

#### Nueva Función `refreshTokenProactively()`:
- Función reutilizable para refrescar tokens
- Maneja cola de peticiones en espera durante el refresh
- Evita múltiples llamadas simultáneas de refresh

#### Mejoras en el Response Interceptor:
- Reutiliza `refreshTokenProactively()` para evitar duplicación de código
- Mejor manejo de errores

## Flujo de Verificación de Token

```
1. Usuario hace una petición
   ↓
2. Request Interceptor verifica token
   ↓
3. ¿Token expirado?
   ├─ SÍ → Intentar refrescar → ¿Éxito?
   │                              ├─ SÍ → Continuar con nuevo token
   │                              └─ NO → Redirigir a login
   │
   └─ NO → ¿Expirará en < 2 min?
           ├─ SÍ → Refrescar proactivamente
           └─ NO → Usar token actual
   ↓
4. Enviar petición con token válido
```

## Configuración

### Buffer de Tiempo para Refresh Proactivo
Por defecto, el sistema refresca tokens que expirarán en menos de **2 minutos**. Este valor se puede ajustar en:

```typescript
isTokenExpiringSoon(token, 2) // 2 minutos de buffer (reducido de 5 minutos)
```

Para cambiar el buffer, modifica el segundo parámetro en `src/services/api.ts` línea 52.

**Nota**: El buffer se redujo de 5 a 2 minutos para evitar refreshes demasiado frecuentes que causaban la sensación de que las sesiones se expiraban "antes de tiempo".

## Beneficios

1. **Sesiones más estables**: Los tokens se refrescan antes de expirar
2. **Mejor experiencia de usuario**: Menos interrupciones por sesiones expiradas
3. **Menos errores 401**: Las peticiones se realizan con tokens válidos
4. **Refresh automático**: No requiere intervención del usuario

## Testing

Para verificar que funciona correctamente:

1. Inicia sesión en la aplicación
2. Abre la consola del navegador
3. Observa los logs cuando se refresca el token:
   - `🔄 Token expirará en X min Y seg, refrescando proactivamente...`
   - `✅ Token refrescado exitosamente`
4. Verifica que las sesiones duran más tiempo

## Notas Técnicas

- Los tokens JWT se decodifican sin verificar la firma (solo se lee el payload)
- La verificación de expiración se basa en el campo `exp` del token
- El sistema mantiene una cola de peticiones durante el refresh para evitar pérdida de datos
- Solo se refresca el token si hay un `refresh_token` disponible en localStorage

## Compatibilidad

- ✅ Compatible con el sistema de autenticación existente
- ✅ No requiere cambios en el backend
- ✅ Funciona con todos los endpoints protegidos
- ✅ Respeta las rutas públicas (no intenta refrescar en endpoints públicos)


