# Fix: entorno de tests con JSDOM en Docker

**Fecha**: 2026-01-18

## Problema
Los tests de `CRMTaskCalendar` fallaban en Docker con:
```
Expected container to be an Element, a Document or a DocumentFragment but got undefined.
```
Esto indicaba que `@testing-library/dom` no tenía un `document` configurado en el entorno de test.

## Solución aplicada
Se forzó la creación de un DOM con JSDOM en `src/test/setup.ts` y se configuró explícitamente `@testing-library/dom` con ese `document`.

## Archivos tocados
- `src/test/setup.ts`

## Resultado
Los tests del calendario (`src/pages/__tests__/CRMTaskCalendar.test.tsx`) pasan en Docker.
