// Hook para gestionar análisis de casos

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { caseAnalysisApi } from '@/services/caseAnalysisApi';
import type {
  CaseAnalysisRequest,
} from '@/types/caseAnalysis';
import { AnalysisState } from '@/types/caseAnalysis';

/**
 * Hook para analizar una oportunidad
 * 
 * @param opportunityId - ID de la oportunidad a analizar
 * @param enabled - Si debe ejecutarse automáticamente (default: false)
 */
export function useOpportunityAnalysis(
  opportunityId: string | undefined,
  enabled: boolean = false
) {

  const {
    data: analysis,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['opportunity-analysis', opportunityId],
    queryFn: () => caseAnalysisApi.analyzeOpportunity(opportunityId!),
    enabled: !!opportunityId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });

  // Determinar estado del análisis
  const state: AnalysisState = isLoading
    ? AnalysisState.LOADING
    : error
    ? AnalysisState.ERROR
    : analysis && !analysis.pili_analysis?.available
    ? AnalysisState.PARTIAL
    : analysis
    ? AnalysisState.SUCCESS
    : AnalysisState.IDLE;

  return {
    analysis,
    isLoading,
    error,
    state,
    refetch,
  };
}

/**
 * Hook para analizar un caso manual
 * 
 * @param request - Datos del caso a analizar
 * @param enabled - Si debe ejecutarse automáticamente (default: false)
 */
export function useCaseAnalysis(
  request: CaseAnalysisRequest | undefined,
  enabled: boolean = false
) {

  const {
    data: analysis,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['case-analysis', request],
    queryFn: () => caseAnalysisApi.analyzeCase(request!),
    enabled: !!request && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });

  // Determinar estado del análisis
  const state: AnalysisState = isLoading
    ? AnalysisState.LOADING
    : error
    ? AnalysisState.ERROR
    : analysis && !analysis.pili_analysis?.available
    ? AnalysisState.PARTIAL
    : analysis
    ? AnalysisState.SUCCESS
    : AnalysisState.IDLE;

  return {
    analysis,
    isLoading,
    error,
    state,
    refetch,
  };
}

/**
 * Hook para mutación de análisis (trigger manual)
 */
export function useAnalyzeOpportunity() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (opportunityId: string) =>
      caseAnalysisApi.analyzeOpportunity(opportunityId),
    onSuccess: (data, opportunityId) => {
      // Actualizar caché con el resultado
      queryClient.setQueryData(['opportunity-analysis', opportunityId], data);
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['opportunity', opportunityId] });
    },
  });

  return {
    analyze: mutation.mutate,
    analyzeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    analysis: mutation.data,
  };
}

/**
 * Hook para mutación de análisis de caso manual
 */
export function useAnalyzeCase() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: CaseAnalysisRequest) =>
      caseAnalysisApi.analyzeCase(request),
    onSuccess: (data, request) => {
      // Actualizar caché con el resultado
      queryClient.setQueryData(['case-analysis', request], data);
      // Invalidar queries relacionadas si hay contact_id u opportunity_id
      if (request.contact_id) {
        queryClient.invalidateQueries({ queryKey: ['contact', request.contact_id] });
      }
      if (request.opportunity_id) {
        queryClient.invalidateQueries({ queryKey: ['opportunity', request.opportunity_id] });
      }
    },
  });

  return {
    analyze: mutation.mutate,
    analyzeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    analysis: mutation.data,
  };
}

