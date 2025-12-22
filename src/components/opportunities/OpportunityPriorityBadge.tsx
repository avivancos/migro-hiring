// OpportunityPriorityBadge - Badge de prioridad de oportunidad

import { Badge } from '@/components/ui/badge';
import type { LeadOpportunity } from '@/types/opportunity';

interface OpportunityPriorityBadgeProps {
  priority?: LeadOpportunity['priority']; // Opcional porque el backend puede no enviarlo
  className?: string;
}

const priorityConfig = {
  high: {
    variant: 'error' as const,
    label: 'Alta',
  },
  medium: {
    variant: 'warning' as const,
    label: 'Media',
  },
  low: {
    variant: 'success' as const,
    label: 'Baja',
  },
};

export function OpportunityPriorityBadge({
  priority,
  className,
}: OpportunityPriorityBadgeProps) {
  // Si priority es undefined o no está en el config, usar 'medium' por defecto
  const validPriority = priority && priority in priorityConfig 
    ? priority 
    : 'medium';
  const config = priorityConfig[validPriority];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

