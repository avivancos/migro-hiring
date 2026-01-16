// TaskList - Lista de tareas con filtros y paginación
// Mobile-first con paginación tradicional unificada y vista de tabla

import { useState, useMemo, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import type { TaskFilters, Task } from '@/types/crm';
import TaskCard from './TaskCard';
import TaskTableRow from './TaskTableRow';
import TaskFiltersComponent from './TaskFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownIcon, ArrowUpIcon, ArrowsUpDownIcon, ArrowPathIcon, ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { Paginator } from '@/components/common/Paginator';

type ViewMode = 'cards' | 'table';
const VIEW_MODE_STORAGE_KEY = 'crm_tasks_view_mode';

type SortField = 'type' | 'text' | 'contact' | 'complete_till' | 'status' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface TaskListProps {
  initialFilters?: TaskFilters;
  showFilters?: boolean;
  onTaskPress?: (task: Task) => void;
}

export default function TaskList({ 
  initialFilters = {}, 
  showFilters = true,
  onTaskPress 
}: TaskListProps) {
  // Estado de vista (tabla o cards) con persistencia en localStorage
  // Por defecto siempre es 'table'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    // Solo respetar si es 'table', sino forzar 'table' por defecto
    if (saved === 'table') {
      return 'table';
    }
    // Si hay 'cards' guardado, limpiarlo y usar 'table'
    if (saved === 'cards') {
      localStorage.removeItem(VIEW_MODE_STORAGE_KEY);
    }
    // Por defecto siempre es 'table'
    return 'table';
  });

  // Guardar preferencia en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const [filters, setFilters] = useState<TaskFilters>({
    ...initialFilters,
    skip: initialFilters?.skip || 0,
    limit: initialFilters?.limit || 25,
  });
  
  // Estado de ordenamiento
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const { tasks: rawTasks, loading, error, total, refresh } = useTasks({
    filters,
    autoLoad: true,
    pageSize: filters.limit || 25,
  });

  // Ordenar tareas localmente
  const tasks = useMemo(() => {
    const sorted = [...rawTasks];
    
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'type':
          aValue = a.task_type || '';
          bValue = b.task_type || '';
          break;
        case 'text':
          aValue = (a.text || '').toLowerCase();
          bValue = (b.text || '').toLowerCase();
          break;
        case 'contact':
          aValue = (a.contact_name || '').toLowerCase();
          bValue = (b.contact_name || '').toLowerCase();
          break;
        case 'complete_till':
          aValue = a.complete_till ? new Date(a.complete_till).getTime() : 0;
          bValue = b.complete_till ? new Date(b.complete_till).getTime() : 0;
          break;
        case 'status':
          // Completadas primero, luego vencidas, luego pendientes
          const aIsCompleted = a.is_completed ? 3 : (a.complete_till && new Date(a.complete_till) < new Date() ? 2 : 1);
          const bIsCompleted = b.is_completed ? 3 : (b.complete_till && new Date(b.complete_till) < new Date() ? 2 : 1);
          aValue = aIsCompleted;
          bValue = bIsCompleted;
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
  }, [rawTasks, sortField, sortOrder]);

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

  // Calcular página actual y total de páginas
  const currentPage = filters.skip !== undefined && filters.limit 
    ? Math.floor(filters.skip / filters.limit) + 1 
    : 1;
  const totalPages = filters.limit && total > 0 
    ? Math.max(1, Math.ceil(total / filters.limit)) 
    : 1;

  const handlePageChange = (newPage: number) => {
    const newSkip = (newPage - 1) * (filters.limit || 25);
    setFilters(prev => ({ ...prev, skip: newSkip }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, skip: 0, limit: newLimit }));
  };

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 mb-4">Error: {error.message}</p>
        <Button onClick={refresh}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <TaskFiltersComponent 
          filters={filters} 
          onFiltersChange={setFilters} 
        />
      )}

      {/* Barra de herramientas con toggle de vista */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
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

      {/* Paginador Superior */}
      {!loading && total > 0 && (
        <Paginator
          total={total}
          page={currentPage}
          limit={filters.limit || 25}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemName="tarea"
          itemNamePlural="tareas"
          className="mb-4"
        />
      )}

      {/* Vista de Cards */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {tasks.length === 0 && !loading ? (
            <div className="p-8 text-center text-gray-500">
              <p>No hay tareas que mostrar</p>
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => onTaskPress?.(task)}
                showActions={true}
              />
            ))
          )}
        </div>
      )}

      {/* Vista de Tabla */}
      {viewMode === 'table' && (
        <>
          {/* Vista móvil: Cards en móvil, tabla en desktop */}
          <div className="block md:hidden space-y-4">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => onTaskPress?.(task)}
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
                            onClick={() => handleSort('type')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Tipo</span>
                              <SortIcon field="type" />
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('text')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Tarea</span>
                              <SortIcon field="text" />
                            </div>
                          </th>
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
                            onClick={() => handleSort('complete_till')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Fecha límite</span>
                              <SortIcon field="complete_till" />
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
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('created_at')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Creada</span>
                              <SortIcon field="created_at" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tasks.map((task) => (
                          <TaskTableRow
                            key={task.id}
                            task={task}
                            onSelect={onTaskPress}
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

      {loading && (
        <div className="flex justify-center py-8">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Paginador Inferior */}
      {!loading && total > 0 && totalPages > 1 && (
        <Paginator
          total={total}
          page={currentPage}
          limit={filters.limit || 25}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemName="tarea"
          itemNamePlural="tareas"
          className="mt-4"
        />
      )}
    </div>
  );
}

