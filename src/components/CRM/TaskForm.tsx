// TaskForm - Formulario para crear/editar tareas

import { useState, useEffect, memo } from 'react';
import type { FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/DateInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ContactSearchSelect } from './ContactSearchSelect';
import type { Task, CRMUser } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { adminService } from '@/services/adminService';

interface TaskFormProps {
  task?: Task;
  defaultEntityType?: 'contacts' | 'companies';
  defaultEntityId?: string;
  defaultText?: string;
  defaultTaskType?: string;
  defaultCompleteTill?: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const TaskForm = memo(function TaskForm({ 
  task, 
  defaultEntityType, 
  defaultEntityId,
  defaultText,
  defaultTaskType,
  defaultCompleteTill,
  onSubmit, 
  onCancel 
}: TaskFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<CRMUser[]>([]);
  
  // Calcular fecha por defecto (mañana a las 10:00)
  const getDefaultDueDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16); // formato para input datetime-local
  };

  // Normalizar defaultEntityType a formato plural
  const normalizedEntityType = defaultEntityType || 'contacts';

  const [formData, setFormData] = useState({
    text: task?.text || defaultText || '',
    task_type: task?.task_type || defaultTaskType || 'call',
    entity_type: (task?.entity_type === 'leads' ? 'contacts' : task?.entity_type) || normalizedEntityType,
    entity_id: task?.entity_id || defaultEntityId || '',
    responsible_user_id: task?.responsible_user_id || '',
    complete_till: task?.complete_till 
      ? new Date(task.complete_till).toISOString().slice(0, 16)
      : defaultCompleteTill
        ? new Date(defaultCompleteTill).toISOString().slice(0, 16)
        : getDefaultDueDate(),
    task_template_id: task?.task_template_id || '',
    result_text: task?.result_text || '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Usar el nuevo endpoint optimizado que devuelve solo responsables (lawyers y agents)
      const usersData = await crmService.getResponsibleUsers(true);
      setUsers(usersData);
      
      // Pre-llenar responsable con el usuario actual si no hay uno ya asignado
      setFormData(prev => {
        // Si ya hay un responsable asignado, mantenerlo
        if (prev.responsible_user_id && prev.responsible_user_id.trim() !== '') {
          return prev;
        }
        
        // SIEMPRE buscar el usuario de la sesión - NO usar fallback del primer usuario
        const currentUser = adminService.getUser();
        if (currentUser?.id || currentUser?.email) {
          const currentEmail = currentUser.email?.toLowerCase();
          const currentCRMUser = usersData.find(u => {
            const matchesId = u.id === currentUser.id;
            const matchesEmail = u.email === currentUser.email || (currentEmail && u.email?.toLowerCase() === currentEmail);
            return matchesId || matchesEmail;
          });
          
          if (currentCRMUser) {
            console.log('✅ [TaskForm] Usuario de sesión encontrado, preseleccionando:', currentCRMUser.id, currentCRMUser.name || currentCRMUser.email);
            return { ...prev, responsible_user_id: currentCRMUser.id };
          } else {
            console.error('❌ [TaskForm] Usuario de sesión NO encontrado en lista de responsables:', {
              sessionUser: { id: currentUser.id, email: currentUser.email },
              availableUsers: usersData.map(u => ({ id: u.id, email: u.email }))
            });
          }
        }
        
        // NO usar fallback - si no se encuentra el usuario de sesión, dejar vacío
        return prev;
        
        return prev;
      });
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convertir fecha a ISO string completo y normalizar entity_type
      const submitData: any = {
        text: formData.text,
        task_type: formData.task_type,
        entity_type: formData.entity_type,
        entity_id: formData.entity_id,
        responsible_user_id: formData.responsible_user_id,
        complete_till: new Date(formData.complete_till).toISOString(),
      };
      
      if (formData.task_template_id) {
        submitData.task_template_id = formData.task_template_id;
      }
      
      await onSubmit(submitData);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      // Manejar error 400 relacionado con responsible_user_id
      if (err?.response?.status === 400) {
        const errorDetail = err?.response?.data?.detail || '';
        if (errorDetail.includes('responsible') || errorDetail.includes('Only users with role')) {
          alert('Solo abogados y administradores pueden ser responsables. Por favor, selecciona un usuario válido.');
          return;
        }
      }
      // Re-lanzar el error para que el componente padre lo maneje
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const taskTypes = [
    { value: 'call', label: 'Llamada' },
    { value: 'meeting', label: 'Reunión' },
    { value: 'email', label: 'Email' },
    { value: 'deadline', label: 'Fecha Límite' },
    { value: 'follow_up', label: 'Seguimiento' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {task ? 'Editar Tarea' : 'Nueva Tarea'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descripción */}
          <div>
            <Label htmlFor="text">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="text"
              value={formData.text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('text', e.target.value)}
              placeholder="Ej: Llamar al cliente para confirmar cita"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de tarea */}
            <div>
              <Label htmlFor="task_type">
                Tipo <span className="text-red-500">*</span>
              </Label>
              <select
                id="task_type"
                value={formData.task_type}
                onChange={(e) => handleChange('task_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px]"
                required
              >
                {taskTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Responsable */}
            <div>
              <Label htmlFor="responsible_user_id">
                Responsable <span className="text-red-500">*</span>
              </Label>
              <select
                id="responsible_user_id"
                value={formData.responsible_user_id}
                onChange={(e) => handleChange('responsible_user_id', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px]"
                required
              >
                <option value="">Seleccionar...</option>
                {users.map(user => {
                  const displayName = user.name?.trim() || user.email || `Usuario ${user.id?.slice(0, 8) || 'N/A'}`;
                  return (
                    <option key={user.id} value={user.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Solo abogados y agentes pueden ser responsables
              </p>
            </div>

            {/* Fecha de vencimiento */}
            <div>
              <Label htmlFor="complete_till">
                Fecha de Vencimiento <span className="text-red-500">*</span>
              </Label>
              <DateInput
                id="complete_till"
                type="datetime-local"
                value={formData.complete_till}
                onChange={(e) => handleChange('complete_till', e.target.value)}
                required
              />
            </div>

            {/* Tipo de entidad - Oculto si viene predefinido */}
            {!defaultEntityType && (
              <div>
                <Label htmlFor="entity_type">
                  Relacionado con <span className="text-red-500">*</span>
                </Label>
                <select
                  id="entity_type"
                  value={formData.entity_type}
                  onChange={(e) => handleChange('entity_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px]"
                  required
                >
                  <option value="contacts">Contacto</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  La tarea está relacionada con un Contacto
                </p>
              </div>
            )}

            {/* ID de entidad - Oculto si viene predefinido */}
            {!defaultEntityId && (
              <div className="md:col-span-2">
                <ContactSearchSelect
                  value={formData.entity_id}
                  onChange={(contactId) => handleChange('entity_id', contactId)}
                  label="Contacto"
                  required
                />
              </div>
            )}
            {/* Mostrar información del contacto cuando viene predefinido */}
            {defaultEntityId && defaultEntityType === 'contacts' && (
              <div className="md:col-span-2">
                <Label>Relacionado con</Label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <span className="text-gray-700">
                    <strong>Contacto:</strong> {
                      typeof defaultEntityId === 'string' 
                        ? `ID: ${defaultEntityId.slice(0, 8)}...` 
                        : defaultEntityId || 'N/A'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Resultado (solo para tareas completadas) */}
          {task?.is_completed && (
            <div>
              <Label htmlFor="result_text">Resultado</Label>
              <Textarea
                id="result_text"
                value={formData.result_text}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('result_text', e.target.value)}
                placeholder="Resultado de la tarea..."
                rows={2}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={loading}
            >
              {loading ? 'Guardando...' : task ? 'Actualizar' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada: solo re-renderizar si cambian props relevantes
  return (
    prevProps.task?.id === nextProps.task?.id &&
    prevProps.defaultEntityType === nextProps.defaultEntityType &&
    prevProps.defaultEntityId === nextProps.defaultEntityId &&
    prevProps.defaultText === nextProps.defaultText
  );
});

