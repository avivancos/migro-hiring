// Paso 4: Revisar y confirmar cambios
// Diseño mobile-first simple

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { CalendarIcon, ExclamationCircleIcon, FlagIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCRMUsers } from '@/hooks/useCRMUsers';
import type { PipelineStageRead } from '@/types/pipeline';
import type { WizardChanges } from '../PipelineModifyWizard';

interface ReviewChangesStepProps {
  stage: PipelineStageRead;
  changes: WizardChanges;
  onComplete: () => void;
  onPrevious: () => void;
  onCancel?: () => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const PRIORITY_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  low: 'info',
  medium: 'success',
  high: 'warning',
  urgent: 'error',
};

export function ReviewChangesStep({
  stage,
  changes,
  onComplete,
  onPrevious,
  onCancel,
}: ReviewChangesStepProps) {
  const { users } = useCRMUsers({ isActive: true });
  const hasChanges = changes.actions.length > 0;

  const getUserName = (userId?: string): string => {
    if (!userId) return 'No asignado';
    const user = users.find((u) => String(u.id) === userId);
    return user?.name || userId;
  };

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">
          Resumen de Modificaciones
        </h3>
        <p className="text-sm text-gray-600">
          Revisa los cambios antes de confirmar
        </p>
      </div>

      {/* Cambios realizados */}
      {hasChanges ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              Cambios Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {changes.actions.map((action, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-semibold text-base text-gray-900">
                      Acción {index + 1}: {action.actionType}
                    </h4>
                    <Badge variant="success">Nueva</Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    {action.responsibleId && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Responsable:</span>
                        <span>{getUserName(action.responsibleId)}</span>
                      </div>
                    )}

                    {action.dueDate && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Fecha límite:</span>
                        <span>
                          {format(new Date(action.dueDate), 'dd MMMM yyyy', { locale: es })}
                        </span>
                      </div>
                    )}

                    {action.priority && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <FlagIcon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Prioridad:</span>
                        <Badge variant={PRIORITY_COLORS[action.priority] || 'neutral'}>
                          {PRIORITY_LABELS[action.priority] || action.priority}
                        </Badge>
                      </div>
                    )}

                    {action.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Notas:</p>
                        <p className="text-sm text-gray-700">{action.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <ExclamationCircleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">
                No hay cambios para aplicar
              </h4>
              <p className="text-sm text-gray-600">
                No se han seleccionado acciones para modificar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline final */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Final</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Etapa actual:</span>
              <Badge variant="info">{stage.current_stage}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Acciones nuevas:</span>
              <Badge variant="success">{changes.actions.length}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advertencia */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-1">
              Confirmar Cambios
            </h4>
            <p className="text-sm text-yellow-700">
              Al confirmar, se crearán las nuevas acciones en el pipeline. Esta acción no se puede deshacer fácilmente.
            </p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex flex-col gap-3 pt-4 border-t">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onPrevious}
            className="flex-1 h-12"
          >
            Atrás
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="h-12 px-6"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          onClick={onComplete}
          disabled={!hasChanges}
          className="w-full h-14 text-base font-semibold"
          size="lg"
        >
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          Confirmar y Guardar
        </Button>
      </div>
    </div>
  );
}

