// Hook para gestionar un stage de pipeline específico
// Incluye carga, actualización y gestión de próxima acción

import { useState, useEffect, useCallback } from 'react';
import { pipelineApi } from '@/services/pipelineApi';
import type {
  PipelineStageRead,
  PipelineStageCreate,
  NextActionUpdate,
  EntityType,
} from '@/types/pipeline';

export function usePipelineStage(
  entityType: EntityType | null,
  entityId: string | null
) {
  const [stage, setStage] = useState<PipelineStageRead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadStage = useCallback(async () => {
    if (!entityType || !entityId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await pipelineApi.getStage(entityType, entityId);
      setStage(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar pipeline stage'));
      console.error('Error loading pipeline stage:', err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  const createOrUpdateStage = useCallback(
    async (stageData: PipelineStageCreate) => {
      setUpdating(true);
      setError(null);

      try {
        const updated = await pipelineApi.createOrUpdateStage(stageData);
        setStage(updated);
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al actualizar pipeline stage'));
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    []
  );

  const updateNextAction = useCallback(
    async (nextAction: NextActionUpdate) => {
      if (!stage) return;

      setUpdating(true);
      setError(null);

      try {
        const updated = await pipelineApi.updateNextAction(stage.id, nextAction);
        setStage(updated);
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al actualizar próxima acción'));
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    [stage]
  );

  useEffect(() => {
    loadStage();
  }, [loadStage]);

  return {
    stage,
    loading,
    error,
    updating,
    refresh: loadStage,
    createOrUpdateStage,
    updateNextAction,
  };
}

