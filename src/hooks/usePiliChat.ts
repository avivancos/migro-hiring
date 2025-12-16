// usePiliChat - Hook para manejar el estado del chat con Pili

import { useState, useCallback, useRef } from 'react';
import { piliService } from '@/services/piliService';
import type { PiliChatRequest } from '@/types/pili';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'pili';
  timestamp: string;
  isLoading?: boolean;
}

interface UsePiliChatReturn {
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, context?: Record<string, any>) => Promise<void>;
  clearChat: () => void;
  retryLastMessage: () => Promise<void>;
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
    async (message: string, context?: Record<string, any>) => {
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
          message,
          conversation_id: conversationId || undefined,
          context,
        };

        const response = await piliService.chat(request);

        // Actualizar conversation ID si es nuevo
        if (response.conversation_id && !conversationId) {
          setConversationId(response.conversation_id);
        }

        // Reemplazar mensaje de carga con respuesta real
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== loadingMessage.id);
          return [
            ...filtered,
            {
              id: `pili_${Date.now()}`,
              content: response.response,
              sender: 'pili',
              timestamp: new Date().toISOString(),
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

  return {
    messages,
    conversationId,
    isLoading,
    error,
    sendMessage,
    clearChat,
    retryLastMessage,
  };
}






