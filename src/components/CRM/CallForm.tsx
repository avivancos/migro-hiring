// CallForm - Formulario para registrar llamadas con seguimiento

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Call, CRMUser, KommoContact, KommoLead } from '@/types/crm';
import { crmService } from '@/services/crmService';

interface CallFormProps {
  call?: Call;
  defaultEntityType?: 'contacts' | 'leads';
  defaultEntityId?: string;
  defaultPhone?: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function CallForm({
  call,
  defaultEntityType,
  defaultEntityId,
  defaultPhone,
  onSubmit,
  onCancel,
}: CallFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [contacts, setContacts] = useState<KommoContact[]>([]);
  const [leads, setLeads] = useState<KommoLead[]>([]);
  
  const [formData, setFormData] = useState({
    direction: call?.direction || 'outbound',
    duration: call?.duration ?? null,
    phone: call?.phone || defaultPhone || '',
    call_status: call?.call_status || 'completed',
    call_result: call?.call_result || '',
    record_url: call?.record_url || '',
    entity_type: call?.entity_type || defaultEntityType || 'contacts',
    entity_id: call?.entity_id || defaultEntityId || '',
    responsible_user_id: call?.responsible_user_id || '',
    resumen_llamada: call?.resumen_llamada || '',
    proxima_llamada_fecha: call?.proxima_llamada_fecha 
      ? new Date(call.proxima_llamada_fecha).toISOString().slice(0, 16)
      : '',
    proxima_accion_fecha: call?.proxima_accion_fecha
      ? new Date(call.proxima_accion_fecha).toISOString().slice(0, 16)
      : '',
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
      
      if (!formData.responsible_user_id && usersData.length > 0) {
        setFormData(prev => ({ ...prev, responsible_user_id: usersData[0].id }));
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadEntities = async () => {
    setLoadingEntities(true);
    try {
      if (formData.entity_type === 'contacts') {
        const contactsData = await crmService.getContacts({ limit: 100 });
        setContacts(contactsData.items || []);
        setLeads([]);
      } else if (formData.entity_type === 'leads') {
        const leadsData = await crmService.getLeads({ limit: 100 });
        setLeads(leadsData.items || []);
        setContacts([]);
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
      const submitData: any = {
        ...formData,
        duration: formData.duration ?? 0,
      };

      // Convertir fechas a ISO string
      if (submitData.proxima_llamada_fecha) {
        submitData.proxima_llamada_fecha = new Date(submitData.proxima_llamada_fecha).toISOString();
      }
      if (submitData.proxima_accion_fecha) {
        submitData.proxima_accion_fecha = new Date(submitData.proxima_accion_fecha).toISOString();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {call ? 'Editar Llamada' : 'Registrar Llamada'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dirección */}
          <div>
            <Label htmlFor="direction">
              Dirección <span className="text-red-500">*</span>
            </Label>
            <select
              id="direction"
              value={formData.direction}
              onChange={(e) => handleChange('direction', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="inbound">Entrante</option>
              <option value="outbound">Saliente</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div>
              <Label htmlFor="phone">
                Teléfono <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+34600123456"
                required
              />
            </div>

            {/* Duración */}
            <div>
              <Label htmlFor="duration">Duración (segundos)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  handleChange('duration', v === '' ? null : (Number(v) || 0));
                }}
                placeholder="300"
                min="0"
              />
            </div>

            {/* Estado */}
            <div>
              <Label htmlFor="call_status">
                Estado <span className="text-red-500">*</span>
              </Label>
              <select
                id="call_status"
                value={formData.call_status}
                onChange={(e) => handleChange('call_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="completed">Completada</option>
                <option value="failed">Fallida</option>
                <option value="busy">Ocupado</option>
                <option value="no_answer">Sin respuesta</option>
                <option value="missed">Perdida</option>
              </select>
            </div>

            {/* Responsable */}
            <div>
              <Label htmlFor="responsible_user_id">Responsable</Label>
              <select
                id="responsible_user_id"
                value={formData.responsible_user_id}
                onChange={(e) => handleChange('responsible_user_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Solo abogados y administradores pueden ser responsables
              </p>
            </div>
          </div>

          {/* Resumen de la llamada */}
          <div>
            <Label htmlFor="resumen_llamada">Resumen de la Llamada</Label>
            <Textarea
              id="resumen_llamada"
              value={formData.resumen_llamada}
              onChange={(e) => handleChange('resumen_llamada', e.target.value)}
              placeholder="Resumen de la conversación..."
              rows={4}
            />
          </div>

          {/* Resultado */}
          <div>
            <Label htmlFor="call_result">Resultado</Label>
            <Textarea
              id="call_result"
              value={formData.call_result}
              onChange={(e) => handleChange('call_result', e.target.value)}
              placeholder="Resultado de la llamada..."
              rows={2}
            />
          </div>

          {/* Fechas de seguimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="proxima_llamada_fecha">Próxima Llamada</Label>
              <Input
                id="proxima_llamada_fecha"
                type="datetime-local"
                value={formData.proxima_llamada_fecha}
                onChange={(e) => handleChange('proxima_llamada_fecha', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="proxima_accion_fecha">Próxima Acción</Label>
              <Input
                id="proxima_accion_fecha"
                type="datetime-local"
                value={formData.proxima_accion_fecha}
                onChange={(e) => handleChange('proxima_accion_fecha', e.target.value)}
              />
            </div>
          </div>

          {/* URL de grabación */}
          <div>
            <Label htmlFor="record_url">URL de Grabación</Label>
            <Input
              id="record_url"
              type="url"
              value={formData.record_url}
              onChange={(e) => handleChange('record_url', e.target.value)}
              placeholder="https://example.com/recording.mp3"
            />
          </div>

          {/* Entity Type (oculto si viene por default) */}
          {!defaultEntityType && (
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
              >
                <option value="contacts">Contacto</option>
                <option value="leads">Lead</option>
              </select>
            </div>
          )}

          {/* Entity ID (oculto si viene por default) */}
          {!defaultEntityId && (
            <div>
              <Label htmlFor="entity_id">
                {formData.entity_type === 'contacts' ? 'Contacto' : 'Lead'}
                <span className="text-red-500">*</span>
              </Label>
              <select
                id="entity_id"
                value={formData.entity_id}
                onChange={(e) => handleChange('entity_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                disabled={loadingEntities}
              >
                <option value="">
                  {loadingEntities 
                    ? 'Cargando...' 
                    : `Seleccionar ${formData.entity_type === 'contacts' ? 'contacto' : 'lead'}...`}
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
              {loading ? 'Guardando...' : call ? 'Actualizar' : 'Registrar Llamada'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


