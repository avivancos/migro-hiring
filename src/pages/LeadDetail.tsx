// LeadDetail - Detailed view of a lead

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services/adminService';
import { crmService } from '@/services/crmService';
import { cloudtalkService } from '@/services/cloudtalkService';
import type { Lead } from '@/types/crm';
import { CallHistory } from '@/components/CRM/CallHistory';
import { ActivityTimeline } from '@/components/CRM/ActivityTimeline';
import { LeadForm } from '@/components/CRM/LeadForm';
import { ArrowLeftIcon, BuildingOffice2Icon, CalendarIcon, CurrencyDollarIcon, EnvelopeIcon, PencilIcon, PhoneIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    if (id) {
      loadLead();
    }
  }, [id, navigate]);

  const loadLead = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const leadData = await crmService.getLead(id);
      setLead(leadData);
    } catch (err) {
      console.error('Error loading lead:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async () => {
    if (!lead?.contact?.phone) {
      alert('No hay número de teléfono disponible');
      return;
    }

    await cloudtalkService.makeCall(lead.contact.phone);
  };

  const handleDelete = async () => {
    if (!lead || !confirm('¿Estás seguro de eliminar este lead?')) return;

    try {
      await crmService.deleteLead(lead.id);
      navigate('/admin/crm/leads');
    } catch (err) {
      console.error('Error deleting lead:', err);
      alert('Error al eliminar lead');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando lead...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="py-12 px-8 text-center">
            <p className="text-gray-600 mb-4">Lead no encontrado</p>
            <Button onClick={() => navigate('/admin/crm/leads')}>
              Volver a Leads
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <LeadForm
            lead={lead}
            onSave={(updated) => {
              setLead(updated);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/admin/crm/leads')}
              variant="ghost"
              size="icon"
            >
              <ArrowLeftIcon width={20} height={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
              <p className="text-gray-600 mt-1">
                {lead.service_type || 'Sin servicio'} • {lead.pipeline_status?.name || lead.status || 'Sin estado'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {lead.contact?.phone && (
              <Button
                onClick={handleCall}
                variant="outline"
                className="flex items-center gap-2"
              >
                <PhoneIcon width={18} height={18} />
                Llamar
              </Button>
            )}
            <Button
              onClick={() => setEditing(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <PencilIcon width={18} height={18} />
              Editar
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              className="flex items-center gap-2 text-red-600 hover:bg-red-50"
            >
              <TrashIcon width={18} height={18} />
              Eliminar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <CurrencyDollarIcon width={16} height={16} />
                      <span className="text-sm font-medium">Valor</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(lead.price)}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <UserIcon width={16} height={16} />
                      <span className="text-sm font-medium">Responsable</span>
                    </div>
                    <p className="text-lg font-medium text-gray-900">
                      {lead.responsible_user?.name || 'Sin asignar'}
                    </p>
                  </div>

                  {lead.contact && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <UserIcon width={16} height={16} />
                        <span className="text-sm font-medium">Contacto</span>
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        {lead.contact.first_name} {lead.contact.last_name}
                      </p>
                      {lead.contact.email && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <EnvelopeIcon width={14} height={14} />
                          {lead.contact.email}
                        </p>
                      )}
                      {lead.contact.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <PhoneIcon width={14} height={14} />
                          {lead.contact.phone}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <CalendarIcon width={16} height={16} />
                      <span className="text-sm font-medium">Creado</span>
                    </div>
                    <p className="text-sm text-gray-900">
                      {formatDate(lead.created_at)}
                    </p>
                  </div>

                  {lead.source && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <BuildingOffice2Icon width={16} height={16} />
                        <span className="text-sm font-medium">Fuente</span>
                      </div>
                      <p className="text-sm text-gray-900">{lead.source}</p>
                    </div>
                  )}

                  {lead.priority && (
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-1">Prioridad</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        lead.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        lead.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {lead.priority}
                      </span>
                    </div>
                  )}
                </div>

                {lead.description && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Descripción</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{lead.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <ActivityTimeline entityType="contact" entityId={lead.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Call History */}
            {lead.contact && (
              <CallHistory entityType="lead" entityId={lead.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

