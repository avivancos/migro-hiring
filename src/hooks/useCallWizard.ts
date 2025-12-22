// Hook principal para gestionar Call Data Wizard

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wizardApi } from '@/services/wizardApi';

export function useCallWizard(callId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: wizard, isLoading } = useQuery({
    queryKey: ['wizard', callId],
    queryFn: () => wizardApi.get(callId!),
    enabled: !!callId,
    staleTime: 10000, // 10 segundos (datos más dinámicos)
  });

  const { data: nextStep } = useQuery({
    queryKey: ['wizard', callId, 'next-step'],
    queryFn: () => wizardApi.getNextStep(callId!),
    enabled: !!callId && !!wizard && wizard.wizard_status === 'active',
    staleTime: 5000, // 5 segundos (datos muy dinámicos)
  });

  const startMutation = useMutation({
    mutationFn: () => wizardApi.start(callId!),
    onSuccess: (data) => {
      queryClient.setQueryData(['wizard', callId], data);
      queryClient.invalidateQueries({ queryKey: ['wizard', callId, 'next-step'] });
    },
  });

  const saveStepMutation = useMutation({
    mutationFn: ({
      stepNumber,
      stepData,
    }: {
      stepNumber: number;
      stepData: Record<string, any>;
    }) => wizardApi.saveStep(callId!, stepNumber, stepData),
    onSuccess: (data) => {
      queryClient.setQueryData(['wizard', callId], data);
      queryClient.invalidateQueries({ queryKey: ['wizard', callId, 'next-step'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (options?: { validateData?: boolean }) =>
      wizardApi.complete(callId!, options),
    onSuccess: (data) => {
      queryClient.setQueryData(['wizard', callId], data);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (reason?: string) => wizardApi.pause(callId!, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(['wizard', callId], data);
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => wizardApi.resume(callId!),
    onSuccess: (data) => {
      queryClient.setQueryData(['wizard', callId], data);
      queryClient.invalidateQueries({ queryKey: ['wizard', callId, 'next-step'] });
    },
  });

  return {
    wizard,
    nextStep,
    isLoading,
    start: startMutation.mutate,
    saveStep: saveStepMutation.mutate,
    complete: completeMutation.mutate,
    pause: pauseMutation.mutate,
    resume: resumeMutation.mutate,
    isStarting: startMutation.isPending,
    isSaving: saveStepMutation.isPending,
    isCompleting: completeMutation.isPending,
    isPausing: pauseMutation.isPending,
    isResuming: resumeMutation.isPending,
  };
}

