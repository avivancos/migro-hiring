# Fix: no reemplazar `window` en tests

**Fecha**: 2026-01-18

## Problema
En `src/test/setup.ts` se reemplazaba `global.window` con un objeto plano al mockear `CloudTalk`. Esto rompía la relación con `document.defaultView` y generaba inconsistencias en el entorno JSDOM.

## Solución
Se mantiene el objeto `window` original y se agregan/ajustan solo las propiedades necesarias:
- `window.CloudTalk = undefined`
- `window.location.href = ''` (con fallback si `location` no existe)

## Archivo tocado
- `src/test/setup.ts`

## Resultado esperado
El entorno de tests conserva el `window` de JSDOM, evitando comportamientos inconsistentes en operaciones de DOM.
