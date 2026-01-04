// Paso 3: Modificar responsables y fechas
// Diseño mobile-first simple

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, Calendar, User, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCRMUsers } from '@/hooks/useCRMUsers';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { PipelineStageRead, PipelineActionRead } from '@/types/pipeline';
import type { WizardChanges } from '../PipelineModifyWizard';

interface ModifyResponsiblesStepProps {
  stage: PipelineStageRead;
  actions: PipelineActionRead[];
  changes: WizardChanges;
  onNext: () => void;
  onPrevious: () => void;
  onChange: (changes: Partial<WizardChanges>) => void;
}

export function ModifyResponsiblesStep({
  stage: _stage,
  actions: _actions,
  changes,
  onNext,
  onPrevious,
  onChange,
}: ModifyResponsiblesStepProps) {
  // Usar onlyResponsibles para cargar solo lawyers y agents (no todos los usuarios)
  const { users, loading: loadingUsers } = useCRMUsers({ isActive: true, onlyResponsibles: true });
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);
  const [actionConfig, setActionConfig] = useState<{
    responsibleId?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    notes?: string;
  }>({});

  // Inicializar configuración de la acción seleccionada
  useEffect(() => {
    const action = changes.actions[selectedActionIndex];
    if (action) {
      setActionConfig({
        responsibleId: action.responsibleId,
        dueDate: action.dueDate || format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        priority: action.priority || 'medium',
        notes: action.notes,
      });
    } else {
      // Valores por defecto
      setActionConfig({
        dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        priority: 'medium',
      });
    }
  }, [selectedActionIndex, changes.actions]);

  // Guardar cambios cuando se modifica la configuración
  useEffect(() => {
    const newActions = [...changes.actions];
    if (newActions[selectedActionIndex]) {
      newActions[selectedActionIndex] = {
        ...newActions[selectedActionIndex],
        ...actionConfig,
      };
      onChange({ actions: newActions });
    }
  }, [actionConfig]);

  const handleSaveAction = () => {
    const newActions = [...changes.actions];
    if (newActions[selectedActionIndex]) {
      newActions[selectedActionIndex] = {
        ...newActions[selectedActionIndex],
        ...actionConfig,
      };
    } else {
      newActions.push({
        actionType: changes.actions[selectedActionIndex]?.actionType || '',
        ...actionConfig,
      });
    }
    onChange({ actions: newActions });

    // Avanzar a la siguiente acción o continuar
    if (selectedActionIndex < changes.actions.length - 1) {
      setSelectedActionIndex(selectedActionIndex + 1);
    } else {
      onNext();
    }
  };

  if (changes.actions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">
              No hay acciones seleccionadas
            </h3>
            <p className="text-sm text-yellow-700">
              Por favor, regresa al paso anterior y selecciona al menos una acción.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={onPrevious}
          className="w-full h-12"
        >
          Volver
        </Button>
      </div>
    );
  }

  const currentAction = changes.actions[selectedActionIndex];
  const actionName = currentAction?.actionType || 'Acción';

  return (
    <div className="space-y-6">
      {/* Indicador de acción actual */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">
            Configurar Acción {selectedActionIndex + 1} de {changes.actions.length}
          </h3>
          <span className="text-sm text-gray-600">
            {actionName}
          </span>
        </div>
        {changes.actions.length > 1 && (
          <div className="flex gap-2 mt-3">
            {changes.actions.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedActionIndex(index)}
                className={`flex-1 h-2 rounded-full transition-all ${
                  index === selectedActionIndex
                    ? 'bg-blue-600'
                    : index < selectedActionIndex
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
                aria-label={`Acción ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Formulario de configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuración de Acción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Responsable */}
          <div className="space-y-2">
            <Label htmlFor="responsible" className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              Responsable de Validación
            </Label>
            {loadingUsers ? (
              <div className="flex items-center justify-center h-12">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <select
                id="responsible"
                value={actionConfig.responsibleId || ''}
                onChange={(e) =>
                  setActionConfig({ ...actionConfig, responsibleId: e.target.value })
                }
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              >
                <option value="">Seleccionar responsable...</option>
                {users.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {user.name} ({user.role_name === 'lawyer' ? 'Abogado' : user.role_name === 'admin' ? 'Admin' : user.role_name || 'Usuario'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fecha límite */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              Fecha Límite
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={actionConfig.dueDate || ''}
              onChange={(e) =>
                setActionConfig({ ...actionConfig, dueDate: e.target.value })
              }
              className="h-12 text-base"
              min={format(new Date(), 'yyyy-MM-dd')}
            />
            <p className="text-xs text-gray-500">
              Fecha por defecto: {format(addDays(new Date(), 1), 'dd MMMM yyyy', { locale: es })}
            </p>
          </div>

          {/* Prioridad */}
          <div className="space-y-2">
            <Label>Prioridad</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setActionConfig({ ...actionConfig, priority })}
                  className={`h-12 rounded-lg border-2 transition-all text-sm font-medium ${
                    actionConfig.priority === priority
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {priority === 'low'
                    ? 'Baja'
                    : priority === 'medium'
                    ? 'Media'
                    : priority === 'high'
                    ? 'Alta'
                    : 'Urgente'}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              value={actionConfig.notes || ''}
              onChange={(e) =>
                setActionConfig({ ...actionConfig, notes: e.target.value })
              }
              placeholder="Añadir notas sobre esta acción..."
              className="min-h-[100px] text-base"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

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
          onClick={handleSaveAction}
          className="flex-1 h-12"
        >
          {selectedActionIndex < changes.actions.length - 1 ? 'Siguiente Acción' : 'Continuar'}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

