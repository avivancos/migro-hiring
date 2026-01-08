// PiliAnalysisCard - Card de análisis Pili optimizada para mobile

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { PiliAnalysis } from '@/types/caseAnalysis';
import ReactMarkdown from 'react-markdown';

interface PiliAnalysisCardProps {
  analysis: PiliAnalysis;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function PiliAnalysisCard({
  analysis,
  expanded = false,
  onToggle,
  className,
}: PiliAnalysisCardProps) {
  const [activeTab, setActiveTab] = useState<'limited' | 'unlimited' | 'recommended'>(
    analysis.comparison?.winner === 'unlimited' ? 'unlimited' : 'limited'
  );

  if (!analysis.available) {
    return null;
  }

  const winner = analysis.comparison?.winner;

  return (
    <Card className={cn('transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg">Análisis IA Avanzado</CardTitle>
          </div>
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
            >
              {expanded ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        {winner && (
          <div className="mt-2">
            <Badge
              variant="outline"
              className={cn(
                winner === 'unlimited' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
              )}
            >
              {winner === 'unlimited' ? 'Análisis Completo' : 'Análisis Rápido'}
            </Badge>
          </div>
        )}
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          {/* Tabs para alternar entre análisis */}
          {(analysis.limited_analysis || analysis.unlimited_analysis) && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
                {analysis.limited_analysis && (
                  <TabsTrigger value="limited" className="min-h-[44px]">
                    Rápido
                  </TabsTrigger>
                )}
                {analysis.unlimited_analysis && (
                  <TabsTrigger value="unlimited" className="min-h-[44px]">
                    Completo
                  </TabsTrigger>
                )}
                {analysis.recommended_analysis && (
                  <TabsTrigger value="recommended" className="min-h-[44px]">
                    Recomendado
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Análisis limitado */}
              {analysis.limited_analysis && (
                <TabsContent value="limited" className="mt-4">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{analysis.limited_analysis.analysis}</ReactMarkdown>
                  </div>
                  {analysis.limited_analysis.processing_time && (
                    <div className="text-xs text-gray-500 mt-2">
                      Tiempo de procesamiento: {analysis.limited_analysis.processing_time.toFixed(2)}s
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Análisis completo */}
              {analysis.unlimited_analysis && (
                <TabsContent value="unlimited" className="mt-4">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{analysis.unlimited_analysis.analysis}</ReactMarkdown>
                  </div>
                  {analysis.unlimited_analysis.processing_time && (
                    <div className="text-xs text-gray-500 mt-2">
                      Tiempo de procesamiento: {analysis.unlimited_analysis.processing_time.toFixed(2)}s
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Análisis recomendado */}
              {analysis.recommended_analysis && (
                <TabsContent value="recommended" className="mt-4">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{analysis.recommended_analysis}</ReactMarkdown>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}

          {/* Recomendación de comparación */}
          {analysis.comparison?.recommendation && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-lg">💡</span>
                <p className="text-sm text-yellow-800">{analysis.comparison.recommendation}</p>
              </div>
            </div>
          )}

          {/* Error si existe */}
          {analysis.error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
              <p className="text-sm text-red-800">Error: {analysis.error}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

