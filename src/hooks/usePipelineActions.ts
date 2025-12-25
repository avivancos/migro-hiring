// Hook para gestionar acciones de un pipeline
// Incluye listado, creación y validación

import { useState, useEffect, useCallback } from 'react';
import { pipelineApi } from '@/services/pipelineApi';
import type {
  PipelineActionRead,
  PipelineActionCreate,
  ActionValidationRequest,
  EntityType,
} from '@/types/pipeline';

export function usePipelineActions(
  entityType: EntityType | null,
  entityId: string | null
) {
  const [actions, setActions] = useState<PipelineActionRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [creating, setCreating] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);

  const loadActions = useCallback(async () => {
    if (!entityType || !entityId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await pipelineApi.listActions(entityType, entityId);
      setActions(response.items);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar acciones'));
      console.error('Error loading pipeline actions:', err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  const createAction = useCallback(
    async (actionData: PipelineActionCreate) => {
      setCreating(true);
      setError(null);

      try {
        const newAction = await pipelineApi.createAction(actionData);
        setActions((prev) => [newAction, ...prev]);
        return newAction;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al crear acción'));
        throw err;
      } finally {
        setCreating(false);
      }
    },
    []
  );

  const validateAction = useCallback(
    async (actionId: string, validation: ActionValidationRequest) => {
      setValidating(actionId);
      setError(null);

      try {
        const updated = await pipelineApi.validateAction(actionId, validation);
        setActions((prev) =>
          prev.map((a) => (a.id === actionId ? updated : a))
        );
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al validar acción'));
        throw err;
      } finally {
        setValidating(null);
      }
    },
    []
  );

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  return {
    actions,
    loading,
    error,
    creating,
    validating,
    refresh: loadActions,
    createAction,
    validateAction,
  };
}







