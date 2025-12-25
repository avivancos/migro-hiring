// TaskForm - Formulario para crear/editar tareas

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Task, CRMUser, KommoContact, KommoLead } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { adminService } from '@/services/adminService';

interface TaskFormProps {
  task?: Task;
  defaultEntityType?: 'leads' | 'contacts' | 'companies';
  defaultEntityId?: string;
  defaultText?: string;
  defaultTaskType?: string;
  defaultCompleteTill?: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({ 
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
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [contacts, setContacts] = useState<KommoContact[]>([]);
  const [leads, setLeads] = useState<KommoLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<KommoLead | null>(null);
  const [selectedContact, setSelectedContact] = useState<KommoContact | null>(null);
  
  // Calcular fecha por defecto (mañana a las 10:00)
  const getDefaultDueDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16); // formato para input datetime-local
  };

  // Normalizar defaultEntityType a formato plural
  const normalizedEntityType = defaultEntityType || 'leads';

  const [formData, setFormData] = useState({
    text: task?.text || defaultText || '',
    task_type: task?.task_type || defaultTaskType || 'call',
    entity_type: task?.entity_type || normalizedEntityType,
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
    loadEntities();
  }, []);

  // Cargar entidades cuando cambie el tipo
  useEffect(() => {
    loadEntities();
  }, [formData.entity_type]);

  const loadUsers = async () => {
    try {
      const usersData = await crmService.getUsers(true);
      setUsers(usersData);
      
      // Pre-llenar responsable con el usuario actual si no hay uno ya asignado
      if (!formData.responsible_user_id) {
        const currentUser = adminService.getUser();
        if (currentUser?.id) {
          // Buscar el usuario actual en la lista de usuarios del CRM
          const currentCRMUser = usersData.find(u => u.id === currentUser.id || u.email === currentUser.email);
          if (currentCRMUser) {
            setFormData(prev => ({ ...prev, responsible_user_id: currentCRMUser.id }));
          } else if (usersData.length > 0) {
            // Si no se encuentra, usar el primero disponible
            setFormData(prev => ({ ...prev, responsible_user_id: usersData[0].id }));
          }
        } else if (usersData.length > 0) {
          setFormData(prev => ({ ...prev, responsible_user_id: usersData[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadEntities = async () => {
    setLoadingEntities(true);
    try {
      // Si viene un defaultEntityId, cargar específicamente esa entidad
      if (defaultEntityId && defaultEntityType) {
        if (defaultEntityType === 'leads') {
          try {
            const lead = await crmService.getLead(defaultEntityId);
            setSelectedLead(lead);
            setLeads([lead]);
            // Cargar también el contacto asociado si existe
            if (lead.contact_id) {
              try {
                const contact = await crmService.getContact(lead.contact_id);
                setSelectedContact(contact);
              } catch (err) {
                console.warn('Error loading contact for lead:', err);
              }
            }
          } catch (err) {
            console.error('Error loading lead:', err);
            setSelectedLead(null);
          }
        } else if (defaultEntityType === 'contacts') {
          try {
            const contact = await crmService.getContact(defaultEntityId);
            setSelectedContact(contact);
            setContacts([contact]);
          } catch (err) {
            console.error('Error loading contact:', err);
            setSelectedContact(null);
          }
        }
      } else {
        // Cargar lista de entidades
        if (formData.entity_type === 'contacts') {
          const contactsData = await crmService.getContacts({ limit: 100 });
          setContacts(contactsData.items || []);
          setLeads([]);
        } else if (formData.entity_type === 'leads') {
          const leadsData = await crmService.getLeads({ limit: 100 });
          setLeads(leadsData.items || []);
          setContacts([]);
        }
      }
    } catch (err) {
      console.error('Error loading entities:', err);
      setContacts([]);
      setLeads([]);
    } finally {
      setLoadingEntities(false);
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
                Solo abogados y administradores pueden ser responsables
              </p>
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
                  <option value="leads">Lead</option>
                  <option value="contacts">Contacto</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona si la tarea está relacionada con un Lead o un Contacto
                </p>
              </div>
            )}

            {/* ID de entidad - Oculto si viene predefinido */}
            {!defaultEntityId && (
              <div className="md:col-span-2">
                <Label htmlFor="entity_id">
                  {formData.entity_type === 'leads' ? 'Lead' : 'Contacto'}
                  <span className="text-red-500">*</span>
                </Label>
                <select
                  id="entity_id"
                  value={formData.entity_id}
                  onChange={(e) => handleChange('entity_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px]"
                  required
                  disabled={loadingEntities}
                >
                  <option value="">
                    {loadingEntities 
                      ? 'Cargando...' 
                      : `Seleccionar ${formData.entity_type === 'leads' ? 'lead' : 'contacto'}...`}
                  </option>
                  {formData.entity_type === 'contacts' ? (
                    contacts.map(contact => {
                      const displayName = contact.name || 
                        `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 
                        contact.email || 
                        `Contacto ${contact.id?.slice(0, 8) || 'N/A'}`;
                      return (
                        <option key={contact.id} value={contact.id}>
                          {displayName}
                        </option>
                      );
                    })
                  ) : (
                    leads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name || `Lead ${lead.id?.slice(0, 8) || 'N/A'}`}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
            {/* Mostrar información del lead/contacto cuando viene predefinido */}
            {defaultEntityId && defaultEntityType && (
              <div className="md:col-span-2 space-y-2">
                <div>
                  <Label>Relacionado con</Label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                    {defaultEntityType === 'leads' ? (
                      <div>
                        <div className="text-gray-700">
                          <strong>Lead:</strong> {selectedLead?.name || leads.find(l => l.id === defaultEntityId)?.name || `Lead ${defaultEntityId?.slice(0, 8) || 'N/A'}`}
                        </div>
                        {selectedContact && (
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Contacto asociado:</strong> {
                              selectedContact.name || 
                              `${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim() || 
                              selectedContact.email || 
                              `Contacto ${selectedContact.id?.slice(0, 8) || 'N/A'}`
                            }
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-700">
                        <strong>Contacto:</strong> {
                          selectedContact?.name || 
                          contacts.find(c => c.id === defaultEntityId)?.name || 
                          contacts.find(c => c.id === defaultEntityId)?.email || 
                          `Contacto ${typeof defaultEntityId === 'string' ? defaultEntityId.slice(0, 8) : defaultEntityId || 'N/A'}`
                        }
                      </span>
                    )}
                  </div>
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
}

