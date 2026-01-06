// CRMOpportunityDetail - Detalle completo de una oportunidad

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOpportunityDetail } from '@/hooks/useOpportunityDetail';
import { OpportunityPriorityBadge } from '@/components/opportunities/OpportunityPriorityBadge';
import { OpportunityScore } from '@/components/opportunities/OpportunityScore';
import { FirstCallAttemptsRow } from '@/components/opportunities/FirstCallAttemptsRow';
import { FirstCallAttemptDetail } from '@/components/opportunities/FirstCallAttemptDetail';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ArrowLeft, Phone, Mail, MapPin, User, Activity, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getDetectionReasonBadges } from '@/utils/opportunity';
import { opportunityApi } from '@/services/opportunityApi';
import { useQueryClient } from '@tanstack/react-query';
import type { FirstCallAttemptRequest } from '@/types/opportunity';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PipelineWizardModal } from '@/components/pipelines/Wizards/PipelineWizardModal';
import { SuggestedNextAction } from '@/components/opportunities/SuggestedNextAction';
import { usePipelineActions } from '@/hooks/usePipelineActions';
import { useAuth } from '@/providers/AuthProvider';
import { Modal } from '@/components/common/Modal';
import { Label } from '@/components/ui/label';
import { useCRMUsers } from '@/hooks/useCRMUsers';
import { ContractDataRequestModal } from '@/components/opportunities/ContractDataRequestModal';
import { RequestContractModal } from '@/components/opportunities/RequestContractModal';
import { useContractRequest } from '@/hooks/useContractRequest';
import { FileText, AlertCircle } from 'lucide-react';

