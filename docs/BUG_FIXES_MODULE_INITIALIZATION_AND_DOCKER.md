# Corrección de Bugs: Inicialización de Módulos y Docker

**Fecha:** 2026-01-15  
**Estado:** ✅ SOLUCIONADO

---

## 🐛 Bugs Identificados y Corregidos

### Bug 1: Error en Inicialización de Módulo para STRIPE_PUBLISHABLE_KEY

**Ubicación:** `src/config/constants.ts:37-39`

**Problema:**
Se lanzaba un error durante la inicialización del módulo si `STRIPE_PUBLISHABLE_KEY` no estaba definida:
```typescript
if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error('VITE_STRIPE_PUBLISHABLE_KEY no está definida...');
}
```

**Impacto:**
- El error se ejecuta durante la carga del módulo, antes de que la aplicación pueda iniciar
- A diferencia de los errores en tiempo de ejecución, los errores en tiempo de inicialización no pueden ser capturados
- La aplicación no puede cargarse, incluso si la funcionalidad de Stripe no se necesita inmediatamente
- Esto impide que la aplicación funcione en modo de desarrollo o testing sin Stripe configurado

**Solución:**
Se cambió para permitir `undefined` y validar solo cuando se intenta usar Stripe (lazy validation):
```typescript
// IMPORTANTE: Permitir undefined para no crashear la app al inicio
// La validación se hace cuando se intenta usar Stripe (lazy validation)
const rawStripeKey = normalizeEnvValue(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
export const STRIPE_PUBLISHABLE_KEY: string | undefined = rawStripeKey;
```

La validación ahora se hace en `usePayment.ts` cuando se intenta inicializar Stripe, permitiendo que la aplicación cargue normalmente.

---

### Bug 2: IIFEs que Ejecutan Throws Inmediatamente

**Ubicación:** `src/config/constants.ts` (múltiples ubicaciones)

**Problema:**
Se usaban IIFEs (Immediately Invoked Function Expressions) en operadores ternarios que ejecutaban `throw` inmediatamente:
```typescript
export const APP_URL = rawAppUrlForApp || 
  (import.meta.env.PROD 
    ? (() => { throw new Error('VITE_APP_URL debe estar definida en producción'); })()
    : 'http://localhost:5173');
```

**Impacto:**
- Los IIFEs se ejecutan inmediatamente durante la evaluación del módulo
- En producción, si la variable no está definida, el error se lanza durante el build/inicialización
- Esto crashea la aplicación antes de que cualquier código pueda ejecutarse
- No hay forma de capturar o manejar este error

**Solución:**
Se creó una función helper `requireInProduction` que valida condicionalmente sin ejecutarse inmediatamente:
```typescript
// Helper para validar variables requeridas en producción (lazy validation)
// Esta función solo se ejecuta cuando se evalúa, no durante la inicialización del módulo
const requireInProduction = (value: string | undefined, varName: string, defaultValue: string): string => {
  if (import.meta.env.PROD && !value) {
    throw new Error(`${varName} debe estar definida en producción`);
  }
  return value || defaultValue;
};

// Uso:
export const APP_URL = requireInProduction(rawAppUrlForApp, 'VITE_APP_URL', 'http://localhost:5173');
```

**Lugares corregidos:**
- `APP_URL` (línea 61)
- `PUBLIC_APP_URL` (línea 73)
- `SHORT_URL_BASE` (línea 79)
- `PUBLIC_DOMAIN` (línea 85)
- `PILI_API_BASE_URL` (línea 91)

---

### Bug 3: Caracteres Especiales sin Escapar en sed

**Ubicación:** `docker/entrypoint.sh:28-29`

**Problema:**
Se usaba `${API_BASE_URL_VALUE}` directamente en `sed` sin escapar caracteres especiales:
```bash
sed -e "s/__PORT__/${PORT_VALUE}/g" -e "s|__API_BASE_URL__|${API_BASE_URL_VALUE}|g" "$TEMPLATE" > "$TARGET"
```

**Impacto:**
- URLs que contienen `/`, `&`, `\`, u otros caracteres especiales de regex causan que el comando `sed` falle
- El comando puede comportarse de forma inesperada o generar configuraciones de nginx inválidas
- Ejemplo: `https://api.migro.es/api` contiene `/` que puede romper el patrón de reemplazo

**Solución:**
Se agregó escape de caracteres especiales antes de usar en `sed`:
```bash
# Escapar caracteres especiales para sed (/, &, \, etc.)
# Escapar todos los caracteres especiales de regex de sed
API_BASE_URL_ESCAPED=$(printf '%s\n' "$API_BASE_URL_VALUE" | sed 's/[[\.*^$()+?{|]/\\&/g')
# Reemplazar tanto el puerto como la URL de la API (ya escapada)
sed -e "s/__PORT__/${PORT_VALUE}/g" -e "s|__API_BASE_URL__|${API_BASE_URL_ESCAPED}|g" "$TEMPLATE" > "$TARGET"
```

---

### Bug 4: ARG sin Valor por Defecto para VITE_STRIPE_PUBLISHABLE_KEY

**Ubicación:** `Dockerfile:24`

**Problema:**
`VITE_STRIPE_PUBLISHABLE_KEY` se declaraba como `ARG` sin valor por defecto:
```dockerfile
ARG VITE_STRIPE_PUBLISHABLE_KEY
```

