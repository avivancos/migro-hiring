// Types for Contracts Module

export type ContractStatus = 'pending' | 'paid' | 'completed' | 'expired' | 'cancelled';
export type KYCStatus = null | 'pending' | 'verified' | 'failed';
export type ClientGrade = 'A' | 'B' | 'C' | 'T';
export type PaymentType = 'one_time' | 'subscription';

export interface Contract {
  id: string;
  hiring_code: string;
  client_name: string;
  client_email: string;
  service_name: string;
  service_description?: string;
  amount: number;
  currency: string;
  status: ContractStatus;
  kyc_status: KYCStatus;
  grade?: ClientGrade;
  payment_type?: PaymentType;
  expires_at: string;
  created_at: string;
  updated_at: string;
  short_url: string;
  // Datos del cliente
  client_passport?: string;
  client_nie?: string;
  client_nationality?: string;
  client_address?: string;
  client_city?: string;
  client_province?: string;
  client_postal_code?: string;
  // Contrato
  contract_date?: string;
  contract_accepted?: boolean;
  contract_accepted_at?: string;
  contract_pdf_url?: string;
  // Pago
  manual_payment_confirmed?: boolean;
  manual_payment_note?: string;
  manual_payment_method?: string;
  payment_intent_id?: string;
  subscription_id?: string;
  subscription_status?: string;
  first_payment_amount?: number;
  // Metadata
  notes?: string;
  created_by?: string;
}

export interface ContractListResponse {
  items: Contract[];
  total: number;
  skip: number;
  limit: number;
}

export interface ContractFilters {
  status?: ContractStatus | 'all';
  kyc_status?: KYCStatus | 'all';
  grade?: ClientGrade | 'all';
  payment_type?: PaymentType | 'all';
  search?: string;
  from_date?: string;
  to_date?: string;
  skip?: number;
  limit?: number;
}

export interface ContractCreateRequest {
  contract_template: string;
  service_name: string;
  service_description?: string;
  amount?: number;
  currency?: string;
  grade: ClientGrade;
  payment_type?: PaymentType;
  expires_in_days?: number;
  notes?: string;
  client_name: string;
  client_email: string;
  client_passport?: string;
  client_nie?: string;
  client_address?: string;
  client_city?: string;
  client_province?: string;
  client_postal_code?: string;
}

export interface ContractUpdateRequest {
  service_name?: string;
  service_description?: string;
  amount?: number;
  currency?: string;
  grade?: ClientGrade;
  payment_type?: PaymentType;
  expires_in_days?: number;
  notes?: string;
  client_name?: string;
  client_email?: string;
  client_passport?: string;
  client_nie?: string;
  client_address?: string;
  client_city?: string;
  client_province?: string;
  client_postal_code?: string;
  status?: ContractStatus;
  manual_payment_confirmed?: boolean;
  manual_payment_note?: string;
  manual_payment_method?: string;
}

export const CONTRACT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
} as const;

export const KYC_STATUS_COLORS = {
  null: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
} as const;

export const GRADE_COLORS = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-orange-100 text-orange-800',
  T: 'bg-purple-100 text-purple-800',
} as const;



