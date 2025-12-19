// CallHistory - Component to display call history with recording player

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Call } from '@/types/crm';
import { crmService } from '@/services/crmService';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Play,
  Pause,
  Clock,
  Calendar,
} from 'lucide-react';

interface CallHistoryProps {
  entityType: 'lead' | 'contact';
  entityId: string;
}

export function CallHistory({ entityType, entityId }: CallHistoryProps) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);

  useEffect(() => {
    loadCalls();
  }, [entityType, entityId]);

  const loadCalls = async () => {
    setLoading(true);
    try {
      // Si entity_id es "new", esperar lista vacía sin errores
      if (entityId === 'new') {
        setCalls([]);
        setLoading(false);
        return;
      }
      
      // Enviar entity_id y entity_type para filtrar en el backend
      const callsData = await crmService.getCalls({
        entity_type: entityType === 'lead' ? 'leads' : entityType === 'contact' ? 'contacts' : entityType,
        entity_id: entityId,
        limit: 50,
      });
      
      // Ordenar llamadas de más recientes a más antiguas
      const sortedCalls = (callsData.items || []).sort((a, b) => {
        const dateA = new Date(a.started_at || a.created_at).getTime();
        const dateB = new Date(b.started_at || b.created_at).getTime();
        return dateB - dateA; // Descendente (más recientes primero)
      });
      setCalls(sortedCalls);
    } catch (err) {
      console.error('Error loading calls:', err);
      setCalls([]); // Mostrar lista vacía en caso de error (incluye 500)
    } finally {
      setLoading(false);
    }
  };

  const getCallIcon = (call: Call) => {
    if (call.direction === 'inbound') {
      return call.status === 'missed' ? PhoneMissed : PhoneIncoming;
    }
    return PhoneOutgoing;
  };

  const getCallIconColor = (call: Call): string => {
    const status = call.call_status || call.status;
    if (call.status === 'missed') return 'text-red-600';
    if (status === 'no_answer') return 'text-yellow-600';
    if (call.direction === 'inbound') return 'text-green-600';
    return 'text-blue-600';
  };

  // Helper para formatear el estado de la llamada
  const formatCallStatus = (status: string | undefined): string => {
    if (!status) return 'Desconocido';
    if (status === 'completed') return 'Llamada efectiva';
    if (status === 'no_answer') return 'Sin respuesta';
    if (status === 'failed') return 'Fallida';
    if (status === 'busy') return 'Ocupado';
    if (status === 'missed') return 'Perdida';
    if (status === 'answered') return 'Respondida';
    return status;
  };

  // Helper para obtener badge del tipo de llamada
  const getCallTypeBadge = (callType: string | undefined) => {
    if (!callType) return null;
    
    const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
      'primera_llamada': { label: 'Contacto Inicial', bg: 'bg-blue-100', text: 'text-blue-800' },
      'contacto_inicial': { label: 'Contacto Inicial', bg: 'bg-blue-100', text: 'text-blue-800' },
      'seguimiento': { label: 'Seguimiento', bg: 'bg-green-100', text: 'text-green-800' },
      'venta': { label: 'Venta', bg: 'bg-purple-100', text: 'text-purple-800' },
    };

    const config = typeConfig[callType] || { label: callType, bg: 'bg-gray-100', text: 'text-gray-800' };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Helper para obtener clases CSS del fondo según el estado
  const getCallBackgroundClasses = (call: Call): string => {
    const status = call.call_status || call.status;
    if (status === 'no_answer') {
      return 'bg-yellow-50 hover:bg-yellow-100';
    }
    return 'bg-gray-50 hover:bg-gray-100';
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePlayRecording = async (call: Call) => {
    if (!call.recording_url) {
      alert('No hay grabación disponible para esta llamada');
      return;
    }

    if (playingCallId === call.id) {
      setPlayingCallId(null);
    } else {
      setPlayingCallId(call.id);
      // Abrir grabación en nueva ventana
      window.open(call.recording_url, '_blank');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Cargando llamadas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone size={20} />
          Historial de Llamadas ({calls.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay llamadas registradas
          </p>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => {
              const Icon = getCallIcon(call);
              const iconColor = getCallIconColor(call);

              return (
                <div
                  key={call.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${getCallBackgroundClasses(call)}`}
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-full bg-white ${iconColor}`}>
                    <Icon size={20} />
                  </div>

                  {/* Call Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {call.phone_number}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        call.status === 'answered' || call.call_status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : (call.status === 'no_answer' || call.call_status === 'no_answer')
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {formatCallStatus(call.call_status || call.status)}
                      </span>
                      {getCallTypeBadge(call.call_type)}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDateTime(call.started_at)}
                      </span>
                      {call.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDuration(call.duration)}
                        </span>
                      )}
                    </div>

                    {call.notes && (
                      <p className="text-sm text-gray-600 mt-2">{call.notes}</p>
                    )}
                  </div>

                  {/* Recording Player */}
                  {call.recording_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePlayRecording(call)}
                      className="flex items-center gap-2"
                    >
                      {playingCallId === call.id ? (
                        <>
                          <Pause size={16} />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          Escuchar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

