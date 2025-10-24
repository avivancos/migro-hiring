// Types for Admin Panel

export type ClientGrade = 'A' | 'B' | 'C';

export interface CreateHiringRequest {
  user_name: string;
  user_email: string;
  user_passport?: string;
  user_nie?: string;
  user_address?: string;
  user_city?: string;
  service_name: string;
  service_description: string;
  grade: ClientGrade;
  amount: number; // Se calcula automáticamente según el grade
  currency: string;
}

export interface HiringCodeResponse {
  hiring_code: string;
  short_url: string;
  expires_at: string;
  hiring_details: {
    id: number;
    user_name: string;
    user_email: string;
    service_name: string;
    amount: number;
    grade: ClientGrade;
  };
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

