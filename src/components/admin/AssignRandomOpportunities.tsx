// AssignRandomOpportunities - Componente para asignar 50 oportunidades aleatorias a un agente
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { opportunityApi } from '@/services/opportunityApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { UserPlus, AlertCircle } from 'lucide-react';
import type { User } from '@/types/user';

interface AssignRandomOpportunitiesProps {
  agents: User[];
  onAssignComplete: () => void;
}

export function AssignRandomOpportunities({ agents, onAssignComplete }: AssignRandomOpportunitiesProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAssign = async () => {
    if (!selectedAgentId) {
      setError('Por favor selecciona un agente');
      return;
    }

    const selectedAgent = agents.find(a => a.id === selectedAgentId);
    if (!selectedAgent) {
      setError('Agente no encontrado');
      return;
    }

    const agentName = selectedAgent.full_name || selectedAgent.email;
    if (!confirm(`¿Estás seguro de asignar 50 oportunidades aleatorias no asignadas al agente ${agentName}?`)) {
      return;
    }

    setAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`🎲 [AssignRandomOpportunities] Solicitando asignación de 50 oportunidades aleatorias al agente ${selectedAgentId} (${agentName})`);

      // Usar el nuevo endpoint que maneja todo en el backend
      const result = await opportunityApi.assignRandom({
        assigned_to_id: selectedAgentId,
        count: 50,
      });

      console.log(`📊 [AssignRandomOpportunities] Resultado de asignación:`, {
        success: result.success,
        assigned_count: result.assigned_count,
        available_count: result.available_count,
        requested_count: result.requested_count,
        warning: result.warning,
      });

      // El endpoint siempre devuelve 200 OK, verificar el campo success
      if (result.success) {
        // Oportunidades asignadas (puede ser parcial si hay warning)
        let message = `${result.assigned_count} oportunidad(es) asignada(s) correctamente al agente ${agentName}`;
        
        if (result.warning) {
          message += `. ${result.warning}`;
        }
        
        if (result.assigned_count < result.requested_count && !result.warning) {
          message += ` (solicitadas: ${result.requested_count}, disponibles: ${result.available_count})`;
        }
        
        setSuccess(message);
        
        // Limpiar selección
        setSelectedAgentId('');
        
        // Notificar al componente padre para recargar
        onAssignComplete();

        // Limpiar mensaje después de 8 segundos (más tiempo si hay warning)
        setTimeout(() => {
          setSuccess(null);
        }, result.warning ? 8000 : 5000);
      } else {
        // success: false significa que no hay oportunidades disponibles
        const message = result.warning || `No hay oportunidades no asignadas disponibles en el sistema (solicitadas: ${result.requested_count}, disponibles: ${result.available_count})`;
        setError(message);
      }
    } catch (error: any) {
      console.error('Error asignando oportunidades aleatorias:', error);
      
      // Manejar errores HTTP (400, 403, 404, 500, etc.)
      // NOTA: 404 solo debería ocurrir si el endpoint no existe, no para "sin oportunidades"
      // El endpoint siempre devuelve 200 OK para respuestas válidas (incluso cuando success=false)
      let errorMessage: string = 'Error al asignar oportunidades. Por favor intenta de nuevo.';
      const errorData = error?.response?.data;
      
      // 404: Endpoint no encontrado (el endpoint no está implementado aún)
      if (error?.response?.status === 404) {
        errorMessage = 'El endpoint de asignación aleatoria no está disponible aún. El backend puede estar en proceso de implementación.';
      }
      // 403: Sin permisos
      else if (error?.response?.status === 403) {
        errorMessage = errorData?.detail || 'No tienes permisos para asignar oportunidades aleatorias.';
      }
      // 400: Error de validación (usuario inválido, count inválido, etc.)
      else if (error?.response?.status === 400) {
        if (errorData?.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = String(errorData.detail);
          } else if (typeof errorData.detail === 'object') {
            // Si detail es un objeto, intentar extraer un mensaje
            if (typeof errorData.detail.detail === 'string') {
              errorMessage = String(errorData.detail.detail);
            } else if (errorData.detail.message && typeof errorData.detail.message === 'string') {
              errorMessage = String(errorData.detail.message);
            }
          }
        }
      }
      // Otros errores
      else if (errorData?.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = String(errorData.detail);
        } else if (typeof errorData.detail === 'object') {
          if (typeof errorData.detail.detail === 'string') {
            errorMessage = String(errorData.detail.detail);
          } else if (errorData.detail.message && typeof errorData.detail.message === 'string') {
            errorMessage = String(errorData.detail.message);
          }
        }
      } else if (error?.message && typeof error.message === 'string') {
        errorMessage = String(error.message);
      }
      
      // Asegurarse de que errorMessage sea siempre un string
      setError(String(errorMessage));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <UserPlus className="w-5 h-5" />
          Asignación Rápida de Oportunidades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Seleccionar agente para asignar 50 oportunidades aleatorias:
          </Label>
          <select
            value={selectedAgentId}
            onChange={(e) => {
              setSelectedAgentId(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={assigning}
          >
            <option value="">Seleccionar agente...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.full_name ? `${agent.full_name} (${agent.email})` : agent.email}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Se seleccionarán 50 oportunidades aleatorias no asignadas y se asignarán al agente seleccionado.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <Button
          onClick={handleAssign}
          disabled={!selectedAgentId || assigning}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {assigning ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Asignando oportunidades...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Asignar 50 Oportunidades Aleatorias
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

