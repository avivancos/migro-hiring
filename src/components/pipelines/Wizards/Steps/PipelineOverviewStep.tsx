// Paso 1: Vista general del pipeline
// Diseño mobile-first simple

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { PipelineStageRead, PipelineActionRead } from '@/types/pipeline';

interface PipelineOverviewStepProps {
  stage: PipelineStageRead;
  actions: PipelineActionRead[];
  onNext: () => void;
}

const STAGE_LABELS: Record<string, { label: string; description: string }> = {
  agent_initial: { label: 'Inicial Agente', description: 'Creación de situación inicial' },
  lawyer_validation: { label: 'Validación Abogado', description: 'Revisión y validación' },
  admin_contract: { label: 'Contrato Admin', description: 'Generación de contrato' },
  client_signature: { label: 'Firma Cliente', description: 'Firma y pago' },
  expediente_created: { label: 'Expediente Creado', description: 'Expediente finalizado' },
};

const STAGE_ORDER = [
  'agent_initial',
  'lawyer_validation',
  'admin_contract',
  'client_signature',
  'expediente_created',
];

export function PipelineOverviewStep({
  stage,
  actions,
  onNext,
}: PipelineOverviewStepProps) {
  const currentIndex = STAGE_ORDER.indexOf(stage.current_stage);

  const getStatusBadge = (action: PipelineActionRead) => {
    switch (action.status) {
      case 'validated':
        return <Badge variant="success">Validada</Badge>;
      case 'rejected':
        return <Badge variant="error">Rechazada</Badge>;
      case 'completed':
        return <Badge variant="info">Completada</Badge>;
      default:
        return <Badge variant="warning">Pendiente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Información del contacto/oportunidad */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Información del Caso</h3>
        <div className="space-y-1 text-sm text-gray-700">
          <p>
            <span className="font-medium">ID:</span> {stage.entity_id}
          </p>
          <p>
            <span className="font-medium">Tipo:</span> {stage.entity_type === 'leads' ? 'Oportunidad' : 'Contacto'}
          </p>
          <p>
            <span className="font-medium">Etapa actual:</span>{' '}
            {STAGE_LABELS[stage.current_stage]?.label || stage.current_stage}
          </p>
        </div>
      </div>

      {/* Etapas del pipeline - Vista móvil vertical */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Etapas del Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {STAGE_ORDER.map((stageKey, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const stageInfo = STAGE_LABELS[stageKey];

              return (
                <div key={stageKey} className="flex items-start gap-4">
                  {/* Indicador */}
                  <div className="flex flex-col items-center pt-1">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                    ) : isCurrent ? (
                      <div className="h-6 w-6 rounded-full border-2 border-blue-600 bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <div className="h-3 w-3 rounded-full bg-blue-600" />
                      </div>
                    ) : (
                      <Circle className="h-6 w-6 text-gray-300 flex-shrink-0" />
                    )}
                    {index < STAGE_ORDER.length - 1 && (
                      <div
                        className={cn(
                          'w-0.5 h-8 mt-1',
                          isCompleted ? 'bg-green-600' : 'bg-gray-200'
                        )}
                      />
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 pb-4">
                    <h4
                      className={cn(
                        'text-base font-medium mb-1',
                        isCurrent
                          ? 'text-blue-600'
                          : isCompleted
                          ? 'text-gray-700'
                          : 'text-gray-400'
                      )}
                    >
                      {stageInfo.label}
                    </h4>
                    <p className="text-sm text-gray-500">{stageInfo.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Acciones actuales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acciones Actuales</CardTitle>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No hay acciones creadas aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actions.slice(0, 3).map((action) => (
                <div
                  key={action.id}
                  className="border rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-sm text-gray-900 flex-1">
                      {action.action_name || action.action_type}
                    </h4>
                    {getStatusBadge(action)}
                  </div>
                  {action.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {action.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    {format(new Date(action.created_at), 'dd MMM yyyy', { locale: es })}
                  </div>
                </div>
              ))}
              {actions.length > 3 && (
                <p className="text-xs text-center text-gray-500 pt-2">
                  +{actions.length - 3} acción{actions.length - 3 !== 1 ? 'es' : ''} más
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón siguiente - Mobile first, grande y visible */}
      <Button
        onClick={onNext}
        className="w-full h-14 text-base font-semibold"
        size="lg"
      >
        Continuar
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}






