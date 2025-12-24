// Types for Pili (AI Chat) Module

export interface PiliChatRequest {
  query: string;
  user_id: string;
  conversation_id?: string | null;
}

export interface PiliChatResponse {
  response: string;
  conversation_id: string;
}

export interface PiliValidationError {
  detail: string;
  errors: Array<{
    field: string;
    message: string;
    type: string;
  }>;
  help: {
    required_fields: string[];
    optional_fields: string[];
    example: {
      query: string;
      user_id: string;
      conversation_id?: string;
    };
  };
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  sdk_available: boolean;
  compendio_loaded?: boolean;
  error?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  followUpQuestion?: string;
  isTruncated?: boolean;
  type?: MessageType;
  metadata?: Record<string, any>;
}

export type MessageType = 
  | 'user' 
  | 'pili' 
  | 'thinking' 
  | 'searching' 
  | 'processing' 
  | 'response' 
  | 'complete' 
  | 'error';

export interface MessageChunk {
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface PiliChatMessagesResponse {
  response: string;
  conversation_id: string;
  messages?: MessageChunk[];
  is_complete?: boolean;
}

// Interfaz para mensajes del hook usePiliChat
export interface PiliMessage {
  id: string;
  content: string;
  sender: 'user' | 'pili';
  timestamp: string;
  isLoading?: boolean;
  followUpQuestion?: string;
  isTruncated?: boolean;
}

// Interfaz para respuesta parseada
export interface ParsedPiliResponse {
  content: string;
  followUpQuestion?: string;
  isTruncated: boolean;
}













