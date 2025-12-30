// FirstCallAttemptsRow - Fila horizontal con 5 badges de intentos

import { FirstCallAttemptBadge, type FirstCallAttemptStatus } from './FirstCallAttemptBadge';
import { Check } from 'lucide-react';
import type { FirstCallAttempt } from '@/types/opportunity';
import { getValidAttemptsCount } from '@/utils/opportunity';

export interface FirstCallAttemptsRowProps {
  attempts: { [key: string]: FirstCallAttempt } | null;
  firstCallCompleted?: boolean;
  successfulAttempt?: number | null;
  onAttemptClick?: (attemptNumber: number) => void;
  className?: string;
}

export function FirstCallAttemptsRow({
  attempts,
  firstCallCompleted = false,
  successfulAttempt,
  onAttemptClick,
  className,
}: FirstCallAttemptsRowProps) {
  const getAttemptStatus = (attemptNumber: number): FirstCallAttemptStatus => {
    const attempt = attempts?.[attemptNumber.toString()];
    return (attempt?.status as FirstCallAttemptStatus) || 'pending';
  };

  // Calcular intentos realizados y disponibles
  // Validar que solo se cuenten las claves válidas (1-5)
  const attemptsCompleted = getValidAttemptsCount(attempts);
  const attemptsAvailable = 5 - attemptsCompleted;

  return (
    <div className={className}>
      {/* Header con título y badge de completado */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
        <h3 className="text-base font-semibold text-gray-900">
          Intentos de Primera Llamada
        </h3>
          {!firstCallCompleted && attemptsAvailable > 0 && (
            <span className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
              {attemptsAvailable} intento{attemptsAvailable !== 1 ? 's' : ''} disponible{attemptsAvailable !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {firstCallCompleted && successfulAttempt && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
            <Check className="h-4 w-4" />
            Completada en intento #{successfulAttempt}
          </span>
        )}
      </div>

      {/* Fila de badges */}
      <div className="flex gap-2 sm:gap-3 items-center flex-wrap">
        {[1, 2, 3, 4, 5].map((attemptNumber) => {
          const status = getAttemptStatus(attemptNumber);
          const isSuccessful = firstCallCompleted && successfulAttempt === attemptNumber;

          return (
            <FirstCallAttemptBadge
              key={attemptNumber}
              attemptNumber={attemptNumber}
              status={status}
              isSuccessful={isSuccessful}
              onClick={() => onAttemptClick?.(attemptNumber)}
              size="md"
            />
          );
        })}
      </div>
    </div>
  );
}

