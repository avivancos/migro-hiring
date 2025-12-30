# Solución al Error: Cookies is not defined

## Problema
Error en runtime: `ReferenceError: Cookies is not defined` en `tokenStorage.ts:141:7`

## Causa
El error indica que se está intentando usar `Cookies` (probablemente de la librería `js-cookie`) pero no está importado. Sin embargo, el código actual de `tokenStorage.ts` NO usa `Cookies` directamente, sino métodos privados `getCookie()` y `setCookie()`.

Esto sugiere que:
1. Puede ser un problema de source map (el error apunta a la línea 141 que es solo un comentario)
2. Puede ser un problema de caché del navegador con código antiguo
3. Puede haber código compilado antiguo que usa `Cookies` sin importarlo

## Solución

### 1. Limpiar caché del navegador
- Hard refresh: `Ctrl + Shift + R` (Windows/Linux) o `Cmd + Shift + R` (Mac)
- O limpiar caché completamente desde las herramientas de desarrollador

### 2. Verificar que no se use `Cookies` directamente
El archivo `src/utils/tokenStorage.ts` NO debe usar `Cookies` directamente. Debe usar:
- `this.getCookie()` - método privado para obtener cookies
- `this.setCookie()` - método privado para establecer cookies
- `this.deleteCookie()` - método privado para eliminar cookies

### 3. Si se necesita usar `js-cookie`
Si en el futuro se quiere usar la librería `js-cookie`, se debe importar correctamente:

```typescript
import Cookies from 'js-cookie';

// Luego usar:
Cookies.set('key', 'value');
Cookies.get('key');
Cookies.remove('key');
```

**NOTA**: Actualmente NO se usa `js-cookie` en `tokenStorage.ts`. El código usa métodos nativos de JavaScript para manejar cookies.

### 4. Verificar build
Si el problema persiste, puede ser necesario:
- Limpiar el build: `rm -rf dist node_modules/.vite`
- Reconstruir: `npm run build`

## Estado Actual
- ✅ El código NO usa `Cookies` directamente
- ✅ El código usa métodos privados `getCookie()`, `setCookie()`, `deleteCookie()`
- ✅ No hay imports de `js-cookie` en `tokenStorage.ts`
- ⚠️ El error puede ser causado por caché del navegador o source map incorrecto

## Verificación
Para verificar que el código está correcto:

```bash
# Buscar cualquier uso de Cookies (con mayúscula) en el código
grep -r "Cookies\." src/
grep -r "Cookies\[" src/
grep -r "Cookies(" src/

# No debería encontrar nada en tokenStorage.ts
```

## Referencias
- `src/utils/tokenStorage.ts` - Archivo principal de gestión de tokens
- `package.json` - `js-cookie` está instalado pero NO se usa en tokenStorage

