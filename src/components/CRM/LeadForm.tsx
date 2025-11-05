// LeadForm - Form to create/edit leads

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { crmService } from '@/services/crmService';
import type { KommoLead, Pipeline, CRMUser, LeadCreateRequest } from '@/types/crm';
import { Save, X } from 'lucide-react';

interface LeadFormProps {
  lead?: KommoLead;
  onSave: (lead: KommoLead) => void;
  onCancel: () => void;
}

export function LeadForm({ lead, onSave, onCancel }: LeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [formData, setFormData] = useState<LeadCreateRequest>({
    name: lead?.name || '',
    price: lead?.price || 0,
    currency: lead?.currency || 'EUR',
    pipeline_id: lead?.pipeline_id || 1,
    status_id: lead?.status_id || 1,
    responsible_user_id: lead?.responsible_user_id || 1,
    priority: lead?.priority || 'medium',
    service_type: lead?.service_type || '',
    service_description: lead?.service_description || '',
    source: lead?.source || '',
    description: lead?.description || '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pipelinesData, usersData] = await Promise.all([
        crmService.getPipelines(),
        crmService.getUsers(true),
      ]);
      setPipelines(pipelinesData);
      setUsers(usersData);

      // Set default pipeline and status if creating new lead
      if (!lead && pipelinesData.length > 0) {
        const defaultPipeline = pipelinesData.find(p => p.is_main) || pipelinesData[0];
        const stages = await crmService.getPipelineStages(defaultPipeline.id);
        setFormData(prev => ({
          ...prev,
          pipeline_id: defaultPipeline.id,
          status_id: stages[0]?.id || 1,
          responsible_user_id: usersData[0]?.id || 1,
        }));
      }
    } catch (err) {
      console.error('Error loading form data:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (lead) {
        const updated = await crmService.updateLead(lead.id, formData);
        onSave(updated);
      } else {
        const created = await crmService.createLead(formData);
        onSave(created);
      }
    } catch (err) {
      console.error('Error saving lead:', err);
      alert('Error al guardar lead');
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
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
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
                className="w-full rounded-md border border-gray-300 p-2"
                value={formData.responsible_user_id}
                onChange={(e) => setFormData({ ...formData, responsible_user_id: parseInt(e.target.value) })}
                required
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
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
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              <Save size={16} className="mr-2" />
              {loading ? 'Guardando...' : 'Guardar Lead'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