export function CRMOpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [selectedAttempt, setSelectedAttempt] = useState<number | null>(null);
  const [isSavingAttempt, setIsSavingAttempt] = useState(false);
  const [showPipelineWizard, setShowPipelineWizard] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showRequestContractModal, setShowRequestContractModal] = useState(false);
  
  // Cargar usuarios responsables usando el hook optimizado
  const { users: filteredUsers, loading: loadingUsers } = useCRMUsers({ isActive: true, onlyResponsibles: true });

  const {
    opportunity,
    isLoading,
    error,
    createPipeline,
    isUpdating,
    isCreatingPipeline,
    assign,
    update,
    isAssigning,
  } = useOpportunityDetail(id);

  // Detectar solicitud de contrato pendiente (debe estar después de la definición de opportunity)
  const contractRequest = useContractRequest(
    opportunity?.pipeline_stage,
    opportunity ? 'leads' : null,
    opportunity?.id || null
  );

  // Verificar si se puede solicitar un contrato
  const canRequestContract = () => {
    if (!opportunity) return false;
    
    // Requisito principal: debe haber completado la primera llamada
    const hasFirstCallCompleted = opportunity.first_call_completed === true;
    
    if (!hasFirstCallCompleted) return false;
    
    // Si hay pipeline stage, verificar que no tenga hiring code aún
    if (opportunity.pipeline_stage) {
      const hasHiringCode = opportunity.pipeline_stage.hiring_code_id;
      if (hasHiringCode) return false; // Ya tiene un contrato solicitado
      
      // Si está en un stage avanzado (más allá de admin_contract), no mostrar
      const stage = opportunity.pipeline_stage.current_stage;
      if (stage === 'client_signature' || stage === 'expediente_created') {
        return false;
      }
    }
    
    // Si llegamos aquí, mostrar el botón:
    // - Primera llamada completada ✓
    // - No tiene hiring code aún ✓
    // - No está en un stage final ✓
    return true;
  };

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
  
  // Actualizar selectedUserId cuando cambia opportunity.assigned_to_id
  useEffect(() => {
    if (opportunity?.assigned_to_id) {
      setSelectedUserId(opportunity.assigned_to_id);
    } else {
      setSelectedUserId('');
    }
  }, [opportunity?.assigned_to_id]);

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
  
  // Helper para obtener el nombre del responsable asignado
  const getAssignedToDisplayName = (): string => {
    if (opportunity.assigned_to) {
      // Si viene expandido del backend, usar name o email
      return opportunity.assigned_to.name?.trim() || 
             opportunity.assigned_to.email?.trim() || 
             'Sin nombre';
    }
    
    // Si solo tenemos el ID, buscar en la lista de usuarios disponibles
    if (opportunity.assigned_to_id && filteredUsers.length > 0) {
      const user = filteredUsers.find(u => u.id === opportunity.assigned_to_id);
      if (user) {
        return user.name?.trim() || user.email?.trim() || 'Sin nombre';
      }
    }
    
    // Fallback: mostrar ID truncado
    if (opportunity.assigned_to_id) {
      return `Usuario ${opportunity.assigned_to_id.substring(0, 8)}...`;
    }
    
    return 'Sin asignar';
  };

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

  const handleOpenAssignModal = () => {
    // Preseleccionar el agente actual
    if (opportunity?.assigned_to_id) {
      setSelectedUserId(opportunity.assigned_to_id);
    } else {
      setSelectedUserId('');
    }
    setShowAssignModal(true);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedUserId('');
  };

  const handleAssignAgent = async () => {
    if (!id) {
      return;
    }

    try {
      // Si se selecciona "Sin asignar" (vacío), usar update para desasignar
      if (!selectedUserId) {
        update({ assigned_to_id: undefined });
      } else {
        // Si se selecciona un agente, usar assign
        assign(selectedUserId);
      }
      setShowAssignModal(false);
      setSelectedUserId('');
      // El hook ya invalida las queries automáticamente
    } catch (error) {
      console.error('Error asignando agente:', error);
      alert('Error al asignar agente. Por favor intenta de nuevo.');
    }
  };

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
              {/* Botón para solicitar contrato */}
              {canRequestContract() && (
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-green-900">Solicitar Contrato</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-700">
                        La primera llamada ha sido completada. Puedes solicitar un código de contratación para avanzar con la venta.
                      </p>
                      <Button
                        onClick={() => setShowRequestContractModal(true)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Solicitar Código de Contratación
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Alerta de solicitud de contrato pendiente */}
              {contractRequest.hiringCode && contractRequest.hasMissingData && (
                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <CardTitle className="text-yellow-900">Solicitud de Contrato Pendiente</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-700">
                        Hay una solicitud de contrato pendiente que requiere completar los datos faltantes.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-yellow-900 mb-2">
                          Datos faltantes:
                        </p>
                        <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                          {!contractRequest.hiringCode && (
                            <li>Nombre completo del cliente</li>
                          )}
                          <li>Número de pasaporte o NIE</li>
                          <li>Dirección completa</li>
                        </ul>
                      </div>
                      <Button
                        onClick={contractRequest.openModal}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Completar Datos del Contrato
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Responsable</CardTitle>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenAssignModal}
                    className="h-8 px-2"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {(opportunity.assigned_to || opportunity.assigned_to_id) ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-600 font-medium mb-1">Asignado a</p>
                      <p className="text-sm text-blue-900 font-semibold truncate">
                        {getAssignedToDisplayName()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium mb-1">Sin asignar</p>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleOpenAssignModal}
                          className="mt-2"
                        >
                          Asignar Agente
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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

      {/* Modal para solicitar contrato */}
      <RequestContractModal
        isOpen={showRequestContractModal}
        onClose={() => setShowRequestContractModal(false)}
        entityType="leads"
        entityId={opportunity.id}
        opportunity={opportunity}
        contact={contact}
        onSuccess={(_hiringCode) => {
          // Recargar datos de la oportunidad
          // hiringCode está disponible pero no se usa en este callback
          queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
          queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          setShowRequestContractModal(false);
        }}
      />

      {/* Modal para completar datos del contrato */}
      {contractRequest.hiringCode && (
        <ContractDataRequestModal
          isOpen={contractRequest.isModalOpen}
          onClose={contractRequest.closeModal}
          hiringCode={contractRequest.hiringCode}
          contactName={contact?.name}
          contactEmail={contact?.email}
          onSuccess={() => {
            // Recargar datos de la oportunidad
            queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
            contractRequest.closeModal();
          }}
        />
      )}

      {/* Modal para asignar/editar agente */}
      <Modal
        open={showAssignModal}
        onClose={handleCloseAssignModal}
        title="Asignar Agente"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={handleCloseAssignModal}
              disabled={isAssigning}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssignAgent}
              disabled={isAssigning || loadingUsers || isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {(isAssigning || isUpdating) ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="agent-select" className="text-sm font-medium text-gray-700 mb-2 block">
              Seleccionar Agente
            </Label>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <select
                id="agent-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                disabled={isAssigning}
              >
                <option value="">Sin asignar</option>
                {filteredUsers.map(user => {
                  const displayName = user.name?.trim() || user.email?.trim() || `Usuario ${user.id?.slice(0, 8) || 'N/A'}`;
                  const roleLabel = user.role_name === 'lawyer' ? 'Abogado' : 
                                   user.role_name === 'agent' ? 'Agente' : 
                                   user.role_name || 'Usuario';
                  return (
                    <option key={user.id} value={user.id}>
                      {displayName} ({roleLabel})
                    </option>
                  );
                })}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Solo abogados y agentes pueden ser responsables
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

