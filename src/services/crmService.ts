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
// Según documentación: todos los endpoints están bajo /api/crm
// Como la base URL ya incluye /api, usamos solo /crm
const CRM_BASE_PATH = '/crm';

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
   * NOTA: Este endpoint puede no estar implementado en el backend
   * Si no existe, el componente debe manejar el error
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
   * NOTA: Este endpoint puede no estar implementado en el backend
   * Si no existe, el componente debe manejar el error
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

  // ===== FLUJOS DE TRABAJO COMUNES =====

  /**
   * Flujo 1: Crear Contacto y Lead asociado
   * Crea un contacto con información básica y campos Migro, luego crea un lead asociado
   */
  async createContactWithLead(
    contactData: ContactCreateRequest,
    leadData: Omit<LeadCreateRequest, 'contact_id'>
  ): Promise<{ contact: KommoContact; lead: KommoLead }> {
    // 1. Crear contacto
    const contact = await this.createContact(contactData);

    // 2. Crear lead asociado
    const lead = await this.createLead({
      ...leadData,
      contact_id: contact.id,
    });

    return { contact, lead };
  },

  /**
   * Flujo 2: Asignar Tareas Automáticas desde Plantillas
   * Obtiene plantillas activas y crea tareas automáticamente para un contacto o lead
   * 
   * @example
   * ```typescript
   * // Asignar todas las tareas aplicables a un contacto
   * const tasks = await crmService.assignTasksFromTemplates(contactId, 'contacts');
   * 
   * // Asignar solo tareas específicas
   * const tasks = await crmService.assignTasksFromTemplates(contactId, 'contacts', {
   *   onlyActive: true,
   *   appliesToContacts: true
   * });
   * ```
   */
  async assignTasksFromTemplates(
    entityId: string,
    entityType: 'contacts' | 'leads',
    options?: {
      onlyActive?: boolean;
      appliesToContacts?: boolean;
      appliesToLeads?: boolean;
      responsibleUserId?: string;
    }
  ): Promise<Task[]> {
    // 1. Obtener plantillas disponibles
    const templatesResponse = await this.getTaskTemplates({
      is_active: options?.onlyActive ?? true,
      applies_to_contacts: options?.appliesToContacts ?? (entityType === 'contacts'),
      applies_to_leads: options?.appliesToLeads ?? (entityType === 'leads'),
    });

    const templates = templatesResponse.items || [];

    // 2. Crear tareas automáticamente
    const tasks: Task[] = [];
    for (const template of templates) {
      // Calcular fecha de vencimiento
      const completeTill = new Date();
      completeTill.setDate(completeTill.getDate() + (template.default_duration_days || 7));

      try {
        const task = await this.createTask({
          text: template.default_text || template.name,
          task_template_id: template.id,
          entity_id: entityId,
          entity_type: entityType === 'contacts' ? 'contacts' : 'leads',
          complete_till: completeTill.toISOString(),
          task_type: template.task_type || 'call',
          responsible_user_id: options?.responsibleUserId || '1',
        });
        tasks.push(task);
      } catch (error) {
        console.error(`Error creando tarea desde plantilla ${template.name}:`, error);
        // Continuar con las demás plantillas aunque una falle
      }
    }

    return tasks;
  },

  /**
   * Flujo 3: Registrar Llamada con Seguimiento Automático
   * Registra una llamada y crea automáticamente una tarea para la próxima llamada si se especifica
   */
  async registerCallWithFollowUp(
    callData: CallCreateRequest
  ): Promise<{ call: Call; followUpTask?: Task }> {
    // 1. Registrar llamada
    const call = await this.createCall(callData);

    // 2. Crear tarea automática para próxima llamada si se especifica
    let followUpTask: Task | undefined;
    if (call.proxima_llamada_fecha) {
      try {
        followUpTask = await this.createTask({
          text: 'Llamada de seguimiento programada',
          task_type: 'call',
          entity_id: call.entity_id,
          entity_type: call.entity_type === 'contact' ? 'contacts' : 
                      call.entity_type === 'contacts' ? 'contacts' :
                      call.entity_type === 'lead' ? 'leads' :
                      call.entity_type === 'leads' ? 'leads' : 'contacts',
          complete_till: call.proxima_llamada_fecha,
          responsible_user_id: call.responsible_user_id || '1',
        });
      } catch (error) {
        console.error('Error creando tarea de seguimiento:', error);
        // No fallar si no se puede crear la tarea
      }
    }

    return { call, followUpTask };
  },

  /**
   * Flujo 4: Obtener Historial Completo de Interacciones de un Contacto
   * Obtiene todas las tareas, llamadas y notas de un contacto y las combina ordenadas por fecha
   */
  async getContactInteractionHistory(contactId: string): Promise<Array<{
    type: 'task' | 'call' | 'note';
    id: string;
    created_at: string;
    data: Task | Call | Note;
  }>> {
    // Obtener todas las interacciones en paralelo
    const [tasksResponse, callsResponse, notesResponse] = await Promise.all([
      this.getContactTasks(contactId, { limit: 100 }),
      this.getContactCalls(contactId, { limit: 100 }),
      this.getContactNotes(contactId, { limit: 100 }),
    ]);

    const tasks = tasksResponse.items || [];
    const calls = callsResponse.items || [];
    const notes = notesResponse.items || [];

    // Combinar y ordenar por fecha (más recientes primero)
    const interactions = [
      ...tasks.map(t => ({ type: 'task' as const, id: t.id, created_at: t.created_at, data: t })),
      ...calls.map(c => ({ type: 'call' as const, id: c.id, created_at: c.created_at, data: c })),
      ...notes.map(n => ({ type: 'note' as const, id: n.id, created_at: n.created_at, data: n })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return interactions;
  },

  /**
   * Flujo 5: Obtener Pipeline de Leads Agrupados por Estado
   * Obtiene todos los leads y los agrupa por estado para visualización en pipeline
   */
  async getLeadsPipeline(filters?: LeadFilters): Promise<{
    new: KommoLead[];
    contacted: KommoLead[];
    proposal: KommoLead[];
    negotiation: KommoLead[];
    won: KommoLead[];
    lost: KommoLead[];
    all: KommoLead[];
  }> {
    const response = await this.getLeads({ ...filters, limit: 100 });
    const leads = response.items || [];

    return {
      new: leads.filter(l => l.status === 'new'),
      contacted: leads.filter(l => l.status === 'contacted'),
      proposal: leads.filter(l => l.status === 'proposal'),
      negotiation: leads.filter(l => l.status === 'negotiation'),
      won: leads.filter(l => l.status === 'won'),
      lost: leads.filter(l => l.status === 'lost'),
      all: leads,
    };
  },

  /**
   * Flujo 6: Flujo Completo de Venta
   * Implementa el flujo completo desde crear contacto hasta convertir lead
   */
  async completeSalesFlow(params: {
    contactData: ContactCreateRequest;
    leadData: Omit<LeadCreateRequest, 'contact_id'>;
    assignTasks?: boolean;
    initialCall?: Omit<CallCreateRequest, 'entity_id' | 'entity_type'>;
    updateGradings?: {
      grading_llamada?: 'A' | 'B+' | 'B-' | 'C';
      grading_situacion?: 'A' | 'B+' | 'B-' | 'C';
    };
  }): Promise<{
    contact: KommoContact;
    lead: KommoLead;
    tasks: Task[];
    call?: Call;
    followUpTask?: Task;
  }> {
    // 1. Crear contacto y lead
    const { contact, lead } = await this.createContactWithLead(
      params.contactData,
      params.leadData
    );

    const tasks: Task[] = [];

    // 2. Asignar tareas automáticas si se solicita
    if (params.assignTasks) {
      const assignedTasks = await this.assignTasksFromTemplates(
        contact.id,
        'contacts'
      );
      tasks.push(...assignedTasks);
    }

    // 3. Registrar llamada inicial si se proporciona
    let call: Call | undefined;
    let followUpTask: Task | undefined;
    if (params.initialCall) {
      const callResult = await this.registerCallWithFollowUp({
        ...params.initialCall,
        entity_id: contact.id,
        entity_type: 'contacts',
      });
      call = callResult.call;
      followUpTask = callResult.followUpTask;
    }

    // 4. Actualizar gradings si se proporcionan
    if (params.updateGradings) {
      await this.updateContact(contact.id, {
        grading_llamada: params.updateGradings.grading_llamada,
        grading_situacion: params.updateGradings.grading_situacion,
      });
    }

    return {
      contact,
      lead,
      tasks,
      call,
      followUpTask,
    };
  },
};

export default crmService;

