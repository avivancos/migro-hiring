## Contexto
En el convenio de **Agentes de Ventas** se solicitó ampliar la jurisdicción para permitir que los agentes puedan elegir el fuero en su domicilio local (similar a lo implementado para abogados colaboradores).

## Cambio aplicado (source of truth)
Se actualizó el documento contractual "fuente":
- `src/legal/agente_ventas_agreement.md`

## Actualización de jurisdicción
- **Cláusula 14.2** (Ley aplicable y jurisdicción): se añadió la opción de someterse a los Juzgados y Tribunales del domicilio local de EL AGENTE, cuando así se acuerde entre las partes y se haga constar en el encabezado.
- **Cláusula 15.1** (Fuero específico): se cambió de "exclusivamente competentes los Juzgados y Tribunales de Salamanca capital" a "competentes los Juzgados y Tribunales de Salamanca capital o, si se pacta expresamente, los del domicilio local de EL AGENTE (según encabezado)".

## Impacto
- Los agentes de ventas ahora pueden pactar expresamente el fuero en su domicilio local.
- Salamanca sigue siendo la referencia general por defecto.
- El domicilio del agente debe constar en el encabezado del contrato para que la opción sea válida.

## Archivos sincronizados
- `src/legal/CHANGELOG_AGENTE_VENTAS.md` (versión 1.3)
- `docs/CONVENIO_COLABORACION_FREELANCE_AGENTES_VENTAS.md`
- `docs/CONTRATO_COLABORACION_AGENTES_VENTAS.md` (si aplica)

## Test manual rápido
- Verificar en el contrato (PDF o MD) que las cláusulas 14.2 y 15.1 mencionan la opción de fuero en el domicilio local del agente.
- Confirmar que el changelog incluye este cambio en la versión 1.3.
