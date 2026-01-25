# Fix: evitar placeholders literales en jurisdicción (convenio colaboradores)

## Contexto
Se detectó un riesgo de que el texto de jurisdicción mostrara placeholders de template (por ejemplo, `${collaboratorCity}` / `${collaboratorProvince}`) si el contenido se consumía como texto sin interpolación, lo que degradaría la validez/precisión del documento legal.

Además, para el documento “publicado” (fuente `src/legal/colab_agreement.md`), se actualizó el changelog para que la última modificación refleje el deploy del **25/1/2026** y se alineó la jurisdicción con el “fuero local (según encabezado)”.

## Decisión
Dado que el **domicilio del colaborador** ya figura en el **encabezado** del convenio (identificación de EL DESPACHO), se ajustó la redacción para **no repetir ciudad/provincia dentro de la cláusula** y, en su lugar, referenciar:

- “domicilio local de EL DESPACHO (según encabezado)”

Esto mantiene el sentido jurídico (“fuero local si se pacta expresamente y se consigna en el encabezado”) y elimina el riesgo de placeholders literales.

## Cambios realizados
- Actualizada cláusula 12.2 (“Ley aplicable y jurisdicción”) para eliminar la repetición de ciudad/provincia dentro de la cláusula.
- Actualizada cláusula 15.1 (“Fuero específico”) para aclarar “según encabezado”.
- Alineado el resumen en PDF (texto breve de jurisdicción) con “según encabezado”.

## Archivos impactados
- `src/utils/collabAgreementTemplate.ts`
- `src/utils/collabAgreementPdfGenerator.ts`
- `src/legal/colab_agreement.md`
- `docs/CONTRATO_AGENTES_FUERO_LOCAL.md`

