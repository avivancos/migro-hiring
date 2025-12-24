// Wizard API Service - Cliente API para el Call Data Wizard

import { api } from './api';
import type {
  CallDataWizard,
  WizardStepResponse,
  WizardGuidance,
  WizardSaveStepRequest,
  WizardCompleteRequest,
  WizardPauseRequest,
} from '@/types/wizard';

const CRM_BASE_PATH = '/crm';

export const wizardApi = {
  /**
   * Iniciar wizard para una llamada
   */
  async start(callId: string): Promise<CallDataWizard> {
    const { data } = await api.post<CallDataWizard>(
      `${CRM_BASE_PATH}/calls/${callId}/wizard/start`
    );
    return data;
  },

  /**
   * Obtener estado del wizard
   */
  async get(callId: string): Promise<CallDataWizard> {
    const { data } = await api.get<CallDataWizard>(
      `${CRM_BASE_PATH}/calls/${callId}/wizard`
    );
    return data;
  },

  /**
   * Obtener siguiente paso del wizard
   */
  async getNextStep(callId: string): Promise<WizardStepResponse> {
    const { data } = await api.get<WizardStepResponse>(
      `${CRM_BASE_PATH}/calls/${callId}/wizard/next-step`
    );
    return data;
  },

  /**
   * Obtener guía del wizard
   */
  async getGuidance(callId: string): Promise<WizardGuidance> {
    const { data } = await api.get<WizardGuidance>(
      `${CRM_BASE_PATH}/calls/${callId}/wizard/guidance`
    );
    return data;
  },

  /**
   * Guardar datos de un paso
   */
  async saveStep(
    callId: string,
    stepNumber: number,
    stepData: Record<string, any>
  ): Promise<CallDataWizard> {
    const { data } = await api.post<CallDataWizard>(
      `${CRM_BASE_PATH}/calls/${callId}/wizard/step`,
      {
        step_number: stepNumber,
        step_data: stepData,
      } as WizardSaveStepRequest
    );
    return data;
  },

  /**
   * Completar wizard
   */
  async complete(
    callId: string,
    options?: { validateData?: boolean }
  ): Promise<CallDataWizard> {
    const { data } = await api.post<CallDataWizard>(
      `${CRM_BASE_PATH}/calls/${callId}/wizard/complete`,
      {
        validate_data: options?.validateData ?? true,
        mark_initial_contact_completed: true,
        create_pipeline: true,
      } as WizardCompleteRequest
    );
    return data;
  },

  /**
   * Pausar wizard
   */
  async pause(callId: string, reason?: string): Promise<CallDataWizard> {
    const { data } = await api.post<CallDataWizard>(
      `${CRM_BASE_PATH}/calls/${callId}/wizard/pause`,
      { reason } as WizardPauseRequest
    );
    return data;
  },

  /**
   * Reanudar wizard
   */
  async resume(callId: string): Promise<CallDataWizard> {
    const { data } = await api.post<CallDataWizard>(
      `${CRM_BASE_PATH}/calls/${callId}/wizard/resume`
    );
    return data;
  },
};


