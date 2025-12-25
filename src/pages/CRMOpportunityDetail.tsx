// CRMOpportunityDetail - Detalle completo de una oportunidad

import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOpportunityDetail } from '@/hooks/useOpportunityDetail';
import { OpportunityPriorityBadge } from '@/components/opportunities/OpportunityPriorityBadge';
import { OpportunityScore } from '@/components/opportunities/OpportunityScore';
import { FirstCallAttemptsRow } from '@/components/opportunities/FirstCallAttemptsRow';
import { FirstCallAttemptDetail } from '@/components/opportunities/FirstCallAttemptDetail';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ArrowLeft, Phone, Mail, MapPin, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getDetectionReasonBadges } from '@/utils/opportunity';
import { opportunityApi } from '@/services/opportunityApi';
import { useQueryClient } from '@tanstack/react-query';
import type { FirstCallAttemptRequest } from '@/types/opportunity';
import { usePageTitle } from '@/hooks/usePageTitle';

export function CRMOpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAttempt, setSelectedAttempt] = useState<number | null>(null);
  const [isSavingAttempt, setIsSavingAttempt] = useState(false);

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

  // Debug: verificar datos del responsable
  console.log('🔍 [CRMOpportunityDetail] Opportunity data:', {
    id: opportunity.id,
    status: opportunity.status,
    assigned_to_id: opportunity.assigned_to_id,
    assigned_to: opportunity.assigned_to,
    hasAssignedTo: !!opportunity.assigned_to,
    first_call_attempts: opportunity.first_call_attempts,
    first_call_completed: opportunity.first_call_completed,
    first_call_successful_attempt: opportunity.first_call_successful_attempt,
  });

  // Manejar click en badge de intento
  const handleAttemptClick = (attemptNumber: number) => {
    setSelectedAttempt(attemptNumber);
  };

  // Manejar cierre del drawer
  const handleCloseAttemptDetail = () => {
    setSelectedAttempt(null);
  };

  // Manejar guardado de intento
  const handleSaveAttempt = async (request: FirstCallAttemptRequest) => {
    if (!id) return;
    
    setIsSavingAttempt(true);
    try {
      await opportunityApi.createFirstCallAttempt(id, request);
      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    } finally {
      setIsSavingAttempt(false);
    }
  };

  // Obtener datos del intento seleccionado
  const selectedAttemptData = selectedAttempt
    ? opportunity.first_call_attempts?.[selectedAttempt.toString()] || null
    : null;

  // Actualizar título de la página con el nombre del contacto asociado
  const opportunityTitle = contact?.name 
    ? `${contact.name} - Detalle de Oportunidad | Migro.es`
    : 'Detalle de Oportunidad | Migro.es';
  usePageTitle(opportunityTitle);

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
              <div className="flex flex-wrap gap-2">
                {getDetectionReasonBadges(opportunity.detection_reason).map((badge, index) => (
                  <Badge key={index} variant="neutral" className="text-sm">
                    {badge}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Intentos de Primera Llamada */}
          <Card>
            <CardHeader>
              <CardTitle>Seguimiento de Primera Llamada</CardTitle>
            </CardHeader>
            <CardContent>
              <FirstCallAttemptsRow
                attempts={opportunity.first_call_attempts || null}
                firstCallCompleted={opportunity.first_call_completed || false}
                successfulAttempt={opportunity.first_call_successful_attempt || null}
                onAttemptClick={handleAttemptClick}
              />
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
          {(opportunity.assigned_to || opportunity.assigned_to_id) && (
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
                        {opportunity.assigned_to?.name || 
                         (opportunity.assigned_to_id ? `Usuario ${opportunity.assigned_to_id.substring(0, 8)}...` : 'Sin asignar')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Drawer de detalle de intento */}
      {selectedAttempt && (
        <FirstCallAttemptDetail
          attemptNumber={selectedAttempt}
          attemptData={selectedAttemptData}
          isOpen={!!selectedAttempt}
          onClose={handleCloseAttemptDetail}
          onSave={handleSaveAttempt}
          isLoading={isSavingAttempt}
          opportunityId={id || ''}
        />
      )}
    </div>
  );
}

