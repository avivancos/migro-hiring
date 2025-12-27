// GradingIndicator - Indicador de grading optimizado para mobile

import { cn } from '@/lib/utils';

interface GradingIndicatorProps {
  grading: 'A' | 'B+' | 'B-' | 'C';
  showLabel?: boolean;
  className?: string;
}

export function GradingIndicator({
  grading,
  showLabel = true,
  className,
}: GradingIndicatorProps) {
  const config = {
    A: { color: '#34C759', label: 'Óptimo', bgColor: 'bg-[#34C759]' },
    'B+': { color: '#5AC8FA', label: 'Favorable', bgColor: 'bg-[#5AC8FA]' },
    'B-': { color: '#FF9500', label: 'Aceptable', bgColor: 'bg-[#FF9500]' },
    C: { color: '#FF3B30', label: 'Complejo', bgColor: 'bg-[#FF3B30]' },
  };

  const { color, label, bgColor } = config[grading];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('w-3 h-3 rounded-full', bgColor)}
        style={{ backgroundColor: color }}
      />
      <span className="text-lg font-semibold text-gray-900">{grading}</span>
      {showLabel && (
        <span className="text-sm text-gray-600 hidden sm:inline">{label}</span>
      )}
    </div>
  );
}





