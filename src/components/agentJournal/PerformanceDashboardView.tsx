// PerformanceDashboardView - Vista de dashboard de desempeño

import { useState } from 'react';
import { usePerformanceDashboard, useSyncMetrics } from '@/hooks/useAgentJournal';
import { MetricCard } from './MetricCard';
import { ComparisonCard } from './ComparisonCard';
import { TrendsChart } from './TrendsChart';
import { PeriodSelector } from './PeriodSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Phone, Clock, CheckCircle, FileText, Briefcase, TrendingUp, Users } from 'lucide-react';
import { formatCallTime } from '@/utils/agentJournal';
import type { PeriodType } from '@/types/agentJournal';
import { Skeleton } from '@/components/common/Skeleton';

export function PerformanceDashboardView() {
  const [period, setPeriod] = useState<PeriodType>('today');
  const { data, isLoading, error, refetch } = usePerformanceDashboard(period);
  const syncMetrics = useSyncMetrics();

  const handleSync = async () => {
    try {
      await syncMetrics.mutateAsync(undefined);
      refetch();
    } catch (err) {
      console.error('Error al sincronizar:', err);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-600 mb-4">Error al cargar el dashboard</p>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  const current = data?.current_period;
  const comparison = data?.comparison;
  const trends = data?.trends || [];
  const teamAverage = data?.team_average;
  const rank = data?.productivity_rank;

  return (
    <div className="space-y-6">
      {/* Header con PeriodSelector y Sync */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PeriodSelector value={period} onChange={setPeriod} />
        <Button
          onClick={handleSync}
          disabled={syncMetrics.isPending}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={syncMetrics.isPending ? 'animate-spin' : ''} />
          {syncMetrics.isPending ? 'Sincronizando...' : 'Sincronizar Métricas'}
        </Button>
      </div>

      {/* Métricas del período actual */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Métricas del Período Actual
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Llamadas Totales"
            value={current?.total_calls ?? 0}
            unit="llamadas"
            icon={Phone}
            loading={isLoading}
          />
          <MetricCard
            title="Tiempo Total"
            value={current ? formatCallTime(current.total_call_time_seconds) : '0s'}
            icon={Clock}
            loading={isLoading}
          />
          <MetricCard
            title="Tareas Completadas"
            value={current?.tasks_completed ?? 0}
            unit="tareas"
            icon={CheckCircle}
            color="success"
            loading={isLoading}
          />
          <MetricCard
            title="Notas Creadas"
            value={current?.notes_created ?? 0}
            unit="notas"
            icon={FileText}
            loading={isLoading}
          />
          <MetricCard
            title="Oportunidades"
            value={current?.opportunities_worked ?? 0}
            unit="oportunidades"
            icon={Briefcase}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Comparación con período anterior */}
      {comparison && current && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Comparación con Período Anterior ({comparison.period})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ComparisonCard
              title="Llamadas"
              current={current.total_calls}
              previous={comparison.total_calls}
              unit="llamadas"
              changePercentage={comparison.total_calls !== 0 
                ? ((current.total_calls - comparison.total_calls) / comparison.total_calls) * 100
                : 0}
              loading={isLoading}
            />
            <ComparisonCard
              title="Tiempo"
              current={current.total_call_time_seconds}
              previous={comparison.total_call_time_seconds}
              unit="seg"
              changePercentage={comparison.total_call_time_seconds !== 0
                ? ((current.total_call_time_seconds - comparison.total_call_time_seconds) / comparison.total_call_time_seconds) * 100
                : 0}
              loading={isLoading}
            />
            <ComparisonCard
              title="Tareas"
              current={current.tasks_completed}
              previous={comparison.tasks_completed}
              unit="tareas"
              changePercentage={comparison.tasks_completed !== 0
                ? ((current.tasks_completed - comparison.tasks_completed) / comparison.tasks_completed) * 100
                : 0}
              loading={isLoading}
            />
            <ComparisonCard
              title="Notas"
              current={current.notes_created}
              previous={comparison.notes_created}
              unit="notas"
              changePercentage={comparison.notes_created !== 0
                ? ((current.notes_created - comparison.notes_created) / comparison.notes_created) * 100
                : 0}
              loading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Ranking y Promedio del Equipo */}
      {(rank !== null || teamAverage) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rank !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Ranking en el Equipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="flex items-center gap-4">
                    <Badge variant="default" className="text-2xl px-4 py-2">
                      #{rank ?? 'N/A'}
                    </Badge>
                    <p className="text-sm text-gray-600">
                      {rank === 1 && '🥇 ¡Eres el mejor del equipo!'}
                      {rank === 2 && '🥈 Muy bien, estás en segundo lugar'}
                      {rank === 3 && '🥉 Buen trabajo, tercer lugar'}
                      {rank && rank > 3 && `Mantente enfocado, puedes mejorar tu posición`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {teamAverage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Promedio del Equipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Llamadas:</span>
                      <span className="font-semibold">{teamAverage.total_calls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tiempo:</span>
                      <span className="font-semibold">
                        {formatCallTime(teamAverage.total_call_time_seconds)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tareas:</span>
                      <span className="font-semibold">{teamAverage.tasks_completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Notas:</span>
                      <span className="font-semibold">{teamAverage.notes_created}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Oportunidades:</span>
                      <span className="font-semibold">{teamAverage.opportunities_worked}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Gráficos de tendencias */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tendencias</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendsChart data={trends} metric="calls" loading={isLoading} />
          <TrendsChart data={trends} metric="time" loading={isLoading} />
          <TrendsChart data={trends} metric="tasks" loading={isLoading} />
          <TrendsChart data={trends} metric="notes" loading={isLoading} />
        </div>
      </div>
    </div>
  );
}

