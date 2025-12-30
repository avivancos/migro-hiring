// ProductivityScoreBadge - Badge para mostrar puntuación de productividad

import { cn } from '@/lib/utils';
import { getProductivityColorClass } from '@/utils/agentJournal';
import { Skeleton } from '@/components/common/Skeleton';

interface ProductivityScoreBadgeProps {
  score: number | null; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  loading?: boolean;
}

export function ProductivityScoreBadge({
  score,
  size = 'md',
  showLabel = true,
  loading = false,
}: ProductivityScoreBadgeProps) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-4xl',
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Skeleton className={cn('rounded-full', sizeClasses[size])} variant="circular" />
        {showLabel && <Skeleton className="h-4 w-20" />}
      </div>
    );
  }

  if (score === null) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className={cn(
          'rounded-full flex items-center justify-center font-bold border-4',
          'bg-gray-100 text-gray-600 border-gray-300',
          sizeClasses[size]
        )}>
          --
        </div>
        {showLabel && (
          <p className="text-sm font-medium text-gray-600">Sin datos</p>
        )}
      </div>
    );
  }

  const colorClass = getProductivityColorClass(score);
  const label = score >= 80 ? 'Excelente' : 
                score >= 60 ? 'Bueno' : 
                score >= 40 ? 'Regular' : 'Bajo';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        'rounded-full flex items-center justify-center font-bold border-4',
        colorClass,
        sizeClasses[size]
      )}>
        {Math.round(score)}
      </div>
      {showLabel && (
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Productividad</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      )}
    </div>
  );
}

