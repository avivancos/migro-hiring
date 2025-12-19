// Utilidades para traducir estados, prioridades y otros valores al español

/**
 * Traduce el estado de un contrato al español
 */
export function formatContractStatus(status: string | undefined): string {
  if (!status) return 'Desconocido';
  const statusMap: Record<string, string> = {
    pending: 'Pendiente',
    paid: 'Pagado',
    completed: 'Completado',
    expired: 'Expirado',
    cancelled: 'Cancelado',
  };
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Traduce el estado de una llamada al español
 */
export function formatCallStatus(status: string | undefined): string {
  if (!status) return 'Desconocido';
  const statusMap: Record<string, string> = {
    completed: 'Completada',
    no_answer: 'Sin respuesta',
    failed: 'Fallida',
    busy: 'Ocupado',
    missed: 'Perdida',
    answered: 'Respondida',
  };
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Traduce el estado de un lead/contacto al español
 */
export function formatLeadStatus(status: string | undefined): string {
  if (!status) return 'Sin estado';
  const statusMap: Record<string, string> = {
    new: 'Nuevo',
    contacted: 'Contactado',
    proposal: 'Propuesta',
    negotiation: 'Negociación',
    won: 'Ganado',
    lost: 'Perdido',
    'in_progress': 'En progreso',
    'on_hold': 'En espera',
  };
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Traduce el estado de una tarea al español
 */
export function formatTaskStatus(status: string | undefined): string {
  if (!status) return 'Sin estado';
  const statusMap: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
    overdue: 'Vencida',
  };
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Traduce el estado KYC al español
 */
export function formatKYCStatus(status: string | null | undefined): string {
  if (status === null || status === undefined) return 'No iniciado';
  const statusMap: Record<string, string> = {
    null: 'No iniciado',
    pending: 'Pendiente',
    verified: 'Verificado',
    failed: 'Fallido',
  };
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Traduce la prioridad al español
 */
export function formatPriority(priority: string | undefined): string {
  if (!priority) return '';
  const priorityMap: Record<string, string> = {
    urgent: 'Urgente',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  };
  return priorityMap[priority.toLowerCase()] || priority;
}

