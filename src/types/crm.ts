// CRM Types - Compatible con API real de Migro

export interface KommoLead {
  id: string; // UUID
  name: string;
  price: number;
  currency: string;
  responsible_user_id: string; // UUID
  group_id?: string; // UUID
  status: string; // 'new', 'contacted', 'proposal', 'negotiation', 'won', 'lost'
  status_id?: string; // UUID (legacy, usar status)
  pipeline_id: string; // UUID
  created_by: string; // UUID
  updated_by: string; // UUID
  created_at: string; // ISO timestamp
  updated_at: string;
  closed_at?: string;
  closest_task_at?: string;
  is_deleted: boolean;
  
  // Relaciones
  contact_id?: string; // UUID
  company_id?: string; // UUID
  hiring_id?: string; // UUID
  
  // Información adicional
  priority?: string; // 'low', 'medium', 'high', 'urgent'
  score?: number;
  service_type?: string;
  service_description?: string;
  source?: string;
  expected_close_date?: string;
  description?: string;
  
  // Validación de primera llamada
  initial_contact_completed?: boolean; // Indica si la primera llamada está completa
  
  // Custom fields (JSON flexible)
  custom_fields?: Record<string, any>;
  
  // Embedded relations
  contact?: KommoContact;
  company?: KommoCompany;
  pipeline_status?: PipelineStatus; // Renombrado para evitar conflicto con status: string
  responsible_user?: CRMUser;
  _embedded?: {
    tags?: Tag[];
    companies?: KommoCompany[];
    contacts?: KommoContact[];
  };
}

export interface KommoContact {
  id: string; // UUID
  name: string; // Nombre completo (requerido por API)
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  company_name?: string; // Renombrado para evitar conflicto con company?: KommoCompany
  position?: string;
  
  company_id?: string; // UUID
  responsible_user_id?: string; // UUID
  notes?: string;
  
  created_by: string; // UUID
  updated_by: string; // UUID
  created_at: string;
  updated_at: string;
  closest_task_at?: string;
  is_deleted: boolean;
  
  custom_fields?: Record<string, any>;
  
  // Campos específicos de Migro
  grading_llamada?: 'A' | 'B+' | 'B-' | 'C';
  grading_situacion?: 'A' | 'B+' | 'B-' | 'C';
  nacionalidad?: string;
  tiempo_espana?: string; // "3 años", "6 meses", etc.
  empadronado?: boolean;
  lugar_residencia?: string;
  tiene_ingresos?: boolean;
  trabaja_b?: boolean;
  edad?: number;
  tiene_familiares_espana?: boolean;
  avatar_url?: string;
  
  // Embedded
  company?: KommoCompany;
  _embedded?: {
    tags?: Tag[];
    companies?: KommoCompany[];
    leads?: KommoLead[];
  };
  
  // Campos calculados (no vienen del backend, se calculan en el frontend)
  ultima_llamada_fecha?: string; // Fecha de la última llamada realizada
  proxima_llamada_fecha?: string; // Fecha de la próxima llamada programada (de calls.proxima_llamada_fecha o tasks.complete_till)
}

export interface KommoCompany {
  id: string; // UUID
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  
  responsible_user_id?: string; // UUID
  created_by: string; // UUID
  updated_by: string; // UUID
  created_at: string;
  updated_at: string;
  closest_task_at?: string;
  is_deleted: boolean;
  
  custom_fields?: Record<string, any>;
  
  _embedded?: {
    tags?: Tag[];
    contacts?: KommoContact[];
    leads?: KommoLead[];
  };
}

// Alias para compatibilidad
export type Company = KommoCompany;

export interface Pipeline {
  id: string; // UUID
  name: string;
  description?: string;
  sort: number;
  is_main: boolean;
  is_archive: boolean;
  created_at: string;
  updated_at: string;
  
  _embedded?: {
    statuses?: PipelineStatus[];
  };
}

