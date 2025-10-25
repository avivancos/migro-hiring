// Types for Admin Panel

export type ClientGrade = 'A' | 'B' | 'C';

export interface CreateHiringRequest {
  contract_template: string; // Template del contrato (requerido)
  service_name: string; // Nombre del servicio
  service_description?: string; // Descripción del servicio
  amount?: number; // Monto en centavos
  currency?: string; // Moneda
  grade: ClientGrade; // Grado del cliente ("A", "B", o "C")
  expires_in_days?: number; // Días de expiración
  notes?: string; // Notas adicionales
  // Datos del usuario (información de contacto principal)
  user_name: string; // Nombre completo del usuario (requerido)
  user_email: string; // Email del usuario (requerido)
  // Datos del cliente (información adicional del documento)
  client_passport?: string; // Pasaporte del cliente
  client_nie?: string; // NIE del cliente
  client_address?: string; // Dirección del cliente
  client_city?: string; // Ciudad del cliente
  client_province?: string; // Provincia del cliente
  client_postal_code?: string; // Código postal del cliente
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

