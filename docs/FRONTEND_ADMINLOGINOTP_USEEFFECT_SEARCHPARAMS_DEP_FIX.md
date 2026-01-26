# Fix: `AdminLoginOtp` evita re-ejecución de `useEffect` por `searchParams`

## Contexto
En `src/pages/AdminLoginOtp.tsx`, el `useEffect` que redirige cuando el usuario ya está autenticado incluía `searchParams` en el array de dependencias.

En React Router, `searchParams` puede cambiar de referencia entre renders aunque el contenido (querystring) no cambie, lo que provoca:
- Re-ejecuciones innecesarias del efecto (checks y redirects repetidos)
- Potenciales problemas de performance / comportamiento “nervioso” en navegación

## Síntoma
El efecto se disparaba aunque `returnUrl` y el estado de auth no hubiesen cambiado, debido a depender del objeto `searchParams`.

## Solución aplicada
- Se derivó un valor **estable** `searchParamsString` con `searchParams.toString()`
- Se derivó `returnUrlParam` desde ese string
- El `useEffect` ahora depende de `returnUrlParam` (string) en lugar de `searchParams` (objeto)
- Se reutilizó `searchParamsString` para construir el link “Volver a login con contraseña” sin recalcular `toString()` dos veces

## Cambio clave (resumen)
- Antes: `useEffect(..., [isAuthenticated, isAdmin, navigate, searchParams])`
- Ahora: `useEffect(..., [isAuthenticated, isAdmin, navigate, returnUrlParam])`

## Archivos impactados
- `src/pages/AdminLoginOtp.tsx`

