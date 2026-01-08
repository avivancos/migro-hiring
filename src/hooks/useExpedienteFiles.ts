// Hook para gestionar archivos de un expediente
// Incluye subida, descarga y cambio de estado

import { useState, useCallback } from 'react';
import { expedienteApi } from '@/services/expedienteApi';
import type { ExpedienteArchivoRead } from '@/types/expediente';

export function useExpedienteFiles(expedienteId: string | null) {
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = useCallback(
    async (
      file: File,
      metadata?: { nombre?: string; tipo?: string }
    ): Promise<ExpedienteArchivoRead | null> => {
      if (!expedienteId) {
        throw new Error('Expediente ID requerido');
      }

      setUploading(true);
      setError(null);

      try {
        const response = await expedienteApi.uploadFile(expedienteId, file, metadata);
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error al subir archivo');
        setError(error);
        throw error;
      } finally {
        setUploading(false);
      }
    },
    [expedienteId]
  );

  const updateFileStatus = useCallback(
    async (
      archivoId: string,
      estado: 'pendiente' | 'aprobado' | 'rechazado',
      validationNotes?: string
    ): Promise<void> => {
      if (!expedienteId) {
        throw new Error('Expediente ID requerido');
      }

      setUpdating(true);
      setError(null);

      try {
        await expedienteApi.updateFileStatus(expedienteId, archivoId, estado, validationNotes);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error al actualizar estado del archivo');
        setError(error);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [expedienteId]
  );

  return {
    uploading,
    updating,
    error,
    uploadFile,
    updateFileStatus,
  };
}

