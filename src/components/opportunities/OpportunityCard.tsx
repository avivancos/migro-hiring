// OpportunityCard - Card de oportunidad en lista (mobile-first)

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OpportunityPriorityBadge } from './OpportunityPriorityBadge';
import { OpportunityScore } from './OpportunityScore';
import { Badge } from '@/components/ui/badge';
import type { LeadOpportunity } from '@/types/opportunity';
import { Phone, Mail, MapPin, User, ChevronRight } from 'lucide-react';
import { formatDetectionReason } from '@/utils/opportunity';

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

  // Extraer nombre del contacto - puede venir en diferentes campos
  // Una oportunidad SIEMPRE debe tener un contacto con nombre
  let contactName = 'Sin nombre';
  
  // Log detallado para debugging
  if (!contact && opportunity.contact_id) {
    console.error('❌ [OpportunityCard] Contacto no expandido - esto no debería pasar.', {
      opportunityId: opportunity.id,
      contactId: opportunity.contact_id,
      hasContact: !!contact,
      contactValue: contact,
      opportunityKeys: Object.keys(opportunity),
    });
  }
  
  if (contact) {
    // Log para ver qué campos tiene el contacto
    if (opportunity.id && (!contact.name && !contact.first_name && !contact.email)) {
      console.warn('⚠️ [OpportunityCard] Contacto sin campos de nombre:', {
        opportunityId: opportunity.id,
        contactId: contact.id,
        contactKeys: Object.keys(contact),
        contact: contact,
      });
    }
    
    // Intentar múltiples campos posibles para el nombre
    if (contact.name) {
      contactName = contact.name;
    } else if (contact.first_name) {
      if (contact.last_name) {
        contactName = `${contact.first_name} ${contact.last_name}`.trim();
      } else {
        contactName = contact.first_name;
      }
    } else if (contact.email) {
      // Si no hay nombre, usar la parte antes del @ del email como fallback
      contactName = contact.email.split('@')[0];
    }
  } else if (opportunity.contact_id) {
    // Si no hay contacto pero sí hay contact_id, mostrar un mensaje más útil
    contactName = `Contacto ${opportunity.contact_id.substring(0, 8)}...`;
    console.warn(`⚠️ [OpportunityCard] Oportunidad ${opportunity.id} sin contacto expandido, contact_id: ${opportunity.contact_id}`);
  }
  
  // Extraer información del contacto
  const contactEmail = contact?.email;
  const contactMobile = contact?.mobile || contact?.phone;
  const contactCity = contact?.city;
  
  // Debug log para primera oportunidad
  if (opportunity.id && !contact) {
    console.log('🔍 [OpportunityCard] Opportunity sin contacto expandido:', {
      id: opportunity.id,
      contact_id: opportunity.contact_id,
      hasContact: !!contact,
      contactData: contact,
    });
  }

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
              {contactName}
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
          {contactCity && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{contactCity}</span>
            </div>
          )}
          {contactEmail && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="truncate">{contactEmail}</span>
            </div>
          )}
          {contactMobile && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{contactMobile}</span>
            </div>
          )}
        </div>

        {/* Razón de detección */}
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-600 line-clamp-2">
            {formatDetectionReason(opportunity.detection_reason)}
          </p>
        </div>

        {/* Responsable asignado */}
        {contact && opportunity.assigned_to && (
          <div className="pt-2 border-t">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-600 font-medium mb-0.5">Responsable</p>
                  <p className="text-sm text-blue-900 font-semibold truncate">
                    {opportunity.assigned_to.name || 'Sin asignar'}
                  </p>
                </div>
              </div>
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

