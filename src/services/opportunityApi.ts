// Opportunity API Service - Cliente API para el módulo de Oportunidades

import { api } from './api';
import type {
  LeadOpportunity,
  OpportunityFilters,
  OpportunityListResponse,
  OpportunityAssignRequest,
  OpportunityUpdateRequest,
} from '@/types/opportunity';
import type { PipelineStageRead } from '@/types/pipeline';

const CRM_BASE_PATH = '/crm';

export const opportunityApi = {
  /**
   * Listar oportunidades con filtros
   */
  async list(filters?: OpportunityFilters): Promise<OpportunityListResponse> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.min_score !== undefined) params.append('min_score', filters.min_score.toString());
    if (filters?.max_score !== undefined) params.append('max_score', filters.max_score.toString());
    
    const { data } = await api.get<OpportunityListResponse>(
      `${CRM_BASE_PATH}/opportunities?${params.toString()}`
    );
    return data;
  },

  /**
   * Obtener oportunidad por ID
   */
  async get(id: string): Promise<LeadOpportunity> {
    const { data } = await api.get<LeadOpportunity>(
      `${CRM_BASE_PATH}/opportunities/${id}`
    );
    return data;
  },

  /**
   * Asignar oportunidad a un usuario
   */
  async assign(id: string, userId: string): Promise<LeadOpportunity> {
    const { data } = await api.post<LeadOpportunity>(
      `${CRM_BASE_PATH}/opportunities/${id}/assign`,
      { assigned_to_id: userId } as OpportunityAssignRequest
    );
    return data;
  },

  /**
   * Actualizar oportunidad
   */
  async update(id: string, updates: OpportunityUpdateRequest): Promise<LeadOpportunity> {
    const { data } = await api.patch<LeadOpportunity>(
      `${CRM_BASE_PATH}/opportunities/${id}`,
      updates
    );
    return data;
  },

  /**
   * Crear pipeline para oportunidad
   */
  async createPipeline(id: string): Promise<PipelineStageRead> {
    const { data } = await api.post<PipelineStageRead>(
      `${CRM_BASE_PATH}/opportunities/${id}/pipeline`
    );
    return data;
  },
};

