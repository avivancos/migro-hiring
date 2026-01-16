// Hook personalizado para gestionar tareas CRM
// Mobile-first con paginación y filtros

import { useState, useEffect, useCallback } from 'react';
import { crmService } from '@/services/crmService';
import type { Task, TaskCreateRequest, TaskUpdateRequest, TaskFilters, CRMUser } from '@/types/crm';
import { useAuth } from './useAuth';

interface UseTasksOptions {
  filters?: TaskFilters;
  autoLoad?: boolean;
  pageSize?: number;
}

export function useTasks(options: UseTasksOptions = {}) {
  const { filters = {}, autoLoad = true, pageSize = 20 } = options;
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [crmUsers, setCrmUsers] = useState<CRMUser[]>([]);

  // Cargar usuarios CRM una vez al montar el componente
  useEffect(() => {
    const loadCRMUsers = async () => {
      try {
        const users = await crmService.getUsers(true);
        setCrmUsers(users);
      } catch (err) {
        console.warn('⚠️ [useTasks] Error cargando usuarios CRM:', err);
        setCrmUsers([]);
      }
    };
    loadCRMUsers();
  }, []);

  const fetchTasks = useCallback(async (reset = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const currentSkip = reset ? 0 : skip;
      const requestFilters: TaskFilters = {
        ...filters,
        skip: currentSkip,
        limit: pageSize,
      };

      const isAdmin = user?.role === 'admin' || user?.is_superuser;
      
      // Para usuarios regulares: buscar el usuario CRM correspondiente y establecer responsible_user_id
      if (!isAdmin) {
        // Si hay un filtro de responsible_user_id explícito, eliminarlo (solo admins pueden usarlo)
        if (requestFilters.responsible_user_id) {
          delete requestFilters.responsible_user_id;
        }
        
        // Buscar el usuario CRM correspondiente al usuario del sistema
        // Intentar primero por ID, luego por email (case-insensitive)
        if ((user?.id || user?.email) && crmUsers.length > 0) {
          const currentEmail = user.email?.toLowerCase();
          const currentUserId = user.id;
          
          const crmUser = crmUsers.find(u => {
            // Buscar por ID primero (más confiable)
            const matchesId = currentUserId && u.id === currentUserId;
            // Luego buscar por email (case-insensitive)
            const matchesEmail = currentEmail && (
              u.email?.toLowerCase() === currentEmail || 
              u.email === user.email
            );
            return matchesId || matchesEmail;
          });
          
          if (crmUser) {
            requestFilters.responsible_user_id = crmUser.id;
            console.log('🔍 [useTasks] Usuario regular, filtrando por CRM user:', {
              systemUserId: user.id,
              systemUserEmail: user.email,
              crmUserId: crmUser.id,
              crmUserName: crmUser.name,
              crmUserEmail: crmUser.email,
              matchedBy: currentUserId && crmUser.id === currentUserId ? 'ID' : 'email',
            });
          } else {
            console.warn('⚠️ [useTasks] No se encontró usuario CRM para:', {
              systemUserId: user.id,
              systemUserEmail: user.email,
              availableCrmUsers: crmUsers.map(u => ({ id: u.id, email: u.email, name: u.name })),
            });
          }
        } else if ((user?.id || user?.email) && crmUsers.length === 0) {
          // Si aún no se han cargado los usuarios CRM, intentar cargarlos ahora
          try {
            const users = await crmService.getUsers(true);
            setCrmUsers(users);
            
            const currentEmail = user.email?.toLowerCase();
            const currentUserId = user.id;
            
            const crmUser = users.find(u => {
              const matchesId = currentUserId && u.id === currentUserId;
              const matchesEmail = currentEmail && (
                u.email?.toLowerCase() === currentEmail || 
                u.email === user.email
              );
              return matchesId || matchesEmail;
            });
            
            if (crmUser) {
              requestFilters.responsible_user_id = crmUser.id;
              console.log('🔍 [useTasks] Usuario CRM encontrado después de carga:', {
                crmUserId: crmUser.id,
                crmUserName: crmUser.name,
                crmUserEmail: crmUser.email,
                matchedBy: currentUserId && crmUser.id === currentUserId ? 'ID' : 'email',
              });
            } else {
              console.warn('⚠️ [useTasks] No se encontró usuario CRM después de carga:', {
                systemUserId: user.id,
                systemUserEmail: user.email,
                availableCrmUsers: users.map(u => ({ id: u.id, email: u.email, name: u.name })),
              });
            }
          } catch (err) {
            console.warn('⚠️ [useTasks] Error cargando usuarios CRM:', err);
          }
        }
      }

      // Debug: Log de filtros
      if (isAdmin) {
        console.log('🔍 [useTasks] Admin filtrando tareas:', {
          responsible_user_id: requestFilters.responsible_user_id,
          filters: requestFilters,
        });
      }

      const response = await crmService.getTasks(requestFilters);
      
      const tasksList = response.items || [];
      
      if (reset) {
        setTasks(tasksList);
      } else {
        setTasks(prev => [...prev, ...tasksList]);
      }

      setTotal(response.total || tasksList.length);
      setSkip(currentSkip + tasksList.length);
      setHasMore(tasksList.length === pageSize && (currentSkip + tasksList.length < (response.total || 0)));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar tareas'));
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, skip, pageSize, loading, user, crmUsers]);

  const createTask = useCallback(async (taskData: TaskCreateRequest): Promise<Task> => {
    try {
      // ⚠️ IMPORTANTE: Si no viene responsible_user_id, el backend lo asigna automáticamente
      // Pero podemos pre-llenarlo con el usuario actual para mejor UX
      if (!taskData.responsible_user_id && user?.id) {
        // Intentar obtener el ID del usuario CRM correspondiente
        // Por ahora, dejamos que el backend lo maneje
      }

      const newTask = await crmService.createTask(taskData);
      setTasks(prev => [newTask, ...prev]);
      setTotal(prev => prev + 1);
      return newTask;
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    }
  }, [user]);

  const updateTask = useCallback(async (taskId: string, updates: TaskUpdateRequest): Promise<Task> => {
    try {
      const updatedTask = await crmService.updateTask(taskId, updates);
      setTasks(prev =>
        prev.map(task => (task.id === taskId ? updatedTask : task))
      );
      return updatedTask;
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      await crmService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  }, []);

  const completeTask = useCallback(async (taskId: string, resultText?: string): Promise<Task> => {
    try {
      const completedTask = await crmService.completeTask(taskId, resultText);
      setTasks(prev =>
        prev.map(task => (task.id === taskId ? completedTask : task))
      );
      return completedTask;
    } catch (err) {
      console.error('Error completing task:', err);
      throw err;
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchTasks(false);
    }
  }, [loading, hasMore, fetchTasks]);

  const refresh = useCallback(() => {
    setSkip(0);
    setHasMore(true);
    fetchTasks(true);
  }, [fetchTasks]);

  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [autoLoad]);

  // Refrescar cuando cambien los filtros
  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [JSON.stringify(filters)]);

  return {
    tasks,
    loading,
    error,
    total,
    hasMore,
    loadMore,
    refresh,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
  };
}

