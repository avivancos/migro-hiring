// Call Data Wizard Types - Para el wizard de datos durante llamadas

/**
 * CallDataWizard - Estado del wizard de datos durante una llamada
 */
export interface CallDataWizard {
  id: string; // UUID
  call_id: string; // UUID
  contact_id: string; // UUID
  current_step: number;
  completed_steps: Record<string, WizardStepData>;
  completion_percentage: number; // 0-100
  wizard_status: 'active' | 'paused' | 'completed';
  started_at: string; // ISO 8601
  completed_at?: string; // ISO 8601
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/**
 * WizardStepData - Datos de un paso completado del wizard
 */
export interface WizardStepData {
  step_number: number;
  data: Record<string, any>;
  completed_at: string; // ISO 8601
}

/**
 * WizardField - Campo del wizard
 */
export interface WizardField {
  name: string;
  required: boolean;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'boolean' | 'datetime';
  label: string;
  options?: string[]; // Para select
  placeholder?: string;
  help_text?: string;
}

/**
 * WizardStepResponse - Respuesta del siguiente paso del wizard
 */
export interface WizardStepResponse {
  step_number: number;
  title: string;
  fields: WizardField[];
  guidance_message: string;
  suggested_question?: string;
  field_to_collect?: string;
  migro_connection?: string;
  missing_fields: string[];
  can_advance: boolean;
}

/**
 * WizardGuidance - Guía del wizard para el agente
 */
export interface WizardGuidance {
  step_number: number;
  message: string;
  suggested_question?: string;
  field_to_collect?: string;
  migro_connection?: string;
}

/**
 * WizardSaveStepRequest - Request para guardar datos de un paso
 */
export interface WizardSaveStepRequest {
  step_number: number;
  step_data: Record<string, any>;
}

/**
 * WizardCompleteRequest - Request para completar wizard
 */
export interface WizardCompleteRequest {
  validate_data?: boolean;
  mark_initial_contact_completed?: boolean;
  create_pipeline?: boolean;
}

/**
 * WizardPauseRequest - Request para pausar wizard
 */
export interface WizardPauseRequest {
  reason?: string;
}







