// Resolver de siguiente acción para oportunidades
// Garantiza que cada oportunidad siempre tenga una acción siguiente disponible

import type { LeadOpportunity } from '@/types/opportunity';
import type { PipelineActionRead, PipelineStage } from '@/types/pipeline';

export interface SuggestedNextAction {
  action_code: string;
  action_name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  required: boolean;
}

/**
 * Determina la siguiente acción sugerida para una oportunidad
 * Basado en el estado actual: llamadas, ventas, seguimientos, etc.
 */
export function getSuggestedNextAction(
  opportunity: LeadOpportunity,
  completedActions: PipelineActionRead[] = [],
  currentStage?: PipelineStage
): SuggestedNextAction | null {
  // 1. PRIMERA PRIORIDAD: Realizar primera llamada (si no se ha completado)
  if (!opportunity.first_call_completed) {
    const attempts = opportunity.first_call_attempts || {};
    const attemptCount = Object.keys(attempts).length;
    
    if (attemptCount < 5) {
      // Aún hay intentos disponibles
      const nextAttempt = attemptCount + 1;
      return {
        action_code: 'make_first_call',
        action_name: `Realizar Primera Llamada (Intento ${nextAttempt}/5)`,
        description: `Realiza el intento ${nextAttempt} de 5 para contactar al cliente`,
        priority: 'high',
        reason: 'La primera llamada es fundamental para iniciar la relación',
        required: true,
      };
    } else if (attemptCount === 5) {
      // Se agotaron todos los intentos sin éxito
      return {
        action_code: 'follow_up_after_failed_calls',
        action_name: 'Seguimiento Post-Llamadas Fallidas',
        description: 'Todos los intentos de llamada se agotaron. Considera seguimiento alternativo',
        priority: 'high',
        reason: 'Se agotaron todos los intentos de primera llamada sin éxito',
        required: true,
      };
    }
  }

  // 2. Si la primera llamada fue exitosa, verificar si hay análisis de Pili
  if (opportunity.first_call_completed && opportunity.first_call_successful_attempt) {
    const hasPiliAnalysis = completedActions.some(
      (a) => a.action_type === 'pili_analysis' || a.action_type === 'analyze_case'
    );
    
    if (!hasPiliAnalysis && currentStage === 'agent_initial') {
      return {
        action_code: 'request_pili_analysis',
        action_name: 'Solicitar Análisis de Pili',
        description: 'Solicita a Pili que analice el caso después de la primera llamada exitosa',
        priority: 'high',
        reason: 'La primera llamada fue exitosa, ahora se requiere análisis del caso',
        required: true,
      };
    }
  }

  // 3. Si estamos en etapa inicial y no se ha elevado al abogado
  if (currentStage === 'agent_initial') {
    const hasElevation = completedActions.some(
      (a) => a.action_type === 'elevate_to_lawyer' && a.status === 'validated'
    );
    
    if (!hasElevation) {
      const elevateAction = completedActions.find((a) => a.action_type === 'elevate_to_lawyer');
      
      if (!elevateAction) {
        return {
          action_code: 'elevate_to_lawyer',
          action_name: 'Elevar Caso a Abogado',
          description: 'Eleva el caso para validación legal después del análisis',
          priority: 'high',
          reason: 'El caso requiere validación legal antes de continuar',
          required: true,
        };
      } else if (elevateAction.status === 'pending_validation') {
        return {
          action_code: 'wait_lawyer_validation',
          action_name: 'Esperar Validación del Abogado',
          description: 'El caso está pendiente de validación por el abogado',
          priority: 'high',
          reason: 'Esperando validación del abogado para continuar',
          required: true,
        };
      }
    }
  }

  // 4. Si el caso fue rechazado, sugerir seguimiento o descarte
  if (currentStage === 'agent_initial') {
    const hasRejection = completedActions.some(
      (a) => a.action_type === 'reject_tramite' && a.status === 'validated'
    );
    
    if (hasRejection) {
      return {
        action_code: 'follow_up_rejected_case',
        action_name: 'Seguimiento de Caso Rechazado',
        description: 'El caso fue rechazado. Considera seguimiento alternativo o descarte',
        priority: 'medium',
        reason: 'El caso requiere seguimiento después del rechazo',
        required: false,
      };
    }
  }

  // 5. Si estamos en etapa de validación de abogado
  if (currentStage === 'lawyer_validation') {
    const hasValidation = completedActions.some(
      (a) => a.action_type === 'validate_pili_analysis' && a.status === 'validated'
    );
    
    if (!hasValidation) {
      return {
        action_code: 'validate_pili_analysis',
        action_name: 'Validar Análisis de Pili',
        description: 'Valida el análisis realizado por Pili',
        priority: 'high',
        reason: 'Requiere validación legal del análisis',
        required: true,
      };
    } else {
      // Después de validar, aprobar o rechazar
      const hasApproval = completedActions.some(
        (a) => (a.action_type === 'approve_tramite' || a.action_type === 'reject_tramite') && a.status === 'validated'
      );
      
      if (!hasApproval) {
        return {
          action_code: 'approve_or_reject_tramite',
          action_name: 'Aprobar o Rechazar Trámite',
          description: 'Decide si el trámite se aprueba o rechaza después de la validación',
          priority: 'high',
          reason: 'Se requiere decisión sobre el trámite',
          required: true,
        };
      }
    }
  }

  // 6. Si está aprobado, generar contrato
  if (currentStage === 'admin_contract') {
    const hasContract = completedActions.some(
      (a) => a.action_type === 'generate_contract' && a.status === 'completed'
    );
    
    if (!hasContract) {
      return {
        action_code: 'generate_contract',
        action_name: 'Generar Contrato',
        description: 'Genera el contrato para el cliente',
        priority: 'high',
        reason: 'El trámite fue aprobado, se requiere generar el contrato',
        required: true,
      };
    }
  }

  // 7. Esperar firma y pago
  if (currentStage === 'client_signature') {
    const hasSignature = completedActions.some(
      (a) => a.action_type === 'wait_signature_payment' && a.status === 'completed'
    );
    
    if (!hasSignature) {
      return {
        action_code: 'wait_signature_payment',
        action_name: 'Esperar Firma y Pago',
        description: 'Espera la firma del contrato y el pago del cliente',
        priority: 'high',
        reason: 'Se requiere firma y pago para continuar',
        required: true,
      };
    } else {
      // Si ya hay firma, crear expediente
      const hasExpediente = completedActions.some(
        (a) => a.action_type === 'create_expediente' && a.status === 'completed'
      );
      
      if (!hasExpediente) {
        return {
          action_code: 'create_expediente',
          action_name: 'Crear Expediente',
          description: 'Crea el expediente legal después de la firma y pago',
          priority: 'high',
          reason: 'Se requiere crear el expediente legal',
          required: true,
        };
      }
    }
  }

  // 8. Si está en expediente creado, sugerir seguimiento de relación
  if (currentStage === 'expediente_created') {
    const hasExpediente = completedActions.some(
      (a) => a.action_type === 'create_expediente' && a.status === 'completed'
    );
    
    if (hasExpediente) {
      // Buscar último seguimiento
      const followUpActions = completedActions.filter(
        (a) => a.action_type === 'follow_up' || a.action_type === 'relationship_building'
      );
      
      const lastFollowUp = followUpActions.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      
      // Si no hay seguimiento reciente (últimos 30 días), sugerir uno
      if (!lastFollowUp || 
          new Date().getTime() - new Date(lastFollowUp.created_at).getTime() > 30 * 24 * 60 * 60 * 1000) {
        return {
          action_code: 'relationship_follow_up',
          action_name: 'Seguimiento de Relación',
          description: 'Mantén el contacto con el cliente para construir relación de confianza',
          priority: 'medium',
          reason: 'Importante mantener relación activa con el cliente',
          required: false,
        };
      }
    }
  }

  // 9. Si la oportunidad está perdida o expirada, sugerir reactivación
  if (opportunity.status === 'lost' || opportunity.status === 'expired') {
    return {
      action_code: 'reactivate_opportunity',
      action_name: 'Reactivar Oportunidad',
      description: 'Considera reactivar esta oportunidad perdida o expirada',
      priority: 'low',
      reason: 'Oportunidad marcada como perdida/expirada, podría reactivarse',
      required: false,
    };
  }

  // 10. Si no hay ninguna acción específica, sugerir seguimiento general
  return {
    action_code: 'general_follow_up',
    action_name: 'Seguimiento General',
    description: 'Realiza un seguimiento general con el cliente',
    priority: 'medium',
    reason: 'Mantener contacto activo con el cliente',
    required: false,
  };
}

