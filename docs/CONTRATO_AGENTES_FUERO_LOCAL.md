# Contrato de agentes: fuero local del agente

## Objetivo
Permitir que el convenio de colaboración de agentes contemple, además de Salamanca, la posibilidad de pactar el fuero en el domicilio local del agente cuando los colaboradores trabajen fuera de España.

## Cambios realizados
- Se actualizó la cláusula de jurisdicción para admitir alternativa de fuero local del despacho/agente cuando se pacte expresamente y quede reflejado en el encabezado.
- Se mantuvo la referencia a la resolución amistosa previa.
- Se alineó el resumen contractual del PDF con la nueva opción de fuero.

## Archivos impactados
- `src/utils/collabAgreementTemplate.ts`
- `src/utils/collabAgreementPdfGenerator.ts`

## Texto clave actualizado
- Jurisdicción: Salamanca o domicilio local del despacho/agente si se pacta expresamente.
- Fuero específico: Salamanca o fuero local del despacho/agente con pacto expreso.

## Notas
- La plantilla usa `collaboratorCity` y `collaboratorProvince` para reflejar el domicilio local.
- El PDF de resumen refleja la misma lógica en forma abreviada.
