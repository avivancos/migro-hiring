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
}













