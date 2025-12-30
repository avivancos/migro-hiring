// PeriodSelector - Selector de período para dashboard

import { Button } from '@/components/ui/button';
import type { PeriodType } from '@/types/agentJournal';
import { cn } from '@/lib/utils';

interface PeriodSelectorProps {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
}

const periods: Array<{ value: PeriodType; label: string }> = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-2">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(period.value)}
          className={cn(
            'min-w-[80px]',
            value === period.value && 'bg-primary text-primary-foreground'
          )}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}

