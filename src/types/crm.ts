// CRM Types - Compatible con Kommo API

export interface KommoLead {
  id: number;
  name: string;
  price: number;
  currency: string;
  responsible_user_id: number;
  group_id?: number;
  status_id: number;
  pipeline_id: number;
  created_by: number;
  updated_by: number;
  created_at: string; // ISO timestamp
  updated_at: string;
  closed_at?: string;
  closest_task_at?: string;
  is_deleted: boolean;
  
  // Relaciones
  contact_id?: number;
  company_id?: number;
  hiring_id?: number;
  
  // Información adicional
  priority?: string; // 'low', 'medium', 'high', 'urgent'
  score?: number;
  service_type?: string;
  service_description?: string;
  source?: string;
  expected_close_date?: string;
  description?: string;
  
  // Custom fields (JSON flexible)
  custom_fields?: Record<string, any>;
  
  // Embedded relations
  contact?: KommoContact;
  company?: KommoCompany;
  status?: PipelineStatus;
  responsible_user?: CRMUser;
  _embedded?: {
    tags?: Tag[];
    companies?: KommoCompany[];
    contacts?: KommoContact[];
  };
}

export interface KommoContact {
  id: number;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  
  company_id?: number;
  responsible_user_id?: number;
  position?: string;
  notes?: string;
  
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  closest_task_at?: string;
  is_deleted: boolean;
  
  custom_fields?: Record<string, any>;
  
  // Embedded
  company?: KommoCompany;
  _embedded?: {
    tags?: Tag[];
    companies?: KommoCompany[];
    leads?: KommoLead[];
  };
}

export interface KommoCompany {
  id: number;
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  
  responsible_user_id?: number;
  created_by: number;
  updated_by: number;
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
  id: number;
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
  id: number;
  name: string;
  description?: string;
  sort: number;
  is_editable: boolean;
  pipeline_id: number;
  color: string;
  type: number; // 0=intermedio, 1=éxito, 2=fracaso
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  text: string;
  task_type: string; // 'call', 'meeting', 'email', 'deadline', 'follow_up'
  entity_id: number;
  entity_type: 'lead' | 'contact' | 'company';
  responsible_user_id: number;
  due_date: string;
  is_completed: boolean;
  completed_at?: string;
  result_text?: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  entity_id: number;
  entity_type: 'lead' | 'contact' | 'company';
  note_type: string; // 'comment', 'call_in', 'call_out', 'meeting', 'email', 'system'
  content: string;
  params?: Record<string, any>;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CRMUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role_name?: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: number;
  cloudtalk_id?: string;
  entity_id: number;
  entity_type: 'lead' | 'contact';
  direction: 'inbound' | 'outbound';
  phone_number: string;
  duration: number; // segundos
  status: 'answered' | 'missed' | 'busy' | 'no-answer' | 'failed';
  recording_url?: string;
  started_at: string;
  ended_at?: string;
  responsible_user_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
}

// ===== Request/Response Types =====

export interface LeadCreateRequest {
  name: string;
  price?: number;
  currency?: string;
  pipeline_id: number;
  status_id: number;
  responsible_user_id: number;
  contact_id?: number;
  company_id?: number;
  priority?: string;
  score?: number;
  service_type?: string;
  service_description?: string;
  source?: string;
  expected_close_date?: string;
  description?: string;
  custom_fields?: Record<string, any>;
}

export interface LeadUpdateRequest {
  name?: string;
  price?: number;
  pipeline_id?: number;
  status_id?: number;
  responsible_user_id?: number;
  contact_id?: number;
  company_id?: number;
  priority?: string;
  score?: number;
  service_type?: string;
  service_description?: string;
  source?: string;
  expected_close_date?: string;
  description?: string;
  custom_fields?: Record<string, any>;
}

export interface ContactCreateRequest {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  company_id?: number;
  responsible_user_id?: number;
  position?: string;
  notes?: string;
  custom_fields?: Record<string, any>;
}

export interface TaskCreateRequest {
  text: string;
  task_type?: string;
  entity_type: 'lead' | 'contact' | 'company';
  entity_id: number;
  responsible_user_id: number;
  due_date: string;
  result_text?: string;
}

export interface NoteCreateRequest {
  entity_type: 'lead' | 'contact' | 'company';
  entity_id: number;
  note_type?: string;
  content: string;
  params?: Record<string, any>;
}

export interface CallCreateRequest {
  entity_type: 'lead' | 'contact';
  entity_id: number;
  direction: 'inbound' | 'outbound';
  phone_number: string;
  duration?: number;
  status: string;
  recording_url?: string;
  started_at: string;
  ended_at?: string;
  responsible_user_id?: number;
  notes?: string;
  cloudtalk_id?: string;
}

// ===== API Response Wrappers (Kommo-style) =====

export interface LeadsListResponse {
  _embedded: {
    leads: KommoLead[];
  };
  _page: {
    page: number;
    limit: number;
    total: number;
    pages?: number;
  };
}

export interface ContactsListResponse {
  _embedded: {
    contacts: KommoContact[];
  };
  _page: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface CompaniesListResponse {
  _embedded: {
    companies: KommoCompany[];
  };
  _page: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface TasksListResponse {
  _embedded: {
    tasks: Task[];
  };
  _page: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface PipelinesListResponse {
  _embedded: {
    pipelines: Pipeline[];
  };
}

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

// ===== Filters =====

export interface LeadFilters {
  pipeline_id?: number;
  status_id?: number;
  responsible_user_id?: number;
  contact_id?: number;
  company_id?: number;
  query?: string;
  page?: number;
  limit?: number;
  source?: string;
  priority?: string;
}

export interface ContactFilters {
  company_id?: number;
  query?: string;
  page?: number;
  limit?: number;
}

export interface TaskFilters {
  entity_type?: string;
  entity_id?: number;
  responsible_user_id?: number;
  is_completed?: boolean;
  page?: number;
  limit?: number;
}

export interface CallFilters {
  entity_type?: string;
  entity_id?: number;
  direction?: string;
  status?: string;
}

