// TaskFilters - Componente de filtros para tareas
// Mobile-first con validación de permisos

import { useAuth } from '@/hooks/useAuth';
import { useCRMUsers } from '@/hooks/useCRMUsers';
import type { TaskFilters } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}

export default function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const { user } = useAuth();
  const { users, loading: usersLoading } = useCRMUsers({ isActive: true });
  
  const isAdmin = user?.role === 'admin' || user?.is_superuser;

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="bg-white p-4 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Filtros</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
        >
          Limpiar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Estado de completado */}
        <div>
          <Label htmlFor="is_completed">Estado</Label>
          <select
            id="is_completed"
            value={filters.is_completed === undefined ? 'all' : filters.is_completed ? 'completed' : 'pending'}
            onChange={(e) => {
              if (e.target.value === 'all') {
                handleFilterChange('is_completed', undefined);
              } else {
                handleFilterChange('is_completed', e.target.value === 'completed');
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px]"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completadas</option>
          </select>
        </div>

        {/* Tipo de tarea */}
        <div>
          <Label htmlFor="task_type">Tipo</Label>
          <select
            id="task_type"
            value={filters.task_type || 'all'}
            onChange={(e) => handleFilterChange('task_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px]"
          >
            <option value="all">Todos</option>
            <option value="call">Llamada</option>
            <option value="meeting">Reunión</option>
            <option value="email">Email</option>
            <option value="reminder">Recordatorio</option>
            <option value="other">Otro</option>
          </select>
        </div>

        {/* Responsable - Solo para admins */}
        {isAdmin && (
          <div>
            <Label htmlFor="responsible_user_id">Responsable</Label>
            <select
              id="responsible_user_id"
              value={filters.responsible_user_id || 'all'}
              onChange={(e) => handleFilterChange('responsible_user_id', e.target.value)}
              disabled={usersLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px] disabled:bg-gray-100"
            >
              <option value="all">Todos</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

