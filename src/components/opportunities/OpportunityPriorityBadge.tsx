// OpportunityPriorityBadge - Badge de prioridad de oportunidad

import { Badge } from '@/components/ui/badge';
import type { LeadOpportunity } from '@/types/opportunity';

interface OpportunityPriorityBadgeProps {
  priority: LeadOpportunity['priority'];
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
  const config = priorityConfig[priority];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

