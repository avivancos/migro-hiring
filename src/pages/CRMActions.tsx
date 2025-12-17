// CRMActions - Vista enfocada en acciones y tareas prioritarias para cerrar ventas

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  Calendar, 
  FileText,
  TrendingUp,
  User,
  ArrowRight
} from 'lucide-react';
import type { Task, KommoLead, KommoContact } from '@/types/crm';
import { crmService } from '@/services/crmService';

interface ActionItem {
  id: string;
  type: 'task' | 'call' | 'expediente';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  dueDate: string;
  entityId: string;
  entityType: 'contacts' | 'leads';
  entityName: string;
  status: string;
  relatedLead?: KommoLead;
  relatedContact?: KommoContact;
}

export function CRMActions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'today' | 'this_week'>('all');

  useEffect(() => {
    loadActions();
  }, [filter]);

  const loadActions = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Cargar tareas pendientes
      const tasksResponse = await crmService.getTasks({
        is_completed: false,
        limit: 100,
      });

      // Cargar todos los contactos (los leads están unificados con contactos)
      const allLeads = await crmService.getAllContacts().catch(() => []) as any;

      const actionItems: ActionItem[] = [];

      // Procesar tareas
      tasksResponse.items.forEach((task: Task) => {
        if (!task.complete_till) return;
        
        const dueDate = new Date(task.complete_till);
        const isUrgent = dueDate <= new Date(Date.now() + 24 * 60 * 60 * 1000); // Próximas 24h
        const isToday = dueDate.toDateString() === today.toDateString();
        const isThisWeek = dueDate >= today && dueDate <= weekEnd;

        if (filter === 'urgent' && !isUrgent) return;
        if (filter === 'today' && !isToday) return;
        if (filter === 'this_week' && !isThisWeek && !isToday) return;

        actionItems.push({
          id: task.id,
          type: 'task',
          priority: isUrgent ? 'urgent' : dueDate <= weekEnd ? 'high' : 'medium',
          title: task.text,
          description: `Tarea: ${task.task_type}`,
          dueDate: task.complete_till,
          entityId: task.entity_id,
          entityType: task.entity_type as 'contacts' | 'leads',
          entityName: 'Cargando...',
          status: task.is_completed ? 'completed' : 'pending',
        });
      });

      // Procesar leads que necesitan acción
      allLeads.forEach((lead: KommoLead) => {
        if (lead.status === 'won' || lead.status === 'lost') return;

        const needsAction = 
          !lead.closest_task_at || 
          new Date(lead.closest_task_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        if (needsAction) {
          actionItems.push({
            id: lead.id,
            type: 'expediente',
            priority: lead.priority === 'urgent' ? 'urgent' : 
                     lead.priority === 'high' ? 'high' : 'medium',
            title: `Expediente: ${lead.name}`,
            description: lead.service_type || 'Expediente legal',
            dueDate: lead.closest_task_at || lead.expected_close_date || lead.created_at,
            entityId: lead.id,
            entityType: 'leads',
            entityName: lead.contact?.name || lead.name,
            status: lead.status,
            relatedLead: lead,
          });
        }
      });

      // Ordenar por prioridad y fecha
      actionItems.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      setActions(actionItems);
    } catch (err) {
      console.error('Error loading actions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 size={18} />;
      case 'call':
        return <Phone size={18} />;
      case 'expediente':
        return <FileText size={18} />;
      default:
        return <AlertCircle size={18} />;
    }
  };

  const handleActionClick = (action: ActionItem) => {
    if (action.entityType === 'leads') {
      navigate(`/crm/leads/${action.entityId}`);
    } else {
      navigate(`/crm/contacts/${action.entityId}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Vencida hace ${Math.abs(diffDays)} días`;
    } else if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Mañana';
    } else if (diffDays <= 7) {
      return `En ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <div className="w-full">
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Acciones y Tareas</h1>
            <p className="text-gray-600 mt-1">Gestiona las acciones prioritarias para cerrar ventas y expedientes</p>
          </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={filter === 'urgent' ? 'default' : 'outline'}
              onClick={() => setFilter('urgent')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <AlertCircle size={16} className="mr-2" />
              Urgentes
            </Button>
            <Button
              variant={filter === 'today' ? 'default' : 'outline'}
              onClick={() => setFilter('today')}
            >
              <Calendar size={16} className="mr-2" />
              Hoy
            </Button>
            <Button
              variant={filter === 'this_week' ? 'default' : 'outline'}
              onClick={() => setFilter('this_week')}
            >
              Esta Semana
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">
                  {actions.filter(a => a.priority === 'urgent').length}
                </p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hoy</p>
                <p className="text-2xl font-bold text-orange-600">
                  {actions.filter(a => {
                    const due = new Date(a.dueDate);
                    return due.toDateString() === new Date().toDateString();
                  }).length}
                </p>
              </div>
              <Clock className="text-orange-600" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Esta Semana</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {actions.filter(a => {
                    const due = new Date(a.dueDate);
                    const weekEnd = new Date();
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    return due <= weekEnd && due >= new Date();
                  }).length}
                </p>
              </div>
              <Calendar className="text-yellow-600" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{actions.length}</p>
              </div>
              <TrendingUp className="text-gray-600" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Acciones */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Prioritarias</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Cargando acciones...</div>
          ) : actions.length > 0 ? (
            <div className="space-y-3">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleActionClick(action)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${
                        action.type === 'task' ? 'bg-blue-100 text-blue-600' :
                        action.type === 'call' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {getTypeIcon(action.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{action.title}</h3>
                          <Badge className={getPriorityColor(action.priority)}>
                            {action.priority === 'urgent' ? 'Urgente' :
                             action.priority === 'high' ? 'Alta' :
                             action.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            {action.entityName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDate(action.dueDate)}
                          </div>
                          {action.relatedLead && (
                            <div className="flex items-center gap-1">
                              <TrendingUp size={14} />
                              {action.relatedLead.status}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-400" size={20} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No hay acciones pendientes
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}


