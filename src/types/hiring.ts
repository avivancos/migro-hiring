// Types for Hiring Flow

export type ClientGrade = 'A' | 'B' | 'C';

export interface HiringDetails {
  id: number;
  hiring_code: string;
  user_name: string;
  user_email: string;
  service_name: string;
  service_description: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'completed';
  kyc_status: null | 'pending' | 'verified' | 'failed';
  expires_at: string;
  short_url: string;
  // Additional fields for contract
  user_passport?: string;
  user_nie?: string;
  user_address?: string;
  user_city?: string;
  contract_date?: string;
  contract_accepted?: boolean;
  contract_accepted_at?: string;
  // Grading (calificación del estudio de Migro)
  grade?: ClientGrade;
}

export interface ConfirmDataRequest {
  confirmed: boolean;
  ip_address?: string;
  user_agent?: string;
}

export interface KYCSession {
  session_id: string;
  client_secret: string;
  url: string;
  status: string;
}

export interface PaymentIntent {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

export interface ContractResponse {
  status: string;
  contract_pdf_url: string;
  message: string;
}