export interface PipelineStatus {
  id: string; // UUID
  name: string;
  description?: string;
  sort: number;
  is_editable: boolean;
  pipeline_id: string; // UUID
  color: string;
  type: number; // 0=intermedio, 1=éxito, 2=fracaso
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string; // UUID
  text: string;
  task_type: string; // 'call', 'meeting', 'email', 'deadline', 'follow_up', 'reminder'
  entity_id: string; // UUID
  entity_type: 'lead' | 'contact' | 'company' | 'contacts' | 'leads'; // API usa 'contacts'/'leads'
  responsible_user_id: string; // UUID
  due_date?: string; // Legacy
  complete_till?: string; // Fecha límite calculada
  is_completed: boolean;
  completed_at?: string;
  result_text?: string;
  created_by: string; // UUID
  updated_by: string; // UUID
  created_at: string;
  updated_at: string;
  
  // Relación con plantilla
  task_template_id?: string; // UUID
  task_template?: TaskTemplate;
}

export interface Note {
  id: string; // UUID
  entity_id: string; // UUID
  entity_type: 'lead' | 'contact' | 'company' | 'contacts' | 'leads'; // API usa 'contacts'/'leads'
  note_type: string; // 'comment', 'call_in', 'call_out', 'meeting', 'email', 'system', 'common'
  content: string;
  params?: Record<string, any>;
  created_by: string; // UUID
  created_at: string;
  updated_at: string;
}

export interface CRMUser {
  id: string; // UUID
  name: string;
  email: string;
  phone?: string;
  role_name?: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  daily_lead_quota?: number; // Cuota diaria de leads (default: 10)
}

export interface Call {
  id: string; // UUID
  cloudtalk_id?: string;
  entity_id: string; // UUID
  entity_type: 'lead' | 'contact' | 'contacts' | 'leads'; // API usa 'contacts'/'leads'
  direction: 'inbound' | 'outbound';
  phone?: string; // API usa 'phone' en lugar de 'phone_number'
  phone_number?: string; // Legacy
  duration: number; // segundos
  call_status: string; // 'completed', 'failed', 'busy', 'no_answer', 'missed'
  status?: string; // Legacy
  call_type?: string; // 'seguimiento', 'venta', 'primera_llamada'
  call_result?: string; // Resultado de la llamada
  record_url?: string; // API usa 'record_url' en lugar de 'recording_url'
  recording_url?: string; // Legacy
  started_at: string;
  ended_at?: string;
  responsible_user_id?: string; // UUID
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Campos específicos de Migro
  resumen_llamada?: string;
  proxima_llamada_fecha?: string;
  proxima_accion_fecha?: string;
}

export interface Tag {
  id: string; // UUID
  name: string;
  color?: string;
}

// ===== CUSTOM FIELDS =====

export type CustomFieldType = 
  | "text"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "checkbox"
  | "url"
  | "email"
  | "phone";

export type EntityType = "contacts" | "leads" | "companies";

export interface FieldSettings {
  options?: string[];            // Para select/multiselect
  min?: number;                  // Para números/fechas
  max?: number;                  // Para números/fechas
  min_length?: number;           // Para textos
  max_length?: number;           // Para textos
  pattern?: string;              // Regex para validación
  currency?: string;             // Para precios
  placeholder?: string;
  help_text?: string;
  default?: any;                 // Valor por defecto
}

export interface CustomField {
  id: string;                    // UUID
  name: string;
  code?: string;                 // Código único para API
  type: CustomFieldType;
  entity_type: EntityType;
  sort: number;
  is_predefined: boolean;
  is_deletable: boolean;
  is_required: boolean;
  is_visible: boolean;
  settings?: FieldSettings;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  id: string;                    // UUID
  custom_field_id: string;       // UUID
  entity_id: string;             // UUID
  entity_type: EntityType;
  value: any;                    // JSON flexible
  created_at: string;
  updated_at: string;
}

export interface CustomFieldCreateRequest {
  name: string;
  code?: string;
  type: CustomFieldType;
  entity_type: EntityType;
  sort?: number;
  is_required?: boolean;
  is_visible?: boolean;
  settings?: FieldSettings;
}

