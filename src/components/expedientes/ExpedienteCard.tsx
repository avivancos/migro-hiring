// Card de expediente para lista
// Mobile-first con swipe actions y información esencial visible

import { useNavigate } from 'react-router-dom';
import { CalendarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Card, CardContent } from '@/components/ui/card';
import { ExpedienteStatusBadge } from './ExpedienteStatusBadge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ExpedienteRead } from '@/types/expediente';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExpedienteCardProps {
  expediente: ExpedienteRead;
  onPress?: (id: string) => void;
  showActions?: boolean;
  onStatusChange?: (id: string, newStatus: string) => void;
  onArchive?: (id: string) => void;
  progress?: number; // Porcentaje de completitud de documentación (0-100)
  className?: string;
}

export function ExpedienteCard({
  expediente,
  onPress,
  progress,
  className,
}: ExpedienteCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onPress) {
      onPress(expediente.id);
    } else {
      navigate(`/crm/expedientes/${expediente.id}`);
    }
  };

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-lg transition-all duration-200',
        'border-l-4 border-l-green-500',
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          {/* Header con título y estado */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <DocumentTextIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                  {expediente.title}
                </h3>
                {expediente.summary && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {expediente.summary}
                  </p>
                )}
              </div>
            </div>
            <ExpedienteStatusBadge status={expediente.status} />
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {expediente.numero_expediente_oficial && (
              <div className="flex items-center gap-2 text-gray-600">
                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                <span className="truncate">
                  Exp: {expediente.numero_expediente_oficial}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span>
                {format(new Date(expediente.updated_at), 'dd MMM yyyy', { locale: es })}
              </span>
            </div>
          </div>

          {/* Barra de progreso de documentación */}
          {progress !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Progreso de documentación</span>
                <span className="font-medium text-gray-900">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Formulario oficial asignado */}
          {expediente.formulario_oficial_id && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircleIcon className="h-4 w-4" />
              <span>Formulario oficial asignado</span>
            </div>
          )}

          {/* Fechas importantes */}
          {(expediente.fecha_presentacion || expediente.fecha_resolucion) && (
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
              {expediente.fecha_presentacion && (
                <div>
                  <span className="font-medium">Presentado: </span>
                  {format(new Date(expediente.fecha_presentacion), 'dd MMM yyyy', { locale: es })}
                </div>
              )}
              {expediente.fecha_resolucion && (
                <div>
                  <span className="font-medium">Resuelto: </span>
                  {format(new Date(expediente.fecha_resolucion), 'dd MMM yyyy', { locale: es })}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

