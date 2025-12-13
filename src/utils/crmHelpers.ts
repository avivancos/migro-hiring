// CRM Helper Utilities - Funciones auxiliares para flujos del CRM

import type { TaskTemplate } from '@/types/crm';

/**
 * Calcular fecha de vencimiento basada en días desde hoy
 */
export function calculateDueDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

/**
 * Calcular fecha de vencimiento desde una fecha base
 */
export function calculateDueDateFromBase(baseDate: Date, daysToAdd: number): string {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString();
}

/**
 * Obtener estadísticas de contactos por grading
 */
export function getContactsStatsByGrading(contacts: Array<{ grading_llamada?: string; grading_situacion?: string }>) {
  const stats = {
    llamada: {
      A: 0,
      'B+': 0,
      'B-': 0,
      C: 0,
      sinGrading: 0,
    },
    situacion: {
      A: 0,
      'B+': 0,
      'B-': 0,
      C: 0,
      sinGrading: 0,
    },
  };

  contacts.forEach(contact => {
    // Estadísticas de grading_llamada
    if (contact.grading_llamada) {
      const grading = contact.grading_llamada as 'A' | 'B+' | 'B-' | 'C';
      if (stats.llamada.hasOwnProperty(grading)) {
        stats.llamada[grading]++;
      }
    } else {
      stats.llamada.sinGrading++;
    }

    // Estadísticas de grading_situacion
    if (contact.grading_situacion) {
      const grading = contact.grading_situacion as 'A' | 'B+' | 'B-' | 'C';
      if (stats.situacion.hasOwnProperty(grading)) {
        stats.situacion[grading]++;
      }
    } else {
      stats.situacion.sinGrading++;
    }
  });

  return stats;
}

/**
 * Filtrar plantillas de tareas según criterios
 */
export function filterTaskTemplates(
  templates: TaskTemplate[],
  options?: {
    isActive?: boolean;
    appliesToContacts?: boolean;
    appliesToLeads?: boolean;
    name?: string;
  }
): TaskTemplate[] {
  return templates.filter(template => {
    if (options?.isActive !== undefined && template.is_active !== options.isActive) {
      return false;
    }
    if (options?.appliesToContacts !== undefined && template.applies_to_contacts !== options.appliesToContacts) {
      return false;
    }
    if (options?.appliesToLeads !== undefined && template.applies_to_leads !== options.appliesToLeads) {
      return false;
    }
    if (options?.name && !template.name.toLowerCase().includes(options.name.toLowerCase())) {
      return false;
    }
    return true;
  });
}

/**
 * Encontrar plantilla por nombre
 */
export function findTemplateByName(templates: TaskTemplate[], name: string): TaskTemplate | undefined {
  return templates.find(t => 
    t.name.toLowerCase().includes(name.toLowerCase())
  );
}

/**
 * Ordenar interacciones por fecha (más recientes primero)
 */
export function sortInteractionsByDate<T extends { created_at: string }>(
  interactions: T[]
): T[] {
  return [...interactions].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Agrupar leads por estado
 */
export function groupLeadsByStatus<T extends { status: string }>(
  leads: T[]
): Record<string, T[]> {
  return leads.reduce((acc, lead) => {
    const status = lead.status || 'unknown';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(lead);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Calcular valor total del pipeline
 */
export function calculatePipelineValue<T extends { price?: number; currency?: string }>(
  leads: T[],
  currency: string = 'EUR'
): number {
  return leads
    .filter(lead => lead.currency === currency || !lead.currency)
    .reduce((sum, lead) => sum + (lead.price || 0), 0);
}

/**
 * Formatear duración de llamada (segundos a formato legible)
 */
export function formatCallDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}

/**
 * Validar datos de contacto antes de crear
 */
export function validateContactData(data: {
  name?: string;
  email?: string;
  phone?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('El nombre es requerido');
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('El email no es válido');
  }

  if (data.phone && !/^\+?[1-9]\d{1,14}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.push('El teléfono no es válido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validar datos de llamada antes de crear
 */
export function validateCallData(data: {
  entity_id?: string;
  entity_type?: string;
  direction?: string;
  call_status?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.entity_id) {
    errors.push('El ID de la entidad es requerido');
  }

  if (!data.entity_type || !['contacts', 'leads'].includes(data.entity_type)) {
    errors.push('El tipo de entidad debe ser "contacts" o "leads"');
  }

  if (!data.direction || !['inbound', 'outbound'].includes(data.direction)) {
    errors.push('La dirección debe ser "inbound" o "outbound"');
  }

  if (!data.call_status) {
    errors.push('El estado de la llamada es requerido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Obtener color para estado de lead
 */
export function getLeadStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: '#3b82f6', // blue
    contacted: '#8b5cf6', // purple
    proposal: '#f59e0b', // amber
    negotiation: '#ef4444', // red
    won: '#10b981', // green
    lost: '#6b7280', // gray
  };
  return colors[status] || '#6b7280';
}

/**
 * Obtener color para grading
 */
export function getGradingColor(grading?: string): string {
  const colors: Record<string, string> = {
    A: '#10b981', // green
    'B+': '#22c55e', // light green
    'B-': '#f59e0b', // amber
    C: '#ef4444', // red
  };
  return colors[grading || ''] || '#6b7280';
}

/**
 * Formatear fecha relativa (hace X días, en X días)
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Hoy';
  } else if (diffDays === 1) {
    return 'Mañana';
  } else if (diffDays === -1) {
    return 'Ayer';
  } else if (diffDays > 0) {
    return `En ${diffDays} días`;
  } else {
    return `Hace ${Math.abs(diffDays)} días`;
  }
}




























