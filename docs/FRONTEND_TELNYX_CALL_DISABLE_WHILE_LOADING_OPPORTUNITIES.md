## Contexto
En `CRMContactDetail` se agregó el botón **“Llamar (Telnyx)”** que inicia una llamada vía Telnyx usando una **oportunidad** como entidad base.

El detalle del contacto carga `relatedOpportunities` de forma asíncrona y mantiene el flag `loadingOpportunities` mientras pagina/busca la oportunidad relacionada.

## Problema
Mientras `loadingOpportunities` está en `true`, `relatedOpportunities` puede estar temporalmente vacío.

Si el usuario hace clic en **“Llamar (Telnyx)”** durante esa ventana:
- `handleTelnyxCall()` asume “no hay oportunidad” (porque `relatedOpportunities[0]` es `undefined`)
- crea una oportunidad nueva
- cuando termina la carga original, se puede terminar con **oportunidades duplicadas** para el mismo contacto.

## Fix aplicado
Se aplicó una corrección en dos capas para evitar duplicados:

1) **Deshabilitar el botón durante la carga**
- Archivo: `src/pages/CRMContactDetail.tsx`
- Cambio: `disabled` ahora incluye `loadingOpportunities`.
- UX: el `title` del botón muestra “Cargando oportunidades relacionadas…” mientras carga.

2) **Guard defensivo en el handler**
- Archivo: `src/pages/CRMContactDetail.tsx`
- Cambio: al inicio de `handleTelnyxCall()` se corta el flujo si `loadingOpportunities === true`, mostrando un mensaje para reintentar cuando termine la carga.

## Archivos tocados
- `src/pages/CRMContactDetail.tsx`

## Test manual (rápido)
- Abrir un contacto con muchas oportunidades en el sistema (o red lenta simulada).
- Entrar a `Contact detail` y **antes de que termine “Oportunidades Relacionadas”**, intentar pulsar “Llamar (Telnyx)”:
  - Debe estar **deshabilitado**.
- Cuando termine de cargar:
  - El botón se habilita (si hay teléfono/móvil).
  - Al pulsar, debe iniciar la llamada sin crear oportunidades duplicadas.

