// usePiliChat - Hook para manejar el estado del chat con Pili

import { useState, useCallback, useRef } from 'react';
import { piliService } from '@/services/piliService';
import type { PiliChatRequest, PiliMessage, ParsedPiliResponse } from '@/types/pili';

// Función helper para obtener/generar un user_id único persistente
const getUserId = (): string => {
  const STORAGE_KEY = 'pili_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);
  
  if (!userId) {
    // Generar un ID único basado en timestamp y random
    userId = `pili-user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, userId);
  }
  
  return userId;
};

/**
 * Parsea la respuesta de Pili para extraer:
 * - Contenido principal (sin pregunta de seguimiento)
 * - Pregunta de seguimiento (si existe)
 * - Estado de truncado
 */
export function parsePiliResponse(response: string): ParsedPiliResponse {
  const result: ParsedPiliResponse = {
    content: response,
    isTruncated: false,
  };

  // Detectar si está truncada
  if (response.includes('[Respuesta truncada por longitud')) {
    result.isTruncated = true;
  }

  // Extraer pregunta de seguimiento
  // Busca el patrón: **¿Te gustaría que profundice en algún aspecto?** [pregunta]
  const followUpMatch = response.match(
    /\*\*¿Te gustaría que profundice en algún aspecto\?\*\*\s*(.+?)(?:\n|$)/i
  );
  
  if (followUpMatch) {
    result.followUpQuestion = followUpMatch[1].trim();
    // Remover pregunta de seguimiento del contenido principal
    result.content = response.replace(
      /\n\n\*\*¿Te gustaría que profundice en algún aspecto\?\*\*.*$/i,
      ''
    ).trim();
  }

  return result;
}

export type Message = PiliMessage;

interface UsePiliChatReturn {
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  retryLastMessage: () => Promise<void>;
  sendFollowUp: (question: string) => Promise<void>;
}

export function usePiliChat(initialConversationId?: string): UsePiliChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastMessageRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      const userMessage: Message = {
        id: `user_${Date.now()}`,
        content: message,
        sender: 'user',
        timestamp: new Date().toISOString(),
      };

      // Agregar mensaje del usuario inmediatamente
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
      lastMessageRef.current = message;

      // Crear mensaje de carga para Pili
      const loadingMessage: Message = {
        id: `pili_loading_${Date.now()}`,
        content: '',
        sender: 'pili',
        timestamp: new Date().toISOString(),
        isLoading: true,
      };
      setMessages((prev) => [...prev, loadingMessage]);

      try {
        const request: PiliChatRequest = {
          query: message,
          user_id: getUserId(),
          conversation_id: conversationId || undefined,
        };

        const response = await piliService.chat(request);

        // Actualizar conversation ID si es nuevo
        if (response.conversation_id && !conversationId) {
          setConversationId(response.conversation_id);
        }

        // Parsear respuesta para extraer pregunta de seguimiento y estado truncado
        const parsed = parsePiliResponse(response.response);

        // Reemplazar mensaje de carga con respuesta real
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== loadingMessage.id);
          return [
            ...filtered,
            {
              id: `pili_${Date.now()}`,
              content: parsed.content,
              sender: 'pili',
              timestamp: new Date().toISOString(),
              followUpQuestion: parsed.followUpQuestion,
              isTruncated: parsed.isTruncated,
            },
          ];
        });
      } catch (err: any) {
        // Manejar errores de forma más detallada
        const errorMessage = err.response?.data?.detail || 
                            err.message || 
                            'Error al enviar el mensaje';
        setError(errorMessage);
        // Remover mensaje de carga
        setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessage.id));
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    lastMessageRef.current = null;
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (lastMessageRef.current) {
      await sendMessage(lastMessageRef.current);
    }
  }, [sendMessage]);

  const sendFollowUp = useCallback(
    async (question: string) => {
      await sendMessage(question);
    },
    [sendMessage]
  );

  return {
    messages,
    conversationId,
    isLoading,
    error,
    sendMessage,
    clearChat,
    retryLastMessage,
    sendFollowUp,
  };
}