export interface CustomFieldUpdateRequest {
  name?: string;
  code?: string;
  type?: CustomFieldType;
  entity_type?: EntityType;
  sort?: number;
  is_required?: boolean;
  is_visible?: boolean;
  settings?: FieldSettings;
}

export interface CustomFieldValueCreateRequest {
  custom_field_id: string;       // UUID
  entity_id: string;             // UUID
  entity_type: EntityType;
  value: any;                    // JSON flexible
}

// ===== Request/Response Types =====

export interface LeadCreateRequest {
  name: string;
  status: string; // 'new', 'contacted', 'proposal', 'negotiation', 'won', 'lost'
  pipeline_id: string; // UUID
  contact_id?: string; // UUID
  price?: number;
  currency?: string;
  description?: string;
  responsible_user_id?: string; // UUID - Opcional: si no se proporciona, se asigna automáticamente
  // Campos opcionales adicionales
  company_id?: string; // UUID
  priority?: string;
  score?: number;
  service_type?: string;
  service_description?: string;
  source?: string;
  expected_close_date?: string;
  custom_fields?: Record<string, any>;
}

export interface LeadUpdateRequest {
  name?: string;
  status?: string; // 'new', 'contacted', 'proposal', 'negotiation', 'won', 'lost'
  pipeline_id?: string; // UUID
  contact_id?: string; // UUID
  price?: number;
  currency?: string;
  description?: string;
  responsible_user_id?: string; // UUID
  company_id?: string; // UUID
  priority?: string;
  score?: number;
  service_type?: string;
  service_description?: string;
  source?: string;
  expected_close_date?: string;
  custom_fields?: Record<string, any>;
}

export interface TaskTemplate {
  id: string; // UUID
  name: string;
  description?: string;
  task_type: string;
  default_text?: string;
  default_duration_days?: number;
  applies_to_contacts: boolean;
  applies_to_leads: boolean;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactCreateRequest {
  name: string; // Requerido por API
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  company?: string;
  position?: string;
  company_id?: string; // UUID
  responsible_user_id?: string; // UUID
  notes?: string;
  custom_fields?: Record<string, any>;
  
  // Campos específicos de Migro
  grading_llamada?: 'A' | 'B+' | 'B-' | 'C';
  grading_situacion?: 'A' | 'B+' | 'B-' | 'C';
  nacionalidad?: string;
  tiempo_espana?: string;
  empadronado?: boolean;
  lugar_residencia?: string;
  tiene_ingresos?: boolean;
  trabaja_b?: boolean;
  edad?: number;
  tiene_familiares_espana?: boolean;
}

export interface TaskCreateRequest {
  text: string;
  task_type?: string;
  entity_type: 'lead' | 'contact' | 'company' | 'contacts' | 'leads';
  entity_id: string; // UUID
  responsible_user_id: string; // UUID
  complete_till?: string; // Fecha límite (ISO string)
  due_date?: string; // Legacy
  result_text?: string;
  task_template_id?: string; // UUID
}

export interface NoteCreateRequest {
  entity_type: 'lead' | 'contact' | 'company' | 'contacts' | 'leads';
  entity_id: string; // UUID
  note_type?: string;
  content: string;
  params?: Record<string, any>;
}

export interface CallCreateRequest {
  entity_type: 'lead' | 'contact' | 'contacts' | 'leads';
  entity_id: string; // UUID (requerido)
  direction: 'inbound' | 'outbound';
  phone?: string; // API usa 'phone'
  phone_number?: string; // Legacy
  duration?: number; // segundos
  call_status: string; // 'completed', 'failed', 'busy', 'no_answer', 'missed'
  call_type?: string; // 'seguimiento', 'venta', 'primera_llamada'
  call_result?: string; // Resultado de la llamada
  record_url?: string; // API usa 'record_url'
  recording_url?: string; // Legacy
  started_at: string;
  ended_at?: string;
  responsible_user_id?: string; // UUID
  notes?: string;
  cloudtalk_id?: string;
  
