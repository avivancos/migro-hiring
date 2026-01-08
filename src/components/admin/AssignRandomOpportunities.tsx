// AssignRandomOpportunities - Componente para asignar 50 oportunidades aleatorias a un agente
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { opportunityApi } from '@/services/opportunityApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ExclamationCircleIcon, InformationCircleIcon, UserPlusIcon } from '@heroicons/react/24/outline';
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
  const [info, setInfo] = useState<string | null>(null); // Para success:false (información, no error)

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

      // ⚠️ REGLA CRÍTICA: El endpoint siempre devuelve 200 OK, verificar el campo success
      if (result.success) {
        // ✅ Éxito (total o parcial)
        // Oportunidades asignadas (puede ser parcial si hay warning)
        let message = `${result.assigned_count} oportunidad(es) asignada(s) correctamente al agente ${agentName}`;
        
        // ⚠️ warning es SIEMPRE string, no objeto - agregarlo al mensaje si existe
        if (result.warning && typeof result.warning === 'string') {
          message += `. ${result.warning}`;
        }
        
        setSuccess(message);
        
        // Limpiar selección y otros mensajes
        setSelectedAgentId('');
        setError(null);
        setInfo(null);
        
        // Notificar al componente padre para recargar
        onAssignComplete();

        // Limpiar mensaje después de 8 segundos (más tiempo si hay warning)
        setTimeout(() => {
          setSuccess(null);
        }, result.warning ? 8000 : 5000);
      } else {
        // ⚠️ REGLA CRÍTICA: success: false NO es un error, es información
        // No hay oportunidades disponibles
        const message = (result.warning && typeof result.warning === 'string') 
          ? result.warning 
          : 'No hay oportunidades no asignadas disponibles en el sistema';
        
        setInfo(message);
        setError(null);
        setSuccess(null);
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => {
          setInfo(null);
        }, 5000);
      }
    } catch (error: any) {
      console.error('Error asignando oportunidades aleatorias:', error);
      
      // ⚠️ Manejar errores HTTP (400, 403, 422, 500, etc.)
      // NOTA: El endpoint NUNCA devuelve 404 para "sin oportunidades" (siempre 200 OK)
      // 404 solo debería ocurrir si el endpoint no está implementado
      let errorMessage: string = 'Error al asignar oportunidades. Por favor intenta de nuevo.';
      const errorData = error?.response?.data;
      
      // 404: Endpoint no encontrado (el endpoint no está implementado aún)
      if (error?.response?.status === 404) {
        errorMessage = 'El endpoint de asignación aleatoria no está disponible aún. El backend puede estar en proceso de implementación.';
      }
      // 403: Sin permisos
      else if (error?.response?.status === 403) {
        errorMessage = (errorData?.detail && typeof errorData.detail === 'string') 
          ? errorData.detail 
          : 'No tienes permisos para asignar oportunidades aleatorias.';
      }
      // 422: Error de validación Pydantic (count fuera de rango, UUID inválido, etc.)
      else if (error?.response?.status === 422) {
        if (errorData?.detail) {
          // Pydantic devuelve array de errores en formato específico
          if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
            const firstError = errorData.detail[0];
            errorMessage = firstError?.msg || firstError?.detail || 'Error de validación';
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
        }
      }
      // 400: Error de validación (usuario inválido o inactivo)
      else if (error?.response?.status === 400) {
        if (errorData?.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (typeof errorData.detail === 'object') {
            // Si detail es un objeto, intentar extraer un mensaje
            if (typeof errorData.detail.detail === 'string') {
              errorMessage = errorData.detail.detail;
            } else if (errorData.detail.message && typeof errorData.detail.message === 'string') {
              errorMessage = errorData.detail.message;
            }
          }
        }
      }
      // Otros errores (500, etc.)
      else if (errorData?.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (typeof errorData.detail === 'object') {
          if (typeof errorData.detail.detail === 'string') {
            errorMessage = errorData.detail.detail;
          } else if (errorData.detail.message && typeof errorData.detail.message === 'string') {
            errorMessage = errorData.detail.message;
          }
        }
      } else if (error?.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      
      // Asegurarse de que errorMessage sea siempre un string
      setError(String(errorMessage));
      setSuccess(null);
      setInfo(null);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <UserPlusIcon className="w-5 h-5" />
          Asignación Rápida: 50 Oportunidades Aleatorias
        </CardTitle>
        <p className="text-sm text-blue-700 mt-2">
          Asigna automáticamente 50 oportunidades aleatorias no asignadas a un agente. 
          Estas oportunidades se seleccionan de forma aleatoria del sistema.
        </p>
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
              setInfo(null);
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

        {/* ⚠️ Error: Solo para errores HTTP (400, 403, 422, 500, etc.) */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* ✅ Éxito: Cuando success=true */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {/* ℹ️ Información: Cuando success=false (no es error, es información) */}
        {info && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg flex items-center gap-2">
            <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{info}</p>
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
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Asignar 50 Oportunidades Aleatorias
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

