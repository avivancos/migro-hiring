// Audit Service - Logs de auditoría
import { api } from './api';
import type {
  AuditLogResponse,
  AuditLogFilters,
} from '@/types/audit';

export const auditService = {
  /**
   * Obtener logs de auditoría con filtros
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogResponse> {
    const { data } = await api.get<AuditLogResponse>('/users/audit-logs', {
      params: filters,
    });
    return data;
  },
};



















