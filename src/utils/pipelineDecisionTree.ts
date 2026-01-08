// Utilidades para el árbol de decisiones del pipeline
// Basado en el diseño del wizard de pipeline

import type { PipelineStage, PipelineActionRead, UserRole, ActionTypeRead } from '@/types/pipeline';

export interface NextAction {
  action_code: string;
  is_required: boolean;
  can_modify: boolean;
}

/**
 * Obtiene las acciones disponibles según la etapa actual y el rol del usuario
 */
export function getNextActions(
  currentStage: PipelineStage,
  completedActions: PipelineActionRead[],
  userRole: UserRole,
  actionTypes: ActionTypeRead[]
): NextAction[] {
  const decisionTree: Record<
    PipelineStage,
    (actions: PipelineActionRead[], actionTypes: ActionTypeRead[]) => NextAction[]
  > = {
    agent_initial: (actions, actionTypes) => {
      // Primera acción siempre requerida
      if (actions.length === 0) {
        const elevateAction = actionTypes.find((at) => at.action_code === 'elevate_to_lawyer');
        if (elevateAction && elevateAction.required_role === userRole) {
          return [
            {
              action_code: 'elevate_to_lawyer',
              is_required: true,
              can_modify: false,
            },
          ];
        }
      }

      // Si primera acción está pendiente, no mostrar otras
      const firstAction = actions.find((a) => a.action_type === 'elevate_to_lawyer');
      if (firstAction?.status === 'pending_validation') {
        return [];
      }

      // Acciones opcionales para agente
      return actionTypes
        .filter(
          (at) =>
            at.required_role === userRole &&
            at.action_code !== 'elevate_to_lawyer' &&
            (at.applicable_stages?.includes('agent_initial') || !at.applicable_stages)
        )
        .map((at) => ({
          action_code: at.action_code,
          is_required: false,
          can_modify: true,
        }));
    },

    lawyer_validation: (actions, actionTypes) => {
      // Validar análisis Pili es requerida si no existe
      const validateAction = actions.find((a) => a.action_type === 'validate_pili_analysis');
      if (!validateAction) {
        const validateActionType = actionTypes.find(
          (at) => at.action_code === 'validate_pili_analysis' && at.required_role === userRole
        );
        if (validateActionType) {
          return [
            {
              action_code: 'validate_pili_analysis',
              is_required: true,
              can_modify: false,
            },
          ];
        }
      }

      // Si está validado, mostrar aprobar/rechazar
      if (validateAction?.status === 'validated') {
        return actionTypes
          .filter(
            (at) =>
              at.required_role === userRole &&
              (at.action_code === 'approve_tramite' || at.action_code === 'reject_tramite') &&
              (at.applicable_stages?.includes('lawyer_validation') || !at.applicable_stages)
          )
          .map((at) => ({
            action_code: at.action_code,
            is_required: at.action_code === 'approve_tramite',
            can_modify: true,
          }));
      }

      return [];
    },

    admin_contract: (actions, actionTypes) => {
      const generateAction = actions.find((a) => a.action_type === 'generate_contract');
      if (!generateAction || generateAction.status !== 'completed') {
        const generateActionType = actionTypes.find(
          (at) => at.action_code === 'generate_contract' && at.required_role === userRole
        );
        if (generateActionType) {
          return [
            {
              action_code: 'generate_contract',
              is_required: true,
              can_modify: false,
            },
          ];
        }
      }

      return actionTypes
        .filter(
          (at) =>
            at.required_role === userRole &&
            at.action_code !== 'generate_contract' &&
            (at.applicable_stages?.includes('admin_contract') || !at.applicable_stages)
        )
        .map((at) => ({
          action_code: at.action_code,
          is_required: false,
          can_modify: true,
        }));
    },

    client_signature: (actions, actionTypes) => {
      const waitAction = actions.find((a) => a.action_type === 'wait_signature_payment');
      if (!waitAction) {
        const waitActionType = actionTypes.find(
          (at) => at.action_code === 'wait_signature_payment' && at.required_role === userRole
        );
        if (waitActionType) {
          return [
            {
              action_code: 'wait_signature_payment',
              is_required: true,
              can_modify: false,
            },
          ];
        }
      }

      return actionTypes
        .filter(
          (at) =>
            at.required_role === userRole &&
            at.action_code !== 'wait_signature_payment' &&
            (at.applicable_stages?.includes('client_signature') || !at.applicable_stages)
        )
        .map((at) => ({
          action_code: at.action_code,
          is_required: false,
          can_modify: true,
        }));
    },

    expediente_created: (actions, actionTypes) => {
      const createAction = actions.find((a) => a.action_type === 'create_expediente');
      if (!createAction || createAction.status !== 'completed') {
        const createActionType = actionTypes.find(
          (at) => at.action_code === 'create_expediente' && at.required_role === userRole
        );
        if (createActionType) {
          return [
            {
              action_code: 'create_expediente',
              is_required: true,
              can_modify: false,
            },
          ];
        }
      }

      return actionTypes
        .filter(
          (at) =>
            at.required_role === userRole &&
            at.action_code !== 'create_expediente' &&
            (at.applicable_stages?.includes('expediente_created') || !at.applicable_stages)
        )
        .map((at) => ({
          action_code: at.action_code,
          is_required: false,
          can_modify: true,
        }));
    },
  };

  const getActions = decisionTree[currentStage];
  if (!getActions) return [];

  const availableActions = getActions(completedActions, actionTypes);
  return availableActions.filter((action) =>
    canUserPerformAction(action.action_code, userRole, actionTypes)
  );
}

