// Hooks para Agent Daily Journal

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentJournalApi } from '@/services/agentJournalApi';
import type {
  DailyReportResponse,
  PerformanceDashboardResponse,
  PeriodType,
} from '@/types/agentJournal';

/**
 * Hook para obtener el reporte diario
 */
export function useDailyReport(targetDate?: Date) {
  return useQuery({
    queryKey: ['agent-journal', 'daily-report', targetDate?.toISOString().split('T')[0]],
    queryFn: () => agentJournalApi.getDailyReport(targetDate),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Auto-refresh cada 5 min
    retry: 1,
  });
}

/**
 * Hook para obtener el dashboard de desempeño
 */
export function usePerformanceDashboard(period: PeriodType = 'today') {
  return useQuery({
    queryKey: ['agent-journal', 'dashboard', period],
    queryFn: () => agentJournalApi.getPerformanceDashboard(period),
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 1,
  });
}

/**
 * Hook para sincronizar métricas
 */
export function useSyncMetrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetDate?: Date) => agentJournalApi.syncMetrics(targetDate),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['agent-journal'] });
    },
  });
}

/**
 * Hook para obtener métricas de un agente específico (admin)
 */
export function useAgentMetrics(userId: string | undefined, targetDate?: Date) {
  return useQuery({
    queryKey: ['agent-journal', 'metrics', userId, targetDate?.toISOString().split('T')[0]],
    queryFn: () => agentJournalApi.getAgentMetrics(userId!, targetDate),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook para firmar y enviar reporte diario
 */
export function useSignAndSendReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetDate, agentSignature }: { targetDate?: Date; agentSignature: string }) =>
      agentJournalApi.signAndSendReport(targetDate, agentSignature),
    onSuccess: () => {
      // Invalidar queries relacionadas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['agent-journal'] });
    },
  });
}

