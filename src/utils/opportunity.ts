// Opportunity Utilities - Funciones helper para el módulo de oportunidades

/**
 * Formatea la razón de detección de una oportunidad
 * Puede ser un string o un objeto con propiedades específicas
 */
export function formatDetectionReason(
  detectionReason: string | Record<string, any>
): string {
  if (typeof detectionReason === 'string') {
    return detectionReason;
  }

  const reason = detectionReason as Record<string, any>;
  const reasons: string[] = [];

  if (reason.has_no_situation) {
    reasons.push('Sin situación conocida');
  }
  if (reason.not_contacted) {
    reasons.push('No contactado');
  }
  if (reason.has_attempts !== undefined) {
    reasons.push(`${reason.attempts_remaining || 0} intentos restantes`);
  }

  return reasons.length > 0 ? reasons.join(' • ') : 'Oportunidad detectada';
}

