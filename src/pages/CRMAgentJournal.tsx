// CRMAgentJournal - Página principal del Agent Daily Journal

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DailyReportView } from '@/components/agentJournal/DailyReportView';
import { PerformanceDashboardView } from '@/components/agentJournal/PerformanceDashboardView';
import { FileText, BarChart3 } from 'lucide-react';

export function CRMAgentJournal() {
  const [activeTab, setActiveTab] = useState<'report' | 'dashboard'>('report');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Diario de Trabajo Diario</h1>
        <p className="text-gray-600 mt-1">
          Visualiza tus métricas diarias y desempeño de trabajo
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'report' | 'dashboard')}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="report" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reporte Diario
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="mt-6">
          <DailyReportView />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <PerformanceDashboardView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

