// Página principal de lista de expedientes
// Mobile-first con filtros, búsqueda y infinite scroll

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/shared/SearchBar';
import { ExpedienteCard } from '@/components/expedientes/ExpedienteCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useExpedientes } from '@/hooks/useExpedientes';
import { useExpedienteSearch } from '@/hooks/useExpedienteSearch';
import { usePermissions } from '@/hooks/usePermissions';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { ExpedienteStatus } from '@/types/expediente';

export function CRMExpedientesList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ExpedienteStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { canCreateExpediente } = usePermissions();

  // Usar búsqueda si hay query, sino usar lista normal
  const { results: searchResults, loading: searchLoading } = useExpedienteSearch({
    debounceMs: 300,
  });

  const { expedientes, loading, hasMore, loadMore } = useExpedientes({
    filters: statusFilter !== 'all' ? { status: statusFilter } : {},
    autoLoad: !searchQuery,
  });

  // Infinite scroll automático
  const { lastElementRef } = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore: loadMore,
    threshold: 200,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // La búsqueda se maneja automáticamente por el hook
  };

  const displayedExpedientes = searchQuery && searchResults
    ? searchResults.items
    : expedientes;

  const isLoading = searchQuery ? searchLoading : loading;

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expedientes</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los expedientes legales de tus clientes
          </p>
        </div>
        {canCreateExpediente() && (
          <Button
            onClick={() => navigate('/crm/expedientes/new')}
            className="w-full md:w-auto"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Expediente
          </Button>
        )}
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Búsqueda */}
            <SearchBar
              onSearch={handleSearch}
              placeholder="Buscar por título, número de expediente, resumen..."
              className="w-full"
            />

            {/* Filtros de estado */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('new')}
              >
                Nuevos
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('in_progress')}
              >
                En Proceso
              </Button>
              <Button
                variant={statusFilter === 'pending_info' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending_info')}
              >
                Pendiente Info
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
              >
                Completados
              </Button>
              <Button
                variant={statusFilter === 'archived' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('archived')}
              >
                Archivados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de expedientes */}
      {isLoading && displayedExpedientes.length === 0 ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : displayedExpedientes.length === 0 ? (
        <EmptyState
          title="No se encontraron expedientes"
          description={
            searchQuery
              ? 'Intenta con otros términos de búsqueda'
              : 'Crea tu primer expediente para comenzar'
          }
          action={
            canCreateExpediente() ? (
              <Button onClick={() => navigate('/crm/expedientes/new')}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Crear Expediente
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {displayedExpedientes.map((expediente, index) => {
            const isLast = index === displayedExpedientes.length - 1;
            return (
              <div
                key={expediente.id}
                ref={isLast && hasMore && !searchQuery ? lastElementRef : null}
              >
                <ExpedienteCard
                  expediente={expediente}
                  progress={0} // Se calcularía en producción
                />
              </div>
            );
          })}

          {/* Loading indicator para infinite scroll */}
          {loading && hasMore && !searchQuery && (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

