// Badge de estado de expediente con colores distintivos
// Mobile-first

import { StatusBadge } from '@/components/common/StatusBadge';
import type { ExpedienteStatus } from '@/types/expediente';

interface ExpedienteStatusBadgeProps {
  status: ExpedienteStatus;
  className?: string;
}

const statusLabels: Record<ExpedienteStatus, string> = {
  new: 'Nuevo',
  in_progress: 'En Proceso',
  pending_info: 'Pendiente Info',
  completed: 'Completado',
  archived: 'Archivado',
};

const statusVariants: Record<ExpedienteStatus, 'info' | 'warning' | 'success' | 'default' | 'pending'> = {
  new: 'info',
  in_progress: 'warning',
  pending_info: 'pending',
  completed: 'success',
  archived: 'default',
};

export function ExpedienteStatusBadge({ status, className }: ExpedienteStatusBadgeProps) {
  return (
    <StatusBadge
      status={statusLabels[status]}
      variant={statusVariants[status]}
      className={className}
      showDot
    />
  );
}













