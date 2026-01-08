// Componente para mostrar la siguiente acción sugerida para una oportunidad
// Garantiza que siempre haya una acción siguiente disponible

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowTrendingUpIcon, ClockIcon, ExclamationCircleIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { getSuggestedNextAction } from '@/utils/nextActionResolver';
import type { LeadOpportunity } from '@/types/opportunity';
import type { PipelineActionRead, PipelineStage } from '@/types/pipeline';

interface SuggestedNextActionProps {
  opportunity: LeadOpportunity;
  completedActions?: PipelineActionRead[];
  currentStage?: PipelineStage;
  onActionClick?: (actionCode: string) => void;
}

export function SuggestedNextAction({
  opportunity,
  completedActions = [],
  currentStage,
  onActionClick,
}: SuggestedNextActionProps) {
  const suggestedAction = getSuggestedNextAction(opportunity, completedActions, currentStage);

  if (!suggestedAction) {
    return null;
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getActionIcon = (actionCode: string) => {
    if (actionCode.includes('call') || actionCode.includes('llamada')) {
      return <PhoneIcon className="h-5 w-5" />;
    }
    if (actionCode.includes('follow_up') || actionCode.includes('seguimiento')) {
      return <ArrowTrendingUpIcon className="h-5 w-5" />;
    }
    if (actionCode.includes('wait') || actionCode.includes('esperar')) {
      return <ClockIcon className="h-5 w-5" />;
    }
    if (actionCode.includes('validate') || actionCode.includes('validar')) {
      return <CheckCircleIcon className="h-5 w-5" />;
    }
    return <ExclamationCircleIcon className="h-5 w-5" />;
  };

  const getButtonText = (actionCode: string): string => {
    const actionTexts: Record<string, string> = {
      'make_first_call': 'Realizar Llamada',
      'request_pili_analysis': 'Solicitar Análisis de Pili',
      'elevate_to_lawyer': 'Elevar a Abogado',
      'follow_up_after_failed_calls': 'Realizar Seguimiento',
      'follow_up_rejected_case': 'Realizar Seguimiento',
      'validate_pili_analysis': 'Validar Análisis',
      'wait_lawyer_validation': 'Esperar Validación',
      'approve_or_reject_tramite': 'Aprobar o Rechazar',
      'generate_contract': 'Generar Contrato',
      'wait_signature_payment': 'Esperar Firma y Pago',
      'create_expediente': 'Crear Expediente',
      'relationship_follow_up': 'Realizar Seguimiento',
      'reactivate_opportunity': 'Reactivar Oportunidad',
      'general_follow_up': 'Realizar Seguimiento',
    };
    
    return actionTexts[actionCode] || 'Ejecutar Acción';
  };

  const handleClick = () => {
    // Si es una acción de llamada, redirigir al handler de llamadas
    if (suggestedAction.action_code === 'make_first_call') {
      onActionClick?.('make_call');
      return;
    }

    // Si es análisis de Pili, redirigir a la página de análisis
    if (suggestedAction.action_code === 'request_pili_analysis') {
      onActionClick?.('analyze');
      return;
    }

    // Para otras acciones, usar el código de acción
    onActionClick?.(suggestedAction.action_code);
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Siguiente Acción Sugerida</CardTitle>
          <Badge className={getPriorityColor(suggestedAction.priority)}>
            {suggestedAction.priority === 'high' ? 'Alta' : 
             suggestedAction.priority === 'medium' ? 'Media' : 'Baja'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {getActionIcon(suggestedAction.action_code)}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              {suggestedAction.action_name}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              {suggestedAction.description}
            </p>
            <p className="text-xs text-gray-500 italic">
              {suggestedAction.reason}
            </p>
          </div>
        </div>

        {suggestedAction.required && (
          <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
            <ExclamationCircleIcon className="h-4 w-4" />
            <span>Acción requerida para continuar</span>
          </div>
        )}

        <Button
          onClick={handleClick}
          className="w-full"
          variant={suggestedAction.required ? 'default' : 'outline'}
        >
          {getButtonText(suggestedAction.action_code)}
        </Button>
      </CardContent>
    </Card>
  );
}

