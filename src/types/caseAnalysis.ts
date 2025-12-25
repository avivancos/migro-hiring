// Case Analysis Types - Para el módulo de Análisis de Casos Migratorios

/**
 * CaseAnalysisRequest - Request para analizar un caso manual
 */
export interface CaseAnalysisRequest {
  // Información básica del caso
  name?: string;
  nationality?: string;
  time_in_spain?: number; // Años en España
  current_status?: string; // Estado migratorio actual
  has_work_permit?: boolean;
  has_residence_permit?: boolean;
  family_situation?: string;
  education_level?: string;
  work_experience?: string;
  language_level?: string;
  income_level?: string;
  notes?: string;
  
  // Información adicional opcional
  contact_id?: string; // UUID del contacto relacionado
  opportunity_id?: string; // UUID de la oportunidad relacionada
}

/**
 * SalesFeasibility - Análisis de viabilidad de venta
 */
export interface SalesFeasibility {
  can_sell: boolean;
  confidence: number; // 0.0-1.0
  reasons: string[];
  recommended_service?: string;
  estimated_price_range?: {
    min: number;
    max: number;
  };
}

/**
 * HumanAnalysisIssues - Fallos humanos detectados
 */
export interface HumanAnalysisIssues {
  issues: string[];
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
}

/**
 * PiliLimitedAnalysis - Análisis limitado de Pili
 */
export interface PiliLimitedAnalysis {
  success: boolean;
  analysis: string; // Markdown
  length: number;
  processing_time: number;
}

/**
 * PiliUnlimitedAnalysis - Análisis completo de Pili
 */
export interface PiliUnlimitedAnalysis {
  success: boolean;
  analysis: string; // Markdown
  length: number;
  processing_time: number;
}

/**
 * PiliComparison - Comparación entre análisis limitado y completo
 */
export interface PiliComparison {
  winner: 'limited' | 'unlimited' | 'tie';
  recommendation: string;
  limited_length: number;
  unlimited_length: number;
}

/**
 * PiliAnalysis - Análisis completo de Pili
 */
export interface PiliAnalysis {
  available: boolean;
  limited_analysis?: PiliLimitedAnalysis;
  unlimited_analysis?: PiliUnlimitedAnalysis;
  comparison?: PiliComparison;
  recommended_analysis?: string; // Análisis del ganador
  processing_time?: number;
  error?: string;
}

/**
 * CaseAnalysisResponse - Respuesta completa del análisis
 */
export interface CaseAnalysisResponse {
  // Calificaciones principales
  score: number; // 1-10
  grading: 'A' | 'B+' | 'B-' | 'C';
  
  // Análisis de venta
  sales_feasibility: SalesFeasibility;
  
  // Fallos humanos detectados
  human_analysis_issues: HumanAnalysisIssues;
  
  // Resumen
  analysis_summary: string;
  
  // Análisis de Pili (opcional)
  pili_analysis?: PiliAnalysis;
  
  // Payload para Pili (datos completos del caso)
  pili_payload?: Record<string, any>;
  
  // Metadatos
  analyzed_at: string; // ISO 8601
  analysis_version: string;
}

/**
 * AnalysisState - Estados del análisis
 */
export const AnalysisState = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  PARTIAL: 'partial', // Pili no disponible pero análisis básico sí
} as const;

export type AnalysisState = typeof AnalysisState[keyof typeof AnalysisState];

