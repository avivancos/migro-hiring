// OpportunityList - Lista de oportunidades con paginación

import React from 'react';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityFilters } from './OpportunityFilters';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useOpportunities } from '@/hooks/useOpportunities';
import type { OpportunityFilters as OpportunityFiltersType } from '@/types/opportunity';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    // Log detallado del error para debugging
    console.error('❌ [OpportunityList] Error renderizado:', {
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      filters,
    });

    // Intentar extraer más información del error si es un error de axios
    let errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    let errorDetails = '';

    // Si es un error de axios, extraer más detalles
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      if (axiosError.response) {
        errorMessage = `Error ${axiosError.response.status}: ${axiosError.response.statusText || 'Error del servidor'}`;
        if (axiosError.response.data) {
          if (typeof axiosError.response.data === 'string') {
            errorDetails = axiosError.response.data;
          } else if (axiosError.response.data.detail) {
            errorDetails = axiosError.response.data.detail;
          } else if (axiosError.response.data.message) {
            errorDetails = axiosError.response.data.message;
          } else {
            errorDetails = JSON.stringify(axiosError.response.data);
          }
        }
      } else if (axiosError.request) {
        errorMessage = 'No se recibió respuesta del servidor';
        errorDetails = 'Verifica tu conexión y que el servidor esté disponible';
      }
    }

    return (
      <div className="space-y-4">
        <EmptyState
          title="Error al cargar oportunidades"
          description={errorMessage}
        />
        {errorDetails && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">
                Detalles del error:
              </p>
              <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                {errorDetails}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
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

