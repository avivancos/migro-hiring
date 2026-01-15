# Solución: Variables de Entorno No Se Cargan en Vite

**Fecha:** 2025-01-28  
**Problema:** El servidor localhost carga `api.migro.es` aunque el `.env` tiene `http://localhost:3000/api/`  
**Estado:** ✅ SOLUCIONADO

---

## 🔍 Problema Identificado

Cuando se modifica el archivo `.env`, Vite **NO recarga automáticamente** las variables de entorno. El servidor de desarrollo debe reiniciarse manualmente para que las nuevas variables se carguen.

### Síntomas

- El archivo `.env` tiene la configuración correcta: `VITE_API_BASE_URL=http://localhost:3000/api/`
- Pero la aplicación sigue usando el fallback: `https://api.migro.es/api`
- Los cambios en `.env` no se reflejan sin reiniciar

---

## ✅ Solución Implementada

### 1. Normalización de URL

Se agregó una función para normalizar la URL de la API, eliminando barras finales que pueden causar problemas:

```typescript
// src/config/constants.ts
const normalizeApiUrl = (url: string | undefined): string => {
  if (!url) return 'https://api.migro.es/api';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_API_BASE_URL);
```

### 2. Log de Depuración

Se agregó un log en desarrollo para verificar qué URL se está usando:

```typescript
if (import.meta.env.DEV) {
  console.log('🔧 [Config] API Base URL configurada:', {
    raw: rawApiUrl,
    normalized: API_BASE_URL,
    fromEnv: !!rawApiUrl,
    fallback: !rawApiUrl,
  });
}
```

Este log aparecerá en la consola del navegador cuando la aplicación se carga, mostrando:
- El valor crudo de la variable de entorno
- El valor normalizado que se está usando
- Si viene del `.env` o del fallback

---

## 🔧 Pasos para Solucionar

### Paso 1: Verificar el archivo `.env`

Asegúrate de que el archivo `.env` en la raíz del proyecto tiene:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**Nota:** La barra final (`/`) es opcional y será normalizada automáticamente.

### Paso 2: Reiniciar el servidor de desarrollo

**IMPORTANTE:** Vite solo carga variables de entorno al iniciar. Debes reiniciar el servidor:

```bash
# Detener el servidor actual (Ctrl+C en la terminal)
# Luego reiniciar:
npm run dev
```

### Paso 3: Verificar en la consola del navegador

Abre las herramientas de desarrollo (F12) y busca el log:

```
🔧 [Config] API Base URL configurada: {
  raw: "http://localhost:3000/api",
  normalized: "http://localhost:3000/api",
  fromEnv: true,
  fallback: false
}
```

Si ves `fromEnv: false` o `fallback: true`, significa que la variable no se está cargando correctamente.

---

## 🐛 Troubleshooting

### Problema: La variable sigue sin cargarse después de reiniciar

**Solución 1:** Verifica que el archivo se llama exactamente `.env` (no `.env.local`, `.env.production`, etc.)

**Solución 2:** Verifica que no hay espacios alrededor del `=`:

```env
# ❌ INCORRECTO
VITE_API_BASE_URL = http://localhost:3000/api

# ✅ CORRECTO
VITE_API_BASE_URL=http://localhost:3000/api
```

**Solución 3:** Verifica que la variable tiene el prefijo `VITE_`:

```env
# ❌ INCORRECTO (no se carga)
API_BASE_URL=http://localhost:3000/api

# ✅ CORRECTO
VITE_API_BASE_URL=http://localhost:3000/api
```

**Solución 4:** Limpia el caché de Vite:

```bash
# Eliminar node_modules/.vite
rm -rf node_modules/.vite
# O en Windows PowerShell:
Remove-Item -Recurse -Force node_modules\.vite

# Reiniciar el servidor
npm run dev
```

### Problema: El log muestra `raw: undefined`

Esto significa que la variable no se está leyendo del `.env`. Verifica:

1. El archivo `.env` está en la raíz del proyecto (mismo nivel que `package.json`)
2. El archivo no tiene errores de sintaxis
3. El servidor se reinició después de modificar el `.env`

---

## 📝 Archivos Modificados

- `src/config/constants.ts`: Agregada normalización de URL y log de depuración

---

## 🔗 Referencias

- [Vite: Variables de Entorno](https://vitejs.dev/guide/env-and-mode.html)
- [Vite: Modos y Variables](https://vitejs.dev/guide/env-and-mode.html#env-files)

---

## ✅ Verificación

Después de reiniciar el servidor, verifica que:

1. ✅ El log en la consola muestra `fromEnv: true`
2. ✅ El log muestra la URL correcta (`http://localhost:3000/api`)
3. ✅ Las peticiones API van a `http://localhost:3000/api` (verificar en Network tab del navegador)
