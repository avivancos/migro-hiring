// CRMOpportunityDetail - Detalle completo de una oportunidad

import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOpportunityDetail } from '@/hooks/useOpportunityDetail';
import { OpportunityPriorityBadge } from '@/components/opportunities/OpportunityPriorityBadge';
import { OpportunityScore } from '@/components/opportunities/OpportunityScore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ArrowLeft, Phone, Mail, MapPin, User } from 'lucide-react';
import { formatDetectionReason } from '@/utils/opportunity';

export function CRMOpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    opportunity,
    isLoading,
    error,
    createPipeline,
    isUpdating,
  } = useOpportunityDetail(id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">
              {error instanceof Error ? error.message : 'Error al cargar oportunidad'}
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/crm/opportunities')}
              className="mt-4"
            >
              Volver a oportunidades
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contact = opportunity.contact;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/crm/opportunities')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          Detalle de Oportunidad
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score y prioridad */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Score y Prioridad</CardTitle>
                <OpportunityPriorityBadge priority={opportunity.priority} />
              </div>
            </CardHeader>
            <CardContent>
              <OpportunityScore score={opportunity.opportunity_score} />
            </CardContent>
          </Card>

          {/* Información del contacto */}
          {contact && (
            <Card>
              <CardHeader>
                <CardTitle>Información del Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{contact.name}</h3>
                </div>
                <div className="space-y-2">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.mobile && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{contact.mobile}</span>
                    </div>
                  )}
                  {contact.city && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{contact.city}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Razón de detección */}
          <Card>
            <CardHeader>
              <CardTitle>Razón de Detección</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                {formatDetectionReason(opportunity.detection_reason)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar con acciones */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                onClick={() => createPipeline()}
                disabled={isUpdating}
              >
                Crear Pipeline
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/crm/contacts/${opportunity.contact_id}`)}
              >
                Ver Contacto
              </Button>
            </CardContent>
          </Card>

          {/* Estado */}
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Estado actual:</p>
              <p className="font-semibold text-lg mt-1">
                {opportunity.status}
              </p>
            </CardContent>
          </Card>

          {/* Responsable asignado */}
          {opportunity.assigned_to && (
            <Card>
              <CardHeader>
                <CardTitle>Responsable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-600 font-medium mb-1">Asignado a</p>
                      <p className="text-sm text-blue-900 font-semibold truncate">
                        {opportunity.assigned_to.name || 'Sin asignar'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

