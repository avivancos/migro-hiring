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
import { Label } from '@/components/ui/label';
import { ArrowDownIcon, ArrowUpIcon, ArrowsUpDownIcon, ChevronLeftIcon, ChevronRightIcon, ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

type ViewMode = 'cards' | 'table';
const VIEW_MODE_STORAGE_KEY = 'crm_opportunities_view_mode';
const DEFAULT_VIEW_MODE: ViewMode = 'table';

type SortField = 'contact' | 'score' | 'priority' | 'status' | 'responsible' | 'created_at';
type SortOrder = 'asc' | 'desc';

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
  // Por defecto siempre es 'table' (definido en constante)
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    // Si hay 'cards' guardado, limpiarlo para forzar 'table' por defecto
    if (saved === 'cards') {
      localStorage.removeItem(VIEW_MODE_STORAGE_KEY);
    }
    // Solo respetar si es 'table', sino usar el modo predeterminado
    if (saved === 'table') {
      return DEFAULT_VIEW_MODE;
    }
    // Por defecto siempre es 'table'
    return DEFAULT_VIEW_MODE;
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
    total,
    page,
    limit,
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
  
  // Estado de ordenamiento
  const [sortField, setSortField] = React.useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');

  // Ordenar oportunidades localmente
  const opportunities = React.useMemo(() => {
    const sorted = [...filteredOpportunities];
    
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'contact':
          const aContactName = a.contact?.name || 
            (a.contact?.first_name ? `${a.contact.first_name} ${a.contact.last_name || ''}`.trim() : '') ||
            a.contact?.email?.split('@')[0] || '';
          const bContactName = b.contact?.name || 
            (b.contact?.first_name ? `${b.contact.first_name} ${b.contact.last_name || ''}`.trim() : '') ||
            b.contact?.email?.split('@')[0] || '';
          aValue = aContactName.toLowerCase();
          bValue = bContactName.toLowerCase();
          break;
        case 'score':
          aValue = a.opportunity_score || 0;
          bValue = b.opportunity_score || 0;
          break;
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'status':
          const statusOrder = { 'pending': 1, 'assigned': 2, 'contacted': 3, 'converted': 4, 'expired': 5, 'lost': 6 };
          aValue = statusOrder[a.status] || 0;
          bValue = statusOrder[b.status] || 0;
          break;
        case 'responsible':
          aValue = a.assigned_to?.name || '';
          bValue = b.assigned_to?.name || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredOpportunities, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUpIcon className="w-4 h-4 text-primary" />
      : <ArrowDownIcon className="w-4 h-4 text-primary" />;
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({ ...prev, page: 1, limit: newLimit }));
  };

  // Calcular rangos para mostrar
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

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

      {/* Controles de Paginación Superior */}
      {!isLoading && total > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Mostrando {startItem} - {endItem} de {total}
                  {filteredOpportunities.length !== rawOpportunities.length && ' (filtradas)'}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="items-per-page-top" className="text-sm text-gray-600 whitespace-nowrap">
                    Por página:
                  </Label>
                  <select
                    id="items-per-page-top"
                    value={limit}
                    onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                <span className="text-sm text-gray-600 px-3 min-w-[100px] text-center">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                <Squares2X2Icon className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="ml-1 sm:ml-2 sm:hidden">Vista</span>
                <span className="hidden sm:inline">Tarjetas</span>
              </>
            ) : (
              <>
                <ListBulletIcon className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
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
        <>
          {/* Vista móvil: Cards en móvil, tabla en desktop */}
          <div className="block md:hidden space-y-4">
            {opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onSelect={onOpportunitySelect}
                showActions={true}
              />
            ))}
          </div>
          
          {/* Vista desktop: Tabla */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('contact')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Contacto</span>
                              <SortIcon field="contact" />
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('score')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Score</span>
                              <SortIcon field="score" />
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('priority')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Prioridad</span>
                              <SortIcon field="priority" />
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Estado</span>
                              <SortIcon field="status" />
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contacto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Razón
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('responsible')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Responsable</span>
                              <SortIcon field="responsible" />
                            </div>
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
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Controles de Paginación Inferior */}
      {!isLoading && total > 0 && totalPages > 1 && (
        <Card className="mt-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Mostrando {startItem} - {endItem} de {total}
                  {filteredOpportunities.length !== rawOpportunities.length && ' (filtradas)'}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="items-per-page-bottom" className="text-sm text-gray-600 whitespace-nowrap">
                    Por página:
                  </Label>
                  <select
                    id="items-per-page-bottom"
                    value={limit}
                    onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                <span className="text-sm text-gray-600 px-3 min-w-[100px] text-center">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

