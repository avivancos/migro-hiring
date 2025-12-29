// Hook para obtener usuarios del CRM
// Usa el servicio crmService para obtener usuarios activos

import { useState, useEffect } from 'react';
import { crmService } from '@/services/crmService';
import type { CRMUser } from '@/types/crm';

export function useCRMUsers(filters?: { role?: string; isActive?: boolean }) {
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadUsers();
  }, [filters?.role, filters?.isActive]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const allUsers = await crmService.getUsers(filters?.isActive, true);
      
      // Filtrar por rol si se especifica
      const filtered = filters?.role
        ? allUsers.filter((u) => u.role_name === filters.role)
        : allUsers;
      
      setUsers(filtered);
    } catch (err) {
      console.error('Error cargando usuarios CRM:', err);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, error, refetch: loadUsers };
}





