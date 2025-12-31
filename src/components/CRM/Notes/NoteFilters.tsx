// NoteFilters - Componente de filtros para notas
// Mobile-first con validación de permisos

import { useAuth } from '@/hooks/useAuth';
import { useCRMUsers } from '@/hooks/useCRMUsers';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface NoteFilters {
  created_by?: string;
  note_type?: string;
}

interface NoteFiltersProps {
  filters: NoteFilters;
  onFiltersChange: (filters: NoteFilters) => void;
}

export default function NoteFilters({ filters, onFiltersChange }: NoteFiltersProps) {
  const { user } = useAuth();
  const { users, loading: usersLoading } = useCRMUsers({ isActive: true });
  
  const isAdmin = user?.role === 'admin' || user?.is_superuser;

  const handleFilterChange = (key: keyof NoteFilters, value: any) => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tipo de nota */}
        <div>
          <Label htmlFor="note_type">Tipo</Label>
          <select
            id="note_type"
            value={filters.note_type || 'all'}
            onChange={(e) => handleFilterChange('note_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px]"
          >
            <option value="all">Todos</option>
            <option value="comment">Comentario</option>
            <option value="call">Llamada</option>
            <option value="meeting">Reunión</option>
            <option value="email">Email</option>
            <option value="system">Sistema</option>
          </select>
        </div>

        {/* Creador - Solo para admins */}
        {isAdmin && (
          <div>
            <Label htmlFor="created_by">Creador</Label>
            <select
              id="created_by"
              value={filters.created_by || 'all'}
              onChange={(e) => handleFilterChange('created_by', e.target.value)}
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
