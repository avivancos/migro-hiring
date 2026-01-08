// TaskList - Lista de tareas con filtros y paginación
// Mobile-first con infinite scroll

import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import type { TaskFilters, Task } from '@/types/crm';
import TaskCard from './TaskCard';
import TaskFiltersComponent from './TaskFilters';
import { Button } from '@/components/ui/button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

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
  const [filters, setFilters] = useState<TaskFilters>(initialFilters);
  const { tasks, loading, error, hasMore, loadMore, refresh } = useTasks({
    filters,
    autoLoad: true,
    pageSize: 20,
  });

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

      {loading && (
        <div className="flex justify-center py-8">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
          >
            Cargar más
          </Button>
        </div>
      )}
    </div>
  );
}

