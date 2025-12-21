// Hook principal para gestionar pipelines
// Mobile-first con filtros y caché

import { useState, useEffect, useCallback } from 'react';
import type {
  PipelineStageRead,
  PipelineFilters,
} from '@/types/pipeline';

interface UsePipelinesOptions {
  filters?: PipelineFilters;
  autoLoad?: boolean;
}

export function usePipelines(options: UsePipelinesOptions = {}) {
  const { filters = {}, autoLoad = true } = options;

  const [stages] = useState<PipelineStageRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPipelines = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Nota: El backend puede no tener un endpoint de listado directo
      // En ese caso, necesitaríamos obtener pipelines desde contactos/leads
      // Por ahora, asumimos que se cargan individualmente por entity
      // Este hook se puede expandir cuando haya endpoint de listado
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar pipelines'));
      console.error('Error loading pipelines:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refresh = useCallback(() => {
    loadPipelines();
  }, [loadPipelines]);

  useEffect(() => {
    if (autoLoad) {
      loadPipelines();
    }
  }, [autoLoad, loadPipelines]);

  return {
    stages,
    loading,
    error,
    refresh,
  };
}





