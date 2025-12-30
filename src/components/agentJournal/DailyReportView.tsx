// DailyReportView - Vista de reporte diario

import { useState } from 'react';
import { useDailyReport, useSyncMetrics } from '@/hooks/useAgentJournal';
import { MetricCard } from './MetricCard';
import { ProductivityScoreBadge } from './ProductivityScoreBadge';
import { CallAttemptsChart } from './CallAttemptsChart';
import { OpportunityDetailCard } from './OpportunityDetailCard';
import { DatePicker } from './DatePicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Phone, PhoneCall, Clock, CheckCircle, FileText, Briefcase, PenTool, CheckCircle2 } from 'lucide-react';
import { formatCallTime } from '@/utils/agentJournal';
import { startOfToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/common/Skeleton';
import { SignReportDialog } from './SignReportDialog';

export function DailyReportView() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(startOfToday());
  const { data, isLoading, error, refetch } = useDailyReport(selectedDate || undefined);
  const syncMetrics = useSyncMetrics();
  const navigate = useNavigate();
  const [showSignDialog, setShowSignDialog] = useState(false);

  const handleSync = async () => {
    try {
      await syncMetrics.mutateAsync(selectedDate || undefined);
      refetch();
    } catch (err) {
      console.error('Error al sincronizar:', err);
    }
  };

  const handleViewOpportunity = (opportunityId: string) => {
    navigate(`/crm/opportunities/${opportunityId}`);
  };

  const handleSignSuccess = () => {
    refetch();
  };

  const isSigned = data?.journal?.extra_data?.signed === true;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-600 mb-4">Error al cargar el reporte</p>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  const journal = data?.journal;
  const opportunities = data?.opportunities_details || [];
  const callAttempts = data?.call_attempts_details || [];

  return (
    <div className="space-y-6">
      {/* Header con DatePicker y Sync */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          maxDate={startOfToday()}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSync}
            disabled={syncMetrics.isPending}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <RefreshCw className={syncMetrics.isPending ? 'animate-spin' : ''} />
            {syncMetrics.isPending ? 'Sincronizando...' : 'Sincronizar Métricas'}
          </Button>
          {!isSigned && (
            <Button
              onClick={() => setShowSignDialog(true)}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              <PenTool className="mr-2" />
              Firmar y Enviar Reporte
            </Button>
          )}
          {isSigned && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-md text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Reporte firmado y enviado</span>
            </div>
          )}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Llamadas Totales"
          value={journal?.total_calls ?? 0}
          unit="llamadas"
          icon={Phone}
          loading={isLoading}
        />
        <MetricCard
          title="Llamadas Efectivas"
          value={journal?.effective_calls ?? 0}
          unit="llamadas"
          icon={PhoneCall}
          color="success"
          loading={isLoading}
        />
        <MetricCard
          title="Tiempo Total"
          value={journal ? formatCallTime(journal.total_call_time_seconds) : '0s'}
          icon={Clock}
          loading={isLoading}
        />
        <MetricCard
          title="Tareas Completadas"
          value={journal?.tasks_completed ?? 0}
          unit="tareas"
          icon={CheckCircle}
          color="success"
          loading={isLoading}
        />
        <MetricCard
          title="Notas Creadas"
          value={journal?.notes_created ?? 0}
          unit="notas"
          icon={FileText}
          loading={isLoading}
        />
        <MetricCard
          title="Oportunidades"
          value={journal?.opportunities_worked ?? 0}
          unit="oportunidades"
          icon={Briefcase}
          loading={isLoading}
        />
      </div>

      {/* Productividad y Tasa de Éxito */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Puntuación de Productividad</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            {isLoading ? (
              <Skeleton className="w-24 h-24 rounded-full" variant="circular" />
            ) : (
              <ProductivityScoreBadge score={data?.productivity_score ?? null} size="md" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasa de Éxito</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            {isLoading ? (
              <Skeleton className="h-16 w-32" />
            ) : (
              <>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {data?.success_rate?.toFixed(1) ?? 0}%
                </p>
                <p className="text-sm text-gray-500">
                  Llamadas exitosas / Total llamadas
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Intentos de Llamada */}
      <CallAttemptsChart data={callAttempts} loading={isLoading} />

      {/* Oportunidades trabajadas */}
      <Card>
        <CardHeader>
          <CardTitle>
            Oportunidades Trabajadas ({opportunities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay oportunidades trabajadas en este día
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <OpportunityDetailCard
                  key={opp.opportunity_id}
                  opportunity={opp}
                  onViewOpportunity={handleViewOpportunity}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de firma */}
      <SignReportDialog
        targetDate={selectedDate || undefined}
        isOpen={showSignDialog}
        onClose={() => setShowSignDialog(false)}
        onSuccess={handleSignSuccess}
      />
    </div>
  );
}

