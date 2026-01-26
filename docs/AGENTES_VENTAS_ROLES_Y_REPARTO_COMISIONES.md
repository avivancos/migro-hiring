## Contexto
En el convenio de **Agentes de Ventas** se solicitó:
- **Especificar labores dentro del grupo de ventas** (roles).
- Actualizar el **esquema de comisiones** por contratación efectiva con un reparto claro por rol.

## Roles (labores) del equipo de ventas
Se definieron los siguientes roles operativos:
- **Supervisor comercial**: escuchas/auditorías de llamadas, propuestas de mejora del guion (script), feedback y soporte operativo para elevar la conversión.
- **Operador de primera llamada**: realiza la primera llamada/entrevista introductoria, cualifica, registra en CRM y ayuda al seguimiento hasta el cierre.
- **Closer (cierre)**: explica el proceso de contratación, resuelve dudas, guía el pago/contratación y coordina/agenda citas o visitas cuando aplique (dejando trazabilidad en CRM).

> Nota: una misma persona puede desempeñar uno o varios roles según la asignación del CRM y las reglas operativas de MIGRO.
>
> Adicionalmente, las funciones/roles **pueden ir relevándose semanalmente** entre los miembros del equipo o asignarse según se elija entre los componentes, manteniendo siempre la trazabilidad en el CRM para el reparto de comisiones.

## Comisión por contratación efectiva (USD) — reparto
Por cada **contratación efectiva** se devenga una comisión total de **60 USD**, distribuida así:
- **30 USD**: operador que realiza la primera llamada y ayuda al seguimiento.
- **20 USD**: resto del equipo (pool de soporte/comercial: supervisor + apoyo al cierre), según trazabilidad en CRM.
- **10 USD**: quien agenda la visita/cita (si aplica) y lo registra en el CRM.

### Excepción: ventas aplazadas
En contrataciones con **pago aplazado** (planes de pago en varios plazos), las comisiones se generarán tras el **segundo pago válido** del cliente a MIGRO (no tras el primero), con el objetivo de reducir riesgos comerciales. El reparto por roles (30/20/10) se mantiene igual, pero el devengo se retrasa hasta el segundo pago.

## Source of truth (contrato)
- `src/legal/agente_ventas_agreement.md`:
  - Roles: cláusula `1.7`
  - Comisiones por contratación (reparto): cláusula `2.4`

## Archivos sincronizados
- `src/legal/CHANGELOG_AGENTE_VENTAS.md` (versión 1.2)
- `src/pages/ColaboradoresAgentes.tsx` (resumen “💰 Remuneración”)
- `docs/CONVENIO_COLABORACION_FREELANCE_AGENTES_VENTAS.md`
- `docs/CONTRATO_COLABORACION_AGENTES_VENTAS.md`

