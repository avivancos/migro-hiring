// LeadForm - Form to create/edit leads

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Lead, LeadCreateRequest, CRMUser, Contact } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { adminService } from '@/services/adminService';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface LeadFormProps {
  lead?: Lead;
  onSave: (lead: Lead) => void;
  onCancel: () => void;
}

// Función para validar UUID
const isUUID = (v?: string | null): boolean => {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
};

// Función para construir payload sin valores inválidos
function buildLeadPayload(form: any): LeadCreateRequest {
  return {
    name: (form.name ?? '').trim() || 'Nuevo contacto',
    status: form.status || null,
    pipeline_id: isUUID(form.pipeline_id) ? form.pipeline_id : null,
    contact_id: isUUID(form.contact_id) ? form.contact_id : null,
    company_id: isUUID(form.company_id) ? form.company_id : null,
    responsible_user_id: isUUID(form.responsible_user_id) ? form.responsible_user_id : null,
    price: Number.isFinite(form.price) ? form.price : null,
    currency: form.currency || 'EUR',
    priority: form.priority || 'medium',
    service_type: form.service_type || '',
    service_description: form.service_description || '',
    source: form.source || '',
    description: form.description || '',
  };
}

export function LeadForm({ lead, onSave, onCancel }: LeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [price, setPrice] = useState<number | null>(lead?.price ?? null);
  const [formData, setFormData] = useState<any>({
    name: lead?.name || '',
    currency: lead?.currency || 'EUR',
    status: lead?.status || 'new',
    pipeline_id: lead?.pipeline_id || undefined,
    responsible_user_id: lead?.responsible_user_id || undefined,
    priority: lead?.priority || 'medium',
    service_type: lead?.service_type || '',
    service_description: lead?.service_description || '',
    source: lead?.source || '',
    description: lead?.description || '',
    contact_id: lead?.contact_id || undefined,
    company_id: lead?.company_id || undefined,
  });

  useEffect(() => {
    loadUsers();
    loadContacts();
  }, []);
  
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      // Usar el nuevo endpoint optimizado que devuelve solo responsables (lawyers y agents)
      const validUsers = await crmService.getResponsibleUsers(true);
      console.log('Usuarios responsables cargados en LeadForm:', validUsers);
      if (Array.isArray(validUsers)) {
        // Ya están filtrados por el endpoint, solo validar que tengan id
        const filteredUsers = validUsers.filter(u => u && u.id);
        setUsers(filteredUsers);
        
        // Pre-llenar responsable con el usuario actual si no hay uno ya asignado
        setFormData((prev: any) => {
          // Si ya hay un responsable asignado, mantenerlo
          if (prev.responsible_user_id && prev.responsible_user_id !== undefined) {
            return prev;
          }
          
          // SIEMPRE buscar el usuario de la sesión - NO usar fallback del primer usuario
          const currentUser = adminService.getUser();
          if (currentUser?.id || currentUser?.email) {
            const currentEmail = currentUser.email?.toLowerCase();
            const currentCRMUser = filteredUsers.find(u => {
              const matchesId = u.id === currentUser.id;
              const matchesEmail = u.email === currentUser.email || (currentEmail && u.email?.toLowerCase() === currentEmail);
              return matchesId || matchesEmail;
            });
            
            if (currentCRMUser) {
              console.log('✅ [LeadForm] Usuario de sesión encontrado, preseleccionando:', currentCRMUser.id, currentCRMUser.name || currentCRMUser.email);
              return { ...prev, responsible_user_id: currentCRMUser.id };
            } else {
              console.error('❌ [LeadForm] Usuario de sesión NO encontrado en lista de responsables:', {
                sessionUser: { id: currentUser.id, email: currentUser.email },
                availableUsers: filteredUsers.map(u => ({ id: u.id, email: u.email }))
              });
            }
          }
          
          // NO usar fallback - si no se encuentra el usuario de sesión, dejar vacío
          
          return prev;
        });
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const contactsData = await crmService.getContacts({ limit: 100 });
      if (contactsData && contactsData.items) {
        setContacts(contactsData.items.filter(c => c && c.id));
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Si es nuevo lead (id='new' o lead undefined/null), cargar defaults del backend
  useEffect(() => {
    if ((!lead || lead.id === 'new') && !loadingDefaults && !loadingUsers) {
      setLoadingDefaults(true);
      crmService.getLeadDefaults()
        .then(defaults => {
          if (defaults) {
            // Inicializar formulario con defaults de /crm/leads/new
            // Si no hay responsible_user_id en defaults, usar el usuario actual
            let responsibleUserId = defaults.responsible_user_id;
            if (!responsibleUserId && users.length > 0) {
              const currentUser = adminService.getUser();
              if (currentUser?.id) {
                const currentCRMUser = users.find(u => u.id === currentUser.id || u.email === currentUser.email);
                if (currentCRMUser) {
                  responsibleUserId = currentCRMUser.id;
                }
              }
            }
            
            setFormData((prev: any) => ({
              ...prev,
              name: (defaults.name ?? prev.name) || '',
              status: (defaults.status ?? prev.status) || 'new',
              pipeline_id: defaults.pipeline_id ?? prev.pipeline_id,
              contact_id: defaults.contact_id ?? prev.contact_id,
              responsible_user_id: responsibleUserId ?? prev.responsible_user_id,
              currency: defaults.currency ?? 'EUR',
              priority: defaults.priority || 'medium',
              service_type: defaults.service_type || '',
              service_description: defaults.service_description || '',
              source: defaults.source || '',
              description: defaults.description || '',
              company_id: defaults.company_id ?? prev.company_id,
            }));
            setPrice(defaults.price ?? null);
          }
        })
        .catch(err => {
          console.error('Error loading lead defaults:', err);
          // No mostrar error, simplemente usar valores por defecto locales
        })
        .finally(() => {
          setLoadingDefaults(false);
        });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Construir payload sin valores inválidos
      const payload = buildLeadPayload({
        ...formData,
        price: price,
      });

      // Construir lead completo para pasar a onSave
      const savedLead: Lead = {
        ...lead!,
        ...payload,
        price: payload.price ?? 0,
        id: lead?.id || 'new',
        created_at: lead?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: lead?.created_by || '',
        updated_by: lead?.updated_by || '',
        is_deleted: false,
      };
      
      onSave(savedLead);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lead ? 'Editar Lead' : 'Nuevo Lead'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre del Lead *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Residencia Legal - Juan Pérez"
                required
              />
            </div>

            <div>
              <Label htmlFor="price">Valor (€)</Label>
              <Input
                id="price"
                type="number"
                value={price ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setPrice(v === '' ? null : Number(v) || null);
                }}
                placeholder="400"
              />
            </div>

            <div>
              <Label htmlFor="service_type">Tipo de Servicio</Label>
              <Input
                id="service_type"
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                placeholder="Residencia Legal"
              />
            </div>

            <div>
              <Label htmlFor="source">Fuente</Label>
              <select
                id="source"
                className="w-full rounded-md border border-gray-300 p-2"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                <option value="Web">Web</option>
                <option value="Referido">Referido</option>
                <option value="Llamada Fría">Llamada Fría</option>
                <option value="Evento">Evento</option>
                <option value="Red Social">Red Social</option>
                <option value="Colaborador">Colaborador</option>
              </select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridad</Label>
              <select
                id="priority"
                className="w-full rounded-md border border-gray-300 p-2"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <Label htmlFor="responsible_user_id">Responsable</Label>
              <select
                id="responsible_user_id"
                value={formData.responsible_user_id ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({ ...formData, responsible_user_id: v === '' ? undefined : v });
                }}
                className="w-full rounded-md border border-gray-300 p-2"
                disabled={loadingUsers}
              >
                <option value="">
                  {loadingUsers ? 'Cargando usuarios...' : 'Asignación automática (recomendado)'}
                </option>
                {users.length === 0 && !loadingUsers && (
                  <option value="" disabled>
                    No hay usuarios disponibles - se asignará automáticamente
                  </option>
                )}
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
                {formData.responsible_user_id 
                  ? 'Solo abogados y agentes pueden ser responsables'
                  : 'Si no seleccionas un responsable, el sistema asignará automáticamente el lead a un agente disponible según cuota diaria y disponibilidad.'}
              </p>
            </div>

            <div>
              <Label htmlFor="contact_id">Relacionado con (Contacto)</Label>
              <select
                id="contact_id"
                value={formData.contact_id ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({ ...formData, contact_id: v === '' ? undefined : v });
                }}
                className="w-full rounded-md border border-gray-300 p-2"
                disabled={loadingContacts}
              >
                <option value="">
                  {loadingContacts ? 'Cargando contactos...' : 'No seleccionar (se creará automáticamente)'}
                </option>
                {contacts.length === 0 && !loadingContacts && (
                  <option value="" disabled>
                    No hay contactos disponibles
                  </option>
                )}
                {contacts.map(contact => {
                  const displayName = contact.name || 
                    `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 
                    contact.email || 
                    `Contacto ${contact.id?.slice(0, 8) || 'N/A'}`;
                  return (
                    <option key={contact.id} value={contact.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Si no seleccionas un contacto, se creará uno automáticamente con el nombre del Lead.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="service_description">Descripción del Servicio</Label>
            <textarea
              id="service_description"
              className="w-full rounded-md border border-gray-300 p-2 mt-1"
              rows={3}
              value={formData.service_description}
              onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
              placeholder="Descripción detallada..."
            />
          </div>

          <div>
            <Label htmlFor="description">Notas Internas</Label>
            <textarea
              id="description"
              className="w-full rounded-md border border-gray-300 p-2 mt-1"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              <XMarkIcon width={16} height={16} className="mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} variant="default">
              <ArrowDownTrayIcon width={16} height={16} className="mr-2" />
              {loading ? 'Guardando...' : 'Guardar Lead'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

