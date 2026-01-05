// Hook para obtener usuarios del CRM
// Usa el servicio crmService para obtener usuarios activos

import { useState, useEffect } from 'react';
import { crmService } from '@/services/crmService';
import type { CRMUser } from '@/types/crm';

export function useCRMUsers(filters?: { role?: string; isActive?: boolean; onlyResponsibles?: boolean }) {
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadUsers();
  }, [filters?.role, filters?.isActive, filters?.onlyResponsibles]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Si se solicita solo responsables, incluir lawyers, agents y admins
      if (filters?.onlyResponsibles || (filters?.role && (filters.role === 'lawyer' || filters.role === 'agent' || filters.role === 'admin'))) {
        // Cargar todos los usuarios activos y filtrar por roles responsables
        const allUsers = await crmService.getUsers(filters?.isActive ?? true, true);
        
        // Filtrar solo usuarios que pueden ser responsables: lawyers, agents y admins
        const responsibleUsers = allUsers.filter((u) => 
          u.role_name === 'lawyer' || 
          u.role_name === 'agent' || 
          u.role_name === 'admin'
        );
        
        // Si se especifica un rol específico además, filtrar por ese rol
        const filtered = filters?.role && (filters.role === 'lawyer' || filters.role === 'agent' || filters.role === 'admin')
          ? responsibleUsers.filter((u) => u.role_name === filters.role)
          : responsibleUsers;
        
        setUsers(filtered);
      } else {
        // Para otros casos, usar el endpoint general
        const allUsers = await crmService.getUsers(filters?.isActive, true);
        
        // Filtrar por rol si se especifica
        const filtered = filters?.role
          ? allUsers.filter((u) => u.role_name === filters.role)
          : allUsers;
        
        setUsers(filtered);
      }
    } catch (err) {
      console.error('Error cargando usuarios CRM:', err);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, error, refetch: loadUsers };
}






