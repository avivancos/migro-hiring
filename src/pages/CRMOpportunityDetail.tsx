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
import { ArrowLeft, Phone, Mail, MapPin, User, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getDetectionReasonBadges } from '@/utils/opportunity';
import { opportunityApi } from '@/services/opportunityApi';
import { useQueryClient } from '@tanstack/react-query';
import type { FirstCallAttemptRequest } from '@/types/opportunity';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PipelineWizardModal } from '@/components/pipelines/Wizards/PipelineWizardModal';
import { PipelineActionsList } from '@/components/pipelines/PipelineActionsList';
import { SuggestedNextAction } from '@/components/opportunities/SuggestedNextAction';
import { usePipelineActions } from '@/hooks/usePipelineActions';

export function CRMOpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAttempt, setSelectedAttempt] = useState<number | null>(null);
  const [isSavingAttempt, setIsSavingAttempt] = useState(false);
  const [showPipelineWizard, setShowPipelineWizard] = useState(false);

  const {
    opportunity,
    isLoading,
    error,
    createPipeline,
    isUpdating,
    isCreatingPipeline,
  } = useOpportunityDetail(id);

  // IMPORTANTE: usePageTitle debe llamarse ANTES de los early returns
  // para cumplir con las reglas de los hooks de React
  const opportunityTitle = opportunity?.contact?.name 
    ? `${opportunity.contact.name} - Detalle de Oportunidad | Migro.es`
    : 'Detalle de Oportunidad | Migro.es';
  usePageTitle(opportunityTitle);

  // Obtener acciones del pipeline para la siguiente acción sugerida
  // Debe estar después de los hooks condicionales pero antes de los early returns
  const { actions: pipelineActions } = usePipelineActions(
    opportunity ? 'leads' : null,
    opportunity?.id || null
  );

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
                <div className="flex items-center justify-between">
                  <CardTitle>Información del Contacto</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/crm/contacts/${opportunity.contact_id}`)}
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Ver Contacto Completo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    <button
                      onClick={() => navigate(`/crm/contacts/${opportunity.contact_id}`)}
                      className="hover:text-primary hover:underline transition-colors"
                    >
                      {contact.name}
                    </button>
                  </h3>
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
          {/* Siguiente Acción Sugerida - Siempre visible */}
          <SuggestedNextAction
            opportunity={opportunity}
            completedActions={pipelineActions}
            currentStage={opportunity.pipeline_stage?.current_stage as any}
            onActionClick={(actionCode) => {
              if (actionCode === 'make_call') {
                // Redirigir al handler de llamadas con el contacto
                navigate(`/crm/call-handler?contact_id=${opportunity.contact_id}&opportunity_id=${opportunity.id}`);
              } else if (actionCode === 'analyze') {
                navigate(`/crm/opportunities/${opportunity.id}/analyze`);
              }
            }}
          />

          {/* Si existe pipeline, mostrar acciones del pipeline */}
          {opportunity.pipeline_stage_id || opportunity.pipeline_stage ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Acciones del Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <PipelineActionsList
                    entityType="leads"
                    entityId={opportunity.id}
                    showCreateButton={true}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Otras Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="default"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigate(`/crm/opportunities/${opportunity.id}/analyze`)}
                  >
                    Pedir a Pili que analice el caso
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPipelineWizard(true)}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Modificar Pipeline
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
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => createPipeline()}
                  disabled={isUpdating || isCreatingPipeline}
                >
                  Crear Pipeline
                </Button>
                <Button
                  variant="default"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => navigate(`/crm/opportunities/${opportunity.id}/analyze`)}
                >
                  Pedir a Pili que analice el caso
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
          )}

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
      
      {/* Modal del Wizard de Pipeline */}
      {id && opportunity && (
        <PipelineWizardModal
          isOpen={showPipelineWizard}
          onClose={() => setShowPipelineWizard(false)}
          entityType="leads"
          entityId={id}
          onComplete={(changes) => {
            console.log('Pipeline modificado:', changes);
            // Recargar datos de la oportunidad
            queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
          }}
        />
      )}
    </div>
  );
}

