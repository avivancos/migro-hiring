// Hook para verificar permisos según rol del usuario
// Basado en la documentación de permisos del prompt

import { useAuth } from './useAuth';
import type { ExpedienteRead } from '@/types/expediente';
import type { PipelineActionRead } from '@/types/pipeline';

export function usePermissions() {
  const { user } = useAuth();

  const canEditExpediente = (expediente: ExpedienteRead): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    if (user.role === 'lawyer') return true;
    if (expediente.user_id === user.id) return true;
    return false;
  };

  const canChangeStatus = (_expediente: ExpedienteRead): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    if (user.role === 'lawyer') return true;
    return false;
  };

  const canAssignFormulario = (): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    if (user.role === 'lawyer') return true;
    return false;
  };

  const canValidateAction = (action: PipelineActionRead): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    if (action.responsible_for_validation_id === user.id) return true;
    // Validar según validation_role del action_type si está disponible
    // Por ahora, asumimos que si es responsable de validación, puede validar
    return false;
  };

  const canCreateExpediente = (): boolean => {
    if (!user) return false;
    // Todos los usuarios autenticados pueden crear expedientes
    return true;
  };

  const canDeleteExpediente = (expediente: ExpedienteRead): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    if (user.role === 'lawyer' && expediente.user_id === user.id) return true;
    return false;
  };

  const canViewAllExpedientes = (): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    if (user.role === 'lawyer') return true;
    if (user.role === 'agent') return true;
    return false;
  };

  const canCreatePipelineAction = (): boolean => {
    if (!user) return false;
    // Agentes, abogados y admins pueden crear acciones
    return ['agent', 'lawyer', 'admin'].includes(user.role || '');
  };

  const canChangePipelineStage = (): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    if (user.role === 'lawyer') return true;
    if (user.role === 'admin') return true;
    return false;
  };

  return {
    canEditExpediente,
    canChangeStatus,
    canAssignFormulario,
    canValidateAction,
    canCreateExpediente,
    canDeleteExpediente,
    canViewAllExpedientes,
    canCreatePipelineAction,
    canChangePipelineStage,
  };
}

