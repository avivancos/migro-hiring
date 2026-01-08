// Lista de acciones del pipeline con filtros y validación
// Mobile-first con acciones rápidas

import { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ClockIcon, PlusIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { usePipelineActions } from '@/hooks/usePipelineActions';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { EntityType, ActionStatus, PipelineActionRead } from '@/types/pipeline';

interface PipelineActionsListProps {
  entityType: EntityType;
  entityId: string;
  onActionClick?: (actionId: string) => void;
  onCreateAction?: () => void;
  onValidate?: (actionId: string, status: 'validated' | 'rejected', notes?: string) => void;
  showCreateButton?: boolean;
}

export function PipelineActionsList({
  entityType,
  entityId,
  onActionClick,
  onCreateAction,
  onValidate,
  showCreateButton = true,
}: PipelineActionsListProps) {
  const [statusFilter, setStatusFilter] = useState<ActionStatus | 'all'>('all');
  const { actions, loading, validating, validateAction } =
    usePipelineActions(entityType, entityId);
  const { canValidateAction, canCreatePipelineAction } = usePermissions();

  const filteredActions = statusFilter === 'all'
    ? actions
    : actions.filter((a) => a.status === statusFilter);

  const getStatusIcon = (status: ActionStatus) => {
    switch (status) {
      case 'validated':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: ActionStatus) => {
    switch (status) {
      case 'validated':
        return <Badge variant="success">Validada</Badge>;
      case 'rejected':
        return <Badge variant="error">Rechazada</Badge>;
      case 'completed':
        return <Badge variant="info">Completada</Badge>;
      default:
        return <Badge variant="warning">Pendiente</Badge>;
    }
  };

  const handleValidate = async (action: PipelineActionRead, status: 'validated' | 'rejected') => {
    if (!onValidate) {
      // Validar directamente si no hay callback
      const notes = status === 'rejected' ? prompt('Motivo del rechazo:') : undefined;
      if (status === 'rejected' && !notes) {
        return; // Requerir motivo para rechazo
      }
      await validateAction(action.id, { status, validation_notes: notes || undefined });
    } else {
      const notes = status === 'rejected' ? prompt('Motivo del rechazo:') : undefined;
      if (status === 'rejected' && !notes) {
        return;
      }
      onValidate(action.id, status, notes || undefined);
    }
  };

  const pendingActions = filteredActions.filter((a) => a.status === 'pending_validation');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Acciones del Pipeline</h3>
          <p className="text-sm text-gray-600">
            {actions.length} acción{actions.length !== 1 ? 'es' : ''} total
            {pendingActions.length > 0 && (
              <span className="ml-2 text-yellow-600 font-medium">
                ({pendingActions.length} pendiente{pendingActions.length !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        {showCreateButton && canCreatePipelineAction() && onCreateAction && (
          <Button onClick={onCreateAction} size="sm" className="w-full md:w-auto">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Acción
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Todas ({actions.length})
        </Button>
        <Button
          variant={statusFilter === 'pending_validation' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('pending_validation')}
        >
          Pendientes ({actions.filter((a) => a.status === 'pending_validation').length})
        </Button>
        <Button
          variant={statusFilter === 'validated' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('validated')}
        >
          Validadas ({actions.filter((a) => a.status === 'validated').length})
        </Button>
        <Button
          variant={statusFilter === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('rejected')}
        >
          Rechazadas ({actions.filter((a) => a.status === 'rejected').length})
        </Button>
        <Button
          variant={statusFilter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('completed')}
        >
          Completadas ({actions.filter((a) => a.status === 'completed').length})
        </Button>
      </div>

      {/* Lista de acciones */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredActions.length === 0 ? (
        <EmptyState
          title="No hay acciones"
          description={
            statusFilter !== 'all'
              ? `No hay acciones con estado "${statusFilter}"`
              : 'Crea la primera acción para comenzar'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredActions.map((action) => {
            const canValidateThis = canValidateAction(action) && action.status === 'pending_validation';

            return (
              <Card
                key={action.id}
                className={cn(
                  'hover:shadow-md transition-shadow cursor-pointer',
                  action.status === 'pending_validation' && 'border-l-4 border-l-yellow-500'
                )}
                onClick={() => onActionClick?.(action.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {getStatusIcon(action.status)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {action.action_name || action.action_type}
                          </h4>
                          {action.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {action.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(action.status)}
                    </div>

                    {/* Información adicional */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        Creada: {format(new Date(action.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                      </div>
                      {action.validated_at && (
                        <div>
                          Validada: {format(new Date(action.validated_at), 'dd MMM yyyy HH:mm', { locale: es })}
                        </div>
                      )}
                    </div>

                    {/* Notas de validación */}
                    {action.validation_notes && (
                      <div className="p-2 bg-gray-50 rounded text-sm text-gray-700">
                        <strong>Notas:</strong> {action.validation_notes}
                      </div>
                    )}

                    {/* Acciones rápidas */}
                    {canValidateThis && (
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleValidate(action, 'validated');
                          }}
                          disabled={validating === action.id}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Validar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleValidate(action, 'rejected');
                          }}
                          disabled={validating === action.id}
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

