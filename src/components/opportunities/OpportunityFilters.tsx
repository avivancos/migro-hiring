// OpportunityFilters - Filtros para oportunidades

import { useState, useEffect } from 'react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OpportunityFilters as OpportunityFiltersType } from '@/types/opportunity';
import type { LeadOpportunity } from '@/types/opportunity';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getValidAttemptsCount } from '@/utils/opportunity';

interface OpportunityFiltersProps {
  filters: OpportunityFiltersType;
  onFiltersChange: (filters: OpportunityFiltersType) => void;
  availableAgents?: Array<{ id: string; name: string }>;
  opportunities?: LeadOpportunity[]; // Oportunidades para filtrado local
  onFilteredOpportunitiesChange?: (filtered: LeadOpportunity[]) => void; // Callback para oportunidades filtradas
}

export function OpportunityFilters({
  filters,
  onFiltersChange,
  availableAgents = [],
  opportunities = [],
  onFilteredOpportunitiesChange,
}: OpportunityFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Filtros rápidos locales
  const [filterSinSituacion, setFilterSinSituacion] = useState(false);
  const [filterIntentosDisponibles, setFilterIntentosDisponibles] = useState<number | null>(null);
  const [filterConInfoAsignada, setFilterConInfoAsignada] = useState<boolean | null>(null);

  const updateFilter = (key: keyof OpportunityFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  // clearFilter está preparado para uso futuro
  // const clearFilter = (key: keyof OpportunityFiltersType) => {
  //   const { [key]: _, ...rest } = filters;
  //   onFiltersChange(rest);
  // };

  // Aplicar filtros rápidos locales usando useMemo para evitar loops
  const filtered = React.useMemo(() => {
    if (!opportunities || opportunities.length === 0) {
      return [];
    }

    let result = [...opportunities];

    // Filtro: Sin situación conocida
    if (filterSinSituacion) {
      result = result.filter(opp => {
        const contact = opp.contact;
        return !contact?.grading_situacion;
      });
    }

    // Filtro: Intentos disponibles
    if (filterIntentosDisponibles !== null) {
      result = result.filter(opp => {
        const usedAttempts = getValidAttemptsCount(opp.first_call_attempts);
        const availableAttempts = 5 - usedAttempts;
        return availableAttempts === filterIntentosDisponibles;
      });
    }

    // Filtro: Con/Sin info asignada
    if (filterConInfoAsignada !== null) {
      if (filterConInfoAsignada) {
        result = result.filter(opp => opp.assigned_to_id);
      } else {
        result = result.filter(opp => !opp.assigned_to_id);
      }
    }

    return result;
  }, [opportunities, filterSinSituacion, filterIntentosDisponibles, filterConInfoAsignada]);

  // Ref para mantener referencia estable al callback
  const callbackRef = React.useRef(onFilteredOpportunitiesChange);
  
  // Actualizar ref cuando cambia el callback
  useEffect(() => {
    callbackRef.current = onFilteredOpportunitiesChange;
  }, [onFilteredOpportunitiesChange]);
  
  // Ref para trackear el valor anterior y evitar actualizaciones innecesarias
  const prevFilteredIdsRef = React.useRef<string>('');
  
  // Actualizar oportunidades filtradas solo cuando cambia el resultado del filtrado
  useEffect(() => {
    if (!callbackRef.current) {
      return;
    }
    
    // Verificar si hay filtros activos
    const hasActiveFilters = filterSinSituacion || filterIntentosDisponibles !== null || filterConInfoAsignada !== null;
    
    // Comparar por IDs para evitar actualizaciones innecesarias
    const currentIds = filtered.map(o => o.id).sort().join(',');
    
    // Solo actualizar si realmente cambió
    if (prevFilteredIdsRef.current !== currentIds) {
      prevFilteredIdsRef.current = currentIds;
      
      if (hasActiveFilters) {
        // Si hay filtros activos, pasar el resultado filtrado
        callbackRef.current(filtered);
      } else {
        // Si no hay filtros activos, pasar todas las oportunidades
        callbackRef.current(opportunities);
      }
    }
  }, [filtered, opportunities, filterSinSituacion, filterIntentosDisponibles, filterConInfoAsignada]);

  const activeFiltersCount =
    (filters.status ? 1 : 0) +
    (filters.priority ? 1 : 0) +
    (filters.assigned_to ? 1 : 0) +
    (filters.search ? 1 : 0) +
    (filters.min_score !== undefined ? 1 : 0) +
    (filters.max_score !== undefined ? 1 : 0) +
    (filterSinSituacion ? 1 : 0) +
    (filterIntentosDisponibles !== null ? 1 : 0) +
    (filterConInfoAsignada !== null ? 1 : 0);

  const clearAllFilters = () => {
    onFiltersChange({});
    setFilterSinSituacion(false);
    setFilterIntentosDisponibles(null);
    setFilterConInfoAsignada(null);
    setIsOpen(false);
  };

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Búsqueda y Botón de Filtros */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por contacto, email, teléfono..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2"
              >
                <FunnelIcon className="w-4 h-4" />
                <span>Filtros</span>
                {hasActiveFilters && (
                  <span className="ml-1 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="text-red-600 hover:text-red-700"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>
          
          {/* Filtros Rápidos - Tags */}
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Filtros Rápidos</Label>
            <div className="flex flex-wrap gap-2">
              {/* Tag: Sin situación conocida */}
              <button
                type="button"
                onClick={() => setFilterSinSituacion(!filterSinSituacion)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterSinSituacion
                    ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                Sin situación conocida
              </button>
              
              {/* Tags: Intentos disponibles (1-5) */}
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setFilterIntentosDisponibles(
                      filterIntentosDisponibles === num ? null : num
                    );
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterIntentosDisponibles === num
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {num} intento{num !== 1 ? 's' : ''} disponible{num !== 1 ? 's' : ''}
                </button>
              ))}
              
              {/* Tag: Con info asignada */}
              <button
                type="button"
                onClick={() => {
                  setFilterConInfoAsignada(
                    filterConInfoAsignada === true ? null : true
                  );
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterConInfoAsignada === true
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                Con info asignada
              </button>
              
              {/* Tag: Sin info asignada */}
              <button
                type="button"
                onClick={() => {
                  setFilterConInfoAsignada(
                    filterConInfoAsignada === false ? null : false
                  );
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterConInfoAsignada === false
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                Sin info asignada
              </button>
            </div>
          </div>
          
          {/* Panel de Filtros Colapsable */}
          {isOpen && (
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Estado */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Estado</Label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={filters.status || ''}
                    onChange={(e) =>
                      updateFilter('status', e.target.value || undefined)
                    }
                  >
                    <option value="">Todos</option>
                    <option value="pending">Pendiente</option>
                    <option value="assigned">Asignada</option>
                    <option value="contacted">Contactada</option>
                    <option value="converted">Convertida</option>
                    <option value="expired">Expirada</option>
                    <option value="lost">Perdida</option>
                  </select>
                </div>

                {/* Prioridad */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Prioridad</Label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={filters.priority || ''}
                    onChange={(e) =>
                      updateFilter('priority', e.target.value || undefined)
                    }
                  >
                    <option value="">Todas</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>

                {/* Agente asignado */}
                {availableAgents.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Asignado a</Label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={filters.assigned_to || ''}
                      onChange={(e) =>
                        updateFilter('assigned_to', e.target.value || undefined)
                      }
                    >
                      <option value="">Todos</option>
                      {availableAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Score range */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Score mínimo</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.min_score ?? ''}
                    onChange={(e) =>
                      updateFilter(
                        'min_score',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Score máximo</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.max_score ?? ''}
                    onChange={(e) =>
                      updateFilter(
                        'max_score',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

