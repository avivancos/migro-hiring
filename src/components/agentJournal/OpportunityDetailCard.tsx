// OpportunityDetailCard - Card expandible para detalles de oportunidad

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowTopRightOnSquareIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import type { OpportunityDetail } from '@/types/agentJournal';
import { formatCallTime } from '@/utils/agentJournal';
import { useQuery } from '@tanstack/react-query';
import { opportunityApi } from '@/services/opportunityApi';
import { getValidAttemptsCount } from '@/utils/opportunity';
import { FirstCallAttemptsRow } from '@/components/opportunities/FirstCallAttemptsRow';

interface OpportunityDetailCardProps {
  opportunity: OpportunityDetail;
  onViewOpportunity?: (id: string) => void;
}

export function OpportunityDetailCard({
  opportunity,
  onViewOpportunity,
}: OpportunityDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Obtener la oportunidad completa cuando se expande para sincronizar call_attempts con first_call_attempts
  const { data: fullOpportunity } = useQuery({
    queryKey: ['opportunity', opportunity.opportunity_id],
    queryFn: () => opportunityApi.get(opportunity.opportunity_id),
    enabled: isExpanded, // Solo obtener cuando está expandido
  });
  
  // Usar call_attempts sincronizado desde first_call_attempts si está disponible
  const synchronizedCallAttempts = fullOpportunity?.first_call_attempts 
    ? getValidAttemptsCount(fullOpportunity.first_call_attempts)
    : opportunity.call_attempts;

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
              {synchronizedCallAttempts} intento{synchronizedCallAttempts !== 1 ? 's' : ''}
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
                <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                Ver
              </Button>
            )}
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
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
          
          {/* Intentos de Primera Llamada - Sincronizado con first_call_attempts */}
          {fullOpportunity && (
            <div className="pt-4 border-t">
              <FirstCallAttemptsRow
                attempts={fullOpportunity.first_call_attempts || null}
                firstCallCompleted={fullOpportunity.first_call_completed || false}
                successfulAttempt={fullOpportunity.first_call_successful_attempt || null}
                onAttemptClick={() => {
                  // Navegar al detalle de oportunidad cuando se hace clic en un badge
                  onViewOpportunity?.(opportunity.opportunity_id);
                }}
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

