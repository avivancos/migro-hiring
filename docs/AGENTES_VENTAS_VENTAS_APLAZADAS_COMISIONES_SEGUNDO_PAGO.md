## Contexto
En el convenio de **Agentes de Ventas** se estableció que las comisiones por contratación efectiva se generan tras el **primer pago válido** del cliente a MIGRO.

Para **ventas aplazadas** (planes de pago en varios plazos), se solicitó que las comisiones se generen tras el **segundo pago** (no el primero) para reducir riesgos comerciales.

## Cambio aplicado (source of truth)
Se actualizó el documento contractual “fuente”:
- `src/legal/agente_ventas_agreement.md`

## Excepción para ventas aplazadas
- **Cláusula 2.4** (Comisiones por contratación): se añadió excepción explícita indicando que en contrataciones con pago aplazado, las comisiones se generarán tras el **segundo pago válido** del cliente a MIGRO.
- **Cláusula 2.5** (Contratación efectiva): se añadió excepción indicando que en contrataciones con pago aplazado, la “contratación efectiva” se entenderá cumplida cuando el cliente haya realizado el **segundo pago válido** a MIGRO.

## Impacto
- El **reparto por roles (30/20/10)** se mantiene igual.
- Solo cambia el **momento del devengo**: en ventas aplazadas, se retrasa hasta el segundo pago.
- Objetivo: reducir riesgos comerciales al asegurar que el cliente haya cumplido con al menos dos pagos antes de generar comisiones.

## Archivos sincronizados
- `src/legal/CHANGELOG_AGENTE_VENTAS.md` (versión 1.3)
- `docs/AGENTES_VENTAS_ROLES_Y_REPARTO_COMISIONES.md`
- `docs/CONVENIO_COLABORACION_FREELANCE_AGENTES_VENTAS.md`
- `docs/CONTRATO_COLABORACION_AGENTES_VENTAS.md`

## Test manual rápido
- Verificar en el contrato (PDF o MD) que las cláusulas 2.4 y 2.5 mencionan la excepción para ventas aplazadas.
- Confirmar que el changelog incluye la versión 1.3 con este cambio.
