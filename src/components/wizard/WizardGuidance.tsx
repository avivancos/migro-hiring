// WizardGuidance - Mensaje de guía del wizard

import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, MessageCircle, Info } from 'lucide-react';
import type { WizardGuidance as WizardGuidanceType } from '@/types/wizard';

interface WizardGuidanceProps {
  guidance: WizardGuidanceType;
}

export function WizardGuidance({
  guidance,
}: WizardGuidanceProps) {
  return (
    <div className="space-y-4">
      {/* Mensaje principal de guía */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                {guidance.message}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pregunta sugerida */}
      {guidance.suggested_question && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-yellow-800 mb-1">
                  Pregunta sugerida:
                </p>
                <p className="text-sm text-yellow-900">
                  {guidance.suggested_question}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conexión con Migro */}
      {guidance.migro_connection && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-green-800 mb-1">
                  ¿Por qué es importante?
                </p>
                <p className="text-sm text-green-900">
                  {guidance.migro_connection}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campo a recolectar */}
      {guidance.field_to_collect && (
        <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
          <span className="font-semibold">Campo a recolectar:</span>{' '}
          {guidance.field_to_collect}
        </div>
      )}
    </div>
  );
}