/**
 * Verifica si una oportunidad tiene una acción siguiente disponible
 */
export function hasNextAction(opportunity: LeadOpportunity): boolean {
  // Si no ha completado la primera llamada y tiene intentos disponibles
  if (!opportunity.first_call_completed) {
    const attempts = opportunity.first_call_attempts || {};
    return Object.keys(attempts).length < 5;
  }
  
  // Siempre hay una acción siguiente (al menos seguimiento general)
  return true;
}

/**
 * Obtiene un mensaje descriptivo del estado actual de la oportunidad
 */
export function getOpportunityStatusMessage(opportunity: LeadOpportunity): string {
  if (!opportunity.first_call_completed) {
    const attempts = opportunity.first_call_attempts || {};
    const attemptCount = Object.keys(attempts).length;
    return `Pendiente de primera llamada (${attemptCount}/5 intentos)`;
  }
  
  if (opportunity.status === 'pending') {
    return 'Pendiente de asignación';
  }
  
  if (opportunity.status === 'assigned') {
    return 'Asignada, en proceso';
  }
  
  if (opportunity.status === 'contacted') {
    return 'Contactada, en seguimiento';
  }
  
  if (opportunity.status === 'converted') {
    return 'Convertida exitosamente';
  }
  
  if (opportunity.status === 'lost') {
    return 'Oportunidad perdida';
  }
  
  if (opportunity.status === 'expired') {
    return 'Oportunidad expirada';
  }
  
  return 'En proceso';
}


