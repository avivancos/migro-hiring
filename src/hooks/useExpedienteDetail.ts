// Hook para gestionar detalle de un expediente
// Incluye carga de datos, edición y actualización optimista

import { useState, useEffect, useCallback } from 'react';
import { expedienteApi } from '@/services/expedienteApi';
import type {
  ExpedienteReadWithFiles,
  ExpedienteUpdate,
} from '@/types/expediente';

export function useExpedienteDetail(expedienteId: string | null) {
  const [expediente, setExpediente] = useState<ExpedienteReadWithFiles | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadExpediente = useCallback(async () => {
    if (!expedienteId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await expedienteApi.getById(expedienteId);
      setExpediente(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar expediente'));
      console.error('Error loading expediente:', err);
    } finally {
      setLoading(false);
    }
  }, [expedienteId]);

  const updateExpediente = useCallback(
    async (updates: ExpedienteUpdate) => {
      if (!expedienteId || !expediente) return;

      // Optimistic update
      const previousExpediente = { ...expediente };
      setExpediente((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...updates,
          updated_at: new Date().toISOString(),
        };
      });

      setUpdating(true);
      setError(null);

      try {
        const updated = await expedienteApi.update(expedienteId, updates);
        setExpediente((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...updated,
            archivos: prev.archivos, // Mantener archivos existentes
          };
        });
        return updated;
      } catch (err) {
        // Revertir en caso de error
        setExpediente(previousExpediente);
        setError(err instanceof Error ? err : new Error('Error al actualizar expediente'));
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    [expedienteId, expediente]
  );

  const cambiarEstado = useCallback(
    async (nuevoStatus: string, comentario?: string) => {
      if (!expedienteId) return;

      setUpdating(true);
      setError(null);

      try {
        const updated = await expedienteApi.cambiarEstado(expedienteId, nuevoStatus, comentario);
        setExpediente((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...updated,
            archivos: prev.archivos,
          };
        });
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cambiar estado'));
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    [expedienteId]
  );

  useEffect(() => {
    loadExpediente();
  }, [loadExpediente]);

  return {
    expediente,
    loading,
    error,
    updating,
    refresh: loadExpediente,
    updateExpediente,
    cambiarEstado,
  };
}

