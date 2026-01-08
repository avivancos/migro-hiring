// ContactCard - Componente memoizado para tarjetas de contacto
// Optimizado para evitar re-renders innecesarios

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ChevronRightIcon, EnvelopeIcon, FlagIcon, PhoneIcon } from '@heroicons/react/24/outline';
import type { Contact } from '@/types/crm';
import { useNavigate } from 'react-router-dom';

interface ContactCardProps {
  contact: Contact;
  onNavigate?: (id: string) => void;
}

// Función helper para obtener variante de badge
const getGradingVariant = (grading?: 'A' | 'B+' | 'B-' | 'C'): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (grading) {
    case 'A':
      return 'default';
    case 'B+':
      return 'secondary';
    case 'B-':
      return 'outline';
    case 'C':
      return 'destructive';
    default:
      return 'outline';
  }
};

// Función helper para formatear fecha
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

// Componente memoizado - solo se re-renderiza si cambian las props
export const ContactCard = memo<ContactCardProps>(({ contact, onNavigate }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onNavigate) {
      onNavigate(contact.id);
    } else {
      navigate(`/crm/contacts/${contact.id}`);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleClick();
  };

  const contactName = contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim() || 'Sin nombre';
  const proximaLlamadaFecha = contact.proxima_llamada_fecha;
  const isProximaLlamadaVencida = proximaLlamadaFecha 
    ? new Date(proximaLlamadaFecha).getTime() < new Date().getTime() 
    : false;

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1 font-display">
              {contactName}
            </h3>
            {contact.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                <span>{contact.phone}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {contact.nacionalidad && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <FlagIcon className="w-3 h-3" />
              <span>{contact.nacionalidad}</span>
            </div>
          )}
          {contact.grading_llamada && (
            <Badge variant={getGradingVariant(contact.grading_llamada)} className="text-xs">
              Llamada: {contact.grading_llamada}
            </Badge>
          )}
          {contact.grading_situacion && (
            <Badge variant={getGradingVariant(contact.grading_situacion)} className="text-xs">
              Situación: {contact.grading_situacion}
            </Badge>
          )}
        </div>
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CalendarIcon className="w-3 h-3" />
              <span>Creación: {formatDate(contact.created_at)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleButtonClick}
            >
              Ver
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {contact.ultima_llamada_fecha && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <PhoneIcon className="w-3 h-3" />
              <span>Última llamada: {formatDate(contact.ultima_llamada_fecha)}</span>
            </div>
          )}
          {proximaLlamadaFecha && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <CalendarIcon className={`w-3 h-3 ${isProximaLlamadaVencida ? 'text-red-600' : 'text-blue-600'}`} />
              <span className={isProximaLlamadaVencida ? 'text-red-600 font-semibold' : ''}>
                Próxima llamada: {formatDate(proximaLlamadaFecha)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Función de comparación personalizada para optimizar re-renders
  // Solo re-renderizar si cambian datos relevantes del contacto
  return (
    prevProps.contact.id === nextProps.contact.id &&
    prevProps.contact.name === nextProps.contact.name &&
    prevProps.contact.email === nextProps.contact.email &&
    prevProps.contact.phone === nextProps.contact.phone &&
    prevProps.contact.nacionalidad === nextProps.contact.nacionalidad &&
    prevProps.contact.grading_llamada === nextProps.contact.grading_llamada &&
    prevProps.contact.grading_situacion === nextProps.contact.grading_situacion &&
    prevProps.contact.created_at === nextProps.contact.created_at &&
    prevProps.contact.ultima_llamada_fecha === nextProps.contact.ultima_llamada_fecha &&
    prevProps.contact.proxima_llamada_fecha === nextProps.contact.proxima_llamada_fecha
  );
});

ContactCard.displayName = 'ContactCard';







