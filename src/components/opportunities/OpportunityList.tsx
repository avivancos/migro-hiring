// OpportunityList - Lista de oportunidades con paginación

import React from 'react';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityTableRow } from './OpportunityTableRow';
import { OpportunityFilters } from './OpportunityFilters';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useOpportunities } from '@/hooks/useOpportunities';
import type { OpportunityFilters as OpportunityFiltersType } from '@/types/opportunity';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Grid3x3, List } from 'lucide-react';

type ViewMode = 'cards' | 'table';
const VIEW_MODE_STORAGE_KEY = 'crm_opportunities_view_mode';

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
  // Estado de vista (tabla o cards) con persistencia en localStorage
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return (saved === 'table' || saved === 'cards') ? saved : 'cards';
  });

  // Guardar preferencia en localStorage cuando cambie
  React.useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  // Usar initialFilters como base, pero permitir que se actualicen
  const [filters, setFilters] = React.useState<OpportunityFiltersType>(initialFilters);
  
  // Actualizar filtros cuando cambien los initialFilters (para agentes)
  React.useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }
  }, [initialFilters]);
  
  const {
    opportunities: rawOpportunities,
    total: _total,
    page,
    limit: _limit,
    totalPages,
    isLoading,
    error,
  } = useOpportunities(filters);
  
  // Oportunidades filtradas localmente (por filtros rápidos)
  const [filteredOpportunities, setFilteredOpportunities] = React.useState<typeof rawOpportunities>(rawOpportunities);
  
  // Callback memoizado para actualizar oportunidades filtradas
  const handleFilteredOpportunitiesChange = React.useCallback((filtered: typeof rawOpportunities) => {
    setFilteredOpportunities(filtered);
  }, []);
  
  // Ref para trackear si hay filtros rápidos activos
  const hasActiveQuickFilters = React.useRef(false);
  
  // Actualizar oportunidades filtradas cuando cambian las oportunidades raw
  // Solo si no hay filtros rápidos activos
  React.useEffect(() => {
    if (!hasActiveQuickFilters.current) {
      setFilteredOpportunities(rawOpportunities);
    }
  }, [rawOpportunities]);
  
  // Usar oportunidades filtradas para mostrar
  const opportunities = filteredOpportunities;

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
        opportunities={rawOpportunities}
        onFilteredOpportunitiesChange={handleFilteredOpportunitiesChange}
      />

      {/* Barra de herramientas con toggle de vista */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          {opportunities.length} {opportunities.length === 1 ? 'oportunidad' : 'oportunidades'}
          {filteredOpportunities.length !== rawOpportunities.length && ' (filtradas)'}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            title={viewMode === 'table' ? 'Vista de tarjetas' : 'Vista de tabla'}
            className="flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
          >
            {viewMode === 'table' ? (
              <>
                <Grid3x3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="ml-1 sm:ml-2 sm:hidden">Vista</span>
                <span className="hidden sm:inline">Tarjetas</span>
              </>
            ) : (
              <>
                <List className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="ml-1 sm:ml-2 sm:hidden">Vista</span>
                <span className="hidden sm:inline">Tabla</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lista de oportunidades - Vista de Cards */}
      {viewMode === 'cards' && (
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
      )}

      {/* Lista de oportunidades - Vista de Tabla */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Razón
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responsable
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {opportunities.map((opportunity) => (
                    <OpportunityTableRow
                      key={opportunity.id}
                      opportunity={opportunity}
                      onSelect={onOpportunitySelect}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Mostrando {opportunities.length > 0 ? 1 : 0} a {opportunities.length} de{' '}
            {opportunities.length} oportunidades {filteredOpportunities.length !== rawOpportunities.length ? '(filtradas)' : ''}
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

