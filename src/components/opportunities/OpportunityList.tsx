// OpportunityList - Lista de oportunidades con paginación

import React from 'react';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityFilters } from './OpportunityFilters';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useOpportunities } from '@/hooks/useOpportunities';
import type { OpportunityFilters as OpportunityFiltersType } from '@/types/opportunity';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OpportunityListProps {
  filters?: OpportunityFiltersType;
  onOpportunitySelect?: (id: string) => void;
  availableAgents?: Array<{ id: string; name: string }>;
}

export function OpportunityList({
  filters: initialFilters = {},
  onOpportunitySelect,
  availableAgents = [],
}: OpportunityListProps) {
  const [filters, setFilters] = React.useState<OpportunityFiltersType>(initialFilters);
  const {
    opportunities,
    total,
    page,
    limit,
    totalPages,
    isLoading,
    error,
  } = useOpportunities(filters);

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  if (isLoading && opportunities.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error al cargar oportunidades"
        description={error instanceof Error ? error.message : 'Error desconocido'}
      />
    );
  }

  if (opportunities.length === 0) {
    return (
      <EmptyState
        title="No hay oportunidades"
        description="No se encontraron oportunidades con los filtros aplicados"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <OpportunityFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableAgents={availableAgents}
      />

      {/* Lista de oportunidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
            onSelect={onOpportunitySelect}
            showActions={true}
          />
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de{' '}
            {total} oportunidades
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <div className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

