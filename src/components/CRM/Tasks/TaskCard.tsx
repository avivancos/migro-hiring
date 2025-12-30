// TaskCard - Card individual de tarea
// Mobile-first con enlaces a contactos y navegación

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Task } from '@/types/crm';
import { formatDate, formatDateTime } from '@/utils/formatters';

// Helper para formatear solo la hora
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};
import {
  Phone,
  Mail,
  Users,
  Bell,
  CheckSquare,
  Calendar,
  User,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onComplete?: (taskId: string) => void;
  onPress?: () => void;
  showActions?: boolean;
}

export default function TaskCard({ 
  task, 
  onComplete, 
  onPress,
  showActions = true 
}: TaskCardProps) {
  const isOverdue = task.complete_till && 
    new Date(task.complete_till) < new Date() && 
    !task.is_completed;

  const getTaskTypeIcon = (type?: string | null) => {
    switch (type) {
      case 'call':
        return Phone;
      case 'meeting':
        return Users;
      case 'email':
        return Mail;
      case 'reminder':
        return Bell;
      default:
        return CheckSquare;
    }
  };

  const getTaskTypeLabel = (type?: string | null) => {
    const labels: Record<string, string> = {
      call: 'Llamada',
      meeting: 'Reunión',
      email: 'Email',
      reminder: 'Recordatorio',
      other: 'Otro',
    };
    return labels[type || 'other'] || 'Tarea';
  };

  const Icon = getTaskTypeIcon(task.task_type);

  return (
    <Card 
      className={`task-card-mobile ${isOverdue ? 'overdue border-l-4 border-red-500' : ''} ${task.is_completed ? 'opacity-75' : ''}`}
      onClick={onPress}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onPress?.()}
    >
      <CardContent className="pt-4">
        {/* Header con tipo y estado */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${task.is_completed ? 'bg-gray-100' : isOverdue ? 'bg-red-100' : 'bg-blue-100'}`}>
              <Icon size={18} className={task.is_completed ? 'text-gray-600' : isOverdue ? 'text-red-600' : 'text-blue-600'} />
            </div>
            <span className={`text-sm font-medium ${task.is_completed ? 'text-gray-600' : isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              {getTaskTypeLabel(task.task_type)}
            </span>
          </div>
          {task.is_completed && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              ✓ Completada
            </span>
          )}
          {isOverdue && !task.is_completed && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              ⚠ Vencida
            </span>
          )}
        </div>

        {/* Contenido principal */}
        <div className="mb-3">
          <h3 className={`font-medium mb-2 ${task.is_completed ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
            {task.text}
          </h3>
          
          {/* Fecha límite destacada */}
          {task.complete_till && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Calendar size={14} />
              <span>
                {formatDate(task.complete_till)} a las {formatTime(task.complete_till)}
              </span>
            </div>
          )}

          {/* ✅ ENLACE A CONTACTO - Destacado */}
          {task.contact_id && task.contact_name && (
            <Link 
              to={`/crm/contacts/${task.contact_id}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors mb-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-600" />
                <div className="text-sm">
                  <div className="text-gray-500">Contacto</div>
                  <div className="font-medium text-gray-900">{task.contact_name}</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          )}

          {/* Enlace a entidad si no es contacto */}
          {task.entity_id && task.entity_type && !task.contact_id && (
            <Link 
              to={`/crm/${task.entity_type}/${task.entity_id}`}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              Ver {task.entity_type === 'contacts' ? 'contacto' : task.entity_type === 'leads' ? 'lead' : 'entidad'}
              <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {/* Acciones rápidas */}
        {showActions && (
          <div className="flex gap-2 pt-3 border-t">
            {!task.is_completed && onComplete && (
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete(task.id);
                }}
              >
                <CheckSquare size={16} className="mr-1" />
                Completar
              </Button>
            )}
            <Link 
              to={`/crm/tasks/${task.id}`}
              className="flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="outline"
                className="w-full"
              >
                <Eye size={16} className="mr-1" />
                Detalles
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

