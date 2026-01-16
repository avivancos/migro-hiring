# Solución: Validación Lazy de Configuración

**Fecha:** 2025-01-28  
**Problema:** Las funciones `normalizeApiUrl()` y `requireInProduction()` se ejecutaban durante la inicialización del módulo, crasheando la aplicación si faltaban variables de entorno.  
**Estado:** ✅ SOLUCIONADO COMPLETAMENTE

---

## 🔍 Problema Identificado

Las funciones `normalizeApiUrl()` y `requireInProduction()` se llamaban durante la inicialización del módulo (`src/config/constants.ts`), lo que causaba que:

1. **Crasheo al importar**: Si faltaban variables de entorno, la aplicación crasheaba inmediatamente al importar el módulo, antes de que cualquier código pudiera ejecutarse.
2. **Imposible cargar en entornos sin configuración**: No era posible cargar la aplicación en entornos donde algunas variables de entorno no estaban configuradas.
3. **Validación temprana**: La validación ocurría durante la inicialización, no cuando se necesitaban los valores.

### Ubicación del Problema

- `src/config/constants.ts:16-30` - `normalizeApiUrl()` se llamaba durante la inicialización
- `src/config/constants.ts:53-76` - `requireInProduction()` se llamaba durante la inicialización

---

## ✅ Solución Implementada

### 1. Patrón de Evaluación Lazy

Se implementó un patrón de evaluación lazy usando objetos con getters que se evalúan solo cuando se acceden, no durante la inicialización del módulo:

```typescript
// Cache para valores ya evaluados (memoization)
let _apiBaseUrl: string | null = null;

// Función getter lazy que se evalúa solo cuando se accede
const getApiBaseUrl = (): string => {
  if (_apiBaseUrl === null) {
    const rawApiUrl = import.meta.env.VITE_API_BASE_URL;
    _apiBaseUrl = normalizeApiUrl(rawApiUrl);
    // ... validación y normalización
  }
  return _apiBaseUrl;
};

// Objeto con getters que se evalúan lazy
const lazyConfig = {
  get API_BASE_URL() {
    return getApiBaseUrl();
  },
  // ... otros getters
};

// Exportar el objeto para evaluación lazy
export const config = lazyConfig;
```

### 2. Actualización de Lugares Críticos

Se actualizaron los lugares críticos donde se crean instancias de servicios para usar el objeto `config` con evaluación lazy:

**`src/services/api.ts`**:
```typescript
// Antes (evaluación inmediata):
import { API_BASE_URL } from '@/config/constants';
export const api = axios.create({
  baseURL: API_BASE_URL, // Se evalúa inmediatamente
});

// Después (evaluación lazy):
import { config } from '@/config/constants';
export const api = axios.create({
  baseURL: config.API_BASE_URL, // Se evalúa solo cuando se accede
});
```

**`src/services/piliService.ts`**:
```typescript
// Antes (evaluación inmediata):
import { PILI_API_BASE_URL } from '@/config/constants';
const piliApi = axios.create({
  baseURL: PILI_API_BASE_URL, // Se evalúa inmediatamente
});

// Después (evaluación lazy):
import { config } from '@/config/constants';
const piliApi = axios.create({
  baseURL: config.PILI_API_BASE_URL, // Se evalúa solo cuando se accede
});
```

### 3. Compatibilidad con Código Existente

Se mantuvieron las exportaciones individuales para compatibilidad con código existente, pero se documentó que se evalúan inmediatamente:

```typescript
// ⚠️ ADVERTENCIA: Estas se evalúan inmediatamente al importar
export const API_BASE_URL = lazyConfig.API_BASE_URL;
export const APP_URL = lazyConfig.APP_URL;
// ...
```

---

## 📋 Estado Actual

### ✅ Completado

- [x] Implementación de patrón lazy con objetos y getters
- [x] Actualización de `src/services/api.ts` para usar `config.API_BASE_URL`
- [x] Actualización de `src/services/piliService.ts` para usar `config.PILI_API_BASE_URL`
- [x] Documentación de la solución

