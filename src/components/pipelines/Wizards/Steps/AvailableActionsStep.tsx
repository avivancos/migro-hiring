// Paso 2: Acciones disponibles por rol
// Diseño mobile-first simple

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ChevronRightIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { PipelineStageRead, PipelineActionRead, ActionTypeRead, UserRole } from '@/types/pipeline';
import type { WizardChanges } from '../PipelineModifyWizard';

interface AvailableActionsStepProps {
  stage: PipelineStageRead;
  actions: PipelineActionRead[];
  actionTypes: ActionTypeRead[];
  userRole: UserRole;
  onNext: () => void;
  onPrevious: () => void;
  onChange: (changes: Partial<WizardChanges>) => void;
}

export function AvailableActionsStep({
  stage,
  actions,
  actionTypes,
  userRole,
  onNext,
  onPrevious,
  onChange,
}: AvailableActionsStepProps) {
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());

  // Filtrar acciones por rol y etapa
  const availableForRole = actionTypes.filter(
    (at) =>
      at.required_role === userRole &&
      (at.applicable_stages?.includes(stage.current_stage) || !at.applicable_stages)
  );

  const requiredActions = availableForRole.filter((at) => {
    // La primera acción siempre es requerida si no hay acciones
    if (actions.length === 0 && at.action_code === 'elevate_to_lawyer') {
      return true;
    }
    return false; // Por ahora, solo la primera es requerida
  });

  const optionalActions = availableForRole.filter((at) => {
    if (actions.length === 0 && at.action_code === 'elevate_to_lawyer') {
      return false;
    }
    return true;
  });

  // Acciones de otros roles (bloqueadas)
  const otherRoleActions = actionTypes.filter((at) => at.required_role !== userRole);

  const handleToggleAction = (actionCode: string) => {
    const newSelected = new Set(selectedActions);
    if (newSelected.has(actionCode)) {
      newSelected.delete(actionCode);
    } else {
      newSelected.add(actionCode);
    }
    setSelectedActions(newSelected);

    // Actualizar cambios
    onChange({
      actions: Array.from(newSelected).map((code) => ({
        actionType: code,
      })),
    });
  };

  const canContinue = selectedActions.size > 0 || requiredActions.length > 0;

  return (
    <div className="space-y-6">
      {/* Información del rol */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-1">
          Rol: {userRole === 'agent' ? 'Agente' : userRole === 'lawyer' ? 'Abogado' : 'Admin'}
        </h3>
        <p className="text-sm text-gray-600">
          Selecciona las acciones que deseas realizar
        </p>
      </div>

      {/* Acciones requeridas */}
      {requiredActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              Acciones Requeridas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requiredActions.map((actionType) => (
                <ActionCard
                  key={actionType.id}
                  actionType={actionType}
                  isSelected={true}
                  isRequired={true}
                  onToggle={() => {}} // No se puede deseleccionar
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones opcionales */}
      {optionalActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Opcionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {optionalActions.map((actionType) => (
                <ActionCard
                  key={actionType.id}
                  actionType={actionType}
                  isSelected={selectedActions.has(actionType.action_code)}
                  isRequired={false}
                  onToggle={() => handleToggleAction(actionType.action_code)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones de otros roles (bloqueadas) */}
      {otherRoleActions.length > 0 && (
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LockClosedIcon className="h-5 w-5 text-gray-400" />
              Acciones de Otros Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {otherRoleActions.slice(0, 3).map((actionType) => (
                <div
                  key={actionType.id}
                  className="border rounded-lg p-4 bg-gray-50 cursor-not-allowed"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-500 mb-1">
                        {actionType.action_name}
                      </h4>
                      {actionType.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {actionType.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="neutral" className="text-xs">
                      {actionType.required_role}
                    </Badge>
                  </div>
                </div>
              ))}
              {otherRoleActions.length > 3 && (
                <p className="text-xs text-center text-gray-400 pt-2">
                  +{otherRoleActions.length - 3} acción{otherRoleActions.length - 3 !== 1 ? 'es' : ''} más
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navegación */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="flex-1 h-12"
        >
          Atrás
        </Button>
        <Button
          onClick={onNext}
          disabled={!canContinue}
          className="flex-1 h-12"
        >
          Continuar
          <ChevronRightIcon className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Componente de tarjeta de acción
interface ActionCardProps {
  actionType: ActionTypeRead;
  isSelected: boolean;
  isRequired: boolean;
  onToggle: () => void;
}

function ActionCard({ actionType, isSelected, isRequired, onToggle }: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full text-left border-2 rounded-lg p-4 transition-all',
        isSelected
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
        isRequired && 'border-green-600 bg-green-50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-base text-gray-900">
              {actionType.action_name}
            </h4>
            {isRequired && (
              <Badge variant="success" className="text-xs">
                Requerida
              </Badge>
            )}
          </div>
          {actionType.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {actionType.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {actionType.validation_role && (
              <span>
                Valida: {actionType.validation_role === 'lawyer' ? 'Abogado' : actionType.validation_role === 'admin' ? 'Admin' : 'Agente'}
              </span>
            )}
            {actionType.default_due_days > 0 && (
              <span>Plazo: {actionType.default_due_days} día{actionType.default_due_days !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {isSelected ? (
            <CheckCircleIcon className="h-6 w-6 text-blue-600" />
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
          )}
        </div>
      </div>
    </button>
  );
}

