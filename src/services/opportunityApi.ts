// Opportunity API Service - Cliente API para el módulo de Oportunidades

import { api } from './api';
import type {
  LeadOpportunity,
  OpportunityFilters,
  OpportunityListResponse,
  OpportunityAssignRequest,
  OpportunityUpdateRequest,
  OpportunityCreateRequest,
  FirstCallAttemptRequest,
} from '@/types/opportunity';
import type { PipelineStageRead, PipelineStageCreate } from '@/types/pipeline';
import { pipelineApi } from './pipelineApi';

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
    
    // Nota: El backend ahora siempre incluye el contacto expandido automáticamente
    // No es necesario el parámetro 'expand', pero lo mantenemos por compatibilidad
    
    const url = `${CRM_BASE_PATH}/opportunities?${params.toString()}`;
    
    try {
      const { data } = await api.get<any>(url);
      
      // Normalizar la respuesta según diferentes formatos posibles
      let normalizedResponse: OpportunityListResponse;
      
      // Formato 1: Array directo
      if (Array.isArray(data)) {
        normalizedResponse = {
          opportunities: data,
          total: data.length,
          page: filters?.page || 1,
          limit: filters?.limit || 50,
          total_pages: Math.ceil(data.length / (filters?.limit || 50)),
        };
      }
      // Formato 2: Objeto con _embedded/_page (formato Kommo)
      else if (data && typeof data === 'object' && data._embedded && data._embedded.opportunities) {
        const opportunities = Array.isArray(data._embedded.opportunities) ? data._embedded.opportunities : [];
        const page = data._page?.page || filters?.page || 1;
        const limit = data._page?.limit || filters?.limit || 50;
        const total = data._page?.total || opportunities.length;
        normalizedResponse = {
          opportunities,
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        };
      }
      // Formato 3: Objeto con campo 'opportunities' (formato esperado)
      else if (data && typeof data === 'object' && 'opportunities' in data) {
        const opportunities = Array.isArray(data.opportunities) ? data.opportunities : [];
        
        // El backend ahora siempre incluye el contacto expandido
        // Ya no es necesario obtener contactos individualmente
        const total = data.total ?? opportunities.length;
        const page = data.page || filters?.page || 1;
        const limit = data.limit || filters?.limit || 50;
        normalizedResponse = {
          opportunities,
          total,
          page,
          limit,
          total_pages: data.total_pages ?? Math.ceil(total / limit),
        };
      }
      // Formato 4: Objeto con campo 'items' (formato alternativo)
      else if (data && typeof data === 'object' && 'items' in data) {
        const opportunities = Array.isArray(data.items) ? data.items : [];
        
        // El backend ahora siempre incluye el contacto expandido
        // Ya no es necesario obtener contactos individualmente
        const total = data.total ?? opportunities.length;
        const page = data.page || filters?.page || 1;
        const limit = data.limit || filters?.limit || 50;
        normalizedResponse = {
          opportunities,
          total,
          page,
          limit,
          total_pages: data.total_pages ?? Math.ceil(total / limit),
        };
      }
      // Formato desconocido: intentar usar tal cual
      else {
        normalizedResponse = {
          opportunities: Array.isArray(data?.opportunities) ? data.opportunities : (Array.isArray(data?.items) ? data.items : []),
          total: data?.total || 0,
          page: data?.page || filters?.page || 1,
          limit: data?.limit || filters?.limit || 50,
          total_pages: data?.total_pages ?? Math.ceil((data?.total || 0) / (data?.limit || filters?.limit || 50)),
        };
      }
      
      return normalizedResponse;
    } catch (error: any) {
      console.error('❌ [opportunityApi] Error al listar oportunidades:');
      console.error('   URL:', url);
      console.error('   Status:', error?.response?.status);
      console.error('   Status Text:', error?.response?.statusText);
      console.error('   Response Data:', error?.response?.data);
      console.error('   Error completo:', error);
      
      if (error?.response?.data) {
        console.error('   Detalle del error:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw error;
    }
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
   * Asignar N oportunidades aleatorias no asignadas a un usuario
   * Endpoint: POST /api/crm/opportunities/assign-random
   * Ver docs/BACKEND_RANDOM_OPPORTUNITIES_ASSIGN_ENDPOINT.md
   */
  async assignRandom(request: {
    assigned_to_id: string;
    count?: number;
  }): Promise<{
    success: boolean;
    assigned_count: number;
    available_count: number;
    requested_count: number;
    opportunity_ids: string[];
    assigned_to_id: string;
    assigned_to_name: string;
    assigned_at: string;
    warning?: string;
  }> {
    const { data } = await api.post(
      `${CRM_BASE_PATH}/opportunities/assign-random`,
      {
        assigned_to_id: request.assigned_to_id,
        count: request.count || 50,
      }
    );
    return data;
  },

  /**
   * Asignar múltiples oportunidades a un usuario (batch)
   * NOTA: Este endpoint debe implementarse en el backend.
   * Ver docs/BACKEND_OPPORTUNITIES_BULK_ASSIGN_ENDPOINT.md
   * 
   * Por ahora, el frontend usa múltiples llamadas individuales a assign()
   */
  async bulkAssign(request: {
    opportunity_ids: string[];
    assigned_to_id: string;
  }): Promise<{
    success: boolean;
    assigned_count: number;
    failed_count: number;
    opportunities: LeadOpportunity[];
    errors: Array<{ opportunity_id: string; error: string }>;
  }> {
    // TODO: Implementar cuando el backend esté listo
    // const { data } = await api.post(
    //   `${CRM_BASE_PATH}/opportunities/bulk-assign`,
    //   request
    // );
    // return data;
    
    // Por ahora, usar asignaciones individuales en paralelo
    // Limitar el número de peticiones simultáneas para evitar sobrecarga
    const BATCH_SIZE = 10; // Procesar en lotes de 10
    const allResults: Array<LeadOpportunity | { error: string; opportunity_id: string }> = [];
    
    for (let i = 0; i < request.opportunity_ids.length; i += BATCH_SIZE) {
      const batch = request.opportunity_ids.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(id =>
        this.assign(id, request.assigned_to_id).catch(error => {
          const errorMessage = error?.response?.data?.detail || error?.message || 'Error desconocido';
          console.error(`❌ [opportunityApi.bulkAssign] Error asignando oportunidad ${id}:`, errorMessage);
          return {
            error: errorMessage,
            opportunity_id: id,
          };
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults);
      
      // Pequeña pausa entre lotes para no sobrecargar el servidor
      if (i + BATCH_SIZE < request.opportunity_ids.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const successes: LeadOpportunity[] = [];
    const errors: Array<{ opportunity_id: string; error: string }> = [];
    
    allResults.forEach((result) => {
      if ('error' in result) {
        errors.push({
          opportunity_id: result.opportunity_id,
          error: result.error,
        });
      } else {
        successes.push(result as LeadOpportunity);
      }
    });
    
    return {
      success: errors.length === 0,
      assigned_count: successes.length,
      failed_count: errors.length,
      opportunities: successes,
      errors,
    };
  },

  /**
   * Desasignar una oportunidad (remover asignación de agente)
   * Usa el endpoint /assign con null para desasignar
   * 
   * El backend acepta assigned_to_id: null o "" y desasigna la oportunidad,
   * cambiando el estado a 'pending' y removiendo el assigned_to_id.
   */
  async unassign(id: string): Promise<LeadOpportunity> {
    const { data } = await api.post<LeadOpportunity>(
      `${CRM_BASE_PATH}/opportunities/${id}/assign`,
      { assigned_to_id: null } as OpportunityAssignRequest
    );
    return data;
  },

  /**
   * Desasignar múltiples oportunidades (remover asignación de agentes)
   * Usa múltiples llamadas individuales a unassign()
   */
  async bulkUnassign(request: {
    opportunity_ids: string[];
  }): Promise<{
    success: boolean;
    unassigned_count: number;
    failed_count: number;
    opportunities: LeadOpportunity[];
    errors: Array<{ opportunity_id: string; error: string }>;
  }> {
    // Usar desasignaciones individuales en paralelo
    // Limitar el número de peticiones simultáneas para evitar sobrecarga
    const BATCH_SIZE = 10; // Procesar en lotes de 10
    const allResults: Array<LeadOpportunity | { error: string; opportunity_id: string }> = [];
    
    for (let i = 0; i < request.opportunity_ids.length; i += BATCH_SIZE) {
      const batch = request.opportunity_ids.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(id =>
        this.unassign(id).catch(error => {
          const errorMessage = error?.response?.data?.detail || error?.message || 'Error desconocido';
          console.error(`❌ [opportunityApi.bulkUnassign] Error desasignando oportunidad ${id}:`, errorMessage);
          return {
            error: errorMessage,
            opportunity_id: id,
          };
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults);
      
      // Pequeña pausa entre lotes para no sobrecargar el servidor
      if (i + BATCH_SIZE < request.opportunity_ids.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const successes: LeadOpportunity[] = [];
    const errors: Array<{ opportunity_id: string; error: string }> = [];
    
    allResults.forEach((result) => {
      if ('error' in result) {
        errors.push({
          opportunity_id: result.opportunity_id,
          error: result.error,
        });
      } else {
        successes.push(result as LeadOpportunity);
      }
    });
    
    return {
      success: errors.length === 0,
      unassigned_count: successes.length,
      failed_count: errors.length,
      opportunities: successes,
      errors,
    };
  },

  /**
   * Crear nueva oportunidad
   * Endpoint: POST /api/crm/opportunities
   */
  async create(request: OpportunityCreateRequest): Promise<LeadOpportunity> {
    const { data } = await api.post<LeadOpportunity>(
      `${CRM_BASE_PATH}/opportunities`,
      {
        contact_id: request.contact_id,
        opportunity_score: request.opportunity_score ?? 50,
        detection_reason: request.detection_reason ?? 'Oportunidad creada manualmente',
        priority: request.priority ?? 'medium',
        assigned_to_id: request.assigned_to_id,
      }
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
   * 
   * NOTA: Usa el endpoint alternativo de pipelines ya que el endpoint específico
   * POST /crm/opportunities/{id}/pipeline no existe aún en el backend.
   * 
   * @see docs/BACKEND_OPPORTUNITIES_PIPELINE_ENDPOINT_404.md
   */
  async createPipeline(id: string): Promise<PipelineStageRead> {
    // Usar el endpoint genérico de pipelines como alternativa
    // Las oportunidades se manejan como 'leads' en el sistema de pipelines
    const stageData: PipelineStageCreate = {
      entity_id: id,
      entity_type: 'leads', // Las oportunidades se tratan como leads en pipelines
      current_stage: 'agent_initial', // Stage inicial por defecto
    };
    
    return pipelineApi.createOrUpdateStage(stageData);
  },

  /**
   * Registrar/actualizar intento de primera llamada
   */
  async createFirstCallAttempt(
    id: string,
    request: FirstCallAttemptRequest
  ): Promise<LeadOpportunity> {
    const { data } = await api.post<LeadOpportunity>(
      `${CRM_BASE_PATH}/opportunities/${id}/first-call-attempt`,
      request
    );
    return data;
  },
};

