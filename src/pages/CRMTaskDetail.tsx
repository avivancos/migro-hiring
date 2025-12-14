// CRM Task Detail - Vista detallada de una tarea

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { crmService } from '@/services/crmService';
import type { Task, CRMUser, KommoContact, KommoLead } from '@/types/crm';
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Users,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { CRMHeader } from '@/components/CRM/CRMHeader';
import { TaskForm } from '@/components/CRM/TaskForm';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export function CRMTaskDetail() {
  const { isAuthenticated, isValidating, LoginComponent } = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [entity, setEntity] = useState<KommoContact | KommoLead | null>(null);
  const [entityNotFound, setEntityNotFound] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && id) {
      loadTaskData();
    }
  }, [id, isAuthenticated]);

  const loadTaskData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [taskData, usersData] = await Promise.all([
        crmService.getTask(id),
        crmService.getUsers(true).catch(() => []),
      ]);

      setTask(taskData);
      setUsers(usersData);

      // Cargar la entidad asociada (contacto o lead unificado)
      // Nota: Los leads ahora están unificados con contactos, siempre usar getContact
      if (taskData.entity_id) {
        console.log('🔍 [CRMTaskDetail] Cargando entidad asociada:', {
          entity_id: taskData.entity_id,
          entity_type: taskData.entity_type,
        });
        setEntityNotFound(false);
        try {
          // Intentar cargar como contacto primero (ya que leads están unificados)
          const contact = await crmService.getContact(taskData.entity_id).catch(async (err) => {
            // Si falla, intentar como lead (fallback para compatibilidad)
            console.warn('⚠️ [CRMTaskDetail] No se pudo cargar como contacto, intentando como lead:', err);
            try {
              const lead = await crmService.getLead(taskData.entity_id);
              return lead as any;
            } catch (leadErr) {
              console.error('❌ [CRMTaskDetail] Tampoco se pudo cargar como lead:', leadErr);
              // Marcar que la entidad no se encontró
              setEntityNotFound(true);
              setEntity(null);
              return null;
            }
          });
          if (contact) {
            console.log('✅ [CRMTaskDetail] Entidad cargada exitosamente:', contact?.id, contact?.name);
            setEntity(contact);
            setEntityNotFound(false);
          } else {
            setEntityNotFound(true);
          }
        } catch (err) {
          console.error('❌ [CRMTaskDetail] Error loading entity:', err);
          setEntityNotFound(true);
          setEntity(null);
          // No es crítico si no se puede cargar la entidad, el botón seguirá funcionando con entity_id
        }
      } else {
        console.warn('⚠️ [CRMTaskDetail] La tarea no tiene entity_id asociado');
        setEntityNotFound(false);
      }
    } catch (err: any) {
      console.error('Error loading task:', err);
      const errorMessage = err?.response?.status === 404 
        ? 'Tarea no encontrada' 
        : err?.response?.data?.detail || err?.message || 'Error al cargar la tarea';
      setError(errorMessage);
      setTask(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!id) return;
    try {
      await crmService.updateTask(id, data);
      setEditing(false);
      await loadTaskData();
    } catch (err: any) {
      console.error('Error updating task:', err);
      alert(err?.response?.data?.detail || err?.message || 'Error al actualizar la tarea');
    }
  };

  const handleComplete = async () => {
    if (!id || !task) return;
    try {
      await crmService.completeTask(id);
      await loadTaskData();
    } catch (err: any) {
      console.error('Error completing task:', err);
      alert(err?.response?.data?.detail || err?.message || 'Error al completar la tarea');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;
    try {
      await crmService.deleteTask(id);
      navigate('/crm/calendar');
    } catch (err: any) {
      console.error('Error deleting task:', err);
      alert(err?.response?.data?.detail || err?.message || 'Error al eliminar la tarea');
    }
  };

  const getUserName = (userId?: string): string => {
    if (!userId) return 'No especificado';
    const user = users.find(u => u.id === userId);
    if (!user) return `Usuario ${userId.slice(0, 8)}...`;
    return user.name?.trim() || user.email || `Usuario ${userId.slice(0, 8)}...`;
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTaskTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      call: 'Llamada',
      meeting: 'Reunión',
      email: 'Email',
      deadline: 'Fecha límite',
      follow_up: 'Seguimiento',
      reminder: 'Recordatorio',
      first_call: 'Primera llamada',
      note_sale: 'Nota de venta',
    };
    return labels[type] || type;
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
      case 'first_call':
        return Phone;
      case 'email':
        return Mail;
      case 'meeting':
        return Users;
      default:
        return FileText;
    }
  };

  // Mostrar spinner mientras valida la sesión
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <LoginComponent />;
  }

  // Si está cargando
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tarea...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si hay error
  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-900 font-semibold mb-4">{error || 'Tarea no encontrada'}</p>
                <Button onClick={() => navigate('/crm/calendar')} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al calendario
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const TaskTypeIcon = getTaskTypeIcon(task.task_type);

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Botón volver */}
          <Button variant="outline" onClick={() => navigate('/crm/calendar')}>
            <ArrowLeft size={18} className="mr-2" />
            Volver al calendario
          </Button>

          {editing ? (
            <Card>
              <CardHeader>
                <CardTitle>Editar Tarea</CardTitle>
              </CardHeader>
              <CardContent>
                <TaskForm
                  task={task}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditing(false)}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Información principal de la tarea */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-lg ${
                        task.is_completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <TaskTypeIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{task.text}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                            {getTaskTypeLabel(task.task_type)}
                          </span>
                          {task.is_completed ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Completada
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {task.entity_id && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Los leads están unificados con contactos, siempre navegar a contacts
                            console.log('🔗 [CRMTaskDetail] Navegando a contacto:', task.entity_id);
                            navigate(`/crm/contacts/${task.entity_id}`);
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ver contacto
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => setEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Fecha límite */}
                  {task.complete_till && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Fecha límite</p>
                        <p className="font-medium">{formatDate(task.complete_till)}</p>
                      </div>
                    </div>
                  )}

                  {/* Responsable */}
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Responsable</p>
                      <p className="font-medium">{getUserName(task.responsible_user_id)}</p>
                    </div>
                  </div>

                  {/* Resultado */}
                  {task.result_text && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Resultado</p>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{task.result_text}</p>
                    </div>
                  )}

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Creada</p>
                      <p className="text-sm font-medium">{formatDate(task.created_at)}</p>
                    </div>
                    {task.completed_at && (
                      <div>
                        <p className="text-sm text-gray-600">Completada</p>
                        <p className="text-sm font-medium">{formatDate(task.completed_at)}</p>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-4 border-t">
                    {!task.is_completed && (
                      <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Marcar como completada
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Entidad asociada */}
              {task.entity_id && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Contacto asociado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {entityNotFound ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-700 font-medium mb-1">
                            ⚠️ Contacto no encontrado
                          </p>
                          <p className="text-sm text-gray-600">
                            El contacto asociado (ID: {task.entity_id}) ya no existe en el sistema.
                            Puede haber sido eliminado o migrado.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Intentar navegar de todas formas, el componente de contacto manejará el 404
                            navigate(`/crm/contacts/${task.entity_id}`);
                          }}
                        >
                          Ver detalles
                          <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                        </Button>
                      </div>
                    ) : entity ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {(entity as KommoContact).name || 
                             `${(entity as KommoContact).first_name || ''} ${(entity as KommoContact).last_name || ''}`.trim() ||
                             (entity as KommoLead).name}
                          </p>
                          {(entity as KommoContact).email && (
                            <p className="text-sm text-gray-600 mt-1">
                              <Mail className="w-4 h-4 inline mr-1" />
                              {(entity as KommoContact).email}
                            </p>
                          )}
                          {((entity as KommoContact).phone || (entity as KommoLead).contact?.phone) && (
                            <p className="text-sm text-gray-600 mt-1">
                              <Phone className="w-4 h-4 inline mr-1" />
                              {(entity as KommoContact).phone || (entity as KommoLead).contact?.phone}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Los leads están unificados con contactos, siempre navegar a contacts
                            navigate(`/crm/contacts/${task.entity_id}`);
                          }}
                        >
                          Ver detalles
                          <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Cargando contacto...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
