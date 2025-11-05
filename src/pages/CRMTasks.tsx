// CRM Tasks - Gestión de tareas

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services/adminService';
import { crmService } from '@/services/crmService';
import type { Task, CRMUser } from '@/types/crm';
import {
  ArrowLeft,
  CheckSquare,
  Calendar,
  Phone,
  Mail,
  Users,
  Clock,
  Plus,
} from 'lucide-react';

export function CRMTasks() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    loadData();
  }, [navigate, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksResponse, usersData] = await Promise.all([
        crmService.getTasks({
          is_completed: filter === 'pending' ? false : filter === 'completed' ? true : undefined,
          page: 1,
          limit: 100,
        }),
        crmService.getUsers(true),
      ]);
      
      setTasks(tasksResponse._embedded.tasks);
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await crmService.completeTask(taskId);
      await loadData();
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'call':
        return Phone;
      case 'email':
        return Mail;
      case 'meeting':
        return Users;
      default:
        return CheckSquare;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Vencida';
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Mañana';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const isOverdue = (dueDate: string): boolean => {
    return new Date(dueDate) < new Date();
  };

  const groupTasksByDate = (tasks: Task[]) => {
    const today: Task[] = [];
    const upcoming: Task[] = [];
    const overdue: Task[] = [];

    tasks.forEach(task => {
      if (isOverdue(task.due_date) && !task.is_completed) {
        overdue.push(task);
      } else if (formatDate(task.due_date) === 'Hoy') {
        today.push(task);
      } else {
        upcoming.push(task);
      }
    });

    return { overdue, today, upcoming };
  };

  const { overdue, today, upcoming } = groupTasksByDate(tasks);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/admin/crm')}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tareas</h1>
              <p className="text-gray-600 mt-1">
                {tasks.filter(t => !t.is_completed).length} tareas pendientes
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/admin/crm/tasks/new')}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Nueva Tarea
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            className={filter === 'pending' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Pendientes ({tasks.filter(t => !t.is_completed).length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
          >
            Completadas ({tasks.filter(t => t.is_completed).length})
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Todas ({tasks.length})
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando tareas...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overdue Tasks */}
            {overdue.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-red-600 mb-4">
                  Vencidas ({overdue.length})
                </h2>
                <div className="space-y-3">
                  {overdue.map((task) => {
                    const Icon = getTaskIcon(task.task_type);
                    return (
                      <Card key={task.id} className="border-l-4 border-red-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="bg-red-100 p-2 rounded text-red-600">
                              <Icon size={20} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{task.text}</h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock size={14} />
                                  {formatDate(task.due_date)}
                                </span>
                                <span>{task.task_type}</span>
                                <span>{task.entity_type} #{task.entity_id}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleCompleteTask(task.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckSquare size={16} className="mr-1" />
                              Completar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Today's Tasks */}
            {today.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-orange-600 mb-4">
                  Hoy ({today.length})
                </h2>
                <div className="space-y-3">
                  {today.map((task) => {
                    const Icon = getTaskIcon(task.task_type);
                    return (
                      <Card key={task.id} className="border-l-4 border-orange-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="bg-orange-100 p-2 rounded text-orange-600">
                              <Icon size={20} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{task.text}</h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span>{task.task_type}</span>
                                <span>{task.entity_type} #{task.entity_id}</span>
                              </div>
                            </div>
                            {!task.is_completed && (
                              <Button
                                size="sm"
                                onClick={() => handleCompleteTask(task.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Completar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Tasks */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-blue-600 mb-4">
                  Próximas ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map((task) => {
                    const Icon = getTaskIcon(task.task_type);
                    return (
                      <Card key={task.id} className="border-l-4 border-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="bg-blue-100 p-2 rounded text-blue-600">
                              <Icon size={20} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{task.text}</h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {formatDate(task.due_date)}
                                </span>
                                <span>{task.task_type}</span>
                                <span>{task.entity_type} #{task.entity_id}</span>
                              </div>
                            </div>
                            {!task.is_completed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteTask(task.id)}
                              >
                                Completar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {tasks.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">
                    {filter === 'pending' ? 'No tienes tareas pendientes' : 'No hay tareas'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

