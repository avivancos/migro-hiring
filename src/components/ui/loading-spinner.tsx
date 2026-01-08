import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 36,
  xl: 48,
};

export function LoadingSpinner({ 
  size = 'md', 
  className,
  text 
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <ArrowPathIcon 
        className="animate-spin text-primary" 
        width={sizeMap[size]}
        height={sizeMap[size]}
      />
      {text && (
        <p className="text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
}

