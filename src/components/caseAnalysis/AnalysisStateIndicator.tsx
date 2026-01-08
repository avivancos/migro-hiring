// AnalysisStateIndicator - Indicador de estado del análisis optimizado para mobile

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ExclamationCircleIcon, ExclamationTriangleIcon, UserIcon } from '@heroicons/react/24/outline';
import { AnalysisState } from '@/types/caseAnalysis';

interface AnalysisStateIndicatorProps {
  state: AnalysisState;
  onRetry?: () => void;
  error?: Error | null;
  className?: string;
}

export function AnalysisStateIndicator({
  state,
  onRetry,
  error,
  className,
}: AnalysisStateIndicatorProps) {
  switch (state) {
    case AnalysisState.LOADING:
      return (
        <div className={`flex flex-col items-center justify-center py-12 ${className || ''}`}>
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
            <UserIcon className="h-16 w-16 text-purple-600 relative z-10" strokeWidth={1.5} />
          </div>
          <p className="mt-4 text-gray-600 text-center font-medium">Pili está analizando el caso</p>
        </div>
      );

    case AnalysisState.ERROR:
      // Verificar si es un error 400 (oportunidad sin llamadas)
      const is400Error = error && typeof error === 'object' && 'response' in error 
        ? (error as any).response?.status === 400 
        : false;
      
      const errorMessage = is400Error && error && typeof error === 'object' && 'response' in error
        ? (error as any).response?.data?.detail || 'No se puede analizar una oportunidad sin llamadas'
        : 'Error al analizar el caso';
      
      return (
        <div className={`flex flex-col items-center justify-center py-12 ${className || ''}`}>
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-500 text-center mb-2 font-medium">Error al analizar el caso</p>
          <p className="text-gray-600 text-center text-sm mb-4 px-4 max-w-md">
            {errorMessage}
          </p>
          {is400Error && (
            <p className="text-gray-500 text-center text-xs mb-4 px-4 max-w-md italic">
              Realiza al menos una llamada al contacto antes de analizar la oportunidad.
            </p>
          )}
          {onRetry && !is400Error && (
            <Button onClick={onRetry} variant="outline" className="min-h-[44px]">
              Reintentar
            </Button>
          )}
        </div>
      );

    case AnalysisState.PARTIAL:
      return (
        <div className={`flex flex-col items-center justify-center py-8 ${className || ''}`}>
          <ExclamationTriangleIcon className="h-10 w-10 text-yellow-500 mb-3" />
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

