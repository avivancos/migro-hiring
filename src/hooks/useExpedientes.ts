// Hook principal para gestionar lista de expedientes
// Mobile-first con infinite scroll y caché inteligente

import { useState, useEffect, useCallback } from 'react';
import { expedienteApi } from '@/services/expedienteApi';
import type {
  ExpedienteRead,
  ExpedienteFilters,
  ExpedienteListResponse,
} from '@/types/expediente';

interface UseExpedientesOptions {
  filters?: ExpedienteFilters;
  autoLoad?: boolean;
  pageSize?: number;
}

export function useExpedientes(options: UseExpedientesOptions = {}) {
  const { filters = {}, autoLoad = true, pageSize = 20 } = options;

  const [expedientes, setExpedientes] = useState<ExpedienteRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);

  const loadExpedientes = useCallback(
    async (reset = false) => {
      if (loading) return;

      setLoading(true);
      setError(null);

      try {
        const currentSkip = reset ? 0 : skip;
        const response: ExpedienteListResponse = await expedienteApi.list({
          ...filters,
          skip: currentSkip,
          limit: pageSize,
        });

        if (reset) {
          setExpedientes(response.items);
        } else {
          setExpedientes((prev) => [...prev, ...response.items]);
        }

        setTotal(response.total);
        setSkip(currentSkip + response.items.length);
        setHasMore(response.items.length === pageSize && currentSkip + response.items.length < response.total);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar expedientes'));
        console.error('Error loading expedientes:', err);
      } finally {
        setLoading(false);
      }
    },
    [filters, skip, pageSize, loading]
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadExpedientes(false);
    }
  }, [loading, hasMore, loadExpedientes]);

  const refresh = useCallback(() => {
    setSkip(0);
    setHasMore(true);
    loadExpedientes(true);
  }, [loadExpedientes]);

  const removeExpediente = useCallback((id: string) => {
    setExpedientes((prev) => prev.filter((e) => e.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
  }, []);

  const updateExpediente = useCallback((updated: ExpedienteRead) => {
    setExpedientes((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
  }, []);

  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [autoLoad, refresh]);

  // Refrescar cuando cambien los filtros
  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [JSON.stringify(filters)]);

  return {
    expedientes,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
    removeExpediente,
    updateExpediente,
  };
}






