// TaskTableRow - Componente memoizado para filas de tabla de tareas
// Optimizado para evitar re-renders innecesarios en tablas grandes

import { memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Task } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/formatters';
import { BellIcon } from '@heroicons/react/24/outline';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/outline';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { PhoneIcon } from '@heroicons/react/24/outline';
import { UserIcon } from '@heroicons/react/24/outline';
import { UsersIcon } from '@heroicons/react/24/outline';

interface TaskTableRowProps {
  task: Task;
  onSelect?: (task: Task) => void;
}

// Helper para formatear solo la hora
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

const getTaskTypeIcon = (type?: string | null) => {
  switch (type) {
    case 'call':
      return PhoneIcon;
    case 'meeting':
      return UsersIcon;
    case 'email':
      return EnvelopeIcon;
    case 'reminder':
      return BellIcon;
    default:
      return CheckIcon;
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

// Componente memoizado - solo se re-renderiza si cambian las props
export const TaskTableRow = memo<TaskTableRowProps>(({ task, onSelect }) => {
  const navigate = useNavigate();
  const isOverdue = task.complete_till && 
    new Date(task.complete_till) < new Date() && 
    !task.is_completed;
  const Icon = getTaskTypeIcon(task.task_type);

  const handleClick = () => {
    if (onSelect) {
      onSelect(task);
    } else {
      navigate(`/crm/tasks/${task.id}`);
    }
  };

  return (
    <tr
      className={`hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${task.is_completed ? 'opacity-75' : ''}`}
      onClick={handleClick}
    >
      {/* Tipo */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${task.is_completed ? 'bg-gray-100' : isOverdue ? 'bg-red-100' : 'bg-blue-100'}`}>
            <Icon className={`w-4 h-4 ${task.is_completed ? 'text-gray-600' : isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <span className="text-sm font-medium text-gray-900">
            {getTaskTypeLabel(task.task_type)}
          </span>
        </div>
      </td>

      {/* Texto/Título */}
      <td className="px-4 py-3">
        <div className={`text-sm ${task.is_completed ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
          {task.text}
        </div>
      </td>

      {/* Contacto */}
      <td className="px-4 py-3">
        {task.contact_id && task.contact_name ? (
          <Link
            to={`/crm/contacts/${task.contact_id}`}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            onClick={(e) => e.stopPropagation()}
          >
            <UserIcon className="w-4 h-4" />
            <span className="truncate max-w-[150px]">{task.contact_name}</span>
          </Link>
        ) : task.entity_id && task.entity_type ? (
          <Link
            to={`/crm/${task.entity_type}/${task.entity_id}`}
            className="text-sm text-blue-600 hover:text-blue-700"
            onClick={(e) => e.stopPropagation()}
          >
            Ver {task.entity_type === 'contacts' ? 'contacto' : task.entity_type === 'leads' ? 'lead' : 'entidad'}
          </Link>
        ) : (
          <span className="text-sm text-gray-400">Sin contacto</span>
        )}
      </td>

      {/* Fecha límite */}
      <td className="px-4 py-3">
        {task.complete_till ? (
          <div className="flex items-center gap-2">
            <CalendarIcon className={`w-4 h-4 ${isOverdue && !task.is_completed ? 'text-red-600' : 'text-gray-400'}`} />
            <div className="text-sm">
              <div className={isOverdue && !task.is_completed ? 'text-red-600 font-medium' : 'text-gray-900'}>
                {formatDate(task.complete_till)}
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(task.complete_till)}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Sin fecha</span>
        )}
      </td>

      {/* Estado */}
      <td className="px-4 py-3">
        {task.is_completed ? (
          <Badge variant="success">Completada</Badge>
        ) : isOverdue ? (
          <Badge variant="error">Vencida</Badge>
        ) : (
          <Badge variant="neutral">Pendiente</Badge>
        )}
      </td>

      {/* Fecha de creación */}
      <td className="px-4 py-3">
        <div className="text-sm text-gray-600">
          {formatDate(task.created_at)}
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Comparación optimizada: solo re-renderizar si cambian datos relevantes
  if (prevProps.task.id !== nextProps.task.id) return false;
  
  const relevantFields = [
    'text', 'task_type', 'is_completed', 'complete_till', 'contact_id', 
    'contact_name', 'entity_id', 'entity_type', 'created_at'
  ];
  
  for (const field of relevantFields) {
    const prevValue = (prevProps.task as any)[field];
    const nextValue = (nextProps.task as any)[field];
    if (prevValue !== nextValue) return false;
  }
  
  return true; // No re-renderizar
});

TaskTableRow.displayName = 'TaskTableRow';
