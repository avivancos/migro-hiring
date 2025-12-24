// OpportunityFilters - Filtros para oportunidades

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { OpportunityFilters as OpportunityFiltersType } from '@/types/opportunity';
import { X, Filter } from 'lucide-react';

interface OpportunityFiltersProps {
  filters: OpportunityFiltersType;
  onFiltersChange: (filters: OpportunityFiltersType) => void;
  availableAgents?: Array<{ id: string; name: string }>;
}

export function OpportunityFilters({
  filters,
  onFiltersChange,
  availableAgents = [],
}: OpportunityFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof OpportunityFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilter = (key: keyof OpportunityFiltersType) => {
    const { [key]: _, ...rest } = filters;
    onFiltersChange(rest);
  };

  const activeFiltersCount =
    (filters.status ? 1 : 0) +
    (filters.priority ? 1 : 0) +
    (filters.assigned_to ? 1 : 0) +
    (filters.search ? 1 : 0) +
    (filters.min_score !== undefined ? 1 : 0) +
    (filters.max_score !== undefined ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Botón de filtros y chips activos */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {/* Chips de filtros activos */}
        {filters.status && (
          <Badge variant="secondary" className="gap-1">
            Estado: {filters.status}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => clearFilter('status')}
            />
          </Badge>
        )}
        {filters.priority && (
          <Badge variant="secondary" className="gap-1">
            Prioridad: {filters.priority}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => clearFilter('priority')}
            />
          </Badge>
        )}
        {filters.search && (
          <Badge variant="secondary" className="gap-1">
            Búsqueda: {filters.search}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => clearFilter('search')}
            />
          </Badge>
        )}
      </div>

      {/* Panel de filtros */}
      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Búsqueda */}
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nombre, email, ciudad..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>

            {/* Estado */}
            <div>
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
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
              <Label htmlFor="priority">Prioridad</Label>
              <select
                id="priority"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
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
                <Label htmlFor="assigned_to">Asignado a</Label>
                <select
                  id="assigned_to"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="min_score">Score mínimo</Label>
                <Input
                  id="min_score"
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
                />
              </div>
              <div>
                <Label htmlFor="max_score">Score máximo</Label>
                <Input
                  id="max_score"
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
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                onFiltersChange({});
                setIsOpen(false);
              }}
            >
              Limpiar filtros
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


