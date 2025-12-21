// Pili Service - Chat IA
// ⚠️ DESHABILITADO: Pili LLM ha sido movido a un repositorio externo
// Este servicio está deshabilitado y retorna errores apropiados

import type {
  PiliChatRequest,
  PiliChatResponse,
  HealthResponse,
} from '@/types/pili';

export const piliService = {
  /**
   * Enviar mensaje a Pili
   * ⚠️ DESHABILITADO: Retorna error indicando que el servicio no está disponible
   */
  async chat(request: PiliChatRequest): Promise<PiliChatResponse> {
    throw new Error('Pili AI service is now managed in an external repository and is not available');
  },

  /**
   * Verificar estado del servicio
   * ⚠️ DESHABILITADO: Retorna error indicando que el servicio no está disponible
   */
  async checkHealth(): Promise<HealthResponse> {
    throw new Error('Pili AI service is now managed in an external repository and is not available');
  },
};
