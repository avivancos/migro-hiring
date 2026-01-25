## Contexto
Se reportó el riesgo de que el PDF del convenio mostrara placeholders literales de template (p. ej. `${collaboratorCity}` / `${collaboratorProvince}`) si el contenido se consumía como texto “raw” sin interpolación previa, degradando la precisión del documento legal.

En este repo existen dos flujos:
- **Convenio publicado (genérico)**: `src/legal/colab_agreement.md` → PDF vía `src/utils/collabAgreementPdfFromMd.ts`.
- **Convenio personalizado**: texto interpolado vía `src/utils/collabAgreementTemplate.ts` → PDF vía `generateCollabAgreementPdfFromText()`.

## Verificación
- En el convenio **publicado** (`src/legal/colab_agreement.md`) **no** hay `${collaboratorCity}` / `${collaboratorProvince}`.
- En el template **personalizado** (`src/utils/collabAgreementTemplate.ts`) esos valores **sí** se interpolan porque `buildCollaboratorAgreementText()` construye un *template literal* con los datos ya disponibles en el formulario.
- Se detectó además un **bloque duplicado** al final de `src/legal/colab_agreement.md` que repetía cláusula 15 + bloque de firmas con un texto de fuero distinto (potencial inconsistencia legal en el PDF publicado).

## Fix aplicado
1) **Guardrail anti-placeholders en PDF**
- Archivo: `src/utils/collabAgreementPdfFromMd.ts`
- Cambio: antes de renderizar, se reemplazan `${collaboratorCity}` y `${collaboratorProvince}` por marcadores neutros (`[Ciudad]` / `[Provincia]`) para evitar que se impriman literales si llegaran a colarse por consumo “raw” sin interpolación.

2) **Eliminar duplicación en el convenio publicado**
- Archivo: `src/legal/colab_agreement.md`
- Cambio: se eliminó el bloque duplicado final (cláusula 15 + firmas + código), dejando una única versión coherente del documento.

## Test rápido (manual)
- Ir a `Colaboradores` → “Descargar PDF” (publicado) y confirmar que:
  - No aparecen `${...}` literales.
  - No hay duplicación de cláusulas/firma al final.
- Ir a “Generar contrato personalizado” y confirmar que ciudad/provincia aparecen interpoladas en el encabezado del texto antes de descargar.

