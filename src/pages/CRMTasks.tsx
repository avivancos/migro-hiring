// CRM Tasks - Página principal de tareas
// Mobile-first con diseño moderno usando nuevos componentes

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TaskList from '@/components/CRM/Tasks/TaskList';
import TaskForm from '@/components/CRM/TaskForm';
import type { TaskFilters, TaskCreateRequest } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, ArrowLeft, Calendar } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { crmService } from '@/services/crmService';

export function CRMTasks() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({
    is_completed: false, // Por defecto mostrar pendientes
  });
  
  const { createTask, completeTask, refresh } = useTasks({
    filters,
    autoLoad: true,
    pageSize: 20,
  });

  const handleCreateTask = async (taskData: TaskCreateRequest) => {
    try {
      await createTask(taskData);
      setShowForm(false);
      refresh();
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Error al crear la tarea');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      refresh();
    } catch (err) {
      console.error('Error completing task:', err);
      alert('Error al completar la tarea');
    }
  };

  const handleTaskPress = (task: any) => {
    navigate(`/crm/tasks/${task.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/crm')}
              variant="ghost"
              size="icon"
              className="md:hidden"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tareas</h1>
              <p className="text-gray-600 mt-1">
                Gestiona tus tareas y recordatorios
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/crm/calendar')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Calendar size={18} />
              <span className="hidden md:inline">Calendario</span>
            </Button>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Plus size={18} />
              Nueva Tarea
            </Button>
          </div>
        </div>

        {/* Formulario de creación */}
        {showForm && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <TaskForm
                onSubmit={handleCreateTask}
                onCancel={() => setShowForm(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Lista de tareas */}
        <TaskList
          initialFilters={filters}
          showFilters={true}
          onTaskPress={handleTaskPress}
        />
      </div>
    </div>
  );
}
