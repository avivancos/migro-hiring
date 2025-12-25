// Case Analysis API Service - Cliente API para el módulo de Análisis de Casos

import { api } from './api';
import type {
  CaseAnalysisRequest,
  CaseAnalysisResponse,
} from '@/types/caseAnalysis';

const CRM_BASE_PATH = '/crm';
const CASES_BASE_PATH = '/cases';

export const caseAnalysisApi = {
  /**
   * Analizar oportunidad completa
   * POST /api/crm/opportunities/{opportunity_id}/analyze
   * 
   * Analiza una oportunidad completa con todos sus datos asociados
   * (contacto, llamadas, notas, historial, etc.)
   * 
   * @param opportunityId - ID de la oportunidad a analizar
   * @returns Análisis completo del caso
   */
  async analyzeOpportunity(opportunityId: string): Promise<CaseAnalysisResponse> {
    const { data } = await api.post<CaseAnalysisResponse>(
      `${CRM_BASE_PATH}/opportunities/${opportunityId}/analyze`,
      {} // No requiere body, todos los datos se obtienen de la oportunidad
    );
    return data;
  },

  /**
   * Analizar caso manual
   * POST /api/cases/analyze
   * 
   * Analiza un caso enviado directamente desde el frontend
   * 
   * @param request - Datos del caso a analizar
   * @returns Análisis completo del caso
   */
  async analyzeCase(request: CaseAnalysisRequest): Promise<CaseAnalysisResponse> {
    const { data } = await api.post<CaseAnalysisResponse>(
      `${CASES_BASE_PATH}/analyze`,
      request
    );
    return data;
  },
};

