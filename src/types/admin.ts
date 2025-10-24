// Types for Admin Panel

export type ClientGrade = 'A' | 'B' | 'C';

export interface CreateHiringRequest {
  user_id: string; // UUID del usuario
  catalog_item_id: string; // ID del servicio del catálogo
  amount: number; // Monto del pago
  currency: string; // Moneda (por defecto "EUR")
  grade: ClientGrade; // Grado del cliente ("A", "B", o "C")
  client_passport?: string; // Pasaporte del cliente
  client_nie?: string; // NIE del cliente
  client_address?: string; // Dirección del cliente
  client_city?: string; // Ciudad del cliente
}

export interface HiringCodeResponse {
  id: string; // payment-uuid
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
  grade: ClientGrade;
  client_passport?: string;
  client_nie?: string;
  client_address?: string;
  client_city?: string;
}

export const GRADE_PRICING = {
  A: 400,
  B: 400,
  C: 600,
} as const;

export const GRADE_DESCRIPTIONS = {
  A: 'Excelente - Alta probabilidad de éxito (400€)',
  B: 'Bueno - Probabilidad media de éxito (400€)',
  C: 'Complejo - Requiere estudio adicional (600€)',
} as const;

