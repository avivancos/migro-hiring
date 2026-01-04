// Pipelines API Service
// Basado en documentación: PIPELINE_SYSTEM_COMPLETE.md

import { api } from './api';
import type {
  PipelineStageRead,
  PipelineStageCreate,
  NextActionUpdate,
  NextActionResponse,
  PipelineStatusResponse,
  PipelineActionRead,
  PipelineActionCreate,
  PipelineActionsListResponse,
  ActionValidationRequest,
  ActionTypeRead,
  CallAnalysisResponse,
  EntityType,
} from '@/types/pipeline';

const PIPELINES_BASE_PATH = '/pipelines';

// Helper para obtener el token CRM del storage
const getCrmToken = (): string | null => {
  // El token CRM debería estar en el storage o en el contexto de auth
  // Por ahora, intentamos obtenerlo del localStorage
  return localStorage.getItem('crm_token') || null;
};

// Helper para crear headers con autenticación CRM
const getCrmHeaders = () => {
  const headers: Record<string, string> = {};
  const crmToken = getCrmToken();
  if (crmToken) {
    headers['X-CRM-Auth'] = crmToken;
  }
  return headers;
};

export const pipelineApi = {
  /**
   * Obtener stage de pipeline
   * GET /api/pipelines/stages/{entity_type}/{entity_id}
   */
  async getStage(
    entityType: EntityType,
    entityId: string
  ): Promise<PipelineStageRead> {
    const { data } = await api.get<PipelineStageRead>(
      `${PIPELINES_BASE_PATH}/stages/${entityType}/${entityId}`,
      { headers: getCrmHeaders() }
    );
    return data;
  },

  /**
   * Crear o actualizar stage
   * POST /api/pipelines/stages
   */
  async createOrUpdateStage(
    stageData: PipelineStageCreate
  ): Promise<PipelineStageRead> {
    const { data } = await api.post<PipelineStageRead>(
      `${PIPELINES_BASE_PATH}/stages`,
      stageData,
      { headers: getCrmHeaders() }
    );
    return data;
  },

  /**
   * Actualizar próxima acción
   * PATCH /api/pipelines/stages/{stage_id}/next-action
   */
  async updateNextAction(
    stageId: string,
    nextAction: NextActionUpdate
  ): Promise<PipelineStageRead> {
    const { data } = await api.patch<PipelineStageRead>(
      `${PIPELINES_BASE_PATH}/stages/${stageId}/next-action`,
      nextAction,
      { headers: getCrmHeaders() }
    );
    return data;
  },

  /**
   * Obtener estado del pipeline
   * GET /api/pipelines/stages/{entity_type}/{entity_id}/status
   */
  async getStatus(
    entityType: EntityType,
    entityId: string
  ): Promise<PipelineStatusResponse> {
    const { data } = await api.get<PipelineStatusResponse>(
      `${PIPELINES_BASE_PATH}/stages/${entityType}/${entityId}/status`,
      { headers: getCrmHeaders() }
    );
    return data;
  },

  /**
   * Crear acción
   * POST /api/pipelines/actions
   */
  async createAction(
    actionData: PipelineActionCreate
  ): Promise<PipelineActionRead> {
    const { data } = await api.post<PipelineActionRead>(
      `${PIPELINES_BASE_PATH}/actions`,
      actionData,
      { headers: getCrmHeaders() }
    );
    return data;
  },

  /**
   * Listar acciones
   * GET /api/pipelines/actions/{entity_type}/{entity_id}
   */
  async listActions(
    entityType: EntityType,
    entityId: string,
    filters?: {
      status?: string;
      skip?: number;
      limit?: number;
    }
  ): Promise<PipelineActionsListResponse> {
    const { data } = await api.get<PipelineActionsListResponse>(
      `${PIPELINES_BASE_PATH}/actions/${entityType}/${entityId}`,
      {
        params: filters,
        headers: getCrmHeaders(),
      }
    );
    return data;
  },

  /**
   * Validar acción
   * POST /api/pipelines/actions/{action_id}/validate
   */
  async validateAction(
    actionId: string,
    validation: ActionValidationRequest
  ): Promise<PipelineActionRead> {
    const { data } = await api.post<PipelineActionRead>(
      `${PIPELINES_BASE_PATH}/actions/${actionId}/validate`,
      validation,
      { headers: getCrmHeaders() }
    );
    return data;
  },

  /**
   * Obtener tipos de acción
   * GET /api/pipelines/action-types
   */
  async getActionTypes(filters?: {
    role?: string;
    is_active?: boolean;
  }): Promise<ActionTypeRead[]> {
    const { data } = await api.get<ActionTypeRead[]>(
      `${PIPELINES_BASE_PATH}/action-types`,
      {
        params: filters,
        headers: getCrmHeaders(),
      }
    );
    return data;
  },

  /**
   * Analizar llamada
   * POST /api/pipelines/calls/{call_id}/analyze
   */
  async analyzeCall(callId: string): Promise<CallAnalysisResponse> {
    const { data } = await api.post<CallAnalysisResponse>(
      `${PIPELINES_BASE_PATH}/calls/${callId}/analyze`,
      {},
      { headers: getCrmHeaders() }
    );
    return data;
  },

  /**
   * Obtener próxima acción de llamada
   * GET /api/pipelines/calls/{call_id}/next-action
   */
  async getCallNextAction(callId: string): Promise<NextActionResponse> {
    const { data } = await api.get<NextActionResponse>(
      `${PIPELINES_BASE_PATH}/calls/${callId}/next-action`,
      { headers: getCrmHeaders() }
    );
    return data;
  },

  /**
   * Validar token de aprobación de hiring code
   * GET /api/pipelines/admin/approve-hiring-code/validate?token={token_hash}
   * Endpoint público - no requiere autenticación
   */
  async validateHiringCodeApprovalToken(token: string): Promise<{
    valid: boolean;
    token_id: string;
    pipeline_stage_id: string;
    hiring_payment: {
      id: number;
      hiring_code: string;
      amount: number;
      currency: string;
      payment_type: string;
    };
    expires_at: string;
    admin_email: string;
  }> {
    const { data } = await api.get(
      `${PIPELINES_BASE_PATH}/admin/approve-hiring-code/validate`,
      {
        params: { token },
        // No incluir headers de autenticación - endpoint público
      }
    );
    return data;
  },

  /**
   * Aprobar solicitud de hiring code con token
   * POST /api/pipelines/admin/approve-hiring-code?token={token_hash}
   * Endpoint público - no requiere autenticación
   */
  async approveHiringCodeWithToken(token: string): Promise<{
    success: boolean;
    message: string;
    pipeline_stage_id: string;
    hiring_payment: {
      id: number;
      hiring_code: string;
      amount: number;
      currency: string;
    };
    approved_at: string;
  }> {
    const { data } = await api.post(
      `${PIPELINES_BASE_PATH}/admin/approve-hiring-code`,
      {},
      {
        params: { token },
        // No incluir headers de autenticación - endpoint público
      }
    );
    return data;
  },
};













