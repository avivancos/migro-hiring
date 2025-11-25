// Types for Hiring Flow

export type ClientGrade = 'A' | 'B' | 'C' | 'T';

export interface HiringDetails {
  id: number;
  hiring_code: string;
  client_name: string; // Cambiado de user_name a client_name
  client_email: string; // Cambiado de user_email a client_email
  service_name: string;
  service_description: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'completed';
  kyc_status: null | 'pending' | 'verified' | 'failed';
  expires_at: string;
  short_url: string;
  // Additional fields for contract (mantenemos compatibilidad con ambos formatos)
  user_passport?: string;
  user_nie?: string;
  user_address?: string;
  user_city?: string;
  user_province?: string;
  user_postal_code?: string;
  // Nuevos campos con prefijo client_ (devueltos por el backend)
  client_passport?: string;
  client_nie?: string;
  client_nationality?: string; // Nacionalidad del cliente
  client_address?: string;
  client_city?: string;
  client_province?: string;
  client_postal_code?: string;
  contract_date?: string;
  contract_accepted?: boolean;
  contract_accepted_at?: string;
  // Grading (calificación del estudio de Migro)
  grade?: ClientGrade;
  // Pago manual (registrado por el admin)
  manual_payment_confirmed?: boolean;
  manual_payment_note?: string;
  manual_payment_method?: string;
  // Tipo de pago y suscripción
  payment_type?: 'one_time' | 'subscription';
  first_payment_amount?: number; // Monto del primer pago en centavos
  subscription_id?: string; // Solo para suscripciones
  subscription_status?: string; // Solo para suscripciones
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

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
  amount: number; // Monto del primer pago en centavos
  total_amount: number; // Monto total en centavos
  payment_type: 'first' | 'subscription';
  installments?: number; // Solo para suscripciones (número de pagos)
  currency: string;
}

