// StatusBadge - Badge para estados con colores semánticos
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusVariant = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'default'
  | 'active'
  | 'inactive'
  | 'pending'
  | 'completed'
  | 'cancelled';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  showDot?: boolean;
  className?: string;
}

const statusConfig: Record<StatusVariant, { label: string; className: string }> = {
  success: { label: 'Éxito', className: 'bg-green-100 text-green-800 border-green-200' },
  error: { label: 'Error', className: 'bg-red-100 text-red-800 border-red-200' },
  warning: { label: 'Advertencia', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  info: { label: 'Info', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  default: { label: 'Default', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  active: { label: 'Activo', className: 'bg-green-100 text-green-800 border-green-200' },
  inactive: { label: 'Inactivo', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  completed: { label: 'Completado', className: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-200' },
};

// Mapeo de estados comunes a variantes
const statusToVariant: Record<string, StatusVariant> = {
  // Estados de usuario
  'active': 'active',
  'inactive': 'inactive',
  'user_verified': 'success',
  'unverified': 'warning',
  
  // Estados de conversación
  'open': 'info',
  'closed': 'default',
  'archived': 'inactive',
  
  // Estados de pago
  'paid': 'success',
  'pending': 'pending',
  'failed': 'error',
  'refunded': 'warning',
  'cancelled': 'cancelled',
  
  // Estados de documento
  'verified': 'success',
  'document_pending': 'pending',
  'rejected': 'error',
  
  // Estados de expediente
  'new': 'info',
  'in_progress': 'warning',
  'completed': 'success',
  
  // Roles
  'admin': 'info',
  'lawyer': 'success',
  'agent': 'warning',
  'user': 'default',
};

export function StatusBadge({ 
  status, 
  variant, 
  showDot = false,
  className 
}: StatusBadgeProps) {
  // Determinar variante automáticamente si no se proporciona
  const finalVariant = variant || statusToVariant[status.toLowerCase()] || 'default';
  const config = statusConfig[finalVariant];
  
  // Formatear label del status
  const label = status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return (
    <Badge
      className={cn(
        'border',
        config.className,
        showDot && 'flex items-center gap-1.5',
        className
      )}
    >
      {showDot && (
        <span 
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            finalVariant === 'success' || finalVariant === 'active' || finalVariant === 'completed' 
              ? 'bg-green-600' 
              : finalVariant === 'error' || finalVariant === 'cancelled'
              ? 'bg-red-600'
              : finalVariant === 'warning' || finalVariant === 'pending'
              ? 'bg-yellow-600'
              : 'bg-gray-600'
          )}
        />
      )}
      {label}
    </Badge>
  );
}



