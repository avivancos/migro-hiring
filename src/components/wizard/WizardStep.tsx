// WizardStep - Paso individual del wizard

import { useState, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WizardField } from './WizardField';
import { WizardGuidance } from './WizardGuidance';
import type { WizardStepResponse, WizardGuidance as WizardGuidanceType } from '@/types/wizard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardStepProps {
  step: WizardStepResponse;
  initialData?: Record<string, any>;
  onDataChange: (data: Record<string, any>) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  canAdvance: boolean;
  guidance?: WizardGuidanceType;
}

export function WizardStep({
  step,
  initialData = {},
  onDataChange,
  onNext,
  onPrevious,
  canAdvance,
  guidance,
}: WizardStepProps) {
  const [stepData, setStepData] = useState<Record<string, any>>(initialData);

  useEffect(() => {
    onDataChange(stepData);
  }, [stepData, onDataChange]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setStepData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Título del paso */}
      <CardHeader>
        <CardTitle className="text-xl">{step.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Guía del wizard */}
        {guidance && <WizardGuidance guidance={guidance} />}

        {/* Campos del paso */}
        <div className="space-y-4">
          {step.fields.map((field) => (
            <WizardField
              key={field.name}
              field={field}
              value={stepData[field.name]}
              onChange={(value) => handleFieldChange(field.name, value)}
              error={
                field.required && !stepData[field.name]
                  ? 'Este campo es requerido'
                  : undefined
              }
            />
          ))}
        </div>

        {/* Campos faltantes */}
        {step.missing_fields.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800 mb-2">
              Campos faltantes:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-700">
              {step.missing_fields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Navegación */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!onPrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button
            onClick={onNext}
            disabled={!canAdvance || !step.can_advance}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </div>
  );
}

