// OpportunityTableRow - Componente memoizado para filas de tabla de oportunidades
// Optimizado para evitar re-renders innecesarios en tablas grandes

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LeadOpportunity } from '@/types/opportunity';
import { Badge } from '@/components/ui/badge';
import { OpportunityPriorityBadge } from './OpportunityPriorityBadge';
import { OpportunityScore } from './OpportunityScore';
import { Mail, Phone, MapPin, User } from 'lucide-react';
import { getDetectionReasonBadges } from '@/utils/opportunity';

interface OpportunityTableRowProps {
  opportunity: LeadOpportunity;
  onSelect?: (id: string) => void;
}

const statusConfig = {
  pending: { variant: 'neutral' as const, label: 'Pendiente' },
  assigned: { variant: 'info' as const, label: 'Asignada' },
  contacted: { variant: 'info' as const, label: 'Contactada' },
  converted: { variant: 'success' as const, label: 'Convertida' },
  expired: { variant: 'warning' as const, label: 'Expirada' },
  lost: { variant: 'error' as const, label: 'Perdida' },
};

// Función helper para obtener nombre del contacto
const getContactName = (opportunity: LeadOpportunity): string => {
  const contact = opportunity.contact;
  if (!contact) {
    if (opportunity.contact_id) {
      return `Contacto ${opportunity.contact_id.substring(0, 8)}...`;
    }
    return 'Sin contacto';
  }

  if (contact.name) {
    return contact.name;
  } else if (contact.first_name) {
    return contact.last_name 
      ? `${contact.first_name} ${contact.last_name}`.trim()
      : contact.first_name;
  } else if (contact.email) {
    return contact.email.split('@')[0];
  }
  
  return 'Sin nombre';
};

// Componente memoizado - solo se re-renderiza si cambian las props
export const OpportunityTableRow = memo<OpportunityTableRowProps>(({ opportunity, onSelect }) => {
  const navigate = useNavigate();
  const contact = opportunity.contact;
  const statusInfo = statusConfig[opportunity.status];
  const contactName = getContactName(opportunity);

  const handleClick = () => {
    if (onSelect) {
      onSelect(opportunity.id);
    } else {
      navigate(`/crm/opportunities/${opportunity.id}`);
    }
  };

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer border-b border-gray-200"
      onClick={handleClick}
    >
      {/* Contacto */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {contactName}
            </div>
            {contact?.email && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Mail className="w-3 h-3" />
                <span className="truncate max-w-xs">{contact.email}</span>
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Score */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-16">
            <OpportunityScore score={opportunity.opportunity_score} />
          </div>
          <span className="text-sm text-gray-600">
            {opportunity.opportunity_score}/100
          </span>
        </div>
      </td>

      {/* Prioridad */}
      <td className="px-4 py-3">
        <OpportunityPriorityBadge priority={opportunity.priority} />
      </td>

      {/* Estado */}
      <td className="px-4 py-3">
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </td>

      {/* Información de contacto */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          {contact?.phone && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Phone className="w-3 h-3" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact?.city && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <MapPin className="w-3 h-3" />
              <span>{contact.city}</span>
            </div>
          )}
        </div>
      </td>

      {/* Razón de detección */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {getDetectionReasonBadges(opportunity.detection_reason).slice(0, 2).map((badge, index) => (
            <Badge key={index} variant="neutral" className="text-xs">
              {badge}
            </Badge>
          ))}
          {getDetectionReasonBadges(opportunity.detection_reason).length > 2 && (
            <Badge variant="neutral" className="text-xs">
              +{getDetectionReasonBadges(opportunity.detection_reason).length - 2}
            </Badge>
          )}
        </div>
      </td>

      {/* Responsable */}
      <td className="px-4 py-3">
        {opportunity.assigned_to ? (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 truncate max-w-[120px]">
              {opportunity.assigned_to.name || 'Sin asignar'}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Sin asignar</span>
        )}
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Comparación optimizada: solo re-renderizar si cambian datos relevantes
  if (prevProps.opportunity.id !== nextProps.opportunity.id) return false;
  
  const relevantFields = [
    'opportunity_score', 'priority', 'status', 'assigned_to_id',
    'contact', 'detection_reason'
  ];
  
  for (const field of relevantFields) {
    const prevValue = (prevProps.opportunity as any)[field];
    const nextValue = (nextProps.opportunity as any)[field];
    if (JSON.stringify(prevValue) !== JSON.stringify(nextValue)) return false;
  }
  
  return true; // No re-renderizar
});

OpportunityTableRow.displayName = 'OpportunityTableRow';

