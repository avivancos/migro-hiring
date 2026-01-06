// Hook para detectar y manejar solicitudes de contrato pendientes

import { useState, useEffect } from 'react';
import { useHiringData } from './useHiringData';
import { pipelineApi } from '@/services/pipelineApi';
import type { PipelineStageRead } from '@/types/pipeline';
import type { EntityType } from '@/types/pipeline';

interface UseContractRequestResult {
  hiringCode: string | null;
  hasMissingData: boolean;
  loading: boolean;
  error: string | null;
  openModal: () => void;
  closeModal: () => void;
  isModalOpen: boolean;
}

/**
 * Hook para detectar si hay una solicitud de contrato pendiente con datos faltantes
 * @param pipelineStage - El pipeline stage que puede tener un hiring code asociado
 * @param entityType - Tipo de entidad ('contacts' o 'leads')
 * @param entityId - ID de la entidad
 */
export function useContractRequest(
  pipelineStage: PipelineStageRead | null | undefined,
  entityType: EntityType | null,
  entityId: string | null
): UseContractRequestResult {
  const [hiringCode, setHiringCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { details: hiringDetails } = useHiringData(hiringCode || '');

  // Obtener el hiring code desde el pipeline stage
  useEffect(() => {
    const fetchHiringCode = async () => {
      if (!pipelineStage?.hiring_code_id || !entityType || !entityId) {
        setHiringCode(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Intentar obtener el stage completo que puede incluir el hiring code
        // const stage = await pipelineApi.getStage(entityType, entityId);
        
        // Si el stage tiene hiring_code_id, necesitamos obtener el hiring code
        // Por ahora, asumimos que el backend puede devolver el hiring code en alguna respuesta
        // O necesitamos crear un endpoint para obtenerlo desde el ID
        
        // Intentar obtener el contrato usando el ID
        // Nota: Esto puede requerir un endpoint específico en el backend
        // Por ahora, intentamos obtener el hiring code desde las acciones del pipeline
        
        // Buscar en las acciones del pipeline si hay alguna acción relacionada con hiring code
        const actions = await pipelineApi.listActions(entityType, entityId);
        const hiringAction = actions.items.find(
          (action) => 
            action.action_type === 'request_hiring_code' || 
            action.action_data?.hiring_code ||
            action.action_data?.hiringCode
        );

        // Intentar obtener el hiring code desde action_data
        const codeFromAction = 
          hiringAction?.action_data?.hiring_code || 
          hiringAction?.action_data?.hiringCode;

        if (codeFromAction) {
          setHiringCode(codeFromAction);
        } else if (pipelineStage.hiring_code_id) {
          // Si tenemos el ID pero no el código, intentar obtener el contrato por ID
          // Nota: Esto puede requerir un endpoint específico en el backend
          // Por ahora, intentamos usar el ID directamente como código (puede no funcionar)
          console.warn('No se encontró el hiring code en las acciones. Intentando usar el ID directamente.');
          // El backend debería proporcionar un endpoint para obtener el código desde el ID
          // Por ahora, dejamos el error para que el usuario sepa que falta información
          setError('No se pudo obtener el código de contratación. Contacte al administrador.');
        } else {
          setHiringCode(null);
        }
      } catch (err: any) {
        setError(err.message || 'Error al obtener información del contrato');
        setHiringCode(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHiringCode();
  }, [pipelineStage?.hiring_code_id, entityType, entityId]);

  // Verificar si faltan datos
  const hasMissingData = hiringDetails
    ? !hiringDetails.client_name ||
      (!hiringDetails.client_passport && !hiringDetails.client_nie) ||
      !hiringDetails.client_address
    : false;

  return {
    hiringCode,
    hasMissingData,
    loading,
    error,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
    isModalOpen,
  };
}
