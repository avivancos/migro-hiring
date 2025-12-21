// Hook para búsqueda avanzada de expedientes
// Incluye debounce y highlighting de resultados

import { useState, useEffect, useCallback, useRef } from 'react';
import { expedienteApi } from '@/services/expedienteApi';
import type { ExpedienteSearchResponse } from '@/types/expediente';

interface UseExpedienteSearchOptions {
  debounceMs?: number;
  minLength?: number;
}

export function useExpedienteSearch(options: UseExpedienteSearchOptions = {}) {
  const { debounceMs = 300, minLength = 2 } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExpedienteSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (searchQuery: string, filters?: { formulario?: string; status?: string }) => {
      if (searchQuery.length < minLength) {
        setResults(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await expedienteApi.buscar(searchQuery, filters);
        setResults(response);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error en la búsqueda'));
        console.error('Error searching expedientes:', err);
      } finally {
        setLoading(false);
      }
    },
    [minLength]
  );

  const debouncedSearch = useCallback(
    (searchQuery: string, filters?: { formulario?: string; status?: string }) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        search(searchQuery, filters);
      }, debounceMs);
    },
    [search, debounceMs]
  );

  const handleQueryChange = useCallback(
    (newQuery: string, filters?: { formulario?: string; status?: string }) => {
      setQuery(newQuery);
      debouncedSearch(newQuery, filters);
    },
    [debouncedSearch]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    query,
    results,
    loading,
    error,
    search: handleQueryChange,
    clearSearch,
  };
}

