// Hook principal para gestionar oportunidades

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunityApi } from '@/services/opportunityApi';
import type {
  LeadOpportunity,
  OpportunityFilters,
} from '@/types/opportunity';

export function useOpportunities(filters?: OpportunityFilters) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['opportunities', filters],
    queryFn: () => opportunityApi.list(filters),
    staleTime: 30000, // 30 segundos
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      opportunityApi.assign(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<LeadOpportunity>;
    }) => opportunityApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  return {
    opportunities: data?.opportunities ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 50,
    totalPages: data?.total_pages ?? 0,
    isLoading,
    error,
    assign: assignMutation.mutate,
    update: updateMutation.mutate,
    isAssigning: assignMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

