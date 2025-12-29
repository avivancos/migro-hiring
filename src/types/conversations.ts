// Types for Conversations Module

export interface Conversation {
  id: string;
  user_id: string;
  user_recipient_id?: string | null;
  type: string;
  title?: string | null;
  status: 'open' | 'closed' | 'archived';
  last_message_at?: string | null;
  is_new: boolean;
  is_paid: boolean;
  unread_count: number;
  participants?: string | null;
  last_sender_role?: string | null;
  last_message_preview?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  user_id: string;
  conversation_id: string;
  content: string;
  sender: 'user' | 'lawyer' | 'system';
  is_file: boolean;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  file_url?: string | null;
  timestamp: string;
  is_read: boolean;
  agent_type?: string | null;
}

export interface ConversationCreate {
  user_recipient_id?: string;
  type: string;
  title?: string;
  participants?: string | null;
  initial_message?: string;
}

export interface ConversationUpdate {
  title?: string;
  status?: string;
  is_new?: boolean;
  is_paid?: boolean;
  unread_count?: number;
  participants?: string;
}

export interface ConversationMessageCreate {
  content: string;
  sender: 'user' | 'lawyer' | 'system';
  is_file?: boolean;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_url?: string;
}

export interface ConversationResponse extends Conversation {
  messages?: ConversationMessage[];
}

export interface ConversationAdminResponse {
  items: Array<Conversation & {
    user_email?: string;
    user_name?: string;
    message_count?: number;
    lawyer_id?: string;
    lawyer_name?: string;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export interface AssignLawyerRequest {
  lawyer_id: string;
}

export interface AssignLawyerResponse extends Conversation {}

export interface ConversationExportRequest {
  format: 'json' | 'csv' | 'pdf';
  include_metadata?: boolean;
}

export interface ConversationExportResponse {
  conversation: Conversation;
  messages: ConversationMessage[];
  metadata?: {
    exported_at: string;
    exported_by: string;
  };
}




