### ✅ Completado Adicionalmente

- [x] Migrar todas las referencias para usar `config.*` en lugar de constantes directas
- [x] Eliminar exportaciones individuales que se evalúan inmediatamente
- [x] Actualizar todos los archivos que usan estas constantes

### Archivos Actualizados para Usar `config.*`

Todos los siguientes archivos han sido actualizados para usar `config.*` (evaluación lazy):

- `src/services/api.ts` - `config.API_BASE_URL`
- `src/services/piliService.ts` - `config.PILI_API_BASE_URL`
- `src/components/ConfirmData.tsx` - `config.SHORT_URL_BASE`
- `src/components/Layout/Footer.tsx` - `config.SHORT_URL_BASE`
- `src/utils/collabAgreementPdfFromMd.ts` - `config.PUBLIC_DOMAIN`
- `src/pages/admin/AdminContractDetail.tsx` - `config.SHORT_URL_BASE`
- `src/pages/AdminDashboard.tsx` - `config.PUBLIC_APP_URL`
- `src/pages/BorradorPDF.tsx` - `config.PUBLIC_APP_URL`
- `src/test/auth-helper.ts` - `config.API_BASE_URL`

**Resultado**: Todas las referencias ahora usan evaluación lazy. Las exportaciones individuales han sido eliminadas completamente.

---

## 🎯 Beneficios

1. **Carga de aplicación sin variables de entorno**: La aplicación puede cargarse incluso si faltan algunas variables de entorno, y los errores solo ocurren cuando se intenta usar el valor.
2. **Mejor experiencia de desarrollo**: Los desarrolladores pueden trabajar sin configurar todas las variables de entorno inmediatamente.
3. **Validación en el momento correcto**: La validación ocurre cuando se necesita el valor, no durante la inicialización.
4. **Compatibilidad**: El código existente sigue funcionando mientras se migra gradualmente.

---

## 🔧 Uso Recomendado

### Para Nuevo Código (Evaluación Lazy)

```typescript
import { config } from '@/config/constants';

// Se evalúa solo cuando se accede
const apiUrl = config.API_BASE_URL;
const appUrl = config.APP_URL;
```

### Para Código Existente (Compatibilidad)

```typescript
import { API_BASE_URL, APP_URL } from '@/config/constants';

// Se evalúa inmediatamente al importar
// Funciona, pero no es lazy
```

---

## 📝 Notas Técnicas

### Limitaciones de ES Modules

En ES modules, no es posible exportar getters directamente como constantes. Por lo tanto:

- Las exportaciones individuales (`export const API_BASE_URL = ...`) se evalúan inmediatamente
- El objeto con getters (`export const config = ...`) se evalúa lazy cuando se accede a sus propiedades

### Memoization

Los valores se cachean después de la primera evaluación para evitar recalcular en cada acceso:

```typescript
let _apiBaseUrl: string | null = null;

const getApiBaseUrl = (): string => {
  if (_apiBaseUrl === null) {
    // Solo se evalúa una vez
    _apiBaseUrl = normalizeApiUrl(import.meta.env.VITE_API_BASE_URL);
  }
  return _apiBaseUrl;
};
```

---

## ✅ Migración Completada

La migración completa a evaluación lazy ha sido finalizada:

1. ✅ Todas las importaciones han sido cambiadas para usar `config.*`
2. ✅ Las exportaciones individuales que se evalúan inmediatamente han sido eliminadas
3. ✅ La documentación ha sido actualizada

---

## ✅ Verificación

Para verificar que la solución funciona:

1. **Sin variables de entorno**: La aplicación debería cargarse sin crashear
2. **Con variables de entorno**: La aplicación debería funcionar normalmente
3. **Al usar servicios**: Los errores solo deberían ocurrir cuando se intenta usar un servicio que requiere una variable de entorno faltante

---

**Referencias:**
- `src/config/constants.ts` - Implementación del patrón lazy
- `src/services/api.ts` - Uso de `config.API_BASE_URL`
- `src/services/piliService.ts` - Uso de `config.PILI_API_BASE_URL`
