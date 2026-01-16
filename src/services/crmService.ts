// CRM Service - API calls for CRM functionality

import { api } from './api';
import { apiCache, APICache } from './apiCache';
import type {
  Lead,
  Contact,
  Company,
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
  CustomField,
  CustomFieldValue,
  CustomFieldCreateRequest,
  CustomFieldUpdateRequest,
  CustomFieldValueCreateRequest,
  MarkInitialContactCompletedResponse,
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
    
    // Si tiene formato _embedded/_page (backend real)
    if (data._embedded && data._embedded.leads) {
      return {
        items: data._embedded.leads,
        total: data._page?.total || data._embedded.leads.length,
        skip: ((data._page?.page || 1) - 1) * (data._page?.limit || 50),
        limit: data._page?.limit || 50,
      };
    }
    
    // Si ya tiene formato estándar, devolverlo
    return data;
  },

  /**
   * Obtener TODOS los leads mediante múltiples peticiones (paginación automática)
   */
  async getAllLeads(filters?: Omit<LeadFilters, 'limit' | 'skip' | 'page'>): Promise<Lead[]> {
    const allLeads: Lead[] = [];
    let page = 1;
    const limit = 100; // Máximo permitido
    let hasMore = true;

    while (hasMore) {
      const response = await this.getLeads({ ...filters, page, limit } as LeadFilters);
      allLeads.push(...response.items);
      
      const totalPages = Math.ceil(response.total / limit);
      hasMore = page < totalPages;
      page++;
    }

    return allLeads;
  },
  
  /**
   * Obtener el total de leads usando el endpoint dedicado /leads/count
   */
  async getLeadsCount(): Promise<number> {
    try {
      const { data } = await api.get<{ total: number }>(`${CRM_BASE_PATH}/leads/count`);
      return data.total || 0;
    } catch (err) {
      console.error('Error obteniendo total de leads:', err);
      return 0;
    }
  },

  /**
   * Obtener un lead por ID
   * Con caché para evitar llamadas duplicadas
   */
  async getLead(id: string, useCache: boolean = true): Promise<Lead> {
    const cacheKey = APICache.generateKey(`${CRM_BASE_PATH}/leads/${id}`);
    
    // Intentar obtener del caché primero
    if (useCache) {
      const cached = apiCache.get<Lead>(cacheKey);
      if (cached) {
        console.log(`💾 [crmService] Lead ${id} obtenido del caché`);
        return cached;
      }
    }
    
    const { data } = await api.get<Lead>(`${CRM_BASE_PATH}/leads/${id}`);
    
    // Guardar en caché (5 minutos TTL)
    if (useCache) {
      apiCache.set(cacheKey, data, 5 * 60 * 1000);
    }
    
    return data;
  },

  /**
   * Obtener defaults para un nuevo lead (prefilling)
   */
  async getLeadDefaults(): Promise<Partial<Lead>> {
    try {
      const { data } = await api.get<Partial<Lead>>(`${CRM_BASE_PATH}/leads/new`);
      return data;
    } catch (err) {
      console.error('Error loading lead defaults:', err);
      return {};
    }
  },

  /**
   * Crear un nuevo lead
   */
  async createLead(lead: LeadCreateRequest): Promise<Lead> {
    // Log del payload antes de enviarlo para diagnosticar errores 422
    console.log('POST /crm/leads - Payload:', JSON.stringify(lead, null, 2));
    try {
    const { data } = await api.post<Lead>(`${CRM_BASE_PATH}/leads`, lead);
    return data;
    } catch (err: any) {
      // Log detallado del error 422
      if (err?.response?.status === 422) {
        console.error('Error 422 - Payload enviado:', JSON.stringify(lead, null, 2));
        console.error('Error 422 - Respuesta del servidor:', err.response?.data);
      }
      throw err;
    }
  },

  /**
   * Actualizar un lead
   */
  async updateLead(id: string, updates: LeadUpdateRequest): Promise<Lead> {
    const { data } = await api.put<Lead>(`${CRM_BASE_PATH}/leads/${id}`, updates);
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
  async convertLeadToContact(leadId: string): Promise<Contact> {
    const { data } = await api.post<Contact>(`${CRM_BASE_PATH}/leads/${leadId}/convert`);
    return data;
  },

  /**
   * Marcar lead como contactado inicialmente (validación de primera llamada)
   * Valida que la primera llamada tenga todos los datos requeridos
   */
  async markLeadAsContacted(leadId: string): Promise<MarkInitialContactCompletedResponse> {
    const { data } = await api.post<MarkInitialContactCompletedResponse>(
      `${CRM_BASE_PATH}/leads/${leadId}/mark-initial-contact-completed`
    );
    return data;
  },

  // ===== CONTACTS =====

  /**
   * Obtener lista de contactos
   * La API puede devolver un array directamente o un objeto con items
   */
  async getContacts(filters?: ContactFilters): Promise<ContactsListResponse> {
    // Asegurar que el parámetro search se envíe correctamente (sin encoding adicional)
    const params: any = { ...filters };
    if (params.search) {
      // El parámetro search debe enviarse tal cual, axios lo codificará automáticamente
      console.log('📤 [crmService] Enviando búsqueda:', params.search);
    }
    
    console.log('📤 [crmService] Obteniendo contactos con filtros:', {
      skip: params.skip,
      limit: params.limit,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
      view: params.view,
      responsible_user_id: params.responsible_user_id,
      search: params.search ? 'presente' : 'ausente',
    });
    
    const { data } = await api.get<any>(`${CRM_BASE_PATH}/contacts`, {
      params,
    });
    
    // Logging para diagnóstico
    console.log('📥 [crmService] Respuesta del backend:', {
      isArray: Array.isArray(data),
      hasEmbedded: !!(data?._embedded),
      contactsCount: Array.isArray(data) ? data.length : data?._embedded?.contacts?.length || 0,
      total: data?._page?.total || (Array.isArray(data) ? data.length : 0),
      rawDataKeys: Object.keys(data || {}),
    });
    
    // Si la respuesta es un array, convertir a formato estándar
    if (Array.isArray(data)) {
      const result = {
        items: data,
        total: data.length,
        skip: filters?.skip || 0,
        limit: filters?.limit || 20,
      };
      
      if (data.length === 0) {
        console.warn('⚠️ [crmService] El backend retornó un array vacío de contactos. Esto puede indicar que el agente no tiene oportunidades asignadas.');
      }
      
      return result;
    }
    
    // Si tiene formato _embedded/_page (backend real)
    if (data._embedded && data._embedded.contacts) {
      const contacts = data._embedded.contacts;
      const total = data._page?.total || contacts.length;
      
      if (contacts.length === 0 && total === 0) {
        console.warn('⚠️ [crmService] El backend retornó 0 contactos. Posibles causas:');
        console.warn('  1. El agente no tiene oportunidades asignadas');
        console.warn('  2. El backend está filtrando por oportunidades asignadas');
        console.warn('  3. No hay contactos en la base de datos');
      }
      
      return {
        items: contacts,
        total,
        skip: ((data._page?.page || 1) - 1) * (data._page?.limit || 50),
        limit: data._page?.limit || 50,
      };
    }
    
    // Si ya tiene formato estándar, devolverlo
    return data;
  },

  /**
   * Obtener el total de contactos usando el endpoint dedicado /contacts/count
   */
  async getContactsCount(filters?: Omit<ContactFilters, 'limit' | 'skip' | 'page'>): Promise<number> {
    try {
      const params: any = {};
      if (filters?.search) params.search = filters.search;
      if (filters?.grading_llamada) params.grading_llamada = filters.grading_llamada;
      if (filters?.grading_situacion) params.grading_situacion = filters.grading_situacion;
      if (filters?.nacionalidad) params.nacionalidad = filters.nacionalidad;
      if (filters?.responsible_user_id) params.responsible_user_id = filters.responsible_user_id;
      if (filters?.empadronado !== undefined) params.empadronado = filters.empadronado;
      if (filters?.tiene_ingresos !== undefined) params.tiene_ingresos = filters.tiene_ingresos;
      if (filters?.ultima_llamada_desde) params.ultima_llamada_desde = filters.ultima_llamada_desde;
      if (filters?.ultima_llamada_hasta) params.ultima_llamada_hasta = filters.ultima_llamada_hasta;
      if (filters?.proxima_llamada_desde) params.proxima_llamada_desde = filters.proxima_llamada_desde;
      if (filters?.proxima_llamada_hasta) params.proxima_llamada_hasta = filters.proxima_llamada_hasta;

      const { data } = await api.get<{ total: number }>(`${CRM_BASE_PATH}/contacts/count`, {
        params,
      });
      return data.total || 0;
    } catch (err) {
      console.error('Error obteniendo total de contactos:', err);
      return 0;
    }
  },

  /**
   * Obtener TODOS los contactos mediante múltiples peticiones (paginación automática)
   */
  async getAllContacts(filters?: Omit<ContactFilters, 'limit' | 'skip' | 'page'>): Promise<Contact[]> {
    const allContacts: Contact[] = [];
    let page = 1;
    const limit = 100; // Máximo permitido
    let hasMore = true;

    while (hasMore) {
      const response = await this.getContacts({ ...filters, page, limit } as ContactFilters);
      allContacts.push(...response.items);
      
      const totalPages = Math.ceil(response.total / limit);
      hasMore = page < totalPages;
      page++;
    }

    return allContacts;
  },

  /**
   * Obtener un contacto por ID
   * Con caché para evitar llamadas duplicadas
   */
  async getContact(id: string, useCache: boolean = true): Promise<Contact> {
    const cacheKey = APICache.generateKey(`${CRM_BASE_PATH}/contacts/${id}`);
    
    // Intentar obtener del caché primero
    if (useCache) {
      const cached = apiCache.get<Contact>(cacheKey);
      if (cached) {
        console.log(`💾 [crmService] Contacto ${id} obtenido del caché`);
        return cached;
      }
    }
    
    const { data } = await api.get<Contact>(`${CRM_BASE_PATH}/contacts/${id}`);
    
    // Guardar en caché (5 minutos TTL)
    if (useCache) {
      apiCache.set(cacheKey, data, 5 * 60 * 1000);
    }
    
    return data;
  },

  /**
   * Crear un nuevo contacto
   */
  async createContact(contact: ContactCreateRequest): Promise<Contact> {
    const { data } = await api.post<Contact>(`${CRM_BASE_PATH}/contacts`, contact);
    return data;
  },

  /**
   * Actualizar un contacto
   */
  async updateContact(id: string, updates: Partial<ContactCreateRequest>): Promise<Contact> {
    const { data } = await api.put<Contact>(`${CRM_BASE_PATH}/contacts/${id}`, updates);
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
  async getCompany(id: string): Promise<Company> {
    const { data } = await api.get<Company>(`${CRM_BASE_PATH}/companies/${id}`);
    return data;
  },

  // ===== PIPELINES =====

  /**
   * Obtener lista de pipelines
   * NOTA: Este endpoint puede no estar implementado en el backend
   * Si no existe, el componente debe manejar el error
   * Maneja arrays vacíos correctamente
   */
  async getPipelines(): Promise<Pipeline[]> {
    try {
      const { data } = await api.get<PipelinesListResponse | Pipeline[]>(`${CRM_BASE_PATH}/pipelines`);
      // Si devuelve array vacío o array directo, manejarlo
      if (Array.isArray(data)) {
        return data;
      }
      // Si devuelve objeto con items
      return data.items || [];
    } catch (err) {
      console.error('Error loading pipelines:', err);
      return []; // Retornar array vacío en lugar de bloquear
    }
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
   * La API puede devolver un array directamente o un objeto con _embedded/_page
   * El backend puede aceptar 'skip' o 'page' según la versión
   */
  async getTasks(filters?: TaskFilters): Promise<TasksListResponse> {
    const params: any = { ...filters };
    
    // El backend puede aceptar 'skip' directamente o requerir 'page'
    // Intentamos primero con 'skip' si está disponible, y si el backend requiere 'page',
    // lo convertimos. Esto hace el código compatible con ambas versiones del backend.
    if (params.skip !== undefined && params.page === undefined) {
      // Algunas versiones del backend usan 'page' en lugar de 'skip'
      // Convertimos skip a page: page = floor(skip / limit) + 1
      const limit = params.limit || 50;
      params.page = Math.floor((params.skip || 0) / limit) + 1;
      // Mantenemos skip también por si el backend lo acepta directamente
      // El backend ignorará el que no use
    }
    
    const { data } = await api.get<any>(`${CRM_BASE_PATH}/tasks`, {
      params,
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
    
    // Si tiene formato _embedded/_page (backend con formato Kommo)
    if (data._embedded && data._embedded.tasks) {
      return {
        items: data._embedded.tasks,
        total: data._page?.total || data._embedded.tasks.length,
        skip: ((data._page?.page || 1) - 1) * (data._page?.limit || 50),
        limit: data._page?.limit || 50,
      };
    }
    
    // Si tiene formato estándar con 'items' directamente
    if (data.items && Array.isArray(data.items)) {
      return {
        items: data.items,
        total: data.total || data.items.length,
        skip: data.skip ?? (filters?.skip || 0),
        limit: data.limit ?? (filters?.limit || 20),
      };
    }
    
    // Si ya tiene formato estándar, devolverlo
    return data;
  },

  /**
   * Obtener una tarea por ID
   * Nota: Si el backend no tiene endpoint GET /tasks/{id}, 
   * se intenta obtener desde la lista de tareas del calendario con un rango amplio de fechas
   */
  async getTask(id: string): Promise<Task> {
    try {
      // Intentar obtener directamente (si el endpoint existe)
      const { data } = await api.get<Task>(`${CRM_BASE_PATH}/tasks/${id}`);
      return data;
    } catch (error: any) {
      // Si el endpoint no existe (404), intentar obtener desde la lista del calendario
      if (error?.response?.status === 404) {
        console.warn(`⚠️ [crmService] Endpoint GET /tasks/${id} no encontrado, intentando obtener desde calendario...`);
        try {
          // Obtener tareas del calendario con un rango amplio de fechas (últimos 2 años y próximos 2 años)
          const now = new Date();
          const startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 2);
          const endDate = new Date(now);
          endDate.setFullYear(endDate.getFullYear() + 2);
          
          const calendarResponse = await api.get<{ items: Task[] } | Task[]>(`${CRM_BASE_PATH}/tasks/calendar`, {
            params: {
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
            },
          });
          
          // Manejar diferentes formatos de respuesta
          const tasks = Array.isArray(calendarResponse.data) 
            ? calendarResponse.data 
            : (calendarResponse.data as any)?.items || [];
          const task = tasks.find((t: Task) => t.id === id);
          
          if (task) {
            console.log(`✅ [crmService] Tarea ${id} encontrada en calendario`);
            return task;
          }
          
          // Si no se encuentra, lanzar error 404
          throw { response: { status: 404, data: { detail: 'Tarea no encontrada' } } };
        } catch (calendarError: any) {
          // Si también falla el calendario, lanzar el error original
          console.error(`❌ [crmService] Error obteniendo tarea desde calendario:`, calendarError);
          throw error;
        }
      }
      // Si es otro error, re-lanzarlo
      throw error;
    }
  },

  /**
   * Crear una nueva tarea
   */
  async createTask(task: TaskCreateRequest): Promise<Task> {
    const { data } = await api.post<Task>(`${CRM_BASE_PATH}/tasks`, task);
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
   * Si entity_id="new", el backend devuelve [] sin error
   */
  async getNotes(filters?: { entity_type?: string; entity_id?: string; note_type?: string; skip?: number; limit?: number; created_by?: string }): Promise<NotesListResponse> {
    try {
    const { data } = await api.get<NotesListResponse>(`${CRM_BASE_PATH}/notes`, {
      params: filters,
    });
    return data;
    } catch (err: any) {
      // Si entity_id es "new", esperar lista vacía
      if (filters?.entity_id === 'new') {
        return {
          items: [],
          total: 0,
          skip: filters?.skip || 0,
          limit: filters?.limit || 20,
        };
      }
      throw err;
    }
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
    const apiNote: any = {
      ...note,
    };
    
    console.log('📝 [crmService] Creando nota:', apiNote);
    const { data } = await api.post<Note>(`${CRM_BASE_PATH}/notes`, apiNote);
    console.log('✅ [crmService] Nota creada exitosamente:', data.id);
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
   * Maneja error 500 mostrando lista vacía hasta que se apliquen migraciones del backend
   */
  async getCalls(filters?: CallFilters): Promise<CallsListResponse> {
    console.log('🟠 [crmService] getCalls llamado con filters:', filters);
    try {
      const { data } = await api.get<any>(`${CRM_BASE_PATH}/calls`, {
        params: filters,
      });
      console.log('🟠 [crmService] getCalls respuesta recibida:', data);
      console.log('🟠 [crmService] getCalls - tipo:', typeof data, 'es array?:', Array.isArray(data));
      
      // El backend puede devolver un array directo o un objeto con items
      let normalizedResponse: CallsListResponse;
      
      if (Array.isArray(data)) {
        // Backend devuelve array directo: convertir a estructura esperada
        console.log('🟠 [crmService] getCalls: respuesta es array, normalizando...');
        normalizedResponse = {
          items: data,
          total: data.length,
          skip: filters?.skip || 0,
          limit: filters?.limit || 20,
        };
      } else if (data && typeof data === 'object' && 'items' in data) {
        // Backend devuelve objeto con items: usar tal cual
        console.log('🟠 [crmService] getCalls: respuesta tiene estructura items');
        normalizedResponse = {
          items: data.items || [],
          total: data.total ?? (data.items?.length || 0),
          skip: data.skip ?? (filters?.skip || 0),
          limit: data.limit ?? (filters?.limit || 20),
        };
      } else {
        // Respuesta inesperada: normalizar a estructura vacía
        console.warn('⚠️ [crmService] getCalls: respuesta inesperada, normalizando a vacío');
        normalizedResponse = {
          items: [],
          total: 0,
          skip: filters?.skip || 0,
          limit: filters?.limit || 20,
        };
      }
      
      console.log('🟠 [crmService] getCalls respuesta normalizada:', normalizedResponse);
      return normalizedResponse;
    } catch (err: any) {
      console.error('❌ [crmService] getCalls error:', err);
      // Si es error 500, probablemente faltan migraciones de transcripción
      // Mientras tanto, retornar lista vacía
      if (err?.response?.status === 500) {
        console.warn('⚠️ [crmService] Error 500 en /crm/calls - probablemente faltan migraciones. Mostrando lista vacía.');
        return {
          items: [],
          total: 0,
          skip: filters?.skip || 0,
          limit: filters?.limit || 20,
        };
      }
      throw err;
    }
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
    console.log('🟢 [crmService] createCall llamado');
    console.log('🟢 [crmService] call recibido:', call);
    
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
    
    console.log('🟢 [crmService] apiCall normalizado:', apiCall);
    console.log('🟢 [crmService] URL:', `${CRM_BASE_PATH}/calls`);
    console.log('🟢 [crmService] Enviando POST request...');
    
    try {
      const { data } = await api.post<Call>(`${CRM_BASE_PATH}/calls`, apiCall);
      console.log('✅ [crmService] Llamada creada exitosamente:', data);
      return data;
    } catch (error: any) {
      console.error('❌ [crmService] Error en createCall:', error);
      console.error('❌ [crmService] Error details:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        detail: error?.response?.data?.detail,
        config: {
          url: error?.config?.url,
          method: error?.config?.method,
          data: error?.config?.data,
        },
      });
      
      // Log detallado de errores de validación 422
      if (error?.response?.status === 422 && error?.response?.data?.detail) {
        console.error('❌ [crmService] Errores de validación (422):');
        if (Array.isArray(error.response.data.detail)) {
          error.response.data.detail.forEach((err: any, index: number) => {
            console.error(`  Error ${index + 1}:`, err);
            if (err.loc) console.error(`    Campo: ${err.loc.join('.')}`);
            if (err.msg) console.error(`    Mensaje: ${err.msg}`);
            if (err.type) console.error(`    Tipo: ${err.type}`);
          });
        } else {
          console.error('  Detalle:', error.response.data.detail);
        }
      }
      
      throw error;
    }
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
   * Con caché para evitar llamadas duplicadas (usuarios cambian poco)
   */
  async getUsers(isActive?: boolean, useCache: boolean = true): Promise<CRMUser[]> {
    const cacheKey = APICache.generateKey(`${CRM_BASE_PATH}/users`, { is_active: isActive });
    
    // Intentar obtener del caché primero
    if (useCache) {
      const cached = apiCache.get<CRMUser[]>(cacheKey);
      if (cached) {
        console.log(`💾 [crmService] Usuarios obtenidos del caché`);
        return cached;
      }
    }
    
    const { data } = await api.get<CRMUser[]>(`${CRM_BASE_PATH}/users`, {
      params: { is_active: isActive },
    });
    
    // Guardar en caché (10 minutos TTL - usuarios cambian poco)
    if (useCache) {
      apiCache.set(cacheKey, data, 10 * 60 * 1000);
    }
    
    return data;
  },

  /**
   * Obtener usuarios que pueden ser asignados como responsables (lawyers y agents)
   * Endpoint optimizado que devuelve solo usuarios elegibles como responsables
   */
  async getResponsibleUsers(isActive: boolean = true, useCache: boolean = true): Promise<CRMUser[]> {
    const cacheKey = APICache.generateKey(`${CRM_BASE_PATH}/users/responsibles`, { is_active: isActive });
    
    // Intentar obtener del caché primero
    if (useCache) {
      const cached = apiCache.get<CRMUser[]>(cacheKey);
      if (cached) {
        console.log(`💾 [crmService] Usuarios responsables obtenidos del caché`);
        return cached;
      }
    }
    
    const { data } = await api.get<CRMUser[]>(`${CRM_BASE_PATH}/users/responsibles`, {
      params: { is_active: isActive },
    });
    
    // Guardar en caché (10 minutos TTL - usuarios cambian poco)
    if (useCache) {
      apiCache.set(cacheKey, data, 10 * 60 * 1000);
    }
    
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
    try {
      const { data } = await api.get<any>(`${CRM_BASE_PATH}/contacts/${contactId}/calls`, {
        params: filters,
      });
      
      // El backend puede devolver un array directo o un objeto con items
      let normalizedResponse: CallsListResponse;
      
      if (Array.isArray(data)) {
        // Backend devuelve array directo: convertir a estructura esperada
        normalizedResponse = {
          items: data,
          total: data.length,
          skip: filters?.skip || 0,
          limit: filters?.limit || 20,
        };
      } else if (data && typeof data === 'object' && 'items' in data) {
        // Backend devuelve objeto con items: usar tal cual
        normalizedResponse = {
          items: data.items || [],
          total: data.total ?? (data.items?.length || 0),
          skip: data.skip ?? (filters?.skip || 0),
          limit: data.limit ?? (filters?.limit || 20),
        };
      } else {
        // Respuesta inesperada: normalizar a estructura vacía
        console.warn('⚠️ [crmService] getContactCalls: respuesta inesperada, normalizando a vacío');
        normalizedResponse = {
          items: [],
          total: 0,
          skip: filters?.skip || 0,
          limit: filters?.limit || 20,
        };
      }
      
      return normalizedResponse;
    } catch (err: any) {
      console.error('❌ [crmService] getContactCalls error:', err);
      // Si es error 500, retornar lista vacía
      if (err?.response?.status === 500) {
        console.warn('⚠️ [crmService] Error 500 en /crm/contacts/{id}/calls - mostrando lista vacía.');
        return {
          items: [],
          total: 0,
          skip: filters?.skip || 0,
          limit: filters?.limit || 20,
        };
      }
      throw err;
    }
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
  /**
   * Obtener tareas para calendario
   * Endpoint específico que permite filtrar por rango de fechas
   * Retorna solo tareas con is_completed: false
   */
  async getCalendarTasks(filters: { start_date: string; end_date?: string; entity_type?: string; responsible_user_id?: string }): Promise<Task[]> {
    try {
      const { data } = await api.get<Task[]>(`${CRM_BASE_PATH}/tasks/calendar`, {
        params: filters,
      });
      // El endpoint retorna un array directo (List[TaskResponse])
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      // Solo manejar 404 (endpoint no existe aún) - retornar array vacío
      if (error.response?.status === 404) {
        console.warn('⚠️ [crmService] Endpoint /tasks/calendar no encontrado (404). El backend puede no estar actualizado.');
        return [];
      }
      // Para otros errores (500, network, etc.), re-lanzar el error
      // para que el código que llama pueda manejarlo apropiadamente
      console.error('❌ [crmService] Error en getCalendarTasks:', error);
      throw error;
    }
  },

  /**
   * Obtener llamadas para calendario
   * Endpoint específico que permite filtrar por rango de fechas sin requerir entity_id
   * El endpoint ahora incluye contact_id y contact_name directamente en la respuesta
   */
  async getCalendarCalls(filters: { start_date: string; end_date?: string }): Promise<Call[]> {
    try {
      const { data } = await api.get<Call[]>(`${CRM_BASE_PATH}/calls/calendar`, {
        params: filters,
      });
      // El endpoint retorna un array directo, no un objeto con items
      const calls = Array.isArray(data) ? data : [];
      
      // Log para debugging
      if (calls.length > 0) {
        const withContactName = calls.filter(c => c.contact_name).length;
        console.log(`📞 [crmService] getCalendarCalls: ${calls.length} llamadas cargadas, ${withContactName} con contact_name`);
      }
      
      return calls;
    } catch (error: any) {
      console.error('❌ [crmService] Error en getCalendarCalls:', error);
      // Si es un 404, el endpoint no existe aún - retornar array vacío
      if (error.response?.status === 404) {
        console.warn('⚠️ [crmService] Endpoint /calls/calendar no encontrado (404). El backend puede no estar actualizado.');
      }
      // Retornar array vacío en lugar de lanzar error
      return [];
    }
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
  ): Promise<{ contact: Contact; lead: Lead }> {
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
    new: Lead[];
    contacted: Lead[];
    proposal: Lead[];
    negotiation: Lead[];
    won: Lead[];
    lost: Lead[];
    all: Lead[];
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
      grading_llamada?: 'A' | 'B+' | 'B-' | 'C' | 'D';
      grading_situacion?: 'A' | 'B+' | 'B-' | 'C' | 'D';
    };
  }): Promise<{
    contact: Contact;
    lead: Lead;
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

  // ===== CUSTOM FIELDS =====

  /**
   * Obtener lista de campos personalizados
   */
  async getCustomFields(params?: {
    entity_type?: 'contacts' | 'leads' | 'companies';
    is_visible?: boolean;
  }): Promise<CustomField[]> {
    const queryParams = new URLSearchParams();
    if (params?.entity_type) {
      queryParams.append('entity_type', params.entity_type);
    }
    if (params?.is_visible !== undefined) {
      queryParams.append('is_visible', String(params.is_visible));
    }

    const { data } = await api.get<CustomField[]>(
      `${CRM_BASE_PATH}/custom-fields${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return data;
  },

  /**
   * Obtener un campo personalizado por ID
   */
  async getCustomField(id: string): Promise<CustomField> {
    const { data } = await api.get<CustomField>(`${CRM_BASE_PATH}/custom-fields/${id}`);
    return data;
  },

  /**
   * Crear un campo personalizado
   */
  async createCustomField(field: CustomFieldCreateRequest): Promise<CustomField> {
    const { data } = await api.post<CustomField>(
      `${CRM_BASE_PATH}/custom-fields`,
      field
    );
    return data;
  },

  /**
   * Actualizar un campo personalizado
   */
  async updateCustomField(id: string, updates: CustomFieldUpdateRequest): Promise<CustomField> {
    const { data } = await api.put<CustomField>(
      `${CRM_BASE_PATH}/custom-fields/${id}`,
      updates
    );
    return data;
  },

  /**
   * Eliminar un campo personalizado
   */
  async deleteCustomField(id: string): Promise<void> {
    await api.delete(`${CRM_BASE_PATH}/custom-fields/${id}`);
  },

  // ===== CUSTOM FIELD VALUES =====

  /**
   * Obtener valores de campos personalizados
   */
  async getCustomFieldValues(params?: {
    entity_id?: string;
    entity_type?: 'contacts' | 'leads' | 'companies';
    custom_field_id?: string;
  }): Promise<CustomFieldValue[]> {
    const queryParams = new URLSearchParams();
    if (params?.entity_id) {
      queryParams.append('entity_id', params.entity_id);
    }
    if (params?.entity_type) {
      queryParams.append('entity_type', params.entity_type);
    }
    if (params?.custom_field_id) {
      queryParams.append('custom_field_id', params.custom_field_id);
    }

    const { data } = await api.get<CustomFieldValue[]>(
      `${CRM_BASE_PATH}/custom-field-values${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return data;
  },

  /**
   * Crear o actualizar un valor de campo personalizado (upsert)
   */
  async upsertCustomFieldValue(value: CustomFieldValueCreateRequest): Promise<CustomFieldValue> {
    const { data } = await api.post<CustomFieldValue>(
      `${CRM_BASE_PATH}/custom-field-values`,
      value
    );
    return data;
  },

  /**
   * Actualizar un valor de campo personalizado
   */
  async updateCustomFieldValue(id: string, value: any): Promise<CustomFieldValue> {
    const { data } = await api.put<CustomFieldValue>(
      `${CRM_BASE_PATH}/custom-field-values/${id}`,
      { value }
    );
    return data;
  },

  /**
   * Eliminar un valor de campo personalizado
   */
  async deleteCustomFieldValue(id: string): Promise<void> {
    await api.delete(`${CRM_BASE_PATH}/custom-field-values/${id}`);
  },

  // ===== CALL TYPES =====

  /**
   * Obtener tipos de llamadas activos
   */
  async getCallTypes(): Promise<Array<{ id: string; name: string; code: string; description?: string }>> {
    try {
      const { data } = await api.get('/crm/call-types');
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      // Si es 404, el endpoint no existe aún - usar tipos por defecto silenciosamente
      if (error?.response?.status === 404) {
        console.log('ℹ️ [crmService] Endpoint /crm/call-types no disponible, usando tipos por defecto');
      } else {
        console.error('Error getting call types:', error);
      }
      // Fallback a tipos por defecto si falla
      return [
        { id: '1', name: 'Primera Llamada', code: 'primera_llamada' },
        { id: '2', name: 'Seguimiento', code: 'seguimiento' },
        { id: '3', name: 'Llamada de Venta', code: 'venta' },
      ];
    }
  },
};

export default crmService;

