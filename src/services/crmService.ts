// CRM Service - API calls for CRM functionality

import { api } from './api';
import type {
  KommoLead,
  KommoContact,
  KommoCompany,
  Pipeline,
  PipelineStatus,
  Task,
  Note,
  Call,
  CRMUser,
  LeadsListResponse,
  ContactsListResponse,
  CompaniesListResponse,
  TasksListResponse,
  CallsListResponse,
  NotesListResponse,
  TaskTemplatesListResponse,
  PipelinesListResponse,
  DashboardStats,
  LeadCreateRequest,
  LeadUpdateRequest,
  ContactCreateRequest,
  TaskCreateRequest,
  NoteCreateRequest,
  CallCreateRequest,
  LeadFilters,
  ContactFilters,
  TaskFilters,
  CallFilters,
  TaskTemplate,
} from '@/types/crm';

// Base path para endpoints del CRM
const CRM_BASE_PATH = '/v1/crm';

export const crmService = {
  // ===== LEADS =====
  
  /**
   * Obtener lista de leads con filtros
   * La API puede devolver un array directamente o un objeto con items
   */
  async getLeads(filters?: LeadFilters): Promise<LeadsListResponse> {
    const { data } = await api.get<any>(`${CRM_BASE_PATH}/leads`, {
      params: filters,
    });
    
    // Si la respuesta es un array, convertir a formato estándar
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        skip: filters?.skip || 0,
        limit: filters?.limit || 20,
      };
    }
    
    // Si ya tiene formato estándar, devolverlo
    return data;
  },

  /**
   * Obtener un lead por ID
   */
  async getLead(id: string): Promise<KommoLead> {
    const { data } = await api.get<KommoLead>(`${CRM_BASE_PATH}/leads/${id}`);
    return data;
  },

  /**
   * Crear un nuevo lead
   */
  async createLead(lead: LeadCreateRequest): Promise<KommoLead> {
    const { data } = await api.post<KommoLead>(`${CRM_BASE_PATH}/leads`, lead);
    return data;
  },

  /**
   * Actualizar un lead
   */
  async updateLead(id: string, updates: LeadUpdateRequest): Promise<KommoLead> {
    const { data } = await api.put<KommoLead>(`${CRM_BASE_PATH}/leads/${id}`, updates);
    return data;
  },

  /**
   * Eliminar un lead (soft delete)
   */
  async deleteLead(id: string): Promise<void> {
    await api.delete(`${CRM_BASE_PATH}/leads/${id}`);
  },

  /**
   * Convertir un lead a contacto
   */
  async convertLeadToContact(leadId: string): Promise<KommoContact> {
    const { data } = await api.post<KommoContact>(`${CRM_BASE_PATH}/leads/${leadId}/convert`);
    return data;
  },

  // ===== CONTACTS =====

  /**
   * Obtener lista de contactos
   * La API puede devolver un array directamente o un objeto con items
   */
  async getContacts(filters?: ContactFilters): Promise<ContactsListResponse> {
    const { data } = await api.get<any>(`${CRM_BASE_PATH}/contacts`, {
      params: filters,
    });
    
    // Si la respuesta es un array, convertir a formato estándar
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        skip: filters?.skip || 0,
        limit: filters?.limit || 20,
      };
    }
    
    // Si ya tiene formato estándar, devolverlo
    return data;
  },

  /**
   * Obtener un contacto por ID
   */
  async getContact(id: string): Promise<KommoContact> {
    const { data } = await api.get<KommoContact>(`${CRM_BASE_PATH}/contacts/${id}`);
    return data;
  },

  /**
   * Crear un nuevo contacto
   */
  async createContact(contact: ContactCreateRequest): Promise<KommoContact> {
    const { data } = await api.post<KommoContact>(`${CRM_BASE_PATH}/contacts`, contact);
    return data;
  },

  /**
   * Actualizar un contacto
   */
  async updateContact(id: string, updates: Partial<ContactCreateRequest>): Promise<KommoContact> {
    const { data } = await api.put<KommoContact>(`${CRM_BASE_PATH}/contacts/${id}`, updates);
    return data;
  },

  /**
   * Eliminar un contacto
   */
  async deleteContact(id: string): Promise<void> {
    await api.delete(`${CRM_BASE_PATH}/contacts/${id}`);
  },

  // ===== COMPANIES =====

  /**
   * Obtener lista de empresas
   */
  async getCompanies(filters?: { query?: string; skip?: number; limit?: number }): Promise<CompaniesListResponse> {
    const { data } = await api.get<CompaniesListResponse>(`${CRM_BASE_PATH}/companies`, {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener una empresa por ID
   */
  async getCompany(id: string): Promise<KommoCompany> {
    const { data } = await api.get<KommoCompany>(`${CRM_BASE_PATH}/companies/${id}`);
    return data;
  },

  // ===== PIPELINES =====

  /**
   * Obtener lista de pipelines
   */
  async getPipelines(): Promise<Pipeline[]> {
    const { data } = await api.get<PipelinesListResponse>(`${CRM_BASE_PATH}/pipelines`);
    return data.items || data;
  },

  /**
   * Obtener un pipeline por ID
   */
  async getPipeline(id: string): Promise<Pipeline> {
    const { data } = await api.get<Pipeline>(`${CRM_BASE_PATH}/pipelines/${id}`);
    return data;
  },

  /**
   * Obtener estados de un pipeline
   */
  async getPipelineStages(pipelineId: string): Promise<PipelineStatus[]> {
    const { data } = await api.get<PipelineStatus[]>(`${CRM_BASE_PATH}/pipelines/${pipelineId}/stages`);
    return data;
  },

  // ===== TASKS =====

  /**
   * Obtener lista de tareas
   */
  async getTasks(filters?: TaskFilters): Promise<TasksListResponse> {
    const { data } = await api.get<TasksListResponse>(`${CRM_BASE_PATH}/tasks`, {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener una tarea por ID
   */
  async getTask(id: string): Promise<Task> {
    const { data } = await api.get<Task>(`${CRM_BASE_PATH}/tasks/${id}`);
    return data;
  },

  /**
   * Crear una nueva tarea
   */
  async createTask(task: TaskCreateRequest): Promise<Task> {
    // Normalizar entity_type a plural si es necesario
    const apiTask: any = {
      ...task,
      entity_type: task.entity_type === 'contact' ? 'contacts' : 
                   task.entity_type === 'lead' ? 'leads' : 
                   task.entity_type === 'company' ? 'companies' :
                   task.entity_type,
    };
    
    const { data } = await api.post<Task>(`${CRM_BASE_PATH}/tasks`, apiTask);
    return data;
  },

  /**
   * Actualizar una tarea
   */
  async updateTask(id: string, updates: Partial<TaskCreateRequest> & { is_completed?: boolean }): Promise<Task> {
    const { data } = await api.put<Task>(`${CRM_BASE_PATH}/tasks/${id}`, updates);
    return data;
  },

  /**
   * Eliminar una tarea
   */
  async deleteTask(id: string): Promise<void> {
    await api.delete(`${CRM_BASE_PATH}/tasks/${id}`);
  },

  /**
   * Marcar tarea como completada
   */
  async completeTask(id: string, resultText?: string): Promise<Task> {
    const { data } = await api.put<Task>(`${CRM_BASE_PATH}/tasks/${id}/complete`, {
      result_text: resultText,
    });
    return data;
  },

  // ===== NOTES =====

  /**
   * Obtener notas de una entidad
   */
  async getNotes(filters?: { entity_type?: string; entity_id?: string; note_type?: string; skip?: number; limit?: number; created_by?: string }): Promise<NotesListResponse> {
    const { data } = await api.get<NotesListResponse>(`${CRM_BASE_PATH}/notes`, {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener una nota por ID
   */
  async getNote(id: string): Promise<Note> {
    const { data } = await api.get<Note>(`${CRM_BASE_PATH}/notes/${id}`);
    return data;
  },

  /**
   * Crear una nota
   */
  async createNote(note: NoteCreateRequest): Promise<Note> {
    // Normalizar entity_type a plural si es necesario
    const apiNote: any = {
      ...note,
      entity_type: note.entity_type === 'contact' ? 'contacts' : 
                   note.entity_type === 'lead' ? 'leads' : 
                   note.entity_type === 'company' ? 'companies' :
                   note.entity_type,
    };
    
    const { data } = await api.post<Note>(`${CRM_BASE_PATH}/notes`, apiNote);
    return data;
  },

  /**
   * Actualizar una nota
   */
  async updateNote(id: string, updates: Partial<NoteCreateRequest>): Promise<Note> {
    const { data } = await api.put<Note>(`${CRM_BASE_PATH}/notes/${id}`, updates);
    return data;
  },

  /**
   * Eliminar una nota
   */
  async deleteNote(id: string): Promise<void> {
    await api.delete(`${CRM_BASE_PATH}/notes/${id}`);
  },

  // ===== CALLS =====

  /**
   * Obtener llamadas
   */
  async getCalls(filters?: CallFilters): Promise<CallsListResponse> {
    const { data } = await api.get<CallsListResponse>(`${CRM_BASE_PATH}/calls`, {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener una llamada por ID
   */
  async getCall(id: string): Promise<Call> {
    const { data } = await api.get<Call>(`${CRM_BASE_PATH}/calls/${id}`);
    return data;
  },

  /**
   * Registrar una llamada
   */
  async createCall(call: CallCreateRequest): Promise<Call> {
    // Normalizar campos para la API
    const apiCall: any = {
      ...call,
      phone: call.phone || call.phone_number,
      // Asegurar que entity_type sea plural ('contacts' o 'leads')
      entity_type: call.entity_type === 'contact' ? 'contacts' : 
                   call.entity_type === 'lead' ? 'leads' : 
                   call.entity_type,
    };
    
    // Eliminar campos legacy
    delete apiCall.phone_number;
    delete apiCall.recording_url;
    delete apiCall.status; // Usar call_status en su lugar
    
    const { data } = await api.post<Call>(`${CRM_BASE_PATH}/calls`, apiCall);
    return data;
  },

  /**
   * Actualizar una llamada
   */
  async updateCall(id: string, updates: Partial<CallCreateRequest>): Promise<Call> {
    const { data } = await api.put<Call>(`${CRM_BASE_PATH}/calls/${id}`, updates);
    return data;
  },

  /**
   * Eliminar una llamada
   */
  async deleteCall(id: string): Promise<void> {
    await api.delete(`${CRM_BASE_PATH}/calls/${id}`);
  },

  // ===== USERS CRM =====

  /**
   * Obtener lista de usuarios CRM
   */
  async getUsers(isActive?: boolean): Promise<CRMUser[]> {
    const { data } = await api.get<CRMUser[]>(`${CRM_BASE_PATH}/users`, {
      params: { is_active: isActive },
    });
    return data;
  },

  /**
   * Obtener un usuario CRM por ID
   */
  async getUser(id: string): Promise<CRMUser> {
    const { data } = await api.get<CRMUser>(`${CRM_BASE_PATH}/users/${id}`);
    return data;
  },

  // ===== CONTACT RELATIONS =====

  /**
   * Obtener leads de un contacto
   */
  async getContactLeads(contactId: string, filters?: { skip?: number; limit?: number }): Promise<LeadsListResponse> {
    const { data } = await api.get<LeadsListResponse>(`${CRM_BASE_PATH}/contacts/${contactId}/leads`, {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener tareas de un contacto
   */
  async getContactTasks(contactId: string, filters?: { skip?: number; limit?: number; is_completed?: boolean }): Promise<TasksListResponse> {
    const { data } = await api.get<TasksListResponse>(`${CRM_BASE_PATH}/contacts/${contactId}/tasks`, {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener llamadas de un contacto
   */
  async getContactCalls(contactId: string, filters?: { skip?: number; limit?: number; direction?: string; call_status?: string }): Promise<CallsListResponse> {
    const { data } = await api.get<CallsListResponse>(`${CRM_BASE_PATH}/contacts/${contactId}/calls`, {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener notas de un contacto
   */
  async getContactNotes(contactId: string, filters?: { skip?: number; limit?: number; note_type?: string }): Promise<NotesListResponse> {
    const { data } = await api.get<NotesListResponse>(`${CRM_BASE_PATH}/contacts/${contactId}/notes`, {
      params: filters,
    });
    return data;
  },

  // ===== TASK TEMPLATES =====

  /**
   * Obtener lista de plantillas de tareas
   */
  async getTaskTemplates(filters?: { is_active?: boolean; applies_to_contacts?: boolean; applies_to_leads?: boolean; is_required?: boolean }): Promise<TaskTemplatesListResponse> {
    const { data } = await api.get<TaskTemplatesListResponse>(`${CRM_BASE_PATH}/task-templates`, {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener una plantilla por ID
   */
  async getTaskTemplate(id: string): Promise<TaskTemplate> {
    const { data } = await api.get<TaskTemplate>(`${CRM_BASE_PATH}/task-templates/${id}`);
    return data;
  },

  /**
   * Crear plantilla de tarea (solo admin)
   */
  async createTaskTemplate(template: Partial<TaskTemplate> & { name: string }): Promise<TaskTemplate> {
    const { data } = await api.post<TaskTemplate>(`${CRM_BASE_PATH}/task-templates`, template);
    return data;
  },

  /**
   * Actualizar plantilla de tarea (solo admin)
   */
  async updateTaskTemplate(id: string, updates: Partial<TaskTemplate>): Promise<TaskTemplate> {
    const { data } = await api.put<TaskTemplate>(`${CRM_BASE_PATH}/task-templates/${id}`, updates);
    return data;
  },

  /**
   * Eliminar plantilla de tarea (solo admin)
   */
  async deleteTaskTemplate(id: string): Promise<void> {
    await api.delete(`${CRM_BASE_PATH}/task-templates/${id}`);
  },

  /**
   * Reordenar plantillas (solo admin)
   */
  async reorderTaskTemplates(templateOrders: { id: string; sort_order: number }[]): Promise<void> {
    await api.put(`${CRM_BASE_PATH}/task-templates/order`, { template_orders: templateOrders });
  },

  // ===== CALENDAR =====

  /**
   * Obtener tareas para calendario
   */
  async getCalendarTasks(filters: { start_date: string; end_date?: string; entity_type?: string; responsible_user_id?: string }): Promise<Task[]> {
    const { data } = await api.get<{ items: Task[] }>(`${CRM_BASE_PATH}/tasks/calendar`, {
      params: filters,
    });
    return data.items || data;
  },

  // ===== DASHBOARD STATS =====

  /**
   * Obtener estadísticas del dashboard
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>(`${CRM_BASE_PATH}/dashboard/stats`);
    return data;
  },

  /**
   * Obtener estadísticas de pipeline
   */
  async getPipelineStats(pipelineId?: string): Promise<any> {
    const { data } = await api.get(`${CRM_BASE_PATH}/dashboard/pipeline-stats`, {
      params: { pipeline_id: pipelineId },
    });
    return data;
  },
};

export default crmService;

