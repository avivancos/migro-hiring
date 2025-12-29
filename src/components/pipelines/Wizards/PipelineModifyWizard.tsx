// Wizard principal de modificación de pipeline
// Diseño mobile-first con máxima simplicidad

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PipelineOverviewStep } from './Steps/PipelineOverviewStep';
import { AvailableActionsStep } from './Steps/AvailableActionsStep';
import { ModifyResponsiblesStep } from './Steps/ModifyResponsiblesStep';
import { ReviewChangesStep } from './Steps/ReviewChangesStep';
import { pipelineApi } from '@/services/pipelineApi';
import { useAuth } from '@/hooks/useAuth';
import type { PipelineStageRead, PipelineActionRead, EntityType, ActionTypeRead } from '@/types/pipeline';

interface PipelineModifyWizardProps {
  entityType: EntityType;
  entityId: string;
  onComplete?: (changes: WizardChanges) => void;
  onCancel?: () => void;
}

export interface WizardChanges {
  actions: Array<{
    actionId?: string;
    actionType: string;
    responsibleId?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    notes?: string;
  }>;
}

const TOTAL_STEPS = 4;

export function PipelineModifyWizard({
  entityType,
  entityId,
  onComplete,
  onCancel,
}: PipelineModifyWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<PipelineStageRead | null>(null);
  const [actions, setActions] = useState<PipelineActionRead[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionTypeRead[]>([]);
  const [changes, setChanges] = useState<WizardChanges>({ actions: [] });

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [entityType, entityId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stageData, actionsData, actionTypesData] = await Promise.all([
        pipelineApi.getStage(entityType, entityId),
        pipelineApi.listActions(entityType, entityId),
        pipelineApi.getActionTypes({ is_active: true }),
      ]);
      setStage(stageData);
      setActions(actionsData.items || []);
      setActionTypes(actionTypesData || []);
    } catch (error) {
      console.error('Error cargando datos del pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChange = (newChanges: Partial<WizardChanges>) => {
    setChanges((prev) => ({ ...prev, ...newChanges }));
  };

  const handleComplete = () => {
    onComplete?.(changes);
  };

  if (loading || !stage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  const userRole = (user?.role || 'agent') as 'agent' | 'lawyer' | 'admin';

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Barra de progreso móvil */}
      <div className="mb-6 md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Paso {currentStep} de {TOTAL_STEPS}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / TOTAL_STEPS) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Contenido del wizard */}
      <Card className="shadow-lg flex flex-col h-full max-h-full">
        <CardHeader className="border-b bg-gray-50 flex-shrink-0">
          <CardTitle className="text-xl md:text-2xl text-center">
            Modificar Pipeline
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 md:p-6 overflow-y-auto flex-1 min-h-0">
          {/* Paso 1: Vista general */}
          {currentStep === 1 && (
            <PipelineOverviewStep
              stage={stage}
              actions={actions}
              onNext={handleNext}
            />
          )}

          {/* Paso 2: Acciones disponibles */}
          {currentStep === 2 && (
            <AvailableActionsStep
              stage={stage}
              actions={actions}
              actionTypes={actionTypes}
              userRole={userRole}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onChange={handleChange}
            />
          )}

          {/* Paso 3: Modificar responsables */}
          {currentStep === 3 && (
            <ModifyResponsiblesStep
              stage={stage}
              actions={actions}
              changes={changes}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onChange={handleChange}
            />
          )}

          {/* Paso 4: Revisar cambios */}
          {currentStep === 4 && (
            <ReviewChangesStep
              stage={stage}
              changes={changes}
              onComplete={handleComplete}
              onPrevious={handlePrevious}
              onCancel={onCancel}
            />
          )}
        </CardContent>

        {/* Navegación inferior - Solo en desktop */}
        {currentStep > 1 && currentStep < 4 && (
          <div className="hidden md:flex items-center justify-between p-6 border-t bg-gray-50 flex-shrink-0">
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="min-w-[120px]"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Atrás
            </Button>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-2 rounded-full ${
                    step === currentStep
                      ? 'bg-primary'
                      : step < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <Button
              onClick={handleNext}
              className="min-w-[120px]"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}




