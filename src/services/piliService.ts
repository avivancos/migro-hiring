// Pili Service - Chat IA
import { api } from './api';
import type {
  PiliChatRequest,
  PiliChatResponse,
  HealthResponse,
} from '@/types/pili';

export const piliService = {
  /**
   * Enviar mensaje a Pili
   */
  async chat(request: PiliChatRequest): Promise<PiliChatResponse> {
    const { data } = await api.post<PiliChatResponse>('/ai/pili-openai/chat', request);
    return data;
  },

  /**
   * Verificar estado del servicio
   */
  async checkHealth(): Promise<HealthResponse> {
    const { data } = await api.get<HealthResponse>('/ai/pili-openai/health');
    return data;
  },
};
