// Admin Pili - Chat con IA
import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { piliService } from '@/services/piliService';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Send, Bot, User, Activity } from 'lucide-react';
import type { Message, HealthResponse } from '@/types/pili';
import { format } from 'date-fns';

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

export function AdminPili() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Obtener user_id único (persistente en localStorage)
  const userId = useMemo(() => getUserId(), []);

  useEffect(() => {
    checkHealth();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkHealth = async () => {
    try {
      const response = await piliService.checkHealth();
      setHealth(response);
    } catch (error) {
      console.error('Error verificando health:', error);
    }
  };

  const sendMessage = async () => {
    // Validar input antes de enviar
    if (!input.trim() || isLoading) {
      if (!input.trim()) {
        setError('Por favor, ingresa una pregunta');
      }
      return;
    }

    // Validar longitud
    if (input.length > 5000) {
      setError('La pregunta es demasiado larga (máximo 5000 caracteres)');
      return;
    }

    // Limpiar error anterior
    setError(null);

    const queryText = input.trim();
    const userMessage: Message = {
      role: 'user',
      content: queryText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await piliService.chat({
        query: queryText,
        user_id: userId,
        conversation_id: conversationId || undefined,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Guardar conversation_id si es la primera respuesta
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
      }
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      
      // Mostrar error de validación o error general
      const errorMessage = error.message || 'Error al procesar tu mensaje. Por favor intenta de nuevo.';
      setError(errorMessage);
      
      // También mostrar en el chat
      const errorChatMessage: Message = {
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Pili - Asistente IA</h2>
          <p className="text-gray-600 mt-1">Chat con el asistente legal de Migro</p>
        </div>
        {health && (
          <StatusBadge
            status={health.status}
            variant={health.status === 'healthy' ? 'success' : 'error'}
            showDot
          />
        )}
      </div>

      {/* Health Status */}
      {health && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Activity className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Estado: {health.status === 'healthy' ? 'Operativo' : 'No disponible'}
                </p>
                <p className="text-xs text-gray-500">
                  SDK: {health.sdk_available ? 'Disponible' : 'No disponible'} | 
                  Compendio: {health.compendio_loaded ? 'Cargado' : 'No cargado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat */}
      <Card className="flex flex-col" style={{ height: '600px' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Conversación
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Inicia una conversación con Pili</p>
                <p className="text-sm mt-2">Pregunta sobre trámites de migración y extranjería</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.timestamp && (
                      <p
                        className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-green-100' : 'text-gray-500'
                        }`}
                      >
                        {format(new Date(message.timestamp), 'HH:mm')}
                      </p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-green-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Limpiar error al escribir
                if (error) setError(null);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Escribe tu pregunta..."
              disabled={isLoading || !health || health.status !== 'healthy'}
              className="flex-1"
              maxLength={5000}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !health || health.status !== 'healthy'}
              className="flex items-center gap-2"
            >
              {isLoading ? 'Enviando...' : <Send size={18} />}
            </Button>
          </div>
          
          {/* Character count */}
          {input.length > 4500 && (
            <p className="text-xs text-amber-600 mt-1">
              {input.length}/5000 caracteres
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