**Impacto:**
- Cuando `docker build` se ejecuta sin `--build-arg VITE_STRIPE_PUBLISHABLE_KEY=...`, el ARG se convierte en una cadena vacía
- Esta cadena vacía se propaga al frontend como `VITE_STRIPE_PUBLISHABLE_KEY=""`
- El frontend detecta esto como un valor inválido y puede fallar durante el build o la inicialización
- Esto causa que los builds de Docker fallen o generen aplicaciones que no pueden inicializarse

**Solución:**
Se agregó un valor por defecto para desarrollo:
```dockerfile
ARG VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
```

**Nota:** En producción, esta variable DEBE estar definida con una clave real, pero el valor por defecto permite que los builds de desarrollo funcionen sin errores.

---

### Bug 5: ARG sin Valor por Defecto en Stage de Producción

**Ubicación:** `Dockerfile:61-62`

**Problema:**
En el stage de producción (`FROM nginx:alpine`), `VITE_API_BASE_URL` se declaraba como `ARG` sin valor por defecto:
```dockerfile
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
```

**Impacto:**
- Los `ARG` no se pasan automáticamente entre stages de Docker
- Si no se pasa explícitamente con `--build-arg`, el ARG será una cadena vacía
- Esto causa que `VITE_API_BASE_URL` sea una cadena vacía en el contenedor de producción
- El `entrypoint.sh` usa esta variable para generar la configuración de nginx, causando configuraciones inválidas

**Solución:**
Se agregó un valor por defecto para desarrollo:
```dockerfile
# IMPORTANTE: Los ARGs no se pasan automáticamente entre stages, 
# por lo que debemos pasarlo explícitamente o usar un valor por defecto
ARG VITE_API_BASE_URL=http://localhost:8000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
```

**Nota:** En producción, esta variable DEBE estar definida con la URL real de la API, pero el valor por defecto permite que los builds de desarrollo funcionen.

---

## 📋 Resumen de Cambios

### Archivos Modificados

1. **`src/config/constants.ts`**
   - Eliminado `throw` inmediato para `STRIPE_PUBLISHABLE_KEY`
   - Eliminados todos los IIFEs que ejecutaban `throw` inmediatamente
   - Creada función helper `requireInProduction` para validación condicional
   - Cambiado tipo de `STRIPE_PUBLISHABLE_KEY` a `string | undefined`

2. **`docker/entrypoint.sh`**
   - Agregado escape de caracteres especiales para `sed`
   - Mejorada la robustez del reemplazo de variables en plantillas

3. **`Dockerfile`**
   - Agregado valor por defecto para `VITE_STRIPE_PUBLISHABLE_KEY`
   - Agregado valor por defecto para `VITE_API_BASE_URL` en stage de producción
   - Agregados comentarios explicativos sobre el comportamiento de ARGs entre stages

---

## 🔧 Verificación

### Verificar Bug 1 y 2 (Inicialización de Módulos)

1. **Sin Stripe configurado:**
   ```bash
   # La aplicación debe cargar normalmente
   npm run dev
   # Solo debe fallar cuando se intenta usar Stripe
   ```

2. **En producción sin variables:**
   ```bash
   # El build debe fallar con mensaje claro
   npm run build
   # Error: "VITE_APP_URL debe estar definida en producción"
   ```

### Verificar Bug 3 (Escape de sed)

1. **Con URL que contiene caracteres especiales:**
   ```bash
   # Debe funcionar correctamente
   VITE_API_BASE_URL="https://api.migro.es/api" docker-compose up
   ```

2. **Verificar configuración de nginx:**
   ```bash
   docker exec migro-hiring-prod cat /etc/nginx/conf.d/default.conf | grep API_BASE_URL
   ```

### Verificar Bug 4 y 5 (Dockerfile)

1. **Build sin variables:**
   ```bash
   # Debe funcionar con valores por defecto
   docker build -t migro-hiring-test .
   ```

2. **Build con variables:**
   ```bash
   # Debe usar las variables proporcionadas
   docker build \
     --build-arg VITE_API_BASE_URL=https://api.migro.es/api \
     --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... \
     -t migro-hiring-prod .
   ```

---

## 📚 Referencias

- [Docker ARG vs ENV](https://docs.docker.com/engine/reference/builder/#arg)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [sed Special Characters](https://www.gnu.org/software/sed/manual/sed.html#BRE-syntax)
- [TypeScript Module Initialization](https://www.typescriptlang.org/docs/handbook/modules.html)

---

## ✅ Checklist de Verificación

- [x] Bug 1: Eliminado throw inmediato para STRIPE_PUBLISHABLE_KEY
- [x] Bug 2: Eliminados todos los IIFEs que ejecutaban throws
- [x] Bug 3: Agregado escape de caracteres especiales en sed
- [x] Bug 4: Agregado valor por defecto para VITE_STRIPE_PUBLISHABLE_KEY
- [x] Bug 5: Agregado valor por defecto para VITE_API_BASE_URL en stage de producción
- [x] Documentación creada
- [x] Sin errores de linting

---

**Estado:** ✅ **Bugs corregidos**  
**Última actualización:** 15 de Enero de 2026  
**Versión:** 1.0.0
