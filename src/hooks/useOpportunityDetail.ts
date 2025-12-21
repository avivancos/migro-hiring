// Hook para obtener detalle de una oportunidad

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunityApi } from '@/services/opportunityApi';
import type { LeadOpportunity } from '@/types/opportunity';

export function useOpportunityDetail(opportunityId: string | undefined) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['opportunity', opportunityId],
    queryFn: () => opportunityApi.get(opportunityId!),
    enabled: !!opportunityId,
    staleTime: 30000,
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string) =>
      opportunityApi.assign(opportunityId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', opportunityId] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<LeadOpportunity>) =>
      opportunityApi.update(opportunityId!, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(['opportunity', opportunityId], updated);
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const createPipelineMutation = useMutation({
    mutationFn: () => opportunityApi.createPipeline(opportunityId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', opportunityId] });
    },
  });

  return {
    opportunity: data,
    isLoading,
    error,
    assign: assignMutation.mutate,
    update: updateMutation.mutate,
    createPipeline: createPipelineMutation.mutate,
    isAssigning: assignMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCreatingPipeline: createPipelineMutation.isPending,
  };
}

