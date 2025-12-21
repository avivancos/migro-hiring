// Expedientes API Service
// Basado en documentación: expedientes_super_mega_prompt_modulo_completo.md

import { api } from './api';
import { withRetry } from './apiRetry';
import { handleApiError } from '@/utils/errorHandler';
import type {
  ExpedienteRead,
  ExpedienteReadWithFiles,
  ExpedienteCreate,
  ExpedienteUpdate,
  ExpedienteListResponse,
  ExpedienteSearchResponse,
  FormularioSeleccionResponse,
  ChecklistResponse,
  CompletitudResponse,
  ExpedienteHistorialResponse,
  ExpedienteEstadisticas,
  ExpedienteFilters,
} from '@/types/expediente';

const EXPEDIENTES_BASE_PATH = '/expedientes';

export const expedienteApi = {
  /**
   * Crear nuevo expediente
   * POST /api/expedientes/
   */
  async create(data: ExpedienteCreate): Promise<ExpedienteRead> {
    try {
      return await withRetry(async () => {
        const { data: responseData } = await api.post<ExpedienteRead>(
          `${EXPEDIENTES_BASE_PATH}/`,
          data
        );
        return responseData;
      });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Obtener expediente por ID
   * GET /api/expedientes/{expediente_id}
   */
  async getById(expedienteId: string): Promise<ExpedienteReadWithFiles> {
    try {
      return await withRetry(async () => {
        const { data: responseData } = await api.get<ExpedienteReadWithFiles>(
          `${EXPEDIENTES_BASE_PATH}/${expedienteId}`
        );
        return responseData;
      });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Obtener o crear expediente por usuario
   * GET /api/expedientes/user/{user_id}
   */
  async getOrCreateByUser(userId: string): Promise<ExpedienteReadWithFiles> {
    const { data } = await api.get<ExpedienteReadWithFiles>(
      `${EXPEDIENTES_BASE_PATH}/user/${userId}`
    );
    return data;
  },

  /**
   * Actualizar expediente
   * PUT /api/expedientes/{expediente_id}
   */
  async update(
    expedienteId: string,
    data: ExpedienteUpdate
  ): Promise<ExpedienteRead> {
    const { data: response } = await api.put<ExpedienteRead>(
      `${EXPEDIENTES_BASE_PATH}/${expedienteId}`,
      data
    );
    return response;
  },

  /**
   * Eliminar expediente (soft delete por defecto)
   * DELETE /api/expedientes/{expediente_id}?hard_delete=false
   */
  async delete(expedienteId: string, hardDelete = false): Promise<void> {
    await api.delete(`${EXPEDIENTES_BASE_PATH}/${expedienteId}`, {
      params: { hard_delete: hardDelete },
    });
  },

  /**
   * Listar expedientes con filtros
   * GET /api/expedientes/
   */
  async list(filters?: ExpedienteFilters): Promise<ExpedienteListResponse> {
    try {
      return await withRetry(async () => {
        const { data: responseData } = await api.get<ExpedienteListResponse>(
          `${EXPEDIENTES_BASE_PATH}/`,
          { params: filters }
        );
        return responseData;
      });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Seleccionar formulario oficial
   * POST /api/expedientes/{expediente_id}/seleccionar-formulario
   */
  async seleccionarFormulario(
    expedienteId: string,
    formularioId: string,
    justificacion?: string
  ): Promise<FormularioSeleccionResponse> {
    const { data } = await api.post<FormularioSeleccionResponse>(
      `${EXPEDIENTES_BASE_PATH}/${expedienteId}/seleccionar-formulario`,
      {
        formulario_oficial_id: formularioId,
        justificacion,
      }
    );
    return data;
  },

  /**
   * Validar completitud de documentación
   * GET /api/expedientes/{expediente_id}/completitud
   */
  async getCompletitud(
    expedienteId: string
  ): Promise<CompletitudResponse> {
    const { data } = await api.get<CompletitudResponse>(
      `${EXPEDIENTES_BASE_PATH}/${expedienteId}/completitud`
    );
    return data;
  },

  /**
   * Generar checklist de documentos
   * GET /api/expedientes/{expediente_id}/checklist
   */
  async getChecklist(
    expedienteId: string
  ): Promise<ChecklistResponse> {
    const { data } = await api.get<ChecklistResponse>(
      `${EXPEDIENTES_BASE_PATH}/${expedienteId}/checklist`
    );
    return data;
  },

  /**
   * Obtener historial de cambios
   * GET /api/expedientes/{expediente_id}/historial
   */
  async getHistorial(
    expedienteId: string,
    skip = 0,
    limit = 50
  ): Promise<ExpedienteHistorialResponse> {
    const { data } = await api.get<ExpedienteHistorialResponse>(
      `${EXPEDIENTES_BASE_PATH}/${expedienteId}/historial`,
      { params: { skip, limit } }
    );
    return data;
  },

  /**
   * Cambiar estado del expediente
   * POST /api/expedientes/{expediente_id}/cambiar-estado
   */
  async cambiarEstado(
    expedienteId: string,
    nuevoStatus: string,
    comentario?: string
  ): Promise<ExpedienteRead> {
    const { data } = await api.post<ExpedienteRead>(
      `${EXPEDIENTES_BASE_PATH}/${expedienteId}/cambiar-estado`,
      {
        nuevo_status: nuevoStatus,
        comentario,
      }
    );
    return data;
  },

  /**
   * Obtener estadísticas del expediente
   * GET /api/expedientes/{expediente_id}/estadisticas
   */
  async getEstadisticas(
    expedienteId: string
  ): Promise<ExpedienteEstadisticas> {
    const { data } = await api.get<ExpedienteEstadisticas>(
      `${EXPEDIENTES_BASE_PATH}/${expedienteId}/estadisticas`
    );
    return data;
  },

  /**
   * Búsqueda avanzada
   * GET /api/expedientes/buscar
   */
  async buscar(
    query: string,
    filters?: {
      formulario?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ExpedienteSearchResponse> {
    const { data } = await api.get<ExpedienteSearchResponse>(
      `${EXPEDIENTES_BASE_PATH}/buscar`,
      {
        params: {
          q: query,
          ...filters,
        },
      }
    );
    return data;
  },

  /**
   * Subir archivo al expediente
   * POST /api/expedientes/{expediente_id}/archivos
   */
  async uploadFile(
    expedienteId: string,
    file: File,
    metadata?: {
      nombre?: string;
      tipo?: string;
    }
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata?.nombre) {
      formData.append('nombre', metadata.nombre);
    }
    if (metadata?.tipo) {
      formData.append('tipo', metadata.tipo);
    }

    const { data } = await api.post(
      `${EXPEDIENTES_BASE_PATH}/${expedienteId}/archivos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },

  /**
   * Cambiar estado de archivo
   * PATCH /api/expedientes/{expediente_id}/archivos/{archivo_id}
   */
  async updateFileStatus(
    expedienteId: string,
    archivoId: string,
    estado: 'pendiente' | 'aprobado' | 'rechazado',
    validationNotes?: string
  ): Promise<any> {
    const { data } = await api.patch(
      `${EXPEDIENTES_BASE_PATH}/${expedienteId}/archivos/${archivoId}`,
      {
        estado,
        validation_notes: validationNotes,
      }
    );
    return data;
  },
};

