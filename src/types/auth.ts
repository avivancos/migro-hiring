// Types for Auth Module

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserRegister {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  accept_terms: boolean;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
}

export interface OAuthTokenResponse extends TokenPair {
  user: User;
}

export interface OAuthLoginRequest {
  provider: 'google' | 'facebook' | 'apple';
  code?: string | null;
  id_token?: string | null;
  access_token?: string | null;
}

export interface GoogleLoginRequest {
  code?: string | null;
  id_token?: string | null;
}

export interface AppleLoginRequest {
  code?: string | null;
  id_token?: string | null;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface TokenPayload {
  sub: string; // User ID
  type: 'access' | 'refresh';
  iat?: string | null;
  exp?: string | null;
}

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  photo_avatar_url?: string | null;
  bio?: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  role: UserRole;
  fcm_registered: boolean;
  last_login?: string | null;
  email_verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'lawyer' | 'agent' | 'user' | 'superuser';

export interface UserWithTokenResponse {
  user: User;
  tokens: TokenPair;
}

export interface MessageResponse {
  message: string;
}
















