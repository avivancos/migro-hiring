// MetricCard - Card para mostrar una métrica individual

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import type { ComponentType } from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  change?: {
    value: number; // Cambio porcentual
    isPositive: boolean;
  };
  icon?: ComponentType<{ className?: string }>;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  change,
  icon: Icon,
  color = 'primary',
  loading = false,
  className,
}: MetricCardProps) {
  const colorClasses = {
    primary: 'border-primary/20',
    success: 'border-green-200',
    warning: 'border-yellow-200',
    danger: 'border-red-200',
  };

  if (loading) {
    return (
      <Card className={cn('p-4', className)}>
        <CardContent className="p-0 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          {change && <Skeleton className="h-4 w-20" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('p-4', colorClasses[color], className)}>
      <CardContent className="p-0 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        </div>
        
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {unit && <p className="text-sm text-gray-500">{unit}</p>}
        </div>

        {change && (
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium',
            change.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {change.isPositive ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
            <span>
              {change.value >= 0 ? '+' : ''}{change.value.toFixed(1)}%
            </span>
            <span className="text-gray-500 text-xs">vs anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

