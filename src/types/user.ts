// User types

export type UserRole = 'admin' | 'lawyer' | 'agent' | 'user';

export interface User {
  id: string; // UUID
  email: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  photo_avatar_url?: string | null;
  bio?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  nationality?: string | null;
  birth_date?: string | null;
  passport_number?: string | null;
  profession?: string | null;
  preferred_language?: string | null;
  preferredLanguage?: string | null;
  communication_preferences?: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean; // computed: role === "admin"
  role: UserRole;
  fcm_registered: boolean;
  is_lawyer?: boolean | null;
  lawyer_title?: string | null;
  lawyer_specialty?: string | null;
  zadarma_extension?: string | null;
  daily_lead_quota?: number | null;
  last_login?: string | null; // ISO 8601 datetime
  email_verified_at?: string | null; // ISO 8601 datetime
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
  firebase_uid?: string | null;
  google_id?: string | null;
  facebook_id?: string | null;
  apple_id?: string | null;
}

export interface UserCreate {
  email: string;
  full_name?: string | null;
  password?: string; // min: 8, max: 72 (opcional para OAuth)
  phone_number?: string | null;
  avatar_url?: string | null;
  photo_avatar_url?: string | null;
  bio?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
  role?: UserRole;
  firebase_uid?: string | null;
  google_id?: string | null;
  facebook_id?: string | null;
  apple_id?: string | null;
}

export interface UserUpdate {
  email?: string | null;
  full_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  photo_avatar_url?: string | null;
  bio?: string | null;
  is_active?: boolean | null;
  is_verified?: boolean | null;
  role?: UserRole | null;
}

export interface UserAdminRoleUpdate {
  role: UserRole;
}

export interface UserAdminStatusUpdate {
  is_active: boolean;
}

export interface UserExportResponse {
  users: User[];
  total: number;
  exported_at: string; // ISO 8601 datetime
  filters?: {
    role?: string | null;
    is_active?: boolean | null;
    is_verified?: boolean | null;
    from_date?: string | null;
    to_date?: string | null;
    q?: string | null;
  } | null;
}

export interface AuditLogEntry {
  id: string; // UUID
  actor_id: string; // UUID
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id?: string | null; // UUID
  details?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string; // ISO 8601 datetime
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  skip: number;
  limit: number;
}

export interface ImpersonateResponse {
  access_token: string;
  token_type: string; // "bearer"
  expires_in: number; // segundos
  impersonated_user_id: string; // UUID
  original_user_id: string; // UUID
}

export interface MessageResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

