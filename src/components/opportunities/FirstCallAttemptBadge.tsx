// FirstCallAttemptBadge - Badge circular para cada intento de primera llamada

import { cn } from '@/lib/utils';
import { AlertTriangle, X, Check, Circle } from 'lucide-react';

export type FirstCallAttemptStatus = 'pending' | 'orange' | 'red' | 'green';

export interface FirstCallAttemptBadgeProps {
  attemptNumber: number; // 1-5
  status: FirstCallAttemptStatus;
  isSuccessful?: boolean; // true si es el intento exitoso
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg'; // sm: 36px, md: 40px, lg: 48px
  className?: string;
}

const statusConfig = {
  pending: {
    bg: 'bg-purple-100',
    border: 'border-purple-400',
    text: 'text-purple-700',
    icon: null,
    iconComponent: null,
  },
  orange: {
    bg: 'bg-orange-200',
    border: 'border-orange-400',
    text: 'text-orange-700',
    icon: '⚠️',
    iconComponent: AlertTriangle,
  },
  red: {
    bg: 'bg-red-200',
    border: 'border-red-400',
    text: 'text-red-700',
    icon: '❌',
    iconComponent: X,
  },
  green: {
    bg: 'bg-green-200',
    border: 'border-green-500',
    text: 'text-green-700',
    icon: '✅',
    iconComponent: Check,
  },
};

const sizeClasses = {
  sm: 'w-9 h-9 text-xs', // 36px
  md: 'w-10 h-10 text-sm', // 40px
  lg: 'w-12 h-12 text-base', // 48px
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

export function FirstCallAttemptBadge({
  attemptNumber,
  status,
  isSuccessful = false,
  onClick,
  size = 'md',
  className,
}: FirstCallAttemptBadgeProps) {
  const config = statusConfig[status];
  const IconComponent = config.iconComponent;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          // Base styles
          'rounded-full border-2 flex items-center justify-center font-bold',
          'transition-all duration-200',
          'relative',
          // Size
          sizeClasses[size],
          // Status colors
          config.bg,
          config.border,
          config.text,
          // Successful attempt styling
          isSuccessful && 'border-[3px] shadow-md shadow-green-500/30',
          // Interactive states
          onClick && 'cursor-pointer active:scale-95 hover:scale-105',
          !onClick && 'cursor-default',
          // Focus states
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          className
        )}
        aria-label={`Intento ${attemptNumber}: ${status}`}
        aria-pressed={status !== 'pending' ? 'true' : 'false'}
      >
        {/* Número del intento */}
        <span className="font-bold">{attemptNumber}</span>

        {/* Icono pequeño en la esquina inferior derecha */}
        {IconComponent && status !== 'pending' && (
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5',
              'bg-white rounded-full border border-current p-0.5',
              'flex items-center justify-center',
              iconSizeClasses[size]
            )}
          >
            <IconComponent className={cn(iconSizeClasses[size], config.text)} />
          </span>
        )}

        {/* Icono de pending si es pending */}
        {status === 'pending' && (
          <Circle className={cn('absolute opacity-30', iconSizeClasses[size], config.text)} />
        )}
      </button>

      {/* Badge "NUEVO" para estado pending */}
      {status === 'pending' && (
        <span className="inline-flex items-center rounded-full border border-purple-400 bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 uppercase tracking-wide leading-tight">
          NUEVO
        </span>
      )}
    </div>
  );
}
