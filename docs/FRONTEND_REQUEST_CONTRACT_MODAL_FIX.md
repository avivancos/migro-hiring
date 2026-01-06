Fecha: 06/01/2026  
Estado: ✅ Aplicado  

## Resumen
Se corrigieron errores de compilación TypeScript relacionados con el modal de solicitud de contratos y un callback con parámetro sin uso.

## Cambios realizados
- `src/components/opportunities/RequestContractModal.tsx`
  - El campo `service_name` ahora se inicializa con `pipeline_stage.current_stage` (en lugar de `pipeline_stage.name`, propiedad inexistente en `PipelineStageRead`).
  - Se ajustó el reset del formulario para usar el mismo valor seguro.
- `src/pages/CRMOpportunityDetail.tsx`
  - El callback `onSuccess` ahora ignora el parámetro `hiringCode` con `_hiringCode` para evitar la advertencia de variable no usada.

## Motivo
- `PipelineStageRead` no expone la propiedad `name`; solo `current_stage`. Esto generaba errores TS2339 en el build.
- El parámetro `hiringCode` no se utiliza en el callback de éxito, produciendo TS6133.

## Verificación
- Build en Docker exitoso:
  - Comando: `docker build --target builder --progress=plain .`
  - Resultado: ✅ `npm run build` finalizó sin errores.

## Impacto
- El modal de solicitud de contrato compila y sigue precargando el nombre de servicio con el stage actual.
- No hay cambios de comportamiento en runtime; solo corrección de tipos y warnings.

## Siguientes pasos
- Si se requiere un nombre amigable para el servicio, mapear `current_stage` a etiquetas legibles (p.ej. `agent_initial` → "Revisión inicial").***
