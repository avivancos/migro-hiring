// OpportunityCard - Card de oportunidad en lista (mobile-first)

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OpportunityPriorityBadge } from './OpportunityPriorityBadge';
import { OpportunityScore } from './OpportunityScore';
import { Badge } from '@/components/ui/badge';
import type { LeadOpportunity } from '@/types/opportunity';
import { Phone, Mail, MapPin, User, ChevronRight } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: LeadOpportunity;
  onSelect?: (id: string) => void;
  showActions?: boolean;
}

const statusConfig = {
  pending: { variant: 'neutral' as const, label: 'Pendiente' },
  assigned: { variant: 'info' as const, label: 'Asignada' },
  contacted: { variant: 'info' as const, label: 'Contactada' },
  converted: { variant: 'success' as const, label: 'Convertida' },
  expired: { variant: 'warning' as const, label: 'Expirada' },
  lost: { variant: 'error' as const, label: 'Perdida' },
};

export function OpportunityCard({
  opportunity,
  onSelect,
  showActions = true,
}: OpportunityCardProps) {
  const contact = opportunity.contact;
  const statusInfo = statusConfig[opportunity.status];

  const handleClick = () => {
    onSelect?.(opportunity.id);
  };

  return (
    <Card
      className="w-full cursor-pointer transition-all hover:shadow-lg"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <OpportunityPriorityBadge priority={opportunity.priority} />
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {contact?.name || 'Sin nombre'}
            </h3>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Score</span>
            <span className="text-sm text-gray-500">
              {opportunity.opportunity_score}/100
            </span>
          </div>
          <OpportunityScore score={opportunity.opportunity_score} />
        </div>

        {/* Información del contacto */}
        <div className="space-y-2">
          {contact?.city && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{contact.city}</span>
            </div>
          )}
          {contact?.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact?.mobile && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{contact.mobile}</span>
            </div>
          )}
        </div>

        {/* Razón de detección */}
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-600 line-clamp-2">
            {typeof opportunity.detection_reason === 'string'
              ? opportunity.detection_reason
              : (() => {
                  const reason = opportunity.detection_reason as Record<string, any>;
                  const reasons: string[] = [];
                  if (reason.has_no_situation) reasons.push('Sin situación conocida');
                  if (reason.not_contacted) reasons.push('No contactado');
                  if (reason.has_attempts !== undefined) {
                    reasons.push(`${reason.attempts_remaining || 0} intentos restantes`);
                  }
                  return reasons.length > 0 ? reasons.join(' • ') : 'Oportunidad detectada';
                })()}
          </p>
        </div>

        {/* Información de intentos */}
        {contact && opportunity.assigned_to && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[100px]">
                {opportunity.assigned_to.name || 'Sin asignar'}
              </span>
            </div>
          </div>
        )}

        {/* Acciones */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              Ver detalle
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

