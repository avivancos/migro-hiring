// Visualización del flujo de pipeline
// Mobile-first con timeline horizontal/vertical según tamaño de pantalla

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowRightIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PipelineStage, PipelineStageRead } from '@/types/pipeline';

interface PipelineFlowProps {
  stage: PipelineStageRead;
  onStageClick?: (stage: PipelineStage) => void;
  editable?: boolean;
}

const stages: Array<{
  key: PipelineStage;
  label: string;
  description: string;
}> = [
  {
    key: 'agent_initial',
    label: 'Inicial Agente',
    description: 'Creación de situación inicial',
  },
  {
    key: 'lawyer_validation',
    label: 'Validación Abogado',
    description: 'Revisión y validación',
  },
  {
    key: 'admin_contract',
    label: 'Contrato Admin',
    description: 'Generación de contrato',
  },
  {
    key: 'client_signature',
    label: 'Firma Cliente',
    description: 'Firma y pago',
  },
  {
    key: 'expediente_created',
    label: 'Expediente Creado',
    description: 'Expediente finalizado',
  },
];

export function PipelineFlow({ stage, onStageClick, editable = false }: PipelineFlowProps) {
  const currentIndex = stages.findIndex((s) => s.key === stage.current_stage);

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        {/* Vista móvil: vertical */}
        <div className="block md:hidden space-y-4">
          {stages.map((s, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={s.key} className="flex items-start gap-4">
                {/* Indicador vertical */}
                <div className="flex flex-col items-center">
                  {isCompleted ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  ) : isCurrent ? (
                    <div className="h-6 w-6 rounded-full border-2 border-green-600 bg-green-50 flex items-center justify-center">
                      <div className="h-3 w-3 rounded-full bg-green-600" />
                    </div>
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-gray-300" />
                  )}
                  {index < stages.length - 1 && (
                    <div
                      className={cn(
                        'w-0.5 h-8 mt-1',
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      )}
                    />
                  )}
                </div>

                {/* Contenido */}
                <div
                  className={cn(
                    'flex-1 pb-4',
                    isCurrent && 'font-semibold'
                  )}
                  onClick={() => editable && onStageClick?.(s.key)}
                >
                  <h4 className={cn(
                    'text-sm font-medium mb-1',
                    isCurrent ? 'text-green-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                  )}>
                    {s.label}
                  </h4>
                  <p className="text-xs text-gray-500">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Vista desktop: horizontal */}
        <div className="hidden md:flex items-center justify-between">
          {stages.map((s, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={s.key} className="flex items-center flex-1">
                {/* Etapa */}
                <div
                  className={cn(
                    'flex flex-col items-center flex-1 cursor-pointer transition-all',
                    isCurrent && 'scale-105'
                  )}
                  onClick={() => editable && onStageClick?.(s.key)}
                >
                  {isCompleted ? (
                    <CheckCircleIcon className="h-8 w-8 text-green-600 mb-2" />
                  ) : isCurrent ? (
                    <div className="h-8 w-8 rounded-full border-2 border-green-600 bg-green-50 flex items-center justify-center mb-2">
                      <div className="h-4 w-4 rounded-full bg-green-600" />
                    </div>
                  ) : (
                    <XCircleIcon className="h-8 w-8 text-gray-300 mb-2" />
                  )}
                  <h4 className={cn(
                    'text-xs font-medium mb-1 text-center',
                    isCurrent ? 'text-green-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                  )}>
                    {s.label}
                  </h4>
                  <p className="text-xs text-gray-500 text-center hidden lg:block">
                    {s.description}
                  </p>
                </div>

                {/* Flecha */}
                {index < stages.length - 1 && (
                  <ArrowRightIcon
                    className={cn(
                      'h-5 w-5 mx-2 flex-shrink-0',
                      isCompleted ? 'text-green-600' : 'text-gray-300'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

