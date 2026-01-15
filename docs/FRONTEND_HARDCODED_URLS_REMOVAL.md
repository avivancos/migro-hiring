# Eliminación de URLs Hardcodeadas

**Fecha:** 2025-01-28  
**Problema:** URLs hardcodeadas de dominios de producción en el código  
**Estado:** ✅ SOLUCIONADO

---

## 🔍 Problema Identificado

Se encontraron varias URLs hardcodeadas en el código que apuntaban directamente a dominios de producción (`api.migro.es`, `contratacion.migro.es`, `migro.es`), lo que impedía que la aplicación funcionara correctamente en desarrollo local.

### URLs Hardcodeadas Encontradas

1. **`src/pages/BorradorPDF.tsx`**: `https://contratacion.migro.es/EJEMPLO`
2. **`src/pages/AdminDashboard.tsx`**: `https://contratacion.migro.es/${hiringCode}`
3. **`src/pages/admin/AdminContractDetail.tsx`**: `https://migro.es/c/${contract.hiring_code}`
4. **`src/utils/collabAgreementPdfFromMd.ts`**: `contratacion.migro.es` (en footer de PDFs)

---

## ✅ Solución Implementada

### 1. Nuevas Constantes en `src/config/constants.ts`

Se agregaron tres nuevas constantes configurables mediante variables de entorno:

```typescript
// URLs públicas de la aplicación
// En desarrollo: usar localhost
// En producción: usar dominios reales
export const PUBLIC_APP_URL = import.meta.env.VITE_APP_URL || 
  (import.meta.env.PROD 
    ? 'https://contratacion.migro.es' 
    : 'http://localhost:5173');

// URL corta para compartir contratos (migro.es/c/CODE)
export const SHORT_URL_BASE = import.meta.env.VITE_SHORT_URL_BASE || 
  (import.meta.env.PROD 
    ? 'https://migro.es' 
    : 'http://localhost:5173');

// Dominio público para footers y referencias (sin protocolo)
export const PUBLIC_DOMAIN = import.meta.env.VITE_PUBLIC_DOMAIN || 
  (import.meta.env.PROD 
    ? 'contratacion.migro.es' 
    : 'localhost:5173');
```

### 2. Variables de Entorno Opcionales

Estas constantes pueden ser sobrescritas mediante variables de entorno:

- `VITE_APP_URL`: URL base de la aplicación (ya existía, ahora se usa también para `PUBLIC_APP_URL`)
- `VITE_SHORT_URL_BASE`: URL base para enlaces cortos (nuevo)
- `VITE_PUBLIC_DOMAIN`: Dominio público sin protocolo (nuevo)

### 3. Reemplazos Realizados

#### `src/pages/BorradorPDF.tsx`
```typescript
// ❌ Antes
short_url: 'https://contratacion.migro.es/EJEMPLO',

// ✅ Después
short_url: `${PUBLIC_APP_URL}/EJEMPLO`,
```

#### `src/pages/AdminDashboard.tsx`
```typescript
// ❌ Antes
const manualUrl = `https://contratacion.migro.es/${hiringCode}`;

// ✅ Después
const manualUrl = `${PUBLIC_APP_URL}/${hiringCode}`;
```

#### `src/pages/admin/AdminContractDetail.tsx`
```typescript
// ❌ Antes
const url = `https://migro.es/c/${contract.hiring_code}`;

// ✅ Después
const url = `${SHORT_URL_BASE}/c/${contract.hiring_code}`;
```

#### `src/utils/collabAgreementPdfFromMd.ts`
```typescript
// ❌ Antes
return renderPdf(rawText, title, footerUrl ?? 'contratacion.migro.es');

// ✅ Después
return renderPdf(rawText, title, footerUrl ?? PUBLIC_DOMAIN);
```

---

## 🔧 Configuración por Entorno

### Desarrollo Local

Por defecto, las constantes usan `localhost:5173`:

```typescript
PUBLIC_APP_URL = 'http://localhost:5173'
SHORT_URL_BASE = 'http://localhost:5173'
PUBLIC_DOMAIN = 'localhost:5173'
```

### Producción

En producción (cuando `import.meta.env.PROD === true`), se usan los dominios reales:

```typescript
PUBLIC_APP_URL = 'https://contratacion.migro.es'
SHORT_URL_BASE = 'https://migro.es'
PUBLIC_DOMAIN = 'contratacion.migro.es'
```

### Sobrescritura con Variables de Entorno

Puedes sobrescribir cualquier valor en el archivo `.env`:

```env
# .env
VITE_APP_URL=http://localhost:3000
VITE_SHORT_URL_BASE=http://localhost:3000
VITE_PUBLIC_DOMAIN=localhost:3000
```

---

## 📝 Archivos Modificados

1. ✅ `src/config/constants.ts` - Agregadas nuevas constantes
2. ✅ `src/pages/BorradorPDF.tsx` - Reemplazado hardcode, agregado import
3. ✅ `src/pages/AdminDashboard.tsx` - Reemplazado hardcode, agregado import
4. ✅ `src/pages/admin/AdminContractDetail.tsx` - Reemplazado hardcode, agregado import
5. ✅ `src/utils/collabAgreementPdfFromMd.ts` - Reemplazado hardcode, agregado import

---

## ✅ Verificación

### Build Exitoso

El build se completó correctamente sin errores:

```bash
npm run build
✓ built in 44.47s
```

### Sin Errores de Linter

Todos los archivos modificados pasan la validación del linter.

---

## 🎯 Beneficios

1. **Flexibilidad**: Las URLs ahora se adaptan automáticamente al entorno (desarrollo/producción)
2. **Configurabilidad**: Pueden ser sobrescritas mediante variables de entorno
3. **Mantenibilidad**: Un solo lugar para cambiar las URLs (`constants.ts`)
4. **Testing**: Facilita el testing en diferentes entornos

---

## 🔗 Referencias

- [Vite: Variables de Entorno](https://vitejs.dev/guide/env-and-mode.html)
- [Vite: Modos y Variables](https://vitejs.dev/guide/env-and-mode.html#env-files)

---

## 📌 Notas Importantes

1. **Reiniciar el servidor**: Después de modificar variables de entorno, es necesario reiniciar el servidor de desarrollo
2. **Build time**: Las variables de entorno se inyectan en tiempo de build, no en runtime
3. **Prefijo VITE_**: Solo las variables con prefijo `VITE_` están disponibles en el código del cliente
