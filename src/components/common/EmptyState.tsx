// EmptyState - Estados vacíos atractivos con ilustraciones
import { ReactNode, ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode | ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode | {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  // Handle icon rendering
  const renderIcon = () => {
    if (!icon) return null;
    
    // If it's a React component (function), render it
    if (typeof icon === 'function') {
      const IconComponent = icon as ComponentType<{ size?: number; className?: string }>;
      return (
        <div className="text-gray-400 mb-4">
          <IconComponent size={48} className="text-gray-400" />
        </div>
      );
    }
    
    // If it's already a React element, render it directly
    return (
      <div className="text-gray-400 mb-4">
        {icon}
      </div>
    );
  };

  return (
    <Card className={cn('p-12 text-center', className)}>
      <div className="flex flex-col items-center justify-center space-y-4">
        {renderIcon()}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 max-w-md">{description}</p>
        )}
        {action && (
          typeof action === 'object' && action !== null && 'onClick' in action ? (
            <Button onClick={action.onClick} className="mt-4">
              {action.label}
            </Button>
          ) : (
            <div className="mt-4">{action}</div>
          )
        )}
      </div>
    </Card>
  );
}

