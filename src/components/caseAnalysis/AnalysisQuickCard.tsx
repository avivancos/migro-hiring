// AnalysisQuickCard - Card rápida de análisis optimizada para mobile

import { Card, CardContent } from '@/components/ui/card';
import { ScoreBadge } from './ScoreBadge';
import { GradingIndicator } from './GradingIndicator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CaseAnalysisResponse } from '@/types/caseAnalysis';

interface AnalysisQuickCardProps {
  analysis: CaseAnalysisResponse;
  onViewDetails?: () => void;
  className?: string;
}

export function AnalysisQuickCard({
  analysis,
  onViewDetails,
  className,
}: AnalysisQuickCardProps) {
  return (
    <Card className={cn('transition-shadow hover:shadow-lg', className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Score y Grading */}
          <div className="flex items-center gap-4 flex-1">
            <ScoreBadge score={analysis.score} size="medium" />
            <div className="flex flex-col gap-1">
              <GradingIndicator grading={analysis.grading} />
              <div className="flex items-center gap-2 mt-1">
                {analysis.sales_feasibility.can_sell ? (
                  <span className="text-sm font-medium text-green-600">
                    ✅ Viable para venta
                  </span>
                ) : (
                  <span className="text-sm font-medium text-red-600">
                    ❌ No viable para venta
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botón de acción */}
          {onViewDetails && (
            <Button
              onClick={onViewDetails}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
              variant="outline"
            >
              Ver Detalles
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}