// Hook específico para calendario de tareas
interface UseCalendarTasksOptions {
  startDate?: Date;
  endDate?: Date;
  entityType?: 'contacts' | 'leads' | 'companies';
  responsibleUserId?: string; // Solo para admins
}

export function useCalendarTasks(options: UseCalendarTasksOptions = {}) {
  const { startDate, endDate, entityType, responsibleUserId } = options;
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCalendarTasks = useCallback(async () => {
    if (!startDate || !endDate) {
      setTasks([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ⚠️ CRÍTICO: Validación de seguridad
      // Solo admins pueden filtrar por responsible_user_id
      const isAdmin = user?.role === 'admin' || user?.is_superuser;
      const filters: any = {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      };

      if (entityType) {
        filters.entity_type = entityType;
      }

      // ⚠️ Solo admins pueden cambiar el responsable
      if (isAdmin && responsibleUserId) {
        filters.responsible_user_id = responsibleUserId;
      }
      // Si no es admin, el backend aplicará automáticamente el filtro por usuario actual

      const calendarTasks = await crmService.getCalendarTasks(filters);
      
      // ⚠️ Validación adicional de seguridad en el cliente
      // Verificar que las tareas recibidas son solo las del usuario (si no es admin)
      if (!isAdmin && user?.id) {
        const unauthorizedTasks = calendarTasks.filter(
          t => t.responsible_user_id && t.responsible_user_id !== user.id
        );
        
        if (unauthorizedTasks.length > 0) {
          console.error('⚠️ SEGURIDAD: Tareas ajenas detectadas', unauthorizedTasks);
          // Filtrar en el cliente como medida de seguridad adicional
          setTasks(calendarTasks.filter(t => !t.responsible_user_id || t.responsible_user_id === user.id));
        } else {
          setTasks(calendarTasks);
        }
      } else {
        setTasks(calendarTasks);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar tareas del calendario'));
      console.error('Error loading calendar tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, entityType, responsibleUserId, user]);

  useEffect(() => {
    fetchCalendarTasks();
  }, [fetchCalendarTasks]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchCalendarTasks,
  };
}
