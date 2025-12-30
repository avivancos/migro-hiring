// Agent Daily Journal Types

/**
 * Respuesta del reporte diario
 */
export interface DailyReportResponse {
  journal: AgentDailyJournal;
  opportunities_details: OpportunityDetail[];
  call_attempts_details: CallAttemptDetail[];
  success_rate: number; // 0-100
  productivity_score: number | null; // 0-100
}

/**
 * Entrada del diario diario del agente
 */
export interface AgentDailyJournal {
  id: string; // UUID
  user_id: string; // UUID
  journal_date: string; // YYYY-MM-DD
  total_call_time_seconds: number;
  total_calls: number;
  effective_calls: number;
  avg_call_duration_seconds: number | null;
  tasks_completed: number;
  tasks_pending: number;
  notes_created: number;
  opportunities_worked: number;
  call_attempts_count: number;
  extra_data: Record<string, any> | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/**
 * Detalles de trabajo en una oportunidad
 */
export interface OpportunityDetail {
  opportunity_id: string; // UUID
  contact_id: string; // UUID
  calls_count: number;
  call_time_seconds: number;
  tasks_completed: number;
  notes_created: number;
  call_attempts: number;
}

/**
 * Detalles de intentos de llamada por número de intento
 */
export interface CallAttemptDetail {
  attempt_number: number; // 1-5
  calls_count: number;
  successful: number;
  failed: number;
  rejected: number;
}

/**
 * Respuesta del dashboard de desempeño
 */
export interface PerformanceDashboardResponse {
  current_period: AgentDailyJournal;
  comparison: PeriodComparison | null;
  trends: TrendDataPoint[];
  team_average: TeamAverage | null;
  productivity_rank: number | null; // 1 = mejor
  period: 'today' | 'week' | 'month';
}

/**
 * Comparación con período anterior
 */
export interface PeriodComparison {
  period: string; // 'yesterday', 'last_week', 'last_month'
  total_call_time_seconds: number;
  total_calls: number;
  tasks_completed: number;
  notes_created: number;
  opportunities_worked: number;
  change_percentage: number; // Cambio porcentual vs período actual
}

/**
 * Punto de datos para tendencias
 */
export interface TrendDataPoint {
  date: string; // YYYY-MM-DD
  total_call_time_seconds: number;
  total_calls: number;
  tasks_completed: number;
  notes_created: number;
}

/**
 * Promedio del equipo
 */
export interface TeamAverage {
  total_call_time_seconds: number;
  total_calls: number;
  tasks_completed: number;
  notes_created: number;
  opportunities_worked: number;
}

/**
 * Tipo de período para dashboard
 */
export type PeriodType = 'today' | 'week' | 'month';

