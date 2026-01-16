// Paginator - Componente de paginación mobile-first reutilizable
// Estilo unificado para todas las listas del sistema

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginatorProps {
  // Datos de paginación
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  
  // Handlers
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  
  // Opciones
  showLimitSelector?: boolean;
  limitOptions?: number[];
  showInfo?: boolean;
  filteredCount?: number; // Para mostrar si hay filtros aplicados
  className?: string;
  
  // Textos personalizables
  itemName?: string; // "contacto", "oportunidad", "tarea", etc.
  itemNamePlural?: string; // "contactos", "oportunidades", "tareas", etc.
}

export function Paginator({
  total,
  page,
  limit,
  totalPages,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
  limitOptions = [25, 50, 100, 200],
  showInfo = true,
  filteredCount,
  className = '',
  itemName = 'item',
  itemNamePlural = 'items',
}: PaginatorProps) {
  // Calcular rangos para mostrar
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);
  
  // Si no hay items, no mostrar el paginador
  if (total === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {showInfo && (
              <div className="text-sm text-gray-600">
                Mostrando {startItem} - {endItem} de {total}
                {filteredCount !== undefined && filteredCount !== total && (
                  <span className="text-gray-500"> (filtradas)</span>
                )}
              </div>
            )}
            {showLimitSelector && (
              <div className="flex items-center gap-2">
                <Label htmlFor="items-per-page" className="text-sm text-gray-600 whitespace-nowrap">
                  Por página:
                </Label>
                <select
                  id="items-per-page"
                  value={limit}
                  onChange={(e) => onLimitChange(parseInt(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {limitOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
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
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
