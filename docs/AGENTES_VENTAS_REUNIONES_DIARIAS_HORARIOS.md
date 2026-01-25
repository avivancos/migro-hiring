## Contexto
El contrato de **Agentes de Ventas** define reuniones diarias obligatorias para:
- Resolución de casos migratorios y de extranjería.
- Soporte comercial para concretar oportunidades en contratos.

Se solicitó ajustar el horario para que existan **dos reuniones**:
- **Primera** a las **13:30 (hora España)**.
- **Segunda** a las **20:30 (hora España)**.

## Cambio aplicado (source of truth)
Se actualizó el documento contractual “fuente”:
- `src/legal/agente_ventas_agreement.md`

Y los artefactos relacionados:
- `src/legal/CHANGELOG_AGENTE_VENTAS.md`
- `src/pages/ColaboradoresAgentes.tsx` (resumen UI)
- `docs/CONVENIO_COLABORACION_FREELANCE_AGENTES_VENTAS.md`
- `docs/CONTRATO_COLABORACION_AGENTES_VENTAS.md`

## Nuevo horario (hora española)
- **Primera reunión diaria**: 13:30 a 13:45
- **Segunda reunión diaria**: 20:30 a 20:45
- **Fin de jornada**: 20:45 (tras la segunda reunión)

## Puntos del contrato afectados
- `3.5` Horario flexible: ajuste del límite recomendado hasta las 20:30.
- `3.6` Reuniones diarias obligatorias: pasa de 1 reunión a 2 reuniones.
- `3.7` Finalización de la jornada: pasa a 20:45 tras la segunda reunión.
- `13.1` Comunicaciones: referencia en plural a “reuniones diarias obligatorias”.
- `18` Registro de modificaciones: se añade versión 1.1 con el cambio de horario.

## Test manual rápido
- Abrir `/colaboradores-agentes/` y validar que el resumen muestra 13:30–13:45 y 20:30–20:45.
- Descargar el PDF del contrato y verificar que en la cláusula 3.6 aparecen ambas reuniones.

