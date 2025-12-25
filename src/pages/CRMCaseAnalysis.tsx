// CRMCaseAnalysis - Página de análisis de casos migratorios (Mobile First)

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Download } from 'lucide-react';
import { useOpportunityAnalysis } from '@/hooks/useCaseAnalysis';
import { AnalysisQuickCard } from '@/components/caseAnalysis/AnalysisQuickCard';
import { SalesFeasibilityCard } from '@/components/caseAnalysis/SalesFeasibilityCard';
import { HumanIssuesCard } from '@/components/caseAnalysis/HumanIssuesCard';
import { PiliAnalysisCard } from '@/components/caseAnalysis/PiliAnalysisCard';
import { AnalysisStateIndicator } from '@/components/caseAnalysis/AnalysisStateIndicator';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AnalysisState } from '@/types/caseAnalysis';

export function CRMCaseAnalysis() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const { analysis, state, refetch } = useOpportunityAnalysis(
    opportunityId,
    true // Auto-fetch cuando se monta
  );

  // Actualizar título de la página
  usePageTitle('Análisis de Caso Migratorio | Migro.es');

  // Manejar compartir análisis
  const handleShare = () => {
    if (navigator.share && analysis) {
      navigator.share({
        title: 'Análisis de Caso Migratorio',
        text: `Score: ${analysis.score.toFixed(1)} - Grading: ${analysis.grading}`,
        url: window.location.href,
      }).catch((err) => {
        console.error('Error compartiendo:', err);
      });
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  // Manejar exportar análisis
  const handleExport = () => {
    if (!analysis) return;

    const exportData = {
      score: analysis.score,
      grading: analysis.grading,
      sales_feasibility: analysis.sales_feasibility,
      analysis_summary: analysis.analysis_summary,
      analyzed_at: analysis.analyzed_at,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis-caso-${opportunityId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Toggle de secciones
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Mostrar estado de carga o error
  if (state === AnalysisState.LOADING || state === AnalysisState.ERROR) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Análisis de Caso</h1>
        </div>
        <AnalysisStateIndicator state={state} onRetry={() => refetch()} />
      </div>
    );
  }

  // Si no hay análisis, mostrar mensaje
  if (!analysis) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Análisis de Caso</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600 text-center">No se encontró análisis disponible</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Análisis de Caso</h1>
        </div>

        {/* Acciones rápidas */}
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex-1 sm:flex-none min-h-[44px]"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex-1 sm:flex-none min-h-[44px]"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Indicador de estado parcial */}
      {state === AnalysisState.PARTIAL && (
        <AnalysisStateIndicator state={state} />
      )}

      {/* Card de análisis rápido */}
      <AnalysisQuickCard
        analysis={analysis}
        onViewDetails={() => {
          // Scroll a sección detallada
          const detailSection = document.getElementById('analysis-details');
          if (detailSection) {
            detailSection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Sección de detalles */}
      <div id="analysis-details" className="space-y-6">
        {/* Resumen del análisis */}
        {analysis.analysis_summary && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Análisis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{analysis.analysis_summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Análisis de viabilidad de venta */}
        <SalesFeasibilityCard
          feasibility={analysis.sales_feasibility}
          expanded={expandedSection === 'sales'}
          onToggle={() => toggleSection('sales')}
        />

        {/* Análisis de Pili (si disponible) */}
        {analysis.pili_analysis?.available && (
          <PiliAnalysisCard
            analysis={analysis.pili_analysis}
            expanded={expandedSection === 'pili'}
            onToggle={() => toggleSection('pili')}
          />
        )}

        {/* Fallos humanos detectados */}
        {analysis.human_analysis_issues.issues.length > 0 && (
          <HumanIssuesCard
            issues={analysis.human_analysis_issues}
            expanded={expandedSection === 'issues'}
            onToggle={() => toggleSection('issues')}
          />
        )}

        {/* Metadatos */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Análisis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Analizado el:</span>{' '}
              {new Date(analysis.analyzed_at).toLocaleString('es-ES', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </div>
            <div>
              <span className="font-medium">Versión:</span> {analysis.analysis_version}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

