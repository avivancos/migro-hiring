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
} from '@/types/crm';

export const crmService = {
  // ===== LEADS =====
  
  /**
   * Obtener lista de leads con filtros
   */
  async getLeads(filters?: LeadFilters): Promise<LeadsListResponse> {
    const { data } = await api.get<LeadsListResponse>('/crm/leads', {
      params: filters,
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Obtener un lead por ID
   */
  async getLead(id: number): Promise<KommoLead> {
    const { data } = await api.get<KommoLead>(`/crm/leads/${id}`, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Crear un nuevo lead
   */
  async createLead(lead: LeadCreateRequest): Promise<KommoLead> {
    const { data } = await api.post<KommoLead>('/crm/leads', lead, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Actualizar un lead
   */
  async updateLead(id: number, updates: LeadUpdateRequest): Promise<KommoLead> {
    const { data } = await api.patch<KommoLead>(`/crm/leads/${id}`, updates, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Eliminar un lead (soft delete)
   */
  async deleteLead(id: number): Promise<void> {
    await api.delete(`/crm/leads/${id}`, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
  },

  // ===== CONTACTS =====

  /**
   * Obtener lista de contactos
   */
  async getContacts(filters?: ContactFilters): Promise<ContactsListResponse> {
    const { data } = await api.get<ContactsListResponse>('/crm/contacts', {
      params: filters,
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Obtener un contacto por ID
   */
  async getContact(id: number): Promise<KommoContact> {
    const { data } = await api.get<KommoContact>(`/crm/contacts/${id}`, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Crear un nuevo contacto
   */
  async createContact(contact: ContactCreateRequest): Promise<KommoContact> {
    const { data } = await api.post<KommoContact>('/crm/contacts', contact, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Actualizar un contacto
   */
  async updateContact(id: number, updates: Partial<ContactCreateRequest>): Promise<KommoContact> {
    const { data } = await api.patch<KommoContact>(`/crm/contacts/${id}`, updates, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Eliminar un contacto
   */
  async deleteContact(id: number): Promise<void> {
    await api.delete(`/crm/contacts/${id}`, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
  },

  // ===== COMPANIES =====

  /**
   * Obtener lista de empresas
   */
  async getCompanies(filters?: { query?: string; page?: number; limit?: number }): Promise<CompaniesListResponse> {
    const { data } = await api.get<CompaniesListResponse>('/crm/companies', {
      params: filters,
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Obtener una empresa por ID
   */
  async getCompany(id: number): Promise<KommoCompany> {
    const { data } = await api.get<KommoCompany>(`/crm/companies/${id}`, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  // ===== PIPELINES =====

  /**
   * Obtener lista de pipelines
   */
  async getPipelines(): Promise<Pipeline[]> {
    const { data } = await api.get<Pipeline[]>('/crm/pipelines', {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Obtener un pipeline por ID
   */
  async getPipeline(id: number): Promise<Pipeline> {
    const { data } = await api.get<Pipeline>(`/crm/pipelines/${id}`, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Obtener estados de un pipeline
   */
  async getPipelineStages(pipelineId: number): Promise<PipelineStatus[]> {
    const { data } = await api.get<PipelineStatus[]>(`/crm/pipelines/${pipelineId}/stages`, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  // ===== TASKS =====

  /**
   * Obtener lista de tareas
   */
  async getTasks(filters?: TaskFilters): Promise<TasksListResponse> {
    const { data} = await api.get<TasksListResponse>('/crm/tasks', {
      params: filters,
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Obtener una tarea por ID
   */
  async getTask(id: number): Promise<Task> {
    const { data } = await api.get<Task>(`/crm/tasks/${id}`, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Crear una nueva tarea
   */
  async createTask(task: TaskCreateRequest): Promise<Task> {
    const { data } = await api.post<Task>('/crm/tasks', task, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Actualizar una tarea
   */
  async updateTask(id: number, updates: Partial<TaskCreateRequest> & { is_completed?: boolean }): Promise<Task> {
    const { data } = await api.patch<Task>(`/crm/tasks/${id}`, updates, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Eliminar una tarea
   */
  async deleteTask(id: number): Promise<void> {
    await api.delete(`/crm/tasks/${id}`, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
  },

  /**
   * Marcar tarea como completada
   */
  async completeTask(id: number, resultText?: string): Promise<Task> {
    return this.updateTask(id, {
      is_completed: true,
      result_text: resultText,
    });
  },

  // ===== NOTES =====

  /**
   * Obtener notas de una entidad
   */
  async getNotes(entityType: 'lead' | 'contact' | 'company', entityId: number): Promise<Note[]> {
    const { data } = await api.get<Note[]>('/crm/notes', {
      params: {
        entity_type: entityType,
        entity_id: entityId,
      },
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Crear una nota
   */
  async createNote(note: NoteCreateRequest): Promise<Note> {
    const { data } = await api.post<Note>('/crm/notes', note, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Actualizar una nota
   */
  async updateNote(id: number, updates: Partial<NoteCreateRequest>): Promise<Note> {
    const { data } = await api.patch<Note>(`/crm/notes/${id}`, updates, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Eliminar una nota
   */
  async deleteNote(id: number): Promise<void> {
    await api.delete(`/crm/notes/${id}`, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
  },

  // ===== CALLS =====

  /**
   * Obtener llamadas
   */
  async getCalls(filters?: CallFilters): Promise<Call[]> {
    const { data } = await api.get<Call[]>('/crm/calls', {
      params: filters,
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Obtener una llamada por ID
   */
  async getCall(id: number): Promise<Call> {
    const { data } = await api.get<Call>(`/crm/calls/${id}`, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Registrar una llamada
   */
  async createCall(call: CallCreateRequest): Promise<Call> {
    const { data } = await api.post<Call>('/crm/calls', call, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  // ===== USERS CRM =====

  /**
   * Obtener lista de usuarios CRM
   */
  async getUsers(isActive?: boolean): Promise<CRMUser[]> {
    const { data } = await api.get<CRMUser[]>('/crm/users', {
      params: { is_active: isActive },
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Obtener un usuario CRM por ID
   */
  async getUser(id: number): Promise<CRMUser> {
    const { data } = await api.get<CRMUser>(`/crm/users/${id}`, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  // ===== DASHBOARD STATS =====

  /**
   * Obtener estadísticas del dashboard
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/crm/dashboard/stats', {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },

  /**
   * Obtener estadísticas de pipeline
   */
  async getPipelineStats(pipelineId?: number): Promise<any> {
    const { data } = await api.get('/crm/dashboard/pipeline-stats', {
      params: { pipeline_id: pipelineId },
      headers: {
        'X-Admin-Password': 'Pomelo2005.1@',
      },
    });
    return data;
  },
};

export default crmService;

