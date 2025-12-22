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
    
    const url = `${CRM_BASE_PATH}/opportunities?${params.toString()}`;
    console.log('🔍 [opportunityApi] GET', url);
    console.log('🔍 [opportunityApi] Filters:', JSON.stringify(filters, null, 2));
    
    try {
      const { data } = await api.get<any>(url);
      
      // Log de la respuesta raw para debugging
      console.log('🔍 [opportunityApi] Raw response:', data);
      console.log('🔍 [opportunityApi] Response type:', typeof data);
      console.log('🔍 [opportunityApi] Is array?:', Array.isArray(data));
      if (data && typeof data === 'object') {
        console.log('🔍 [opportunityApi] Keys:', Object.keys(data));
        if ('opportunities' in data) {
          console.log('🔍 [opportunityApi] opportunities type:', typeof data.opportunities);
          console.log('🔍 [opportunityApi] opportunities is array?:', Array.isArray(data.opportunities));
          console.log('🔍 [opportunityApi] opportunities length:', data.opportunities?.length);
        }
      }
      
      // Normalizar la respuesta según diferentes formatos posibles
      let normalizedResponse: OpportunityListResponse;
      
      // Formato 1: Array directo
      if (Array.isArray(data)) {
        console.log('🔍 [opportunityApi] Formato: Array directo');
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
        console.log('🔍 [opportunityApi] Formato: _embedded/_page');
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
        console.log('🔍 [opportunityApi] Formato: Campo opportunities');
        const opportunities = Array.isArray(data.opportunities) ? data.opportunities : [];
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
        console.log('🔍 [opportunityApi] Formato: Campo items');
        const opportunities = Array.isArray(data.items) ? data.items : [];
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
        console.warn('⚠️ [opportunityApi] Formato desconocido, intentando usar tal cual');
        normalizedResponse = {
          opportunities: Array.isArray(data?.opportunities) ? data.opportunities : (Array.isArray(data?.items) ? data.items : []),
          total: data?.total || 0,
          page: data?.page || filters?.page || 1,
          limit: data?.limit || filters?.limit || 50,
          total_pages: data?.total_pages ?? Math.ceil((data?.total || 0) / (data?.limit || filters?.limit || 50)),
        };
      }
      
      console.log('✅ [opportunityApi] Response normalizada:', {
        opportunitiesCount: normalizedResponse.opportunities?.length || 0,
        total: normalizedResponse.total,
        page: normalizedResponse.page,
        limit: normalizedResponse.limit,
        totalPages: normalizedResponse.total_pages,
      });
      
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

