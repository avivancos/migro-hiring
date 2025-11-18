// Contact Detail - Vista detallada de contacto

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services/adminService';
import { crmService } from '@/services/crmService';
import { ActivityTimeline } from '@/components/CRM/ActivityTimeline';
import { CallHistory } from '@/components/CRM/CallHistory';
import type { KommoContact, KommoLead } from '@/types/crm';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Building2,
  Edit,
  Briefcase,
} from 'lucide-react';

export function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<KommoContact | null>(null);
  const [relatedLeads, setRelatedLeads] = useState<KommoLead[]>([]);

  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    if (!id) {
      navigate('/admin/crm/contacts');
      return;
    }

    loadContactData();
  }, [id, navigate]);

  const loadContactData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [contactData, leadsResponse] = await Promise.all([
        crmService.getContact(id),
        crmService.getLeads({ contact_id: id }),
      ]);

      setContact(contactData);
      setRelatedLeads(leadsResponse.items || []);
    } catch (err) {
      console.error('Error loading contact:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando contacto...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">Contacto no encontrado</p>
              <Button
                onClick={() => navigate('/admin/crm/contacts')}
                className="mt-4"
              >
                Volver a contactos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/admin/crm/contacts')}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {contact.first_name} {contact.last_name}
              </h1>
              {contact.position && (
                <p className="text-gray-600 mt-1">{contact.position}</p>
              )}
            </div>
          </div>
          <Button
            onClick={() => navigate(`/admin/crm/contacts/${id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit size={18} />
            Editar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contact.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="text-gray-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </div>
                )}

                {contact.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="text-gray-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                )}

                {contact.mobile && contact.mobile !== contact.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="text-gray-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Móvil</p>
                      <a
                        href={`tel:${contact.mobile}`}
                        className="text-blue-600 hover:underline"
                      >
                        {contact.mobile}
                      </a>
                    </div>
                  </div>
                )}

                {contact.company && (
                  <div className="flex items-start gap-3">
                    <Building2 className="text-gray-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Empresa</p>
                      <p className="text-gray-900">
                        {typeof contact.company === 'string' 
                          ? contact.company 
                          : contact.company.name}
                      </p>
                    </div>
                  </div>
                )}

                {contact.position && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="text-gray-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Cargo</p>
                      <p className="text-gray-900">{contact.position}</p>
                    </div>
                  </div>
                )}

                {(contact.address || contact.city || contact.country) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="text-gray-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="text-gray-900">
                        {contact.address && <>{contact.address}<br /></>}
                        {contact.city && <>{contact.city}<br /></>}
                        {contact.country}
                      </p>
                    </div>
                  </div>
                )}

                {contact.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">Notas</p>
                    <p className="text-gray-900 text-sm whitespace-pre-wrap">
                      {contact.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Leads */}
            {relatedLeads.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Oportunidades ({relatedLeads.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedLeads.map(lead => (
                    <div
                      key={lead.id}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => navigate(`/admin/crm/leads/${lead.id}`)}
                    >
                      <p className="font-medium text-gray-900 text-sm">
                        {lead.name}
                      </p>
                      {lead.pipeline_status && (
                        <p className="text-xs text-gray-500 mt-1">
                          {lead.pipeline_status.name}
                        </p>
                      )}
                      {lead.price && (
                        <p className="text-sm text-green-600 font-semibold mt-1">
                          {new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: lead.currency || 'EUR',
                          }).format(lead.price)}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Activity and Calls */}
          <div className="lg:col-span-2 space-y-6">
            <CallHistory entityType="contact" entityId={id!} />
            <ActivityTimeline entityType="contact" entityId={id!} />
          </div>
        </div>
      </div>
    </div>
  );
}

