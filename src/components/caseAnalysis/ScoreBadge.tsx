// ScoreBadge - Badge de score optimizado para mobile

import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function ScoreBadge({ score, size = 'medium', className }: ScoreBadgeProps) {
  const sizeMap = {
    small: 'w-10 h-10 text-base',
    medium: 'w-16 h-16 text-2xl',
    large: 'w-20 h-20 text-3xl',
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-[#34C759]'; // Verde
    if (score >= 6) return 'bg-[#5AC8FA]'; // Azul
    if (score >= 4) return 'bg-[#FF9500]'; // Naranja
    return 'bg-[#FF3B30]'; // Rojo
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-bold shadow-md',
        sizeMap[size],
        getScoreColor(score),
        className
      )}
    >
      {score.toFixed(1)}
    </div>
  );
}





