// Opportunity Types - Para el módulo de Leads/Oportunidades

import type { Contact, CRMUser } from './crm';
import type { PipelineStageRead } from './pipeline';

/**
 * FirstCallAttempt - Intento de primera llamada
 */
export interface FirstCallAttempt {
  status: 'pending' | 'orange' | 'red' | 'green';
  call_id?: string;
  attempted_at: string; // ISO 8601 datetime
  notes?: string;
}

/**
 * FirstCallAttempts - Mapa de intentos (1-5)
 */
export type FirstCallAttempts = {
  [key: string]: FirstCallAttempt; // key: "1" | "2" | "3" | "4" | "5"
} | null;

/**
 * LeadOpportunity - Oportunidad detectada automáticamente
 */
export interface LeadOpportunity {
  id: string; // UUID
  contact_id: string; // UUID
  contact?: Contact; // Relación expandida
  detected_at: string; // ISO 8601
  opportunity_score: number; // 0-100
  priority?: 'high' | 'medium' | 'low'; // Opcional porque el backend puede no enviarlo
  status: 'pending' | 'assigned' | 'contacted' | 'converted' | 'expired' | 'lost';
  detection_reason: string | Record<string, any>; // Puede ser string o objeto con detalles
  assigned_to_id?: string; // UUID
  assigned_to?: CRMUser; // Relación expandida
  pipeline_stage_id?: string; // UUID
  pipeline_stage?: PipelineStageRead; // Relación expandida
  first_call_attempts?: FirstCallAttempts; // Mapa de intentos 1-5
  first_call_completed?: boolean; // Indica si se completó la primera llamada
  first_call_successful_attempt?: number | null; // Número del intento exitoso (1-5)
  notes?: string; // Notas adicionales sobre la oportunidad
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
 * assigned_to_id puede ser null o "" para desasignar
 */
export interface OpportunityAssignRequest {
  assigned_to_id: string | null; // UUID o null para desasignar
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

/**
 * FirstCallAttemptRequest - Request para registrar/actualizar intento de primera llamada
 */
export interface FirstCallAttemptRequest {
  attempt_number: number; // 1-5
  status: 'orange' | 'red' | 'green'; // No incluye 'pending'
  call_id?: string;
  notes?: string;
}

/**
 * OpportunityCreateRequest - Request para crear una nueva oportunidad
 */
export interface OpportunityCreateRequest {
  contact_id: string; // UUID del contacto (requerido)
  opportunity_score?: number; // 0-100 (opcional, default: 50)
  detection_reason?: string | Record<string, any>; // Razón de detección (opcional)
  priority?: 'high' | 'medium' | 'low'; // Prioridad (opcional, default: 'medium')
  assigned_to_id?: string; // UUID del usuario asignado (opcional)
}

