// HumanIssuesCard - Card de fallos humanos optimizada para mobile

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { HumanAnalysisIssues } from '@/types/caseAnalysis';

interface HumanIssuesCardProps {
  issues: HumanAnalysisIssues;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function HumanIssuesCard({
  issues,
  expanded = false,
  onToggle,
  className,
}: HumanIssuesCardProps) {
  const severityColors = {
    low: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  const severityLabels = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  };

  if (issues.issues.length === 0) {
    return null;
  }

  return (
    <Card className={cn('transition-shadow border-l-4', severityColors[issues.severity], className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <CardTitle className="text-lg">Fallos Humanos Detectados</CardTitle>
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
        <Badge className={cn('mt-2', severityColors[issues.severity])}>
          Severidad: {severityLabels[issues.severity]}
        </Badge>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          {/* Issues */}
          {issues.issues.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Problemas detectados:</div>
              <ul className="space-y-1">
                {issues.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recomendaciones */}
          {issues.recommendations.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <div className="text-sm font-medium text-gray-700">Recomendaciones:</div>
              <ul className="space-y-1">
                {issues.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">💡</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

