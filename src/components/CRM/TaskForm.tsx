// TaskForm - Formulario para crear/editar tareas

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Task, CRMUser } from '@/types/crm';
import { crmService } from '@/services/crmService';

interface TaskFormProps {
  task?: Task;
  defaultEntityType?: 'lead' | 'contact' | 'company';
  defaultEntityId?: number;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({ 
  task, 
  defaultEntityType, 
  defaultEntityId, 
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

  const [formData, setFormData] = useState({
    text: task?.text || '',
    task_type: task?.task_type || 'call',
    entity_type: task?.entity_type || defaultEntityType || 'leads',
    entity_id: task?.entity_id || defaultEntityId || '',
    responsible_user_id: task?.responsible_user_id || '',
    complete_till: task?.complete_till 
      ? new Date(task.complete_till).toISOString().slice(0, 16) 
      : getDefaultDueDate(),
    task_template_id: task?.task_template_id || '',
    result_text: task?.result_text || '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await crmService.getUsers(true);
      setUsers(usersData);
      
      // Asignar primer usuario activo si no hay uno seleccionado
      if (!formData.responsible_user_id && usersData.length > 0) {
        setFormData(prev => ({ ...prev, responsible_user_id: usersData[0].id }));
      }
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
        entity_type: formData.entity_type === 'contact' ? 'contacts' : 
                     formData.entity_type === 'lead' ? 'leads' : 
                     formData.entity_type,
        entity_id: formData.entity_id,
        responsible_user_id: formData.responsible_user_id,
        complete_till: new Date(formData.complete_till).toISOString(),
      };
      
      if (formData.task_template_id) {
        submitData.task_template_id = formData.task_template_id;
      }
      
      await onSubmit(submitData);
    } catch (err) {
      console.error('Error submitting form:', err);
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                onChange={(e) => handleChange('responsible_user_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Seleccionar...</option>
                {users.map(user => (
                  <option key={user.id} value={String(user.id)}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha de vencimiento */}
            <div>
              <Label htmlFor="complete_till">
                Fecha de Vencimiento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="complete_till"
                type="datetime-local"
                value={formData.complete_till}
                onChange={(e) => handleChange('complete_till', e.target.value)}
                required
              />
            </div>

            {/* Tipo de entidad */}
            <div>
              <Label htmlFor="entity_type">
                Relacionado con <span className="text-red-500">*</span>
              </Label>
              <select
                id="entity_type"
                value={formData.entity_type}
                onChange={(e) => handleChange('entity_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                disabled={!!defaultEntityType}
              >
                <option value="leads">Lead</option>
                <option value="contacts">Contacto</option>
              </select>
            </div>

            {/* ID de entidad */}
            {!defaultEntityId && (
              <div className="md:col-span-2">
                <Label htmlFor="entity_id">
                  ID de {formData.entity_type === 'leads' ? 'Lead' : 'Contacto'}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="entity_id"
                  type="text"
                  value={formData.entity_id}
                  onChange={(e) => handleChange('entity_id', e.target.value)}
                  placeholder="UUID"
                  required
                />
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
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Guardando...' : task ? 'Actualizar' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

