// PiliChat - Componente para el chat con Pili

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { usePiliChat } from '@/hooks/usePiliChat';
import { Send, Loader2, AlertCircle, RefreshCw, Lightbulb, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PiliChatProps {
  initialConversationId?: string;
  className?: string;
}

export function PiliChat({ initialConversationId, className }: PiliChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    retryLastMessage,
    sendFollowUp,
  } = usePiliChat(initialConversationId);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            P
          </div>
          <div>
            <h2 className="font-semibold text-lg">Pili - Asistente Legal</h2>
            <p className="text-sm text-gray-500">Especialista en migración</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Limpiar chat
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg font-medium">¡Hola! Soy Pili 👋</p>
            <p className="text-sm mt-2">
              Puedo ayudarte con preguntas sobre migración, expedientes y más.
            </p>
            <p className="text-xs mt-4 text-gray-400">
              Prueba preguntando: "¿Qué documentos necesito para el NIE?"
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow-sm'
              }`}
            >
              {message.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Pili está pensando...</span>
                </div>
              ) : (
                <>
                  <div className="pili-markdown">
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
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-gray-900">{children}</code>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-gray-300 pl-3 italic my-2 text-gray-700">{children}</blockquote>
                        ),
                        a: ({ href, children }) => (
                          <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {message.content}
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
                        onClick={() => sendFollowUp(message.followUpQuestion!)}
                        disabled={isLoading}
                        className="w-full text-left text-sm text-blue-700 hover:text-blue-900 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {message.followUpQuestion}
                      </button>
                    </div>
                  )}
                  
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-400'
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button
            onClick={retryLastMessage}
            className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Reintentar
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}






