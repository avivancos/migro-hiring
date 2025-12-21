// Opportunity Types - Para el módulo de Leads/Oportunidades

import type { KommoContact, CRMUser } from './crm';
import type { PipelineStageRead } from './pipeline';

/**
 * LeadOpportunity - Oportunidad detectada automáticamente
 */
export interface LeadOpportunity {
  id: string; // UUID
  contact_id: string; // UUID
  contact?: KommoContact; // Relación expandida
  detected_at: string; // ISO 8601
  opportunity_score: number; // 0-100
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'assigned' | 'contacted' | 'converted' | 'expired' | 'lost';
  detection_reason: string;
  assigned_to_id?: string; // UUID
  assigned_to?: CRMUser; // Relación expandida
  pipeline_stage_id?: string; // UUID
  pipeline_stage?: PipelineStageRead; // Relación expandida
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/**
 * OpportunityFilters - Filtros para listar oportunidades
 */
export interface OpportunityFilters {
  status?: 'pending' | 'assigned' | 'contacted' | 'converted' | 'expired' | 'lost';
  priority?: 'high' | 'medium' | 'low';
  assigned_to?: string; // UUID del usuario asignado
  page?: number; // Número de página (1-indexed)
  limit?: number; // Resultados por página (default: 50, max: 1000)
  search?: string; // Búsqueda por nombre, email, ciudad
  min_score?: number; // Score mínimo
  max_score?: number; // Score máximo
}

/**
 * OpportunityListResponse - Respuesta de listado de oportunidades
 */
export interface OpportunityListResponse {
  opportunities: LeadOpportunity[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * OpportunityAssignRequest - Request para asignar oportunidad
 */
export interface OpportunityAssignRequest {
  assigned_to_id: string; // UUID
}

/**
 * OpportunityUpdateRequest - Request para actualizar oportunidad
 */
export interface OpportunityUpdateRequest {
  status?: LeadOpportunity['status'];
  priority?: LeadOpportunity['priority'];
  assigned_to_id?: string;
  notes?: string;
}

