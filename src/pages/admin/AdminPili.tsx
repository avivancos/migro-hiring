// Admin Pili - Chat con IA
import { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { piliService } from '@/services/piliService';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Send, Bot, User, Lightbulb, AlertTriangle } from 'lucide-react';
// Importación segura de Activity para evitar error en producción
import * as LucideIcons from 'lucide-react';
const { Activity } = LucideIcons;
import type { Message, HealthResponse } from '@/types/pili';
import { format } from 'date-fns';
import { parsePiliResponse } from '@/hooks/usePiliChat';

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

  const sendMessage = async (messageText?: string) => {
    const queryText = messageText || input.trim();
    
    // Validar input antes de enviar
    if (!queryText || isLoading) {
      if (!queryText) {
        setError('Por favor, ingresa una pregunta');
      }
      return;
    }

    // Validar longitud
    if (queryText.length > 5000) {
      setError('La pregunta es demasiado larga (máximo 5000 caracteres)');
      return;
    }

    // Limpiar error anterior
    setError(null);
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
      // Usar el endpoint de mensajes múltiples
      const response = await piliService.chatMessages({
        query: queryText,
        user_id: userId,
        conversation_id: conversationId || undefined,
      });

      // Guardar conversation_id si es la primera respuesta
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      // Si hay mensajes de progreso, mostrarlos uno por uno con animación
      if (response.messages && response.messages.length > 0) {
        for (const msg of response.messages) {
          // Omitir el mensaje 'response' aquí, lo mostraremos al final
          if (msg.type === 'response') continue;

          // Agregar mensaje de progreso
          const progressMessage: Message = {
            role: 'assistant',
            content: msg.content,
            timestamp: msg.timestamp,
            type: msg.type,
            metadata: msg.metadata,
          };
          setMessages((prev) => [...prev, progressMessage]);

          // Pequeño delay para animación (más rápido para mensajes de progreso)
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // Ocultar mensajes de progreso después de un pequeño delay
        setTimeout(() => {
          setMessages((prev) =>
            prev.filter(
              (msg) =>
                msg.type !== 'thinking' &&
                msg.type !== 'searching' &&
                msg.type !== 'processing' &&
                msg.type !== 'complete'
            )
          );
        }, 1000);
      }

      // Mostrar respuesta final (parseada)
      const parsed = parsePiliResponse(response.response);
      const assistantMessage: Message = {
        role: 'assistant',
        content: parsed.content,
        timestamp: new Date().toISOString(),
        followUpQuestion: parsed.followUpQuestion,
        isTruncated: parsed.isTruncated,
        type: 'pili',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      
      // Limpiar mensajes de progreso en caso de error
      setMessages((prev) =>
        prev.filter(
          (msg) =>
            msg.type !== 'thinking' &&
            msg.type !== 'searching' &&
            msg.type !== 'processing' &&
            msg.type !== 'complete'
        )
      );

      // Mostrar error de validación o error general
      const errorMessage = error.message || 'Error al procesar tu mensaje. Por favor intenta de nuevo.';
      setError(errorMessage);
      
      // También mostrar en el chat
      const errorChatMessage: Message = {
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
        type: 'error',
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
              messages.map((message, index) => {
                // Mensajes de progreso (thinking, searching, processing)
                if (
                  message.type &&
                  ['thinking', 'searching', 'processing'].includes(message.type)
                ) {
                  return (
                    <div
                      key={index}
                      className="flex gap-3 justify-start animate-slideIn"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <div
                          className={`h-3 w-3 rounded-full animate-spin ${
                            message.type === 'searching'
                              ? 'border-2 border-yellow-400 border-t-transparent'
                              : message.type === 'processing'
                              ? 'border-2 border-blue-400 border-t-transparent'
                              : 'border-2 border-gray-400 border-t-transparent'
                          }`}
                        />
                      </div>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 border-l-4 flex items-center gap-2 ${
                          message.type === 'searching'
                            ? 'bg-amber-50 border-amber-400 text-amber-800'
                            : message.type === 'processing'
                            ? 'bg-blue-50 border-blue-400 text-blue-800'
                            : 'bg-gray-50 border-gray-400 text-gray-800'
                        }`}
                      >
                        <p className="text-sm italic">{message.content}</p>
                      </div>
                    </div>
                  );
                }

                // Mensajes de error
                if (message.type === 'error') {
                  return (
                    <div
                      key={index}
                      className="flex gap-3 justify-start animate-slideIn"
                    >
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="max-w-[80%] rounded-lg p-3 bg-red-50 border-l-4 border-red-400 text-red-800">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  );
                }

                // Mensajes normales (user y assistant)
                return (
                  <div
                    key={index}
                    className={`flex gap-3 animate-slideIn ${
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
                    <div className="pili-markdown text-sm">
                      <ReactMarkdown
                        components={{
                          // Estilos personalizados para elementos Markdown
                          h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 text-gray-900">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2 text-gray-900">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-gray-900">{children}</h3>,
                          p: ({ children }) => <p className="mb-2 leading-relaxed text-gray-800">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-gray-800">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-800">{children}</ol>,
                          li: ({ children }) => <li className="ml-2">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => (
                            <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono text-gray-900">{children}</code>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-gray-400 pl-3 italic my-2 text-gray-700">{children}</blockquote>
                          ),
                          a: ({ href, children }) => (
                            <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {typeof message.content === 'string' ? message.content : String(message.content || '')}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Nota de truncado */}
                    {message.isTruncated && (
                      <div className="mt-2 p-2 bg-amber-50 border-l-3 border-amber-400 rounded text-xs text-amber-800 flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>Respuesta truncada. Puedes pedir que continúe.</span>
                      </div>
                    )}
                    
                    {/* Pregunta de seguimiento */}
                    {message.followUpQuestion && (
                      <div className="mt-3 p-3 bg-blue-50 border-l-3 border-blue-400 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-700">
                            ¿Te gustaría que profundice?
                          </span>
                        </div>
                        <button
                          onClick={() => sendMessage(message.followUpQuestion!)}
                          disabled={isLoading}
                          className="w-full text-left text-sm text-blue-700 hover:text-blue-900 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {message.followUpQuestion}
                        </button>
                      </div>
                    )}
                    
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
                );
              })
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
              onClick={() => sendMessage()}
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