/**
 * Verifica si un usuario puede realizar una acción según su rol
 */
function canUserPerformAction(
  actionCode: string,
  userRole: UserRole,
  actionTypes: ActionTypeRead[]
): boolean {
  const actionType = actionTypes.find((at) => at.action_code === actionCode);
  if (!actionType) return false;

  // Admins pueden hacer todo (userRole solo puede ser 'lawyer' | 'agent' según el tipo, pero validamos por seguridad)
  if (userRole === 'admin') {
    return true;
  }

  // Verificar si el rol del usuario coincide con el rol requerido
  return actionType.required_role === userRole;
}

/**
 * Obtiene el siguiente stage según la acción completada
 */
export function getNextStage(
  currentStage: PipelineStage,
  actionCode: string
): PipelineStage | null {
  const stageTransitions: Record<PipelineStage, Record<string, PipelineStage>> = {
    agent_initial: {
      elevate_to_lawyer: 'lawyer_validation',
    },
    lawyer_validation: {
      approve_tramite: 'admin_contract',
      reject_tramite: 'agent_initial', // Vuelve atrás
    },
    admin_contract: {
      generate_contract: 'client_signature',
    },
    client_signature: {
      wait_signature_payment: 'expediente_created',
    },
    expediente_created: {
      create_expediente: 'expediente_created', // Se mantiene
    },
  };

  return stageTransitions[currentStage]?.[actionCode] || null;
}

/**
 * Verifica si una acción es requerida según las reglas de negocio
 */
export function isActionRequired(
  actionCode: string,
  currentStage: PipelineStage,
  completedActions: PipelineActionRead[]
): boolean {
  // Primera acción siempre requerida
  if (currentStage === 'agent_initial' && completedActions.length === 0) {
    return actionCode === 'elevate_to_lawyer';
  }

  // Validar análisis Pili es requerida en lawyer_validation si no existe
  if (currentStage === 'lawyer_validation') {
    const validateAction = completedActions.find(
      (a) => a.action_type === 'validate_pili_analysis'
    );
    if (!validateAction && actionCode === 'validate_pili_analysis') {
      return true;
    }
    if (validateAction?.status === 'validated' && actionCode === 'approve_tramite') {
      return true;
    }
  }

  // Generar contrato es requerida en admin_contract
  if (currentStage === 'admin_contract' && actionCode === 'generate_contract') {
    return true;
  }

  // Esperar firma y pago es requerida en client_signature
  if (currentStage === 'client_signature' && actionCode === 'wait_signature_payment') {
    return true;
  }

  // Crear expediente es requerida en expediente_created
  if (currentStage === 'expediente_created' && actionCode === 'create_expediente') {
    return true;
  }

  return false;
}

