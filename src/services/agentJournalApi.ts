// Agent Daily Journal API Service

import { api } from './api';
import type {
  DailyReportResponse,
  PerformanceDashboardResponse,
  AgentDailyJournal,
  PeriodType,
} from '@/types/agentJournal';
import { format } from 'date-fns';

const AGENT_JOURNAL_BASE_PATH = '/agent-journal';

export const agentJournalApi = {
  /**
   * Obtener reporte diario del agente autenticado
   * GET /api/agent-journal/daily-report
   */
  async getDailyReport(targetDate?: Date): Promise<DailyReportResponse> {
    const params = new URLSearchParams();
    if (targetDate) {
      params.append('target_date', format(targetDate, 'yyyy-MM-dd'));
    }
    
    const url = `${AGENT_JOURNAL_BASE_PATH}/daily-report${params.toString() ? `?${params.toString()}` : ''}`;
    const { data } = await api.get<DailyReportResponse>(url);
    return data;
  },

  /**
   * Obtener dashboard de desempeño
   * GET /api/agent-journal/performance-dashboard
   */
  async getPerformanceDashboard(period: PeriodType = 'today'): Promise<PerformanceDashboardResponse> {
    const params = new URLSearchParams();
    params.append('period', period);
    
    const url = `${AGENT_JOURNAL_BASE_PATH}/performance-dashboard?${params.toString()}`;
    const { data } = await api.get<PerformanceDashboardResponse>(url);
    return data;
  },

  /**
   * Obtener métricas de un agente específico (solo administradores)
   * GET /api/agent-journal/metrics/{user_id}
   */
  async getAgentMetrics(userId: string, targetDate?: Date): Promise<AgentDailyJournal> {
    const params = new URLSearchParams();
    if (targetDate) {
      params.append('target_date', format(targetDate, 'yyyy-MM-dd'));
    }
    
    const url = `${AGENT_JOURNAL_BASE_PATH}/metrics/${userId}${params.toString() ? `?${params.toString()}` : ''}`;
    const { data } = await api.get<AgentDailyJournal>(url);
    return data;
  },

  /**
   * Sincronizar/actualizar métricas del día
   * POST /api/agent-journal/sync
   */
  async syncMetrics(targetDate?: Date): Promise<AgentDailyJournal> {
    const params = new URLSearchParams();
    if (targetDate) {
      params.append('target_date', format(targetDate, 'yyyy-MM-dd'));
    }
    
    const url = `${AGENT_JOURNAL_BASE_PATH}/sync${params.toString() ? `?${params.toString()}` : ''}`;
    const { data } = await api.post<AgentDailyJournal>(url);
    return data;
  },

  /**
   * Firmar y enviar reporte diario por email a administradores
   * POST /api/agent-journal/sign-and-send
   */
  async signAndSendReport(targetDate: Date | undefined, agentSignature: string): Promise<{
    status: string;
    message: string;
    journal_id: string;
    signed_at: string;
    sent_to: string[];
    target_date: string;
  }> {
    const body: {
      target_date?: string;
      agent_signature: string;
    } = {
      agent_signature: agentSignature,
    };

    if (targetDate) {
      body.target_date = format(targetDate, 'yyyy-MM-dd');
    }

    const { data } = await api.post(`${AGENT_JOURNAL_BASE_PATH}/sign-and-send`, body);
    return data;
  },
};

