// Conversations Service - Gestión de conversaciones
import { api } from './api';
import type {
  Conversation,
  ConversationResponse,
  ConversationCreate,
  ConversationUpdate,
  ConversationMessage,
  ConversationMessageCreate,
  ConversationAdminResponse,
  AssignLawyerRequest,
  AssignLawyerResponse,
  ConversationExportRequest,
  ConversationExportResponse,
  MessageResponse,
} from '@/types/conversations';

export const conversationsService = {
  /**
   * Listar conversaciones del usuario actual
   */
  async getConversations(params?: {
    skip?: number;
    limit?: number;
    include_as_lawyer?: boolean;
  }): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>('/conversations/', { params });
    return data;
  },

  /**
   * Obtener conversación por ID
   */
  async getConversation(conversationId: string): Promise<ConversationResponse> {
    const { data } = await api.get<ConversationResponse>(`/conversations/${conversationId}`);
    return data;
  },

  /**
   * Crear nueva conversación
   */
  async createConversation(request: ConversationCreate): Promise<ConversationResponse> {
    const { data } = await api.post<ConversationResponse>('/conversations/', request);
    return data;
  },

  /**
   * Actualizar conversación
   */
  async updateConversation(
    conversationId: string,
    request: ConversationUpdate
  ): Promise<ConversationResponse> {
    const { data } = await api.put<ConversationResponse>(
      `/conversations/${conversationId}`,
      request
    );
    return data;
  },

  /**
   * Agregar mensaje a conversación
   */
  async addMessage(
    conversationId: string,
    request: ConversationMessageCreate
  ): Promise<MessageResponse> {
    const { data } = await api.post<MessageResponse>(
      `/conversations/${conversationId}/messages`,
      request
    );
    return data;
  },

  /**
   * Marcar conversación como leída
   */
  async markAsRead(conversationId: string): Promise<MessageResponse> {
    const { data } = await api.post<MessageResponse>(`/conversations/${conversationId}/read`);
    return data;
  },

  /**
   * Eliminar conversación
   */
  async deleteConversation(conversationId: string): Promise<MessageResponse> {
    const { data } = await api.delete<MessageResponse>(`/conversations/${conversationId}`);
    return data;
  },

  // ===== ADMIN ENDPOINTS =====

  /**
   * Obtener todas las conversaciones (admin)
   */
  async getAllConversations(params?: {
    user_id?: string;
    lawyer_id?: string;
    from?: string;
    from_date?: string;
    to?: string;
    to_date?: string;
    q?: string;
    has_lawyer?: boolean;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<ConversationAdminResponse> {
    const { data } = await api.get<ConversationAdminResponse>('/conversations/admin/all', {
      params,
    });
    return data;
  },

  /**
   * Obtener mensajes de conversación (admin)
   */
  async getConversationMessages(
    conversationId: string,
    params?: {
      skip?: number;
      limit?: number;
    }
  ): Promise<{ items: ConversationMessage[]; total: number }> {
    const { data } = await api.get(`/conversations/${conversationId}/messages`, { params });
    return data;
  },

  /**
   * Eliminar mensaje (admin)
   */
  async deleteMessage(
    conversationId: string,
    messageId: string,
    reason?: string
  ): Promise<MessageResponse> {
    const { data } = await api.delete<MessageResponse>(
      `/conversations/${conversationId}/messages/${messageId}`,
      { params: { reason } }
    );
    return data;
  },

  /**
   * Exportar conversación (admin)
   */
  async exportConversation(
    conversationId: string,
    request: ConversationExportRequest
  ): Promise<ConversationExportResponse | Blob> {
    if (request.format === 'csv' || request.format === 'pdf') {
      const response = await api.get(`/conversations/${conversationId}/export`, {
        params: request,
        responseType: 'blob',
      });
      return response.data;
    } else {
      const { data } = await api.post<ConversationExportResponse>(
        `/conversations/${conversationId}/export`,
        request
      );
      return data;
    }
  },

  /**
   * Asignar abogado a conversación (admin)
   */
  async assignLawyer(
    conversationId: string,
    request: AssignLawyerRequest
  ): Promise<AssignLawyerResponse> {
    const { data } = await api.patch<AssignLawyerResponse>(
      `/conversations/${conversationId}/assign-lawyer`,
      request
    );
    return data;
  },
};



