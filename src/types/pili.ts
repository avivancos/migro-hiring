// Types for Pili (AI Chat) Module

export interface PiliChatRequest {
  message: string;
  conversation_id?: string | null;
  context?: {
    conversation_history?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
    [key: string]: any;
  } | null;
}

export interface PiliChatResponse {
  response: string;
  conversation_id: string;
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
}













