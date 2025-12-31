// OpportunityDetailCard - Card expandible para detalles de oportunidad

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { OpportunityDetail } from '@/types/agentJournal';
import { formatCallTime } from '@/utils/agentJournal';

interface OpportunityDetailCardProps {
  opportunity: OpportunityDetail;
  onViewOpportunity?: (id: string) => void;
}

export function OpportunityDetailCard({
  opportunity,
  onViewOpportunity,
}: OpportunityDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              Oportunidad #{opportunity.opportunity_id.slice(0, 8)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {opportunity.calls_count} llamada{opportunity.calls_count !== 1 ? 's' : ''} • 
              {formatCallTime(opportunity.call_time_seconds)} • 
              {opportunity.call_attempts} intento{opportunity.call_attempts !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onViewOpportunity && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewOpportunity(opportunity.opportunity_id);
                }}
                className="text-xs"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Ver
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Llamadas</p>
              <p className="text-lg font-semibold text-gray-900">{opportunity.calls_count}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tiempo Total</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCallTime(opportunity.call_time_seconds)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tareas Completadas</p>
              <p className="text-lg font-semibold text-gray-900">{opportunity.tasks_completed}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Notas Creadas</p>
              <p className="text-lg font-semibold text-gray-900">{opportunity.notes_created}</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

