## Contexto
Se añadió el portal cliente con el slug `/clientes` y una ruta dinámica `/clientes/:code` para iniciar el flujo de contratación (`HiringFlow`) con un `hiring_code`.

La app actualiza el título SEO (tag `<title>`) con `usePageTitle()` usando `getPageTitle()` en `src/config/pageTitles.ts`.

## Problema
`getPageTitle()` contemplaba casos dinámicos como:
- `/contratacion/:code`
- `/hiring/:code`

Pero **no** contemplaba `/clientes/:code`.

Resultado: al navegar a rutas como `/clientes/ABC123`, el título caía al **fallback genérico** en vez de usar un título SEO coherente para el flujo de contratación del portal.

## Fix aplicado
Archivo: `src/config/pageTitles.ts`

Se agregó la ruta dinámica al mapa `PAGE_TITLES`, usando el mismo mecanismo existente para rutas con `:param`:
- `/clientes/:code` → `Portal de Clientes - Contratación | Migro.es`

Además, por consistencia, también se agregaron:
- `/contratacion/:code`
- `/hiring/:code`

Con esto, el loop de coincidencia por regex en `getPageTitle()` reconoce `/clientes/ABC123` y retorna un título adecuado sin depender del fallback.

## Verificación manual rápida
- Abrir `/clientes/ABC123` (o cualquier código real) y confirmar que el `<title>` del navegador cambia a:
  - `Portal de Clientes - Contratación | Migro.es`

