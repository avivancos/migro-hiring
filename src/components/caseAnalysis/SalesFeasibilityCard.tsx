// SalesFeasibilityCard - Card de viabilidad de venta optimizada para mobile

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SalesFeasibility } from '@/types/caseAnalysis';

interface SalesFeasibilityCardProps {
  feasibility: SalesFeasibility;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function SalesFeasibilityCard({
  feasibility,
  expanded = false,
  onToggle,
  className,
}: SalesFeasibilityCardProps) {
  return (
    <Card className={cn('transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Viabilidad de Venta</CardTitle>
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado principal */}
        <div className="flex items-center gap-3">
          {feasibility.can_sell ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              ✅ Viable
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
              ❌ No viable
            </Badge>
          )}
          <div className="flex-1">
            <div className="text-sm text-gray-600">Confianza</div>
            <div className="text-lg font-semibold">
              {(feasibility.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Razones */}
        {expanded && feasibility.reasons.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-sm font-medium text-gray-700">Razones:</div>
            <ul className="space-y-1">
              {feasibility.reasons.map((reason, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Servicio recomendado */}
        {expanded && feasibility.recommended_service && (
          <div className="pt-2 border-t">
            <div className="text-sm font-medium text-gray-700 mb-1">
              Servicio Recomendado:
            </div>
            <Badge variant="outline" className="text-sm">
              {feasibility.recommended_service}
            </Badge>
          </div>
        )}

        {/* Rango de precio estimado */}
        {expanded && feasibility.estimated_price_range && (
          <div className="pt-2 border-t">
            <div className="text-sm font-medium text-gray-700 mb-1">
              Rango de Precio Estimado:
            </div>
            <div className="text-sm text-gray-600">
              {feasibility.estimated_price_range.min.toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR',
              })}{' '}
              -{' '}
              {feasibility.estimated_price_range.max.toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR',
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

