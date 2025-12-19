// MigroLogo - Componente reutilizable para el logo de Migro
import { cn } from '@/lib/utils';

interface MigroLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
  variant?: 'default' | 'sidebar' | 'header';
}

export function MigroLogo({ 
  className, 
  showText = false, 
  textClassName,
  variant = 'default' 
}: MigroLogoProps) {
  const getSize = () => {
    switch (variant) {
      case 'sidebar':
        return 'h-8 w-auto';
      case 'header':
        return 'h-6 sm:h-8 w-auto';
      default:
        return 'h-8 w-auto';
    }
  };

  const getTextSize = () => {
    switch (variant) {
      case 'sidebar':
        return 'text-xl';
      case 'header':
        return 'text-base sm:text-lg md:text-xl';
      default:
        return 'text-xl';
    }
  };

  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      <img
        className={cn(getSize(), "object-contain")}
        src="/assets/migro-logo.png"
        alt="Migro"
      />
      {showText && (
        <span className={cn(
          "font-display font-bold text-primary",
          getTextSize(),
          textClassName
        )}>
          Migro
        </span>
      )}
    </div>
  );
}

