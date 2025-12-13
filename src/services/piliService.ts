// PiliService - Servicio para comunicación con el agente IA Pili

import { api } from './api';

export type PiliChatRequest = {
  message: string;
  conversation_id?: string;
  context?: Record<string, any>;
};

export type PiliChatResponse = {
  response: string;
  conversation_id: string;
};

export type PiliHealthResponse = {
  status: 'healthy' | 'unhealthy';
  service: string;
  sdk_available: boolean;
  compendio_loaded: boolean;
  error?: string;
};

class PiliService {
  /**
   * Envía un mensaje a Pili y recibe su respuesta
   * Endpoint de producción: /api/ai/pili-openai/chat
   */
  async chat(request: PiliChatRequest): Promise<PiliChatResponse> {
    try {
      const { data } = await api.post<PiliChatResponse>(
        '/ai/pili-openai/chat',
        request
      );
      return data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Error al comunicarse con Pili');
    }
  }

  /**
   * Verifica el estado del servicio de Pili
   * Endpoint de producción: /api/ai/pili-openai/health
   * Autenticación: No requerida
   */
  async healthCheck(): Promise<PiliHealthResponse> {
    try {
      const { data } = await api.get<PiliHealthResponse>(
        '/ai/pili-openai/health'
      );
      return data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Error al verificar el estado de Pili');
    }
  }

  /**
   * Inicializa el compendio de extranjería
   */
  async initializeCompendio(): Promise<{ status: string; message: string }> {
    try {
      const { data } = await api.post<{ status: string; message: string }>(
        '/ai/pili/initialize-compendio',
        {}
      );
      return data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Error al inicializar el compendio');
    }
  }
}

export const piliService = new PiliService();






