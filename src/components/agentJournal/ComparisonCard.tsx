// ComparisonCard - Card para mostrar comparación con período anterior

import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatChangePercentage } from '@/utils/agentJournal';

interface ComparisonCardProps {
  title: string;
  current: number;
  previous: number;
  unit?: string;
  changePercentage: number;
  loading?: boolean;
}

export function ComparisonCard({
  title,
  current,
  previous,
  unit,
  changePercentage,
  loading = false,
}: ComparisonCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = changePercentage >= 0;

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-gray-600 mb-3">{title}</p>
        
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {current}
              {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
            </p>
            <p className="text-xs text-gray-500 mt-1">Período anterior: {previous}{unit}</p>
          </div>
          
          <div className={cn(
            'flex items-center gap-1 text-sm font-semibold',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {isPositive ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
            <span>{formatChangePercentage(changePercentage)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

