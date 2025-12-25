// AnalysisStateIndicator - Indicador de estado del análisis optimizado para mobile

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { AnalysisState } from '@/types/caseAnalysis';

interface AnalysisStateIndicatorProps {
  state: AnalysisState;
  onRetry?: () => void;
  className?: string;
}

export function AnalysisStateIndicator({
  state,
  onRetry,
  className,
}: AnalysisStateIndicatorProps) {
  switch (state) {
    case AnalysisState.LOADING:
      return (
        <div className={`flex flex-col items-center justify-center py-12 ${className || ''}`}>
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 text-center">Analizando caso...</p>
        </div>
      );

    case AnalysisState.ERROR:
      return (
        <div className={`flex flex-col items-center justify-center py-12 ${className || ''}`}>
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-500 text-center mb-4">Error al analizar el caso</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="min-h-[44px]">
              Reintentar
            </Button>
          )}
        </div>
      );

    case AnalysisState.PARTIAL:
      return (
        <div className={`flex flex-col items-center justify-center py-8 ${className || ''}`}>
          <AlertTriangle className="h-10 w-10 text-yellow-500 mb-3" />
          <p className="text-yellow-700 text-center font-medium mb-1">
            ⚠️ Análisis básico disponible
          </p>
          <p className="text-sm text-gray-600 text-center">
            Análisis avanzado no disponible
          </p>
        </div>
      );

    default:
      return null;
  }
}

