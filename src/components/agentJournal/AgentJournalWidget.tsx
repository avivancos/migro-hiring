// AgentJournalWidget - Widget para mostrar métricas del Agent Daily Journal en el dashboard

import { useState } from 'react';
import { useDailyReport, useSyncMetrics } from '@/hooks/useAgentJournal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductivityScoreBadge } from './ProductivityScoreBadge';
import { SignReportDialog } from './SignReportDialog';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon, ArrowRightIcon, BookOpenIcon, BriefcaseIcon, ClockIcon, DocumentTextIcon, PencilIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { formatCallTime } from '@/utils/agentJournal';
import { startOfToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/common/Skeleton';

export function AgentJournalWidget() {
  const { data, isLoading, refetch } = useDailyReport(startOfToday());
  const syncMetrics = useSyncMetrics();
  const navigate = useNavigate();
  const [showSignDialog, setShowSignDialog] = useState(false);

  const handleSync = async () => {
    try {
      await syncMetrics.mutateAsync(undefined);
      refetch();
    } catch (err) {
      console.error('Error al sincronizar:', err);
    }
  };

  const handleViewFullReport = () => {
    navigate('/crm/journal');
  };

  const handleSignSuccess = () => {
    refetch();
  };

  const journal = data?.journal;
  const isSigned = journal?.extra_data?.signed === true;

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5 text-green-600" />
            <CardTitle className="text-base sm:text-lg font-bold">Mi Diario de Trabajo</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={syncMetrics.isPending}
              className="text-xs sm:text-sm"
              title="Sincronizar métricas"
            >
              <ArrowPathIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${syncMetrics.isPending ? 'animate-spin' : ''}`} />
            </Button>
            {!isSigned && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSignDialog(true)}
                className="text-xs sm:text-sm border-green-600 text-green-700 hover:bg-green-50"
                title="Firmar y enviar reporte"
              >
                <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Firmar</span>
              </Button>
            )}
            {isSigned && (
              <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Firmado</span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleViewFullReport}
              className="text-xs sm:text-sm"
            >
              Ver completo
              <ArrowRightIcon className="w-3 h-3 sm:w-4 sm:w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
            <div className="flex justify-center">
              <Skeleton className="h-24 w-24 rounded-full" variant="circular" />
            </div>
          </div>
        ) : journal ? (
          <div className="space-y-4">
            {/* Métricas principales en grid compacto */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-600">Llamadas Totales</p>
                  <PhoneIcon className="h-3 w-3 text-gray-400" />
                </div>
                <p className="text-xl font-bold text-gray-900">{journal.total_calls}</p>
                <p className="text-xs text-gray-500">llamadas</p>
              </div>
              <div className="p-3 rounded-lg border border-green-200 bg-green-50/50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-600">Llamadas Efectivas</p>
                  <PhoneIcon className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-xl font-bold text-gray-900">{journal.effective_calls}</p>
                <p className="text-xs text-gray-500">llamadas</p>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-600">Tiempo Total</p>
                  <ClockIcon className="h-3 w-3 text-gray-400" />
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCallTime(journal.total_call_time_seconds)}</p>
              </div>
              <div className="p-3 rounded-lg border border-green-200 bg-green-50/50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-600">Tareas Completadas</p>
                  <CheckCircleIcon className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-xl font-bold text-gray-900">{journal.tasks_completed}</p>
                <p className="text-xs text-gray-500">tareas</p>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-600">Notas Creadas</p>
                  <DocumentTextIcon className="h-3 w-3 text-gray-400" />
                </div>
                <p className="text-xl font-bold text-gray-900">{journal.notes_created}</p>
                <p className="text-xs text-gray-500">notas</p>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-600">Oportunidades</p>
                  <BriefcaseIcon className="h-3 w-3 text-gray-400" />
                </div>
                <p className="text-xl font-bold text-gray-900">{journal.opportunities_worked}</p>
                <p className="text-xs text-gray-500">oportunidades</p>
              </div>
            </div>

            {/* Productividad y Tasa de Éxito */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <ProductivityScoreBadge score={data?.productivity_score ?? null} size="sm" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tasa de Éxito</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.success_rate?.toFixed(1) ?? 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No hay datos disponibles para hoy</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              className="mt-4"
            >
              Sincronizar Métricas
            </Button>
          </div>
        )}
      </CardContent>

      {/* Diálogo de firma */}
      <SignReportDialog
        targetDate={startOfToday()}
        isOpen={showSignDialog}
        onClose={() => setShowSignDialog(false)}
        onSuccess={handleSignSuccess}
      />
    </Card>
  );
}

