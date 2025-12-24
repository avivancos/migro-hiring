// Pili Service - Chat IA
// Conecta al servicio externo de Pili

import axios from 'axios';
import { PILI_API_BASE_URL } from '@/config/constants';
import type {
  PiliChatRequest,
  PiliChatResponse,
  HealthResponse,
  PiliValidationError,
  PiliChatMessagesResponse,
} from '@/types/pili';

// Timeout de 60 segundos para las respuestas de Pili (pueden tardar)
const PILI_API_TIMEOUT = 60000;

// Instancia de axios para el servicio de Pili (sin interceptores de autenticación)
const piliApi = axios.create({
  baseURL: PILI_API_BASE_URL,
  timeout: PILI_API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const piliService = {
  /**
   * Enviar mensaje a Pili
   * @param request - Request con query, user_id y conversation_id opcional
   * @returns Response con respuesta de Pili y conversation_id
   */
  async chat(request: PiliChatRequest): Promise<PiliChatResponse> {
    try {
      // Validar que query sea un string
      if (typeof request.query !== 'string') {
        throw new Error('El campo "query" debe ser un string.');
      }

      // Validar query antes de enviar
      const queryTrimmed = request.query.trim();
      if (!queryTrimmed) {
        throw new Error('El campo "query" no puede estar vacío. Debe contener al menos un carácter.');
      }

      // Validar user_id antes de enviar
      if (typeof request.user_id !== 'string') {
        throw new Error('El campo "user_id" debe ser un string.');
      }

      const userIdTrimmed = request.user_id.trim();
      if (!userIdTrimmed) {
        throw new Error('El campo "user_id" no puede estar vacío.');
      }

      // Validar longitud de query
      if (queryTrimmed.length > 5000) {
        throw new Error('La pregunta es demasiado larga (máximo 5000 caracteres).');
      }

      const response = await piliApi.post<PiliChatResponse>(
        '/pili/chat',
        {
          query: queryTrimmed,
          user_id: userIdTrimmed,
          conversation_id: request.conversation_id || undefined,
        }
      );
      
      return response.data;
    } catch (error: unknown) {
      console.error('Error en piliService.chat:', error);

      // Manejar error 422 (Validation Error)
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const validationError = error.response.data as PiliValidationError;
        const errorMessages = validationError.errors
          ?.map(err => `${err.field}: ${err.message}`)
          .join('\n') || validationError.detail;
        
        throw new Error(`Error de validación:\n${errorMessages}`);
      }

      // Manejar otros errores de respuesta
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.detail || error.response.data?.message;
        throw new Error(errorMessage || 'Error al enviar mensaje a Pili');
      }

      // Manejar errores de conexión
      if (axios.isAxiosError(error) && error.request) {
        throw new Error('No se pudo conectar con el servicio de Pili. Verifica que el servicio esté disponible.');
      }

      // Re-lanzar errores de validación del cliente
      if (error instanceof Error) {
        throw error;
      }

      // Error desconocido
      throw new Error('Error desconocido al consultar a Pili');
    }
  },

  /**
   * Enviar mensaje a Pili y obtener mensajes múltiples (con progreso)
   * @param request - Request con query, user_id y conversation_id opcional
   * @returns Response con respuesta final, mensajes de progreso y conversation_id
   */
  async chatMessages(request: PiliChatRequest): Promise<PiliChatMessagesResponse> {
    try {
      // Validar que query sea un string
      if (typeof request.query !== 'string') {
        throw new Error('El campo "query" debe ser un string.');
      }

      // Validar query antes de enviar
      const queryTrimmed = request.query.trim();
      if (!queryTrimmed) {
        throw new Error('El campo "query" no puede estar vacío. Debe contener al menos un carácter.');
      }

      // Validar user_id antes de enviar
      if (typeof request.user_id !== 'string') {
        throw new Error('El campo "user_id" debe ser un string.');
      }

      const userIdTrimmed = request.user_id.trim();
      if (!userIdTrimmed) {
        throw new Error('El campo "user_id" no puede estar vacío.');
      }

      // Validar longitud de query
      if (queryTrimmed.length > 5000) {
        throw new Error('La pregunta es demasiado larga (máximo 5000 caracteres).');
      }

      const response = await piliApi.post<PiliChatMessagesResponse>(
        '/pili/chat/messages',
        {
          query: queryTrimmed,
          user_id: userIdTrimmed,
          conversation_id: request.conversation_id || undefined,
        }
      );
      
      return response.data;
    } catch (error: unknown) {
      console.error('Error en piliService.chatMessages:', error);

      // Manejar error 422 (Validation Error)
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const validationError = error.response.data as PiliValidationError;
        const errorMessages = validationError.errors
          ?.map(err => `${err.field}: ${err.message}`)
          .join('\n') || validationError.detail;
        
        throw new Error(`Error de validación:\n${errorMessages}`);
      }

      // Manejar otros errores de respuesta
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.detail || error.response.data?.message;
        throw new Error(errorMessage || 'Error al enviar mensaje a Pili');
      }

      // Manejar errores de conexión
      if (axios.isAxiosError(error) && error.request) {
        throw new Error('No se pudo conectar con el servicio de Pili. Verifica que el servicio esté disponible.');
      }

      // Re-lanzar errores de validación del cliente
      if (error instanceof Error) {
        throw error;
      }

      // Error desconocido
      throw new Error('Error desconocido al consultar a Pili');
    }
  },

  /**
   * Verificar estado del servicio
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await piliApi.get<HealthResponse>('/pili/health');
      return response.data;
    } catch (error: any) {
      console.error('Error en piliService.checkHealth:', error);
      // Retornar respuesta de error en lugar de lanzar excepción para que la UI pueda manejarlo
      return {
        status: 'unhealthy',
        service: 'pili',
        sdk_available: false,
        compendio_loaded: false,
        error: error.response?.data?.detail || error.message || 'Error al verificar el estado del servicio',
      };
    }
  },
};
