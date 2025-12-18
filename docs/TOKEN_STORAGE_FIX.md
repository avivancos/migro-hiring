# Solución: Problema de Re-logueo Constante

## Problema Identificado

El sistema pedía re-loguear constantemente debido a varios problemas en el manejo de tokens:

1. **`adminService.logout()` no limpiaba todos los tokens**: Solo eliminaba algunos tokens manualmente pero no los timestamps de expiración (`token_expires_at`, `refresh_expires_at`), dejando datos inconsistentes en localStorage.

2. **`useRequireAuth` limpiaba la sesión demasiado rápido**: Cuando recibía un error 401, inmediatamente limpiaba la sesión sin intentar refrescar el token primero, incluso cuando había un refresh token disponible.

3. **Validación doble innecesaria**: El interceptor de axios validaba la expiración tanto con `TokenStorage` como con el JWT, lo que podía causar refreshes innecesarios o conflictos.

4. **Falta de sincronización**: Múltiples lugares guardaban tokens de forma inconsistente, causando que algunos componentes vieran tokens expirados mientras otros no.

## Solución Implementada

### 1. Corrección de `adminService.logout()`

**Antes:**
```typescript
logout(): void {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('admin_user');
}
```

**Después:**
```typescript
logout(): void {
  // Usar TokenStorage para limpiar todos los tokens correctamente
  // Esto incluye access_token, refresh_token, admin_token y los timestamps de expiración
  TokenStorage.clearTokens();
  // admin_user se limpia en TokenStorage.clearTokens()
}
```

**Beneficio**: Ahora se limpian todos los tokens y timestamps de forma consistente, evitando datos residuales que causaban problemas.

### 2. Mejora de `useRequireAuth`

**Cambios principales:**
- Usa `TokenStorage.getAccessToken()` en lugar de `localStorage.getItem('access_token')` directamente
- Verifica si hay refresh token disponible antes de limpiar la sesión
- Si hay un error 401 pero hay refresh token disponible, espera a que el interceptor de axios lo refresque automáticamente
- Solo limpia la sesión si realmente no hay forma de refrescar el token

**Beneficio**: Evita limpiar la sesión prematuramente cuando el token puede ser refrescado automáticamente.

### 3. Optimización del Interceptor de Axios

**Cambios principales:**
- Usa `TokenStorage` como fuente principal de verdad para la expiración
- Solo verifica el JWT como confirmación cuando `TokenStorage` indica expiración
- Evita refreshes innecesarios cuando hay discrepancias menores entre TokenStorage y JWT
- Maneja casos edge donde TokenStorage y JWT no están sincronizados

**Beneficio**: Reduce refreshes innecesarios y mejora la estabilidad de las sesiones.

## Archivos Modificados

1. **`src/services/adminService.ts`**
   - `logout()` ahora usa `TokenStorage.clearTokens()`

2. **`src/hooks/useRequireAuth.tsx`**
   - Importa `TokenStorage`
   - Mejora la lógica de validación para intentar refrescar antes de limpiar
   - Usa `TokenStorage` para verificar tokens

3. **`src/services/api.ts`**
   - Optimiza la lógica de validación de expiración
   - Reduce refreshes innecesarios
   - Mejora el manejo de casos edge

## Flujo Mejorado de Validación

```
1. Usuario hace una petición
   ↓
2. Interceptor verifica token con TokenStorage
   ↓
3. ¿Token expirado según TokenStorage?
   ├─ SÍ → Verificar JWT para confirmar
   │        ├─ JWT también expirado → Refrescar token
   │        └─ JWT válido → Refrescar preventivamente
   │
   └─ NO → ¿JWT expirará pronto (< 2 min)?
           ├─ SÍ → Refrescar proactivamente
           └─ NO → Usar token actual
   ↓
4. Si hay error 401 en la respuesta:
   ├─ ¿Hay refresh token disponible?
   │  ├─ SÍ → Esperar refresh automático del interceptor
   │  └─ NO → Limpiar sesión y redirigir a login
   ↓
5. Continuar con petición
```

## Beneficios

1. **Sesiones más estables**: Los tokens se refrescan automáticamente antes de expirar
2. **Menos interrupciones**: No se limpia la sesión prematuramente cuando hay refresh token disponible
3. **Limpieza consistente**: Todos los tokens y timestamps se limpian correctamente al hacer logout
4. **Mejor experiencia de usuario**: Menos necesidad de re-loguear constantemente

## Testing

Para verificar que funciona correctamente:

1. Inicia sesión en la aplicación
2. Abre la consola del navegador
3. Observa los logs cuando se refresca el token:
   - `🔄 Token expirará en X min Y seg, refrescando proactivamente...`
   - `✅ Token refrescado exitosamente`
4. Verifica que las sesiones duran más tiempo sin pedir re-logueo
5. Verifica que al hacer logout, todos los tokens se limpian correctamente

## Notas Técnicas

- `TokenStorage` usa los valores de `expires_in` del servidor para calcular la expiración
- El buffer de 2 minutos en `TokenStorage.isTokenExpired()` permite refreshes proactivos
- El interceptor de axios maneja automáticamente el refresh de tokens en caso de error 401
- Todos los componentes ahora usan `TokenStorage` como fuente única de verdad para tokens

## Próximos Pasos Recomendados

1. Monitorear los logs en producción para verificar que los refreshes funcionan correctamente
2. Considerar implementar un sistema de notificación cuando el refresh token esté cerca de expirar
3. Evaluar si el buffer de 2 minutos es óptimo o necesita ajuste según el uso real

