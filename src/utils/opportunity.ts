// Opportunity Utilities - Funciones helper para el módulo de oportunidades

import type { FirstCallAttempts } from '@/types/opportunity';

/**
 * Cuenta el número de intentos válidos (1-5) en first_call_attempts
 * Solo cuenta las claves válidas para evitar problemas con datos corruptos
 */
export function getValidAttemptsCount(attempts: FirstCallAttempts | null | undefined): number {
  if (!attempts) return 0;
  const validAttemptNumbers = ['1', '2', '3', '4', '5'];
  return Object.keys(attempts).filter(key => validAttemptNumbers.includes(key)).length;
}

/**
 * Obtiene las razones de detección como un array de strings
 * Puede ser un string o un objeto con propiedades específicas
 */
export function getDetectionReasonBadges(
  detectionReason: string | Record<string, any>
): string[] {
  if (typeof detectionReason === 'string') {
    // Si es un string, intentar dividirlo por " • " o devolverlo como único elemento
    if (detectionReason.includes(' • ')) {
      return detectionReason.split(' • ').filter(Boolean);
    }
    return detectionReason ? [detectionReason] : ['Oportunidad detectada'];
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

  return reasons.length > 0 ? reasons : ['Oportunidad detectada'];
}

/**
 * Formatea la razón de detección de una oportunidad
 * Puede ser un string o un objeto con propiedades específicas
 * @deprecated Usar getDetectionReasonBadges para obtener un array de badges
 */
export function formatDetectionReason(
  detectionReason: string | Record<string, any>
): string {
  const badges = getDetectionReasonBadges(detectionReason);
  return badges.join(' • ');
}

