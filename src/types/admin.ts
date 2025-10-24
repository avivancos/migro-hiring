// Types for Admin Panel

export type ClientGrade = 'A' | 'B' | 'C';

export interface CreateHiringRequest {
  user_name: string; // Nombre completo del cliente
  user_email: string; // Email del cliente
  user_passport?: string; // Pasaporte del cliente
  user_nie?: string; // NIE del cliente
  user_address: string; // Dirección del cliente
  user_city: string; // Ciudad del cliente
  grade: ClientGrade; // Grado del cliente ("A", "B", o "C")
  service_name: string; // Nombre del servicio
  notes?: string; // Notas adicionales
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

