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
  entityId: number;
}

export function CallHistory({ entityType, entityId }: CallHistoryProps) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingCallId, setPlayingCallId] = useState<number | null>(null);

  useEffect(() => {
    loadCalls();
  }, [entityType, entityId]);

  const loadCalls = async () => {
    setLoading(true);
    try {
      const callsData = await crmService.getCalls({
        entity_type: entityType,
        entity_id: entityId,
      });
      setCalls(callsData);
    } catch (err) {
      console.error('Error loading calls:', err);
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
    if (call.status === 'missed') return 'text-red-600';
    if (call.direction === 'inbound') return 'text-green-600';
    return 'text-blue-600';
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
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-full bg-white ${iconColor}`}>
                    <Icon size={20} />
                  </div>

                  {/* Call Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {call.phone_number}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        call.status === 'answered'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {call.status}
                      </span>
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

