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
      
      // Si se solicita solo responsables, usar endpoint optimizado
      if (filters?.onlyResponsibles || (filters?.role && (filters.role === 'lawyer' || filters.role === 'agent' || filters.role === 'admin'))) {
        // Cargar usuarios responsables desde endpoint optimizado
        const allUsers = await crmService.getResponsibleUsers(filters?.isActive ?? true, true);
        
        // El endpoint ya devuelve responsables; filtrar por rol solo si se pide y está disponible
        const filtered = filters?.role && (filters.role === 'lawyer' || filters.role === 'agent' || filters.role === 'admin')
          ? allUsers.filter((u) => u.role_name === filters.role)
          : allUsers;
        
        console.info('🐛 [useCRMUsers] Responsables cargados:', {
          total: allUsers.length,
          sample: allUsers.slice(0, 5).map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role_name,
          })),
        });
        setUsers(filtered);
      } else {
        // Para otros casos, usar el endpoint general
        const allUsers = await crmService.getUsers(filters?.isActive, true);
        
        // Filtrar por rol si se especifica
        const filtered = filters?.role
          ? allUsers.filter((u) => u.role_name === filters.role)
          : allUsers;
        
        console.info('🐛 [useCRMUsers] Usuarios CRM cargados:', {
          total: allUsers.length,
          sample: allUsers.slice(0, 5).map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role_name,
          })),
        });
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






