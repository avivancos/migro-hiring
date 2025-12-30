// Hook personalizado para gestionar tareas CRM
// Mobile-first con paginación y filtros

import { useState, useEffect, useCallback } from 'react';
import { crmService } from '@/services/crmService';
import type { Task, TaskCreateRequest, TaskUpdateRequest, TaskFilters } from '@/types/crm';
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

      // ⚠️ IMPORTANTE: Los usuarios regulares NO pueden filtrar por otros usuarios
      // El backend aplica automáticamente el filtro de seguridad
      // Solo admins pueden usar responsible_user_id para filtrar
      const isAdmin = user?.role === 'admin' || user?.is_superuser;
      if (!isAdmin && requestFilters.responsible_user_id) {
        // Remover el filtro para usuarios regulares - el backend lo aplicará automáticamente
        delete requestFilters.responsible_user_id;
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
  }, [filters, skip, pageSize, loading, user]);

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

