// Tipos TypeScript para el módulo de Pipelines
// Basado en la documentación del backend: PIPELINE_SYSTEM_COMPLETE.md

export type EntityType = 'contacts' | 'leads';

export type PipelineStage = 
  | 'agent_initial' 
  | 'lawyer_validation' 
  | 'admin_contract' 
  | 'client_signature' 
  | 'expediente_created';

export type ActionStatus = 
  | 'pending_validation' 
  | 'validated' 
  | 'rejected' 
  | 'completed';

export type UserRole = 'agent' | 'lawyer' | 'admin';

export interface PipelineStageRead {
  id: string;
  entity_id: string;
  entity_type: EntityType;
  current_stage: PipelineStage;
  situacion_migrante?: Record<string, any>;
  created_by_agent_id?: string;
  validated_by_lawyer_id?: string;
  validated_at?: string;
  contract_generated_by_id?: string;
  contract_generated_at?: string;
  hiring_code_id?: string;
  next_action_type?: string;
  next_action_responsible_id?: string;
  next_action_due_date?: string;
  next_action_description?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineStageCreate {
  entity_id: string;
  entity_type: EntityType;
  current_stage: PipelineStage;
  situacion_migrante?: Record<string, any>;
  created_by_agent_id?: string;
  validated_by_lawyer_id?: string;
  notes?: string;
  next_action_type?: string;
  next_action_responsible_id?: string;
  next_action_due_date?: string;
  next_action_description?: string;
}

export interface NextActionUpdate {
  next_action_type?: string;
  next_action_responsible_id?: string;
  next_action_due_date?: string;
  next_action_description?: string;
}

export interface NextActionResponse {
  next_action_type: string;
  next_action_responsible_id: string;
  next_action_due_date: string;
  next_action_description: string;
}

export interface PipelineStatusResponse {
  stage_id: string;
  entity_id: string;
  entity_type: EntityType;
  current_stage: PipelineStage;
  next_action?: NextActionResponse;
  actions_count: number;
  pending_actions_count: number;
  is_active: boolean;
}

export interface PipelineActionRead {
  id: string;
  pipeline_stage_id: string;
  action_type: string;
  action_name?: string;
  performed_by_id: string;
  responsible_for_validation_id?: string;
  status: ActionStatus;
  action_data?: Record<string, any>;
  description?: string;
  validated_at?: string;
  validated_by_id?: string;
  validation_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineActionCreate {
  pipeline_stage_id: string;
  action_type: string;
  action_name?: string;
  performed_by_id: string;
  responsible_for_validation_id?: string;
  status?: ActionStatus;
  action_data?: Record<string, any>;
  description?: string;
}

export interface PipelineActionsListResponse {
  items: PipelineActionRead[];
  total: number;
  skip: number;
  limit: number;
}

export interface ActionValidationRequest {
  status: 'validated' | 'rejected';
  validation_notes?: string;
}

export interface ActionTypeRead {
  id: string;
  action_code: string;
  action_name: string;
  description?: string;
  required_role: UserRole;
  validation_role?: UserRole;
  default_due_days: number;
  is_active: boolean;
}

export interface CallAnalysisResponse {
  suggested_action: string;
  next_action_type: string;
  next_action_responsible_id: string;
  next_action_due_date: string;
  next_action_description: string;
  pipeline_stage_updated: boolean;
  reason: string;
}

export interface PipelineFilters {
  entity_type?: EntityType;
  current_stage?: PipelineStage;
  responsible_id?: string;
  is_active?: boolean;
  date_from?: string;
  date_to?: string;
  skip?: number;
  limit?: number;
}