  // Campos específicos de Migro
  resumen_llamada?: string;
  proxima_llamada_fecha?: string;
  proxima_accion_fecha?: string;
}

// ===== API Response Wrappers (API Real) =====

export interface LeadsListResponse {
  items: KommoLead[];
  total: number;
  skip: number;
  limit: number;
}

export interface ContactsListResponse {
  items: KommoContact[];
  total: number;
  skip: number;
  limit: number;
}

export interface CompaniesListResponse {
  items: KommoCompany[];
  total: number;
  skip: number;
  limit: number;
}

export interface TasksListResponse {
  items: Task[];
  total: number;
  skip: number;
  limit: number;
}

export interface CallsListResponse {
  items: Call[];
  total: number;
  skip: number;
  limit: number;
}

export interface NotesListResponse {
  items: Note[];
  total: number;
  skip: number;
  limit: number;
}

export interface TaskTemplatesListResponse {
  items: TaskTemplate[];
  total: number;
}

export interface PipelinesListResponse {
  items: Pipeline[];
}

// Alias para compatibilidad con respuestas que pueden venir como array directo
export type PipelinesResponse = Pipeline[] | PipelinesListResponse;

// ===== Dashboard Stats =====

export interface DashboardStats {
  total_leads: number;
  leads_by_status: Array<{
    name: string;
    count: number;
  }>;
  pending_tasks: number;
  total_pipeline_value: number;
}

// ===== Lead Validation Response =====

export interface MarkInitialContactCompletedResponse {
  success: boolean;
  message: string;
  missing_fields?: string[];
  recommended_missing?: string[];
}

// ===== Filters =====

export interface LeadFilters {
  skip?: number;
  limit?: number;
  page?: number; // Paginación basada en página (backend usa esto)
  status?: string; // 'new', 'contacted', 'proposal', 'negotiation', 'won', 'lost'
  pipeline_id?: string; // UUID
  contact_id?: string; // UUID
  responsible_user_id?: string; // UUID
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  // Campos adicionales opcionales
  source?: string;
  priority?: string;
}

export interface ContactFilters {
  skip?: number;
  limit?: number;
  page?: number; // Paginación basada en página (backend usa esto)
  name?: string; // Búsqueda parcial por nombre
  search?: string; // Búsqueda general (nombre, email, teléfono)
  email?: string;
  phone?: string;
  nacionalidad?: string;
  grading_llamada?: 'A' | 'B+' | 'B-' | 'C';
  grading_situacion?: 'A' | 'B+' | 'B-' | 'C';
  responsible_user_id?: string; // UUID
  company_id?: string; // UUID
  sort_by?: string; // 'name', 'created_at', 'grading_llamada'
  sort_order?: 'asc' | 'desc';
  // Campos adicionales opcionales
  empadronado?: boolean;
  tiene_ingresos?: boolean;
  trabaja_b?: boolean;
  // Filtros de fechas de llamadas
  ultima_llamada_desde?: string;
  ultima_llamada_hasta?: string;
  proxima_llamada_desde?: string;
  proxima_llamada_hasta?: string;
}

export interface TaskFilters {
  skip?: number;
  limit?: number;
  task_type?: string; // 'call', 'meeting', 'email', 'reminder'
  is_completed?: boolean;
  entity_id?: string; // UUID
  entity_type?: 'contacts' | 'leads' | 'companies' | string; // 'contacts', 'leads'
  responsible_user_id?: string; // UUID
  complete_till_from?: string; // ISO datetime
  complete_till_to?: string; // ISO datetime
}

export interface CallFilters {
  skip?: number;
  limit?: number;
  direction?: 'inbound' | 'outbound';
  call_status?: string; // 'completed', 'failed', 'busy', 'no_answer', 'missed'
  entity_id?: string; // UUID
  entity_type?: string; // 'contacts', 'leads'
  responsible_user_id?: string; // UUID
  date_from?: string; // ISO datetime
  date_to?: string; // ISO datetime
}

