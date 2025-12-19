// Types for Audit Logs Module

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  skip: number;
  limit: number;
}

export interface AuditLogFilters {
  user_id?: string;
  from_date?: string;
  to_date?: string;
  q?: string;
  skip?: number;
  limit?: number;
}









