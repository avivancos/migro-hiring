// ContactTableRow - Componente memoizado para filas de tabla de contactos
// Optimizado para evitar re-renders innecesarios en tablas grandes

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Contact } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronRightIcon, EnvelopeIcon, FlagIcon, PhoneIcon, StarIcon } from '@heroicons/react/24/outline';

interface ContactTableRowProps {
  contact: Contact;
  visibleColumns: string[];
  onNavigate?: (id: string) => void;
  showSelection?: boolean;
  isSelected?: boolean;
  selectionDisabled?: boolean;
  onToggleSelected?: (checked: boolean) => void;
}

// Función helper para obtener variante de badge
const getGradingVariant = (grading?: 'A' | 'B+' | 'B-' | 'C' | 'D'): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (grading) {
    case 'A':
      return 'default';
    case 'B+':
      return 'secondary';
    case 'B-':
      return 'outline';
    case 'C':
      return 'destructive';
    case 'D':
      return 'destructive';
    default:
      return 'outline';
  }
};

// Función helper para formatear fecha
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

// Función helper para renderizar celda
const renderCell = (contact: Contact, columnKey: string) => {
  switch (columnKey) {
    case 'name':
      return (
        <td key={columnKey} className="px-4 py-3 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">
            {contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim() || 'Sin nombre'}
          </div>
        </td>
      );
    case 'email':
      return (
        <td key={columnKey} className="px-4 py-3 whitespace-nowrap">
          {contact.email ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <EnvelopeIcon className="w-4 h-4" />
              <span className="truncate max-w-xs">{contact.email}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">N/A</span>
          )}
        </td>
      );
    case 'phone':
      return (
        <td key={columnKey} className="px-4 py-3 whitespace-nowrap">
          {contact.phone ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <PhoneIcon className="w-4 h-4" />
              <span>{contact.phone}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">N/A</span>
          )}
        </td>
      );
    case 'nacionalidad':
      return (
        <td key={columnKey} className="px-4 py-3 whitespace-nowrap">
          {contact.nacionalidad ? (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <FlagIcon className="w-4 h-4" />
              <span>{contact.nacionalidad}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">N/A</span>
          )}
        </td>
      );
    case 'grading_llamada':
      return (
        <td key={columnKey} className="px-4 py-3 whitespace-nowrap">
          {contact.grading_llamada ? (
            <Badge variant={getGradingVariant(contact.grading_llamada)} className="text-xs">
              <StarIcon className="w-3 h-3 mr-1" />
              {contact.grading_llamada}
            </Badge>
          ) : (
            <span className="text-sm text-gray-400">N/A</span>
          )}
        </td>
      );
    case 'grading_situacion':
      return (
        <td key={columnKey} className="px-4 py-3 whitespace-nowrap">
          {contact.grading_situacion ? (
            <Badge variant={getGradingVariant(contact.grading_situacion)} className="text-xs">
              <StarIcon className="w-3 h-3 mr-1" />
              {contact.grading_situacion}
            </Badge>
          ) : (
            <span className="text-sm text-gray-400">N/A</span>
          )}
        </td>
      );
    case 'created_at':
      return (
        <td key={columnKey} className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-4 h-4" />
            <span>{formatDate(contact.created_at)}</span>
          </div>
        </td>
      );
    case 'updated_at':
      return (
        <td key={columnKey} className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
          {formatDate(contact.updated_at)}
        </td>
      );
    case 'ultima_llamada':
      return (
        <td key={columnKey} className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
          {contact.ultima_llamada_fecha ? (
            <div className="flex items-center gap-1">
              <PhoneIcon className="w-4 h-4" />
              <span>{formatDate(contact.ultima_llamada_fecha)}</span>
            </div>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </td>
      );
    case 'proxima_llamada':
      return (
        <td key={columnKey} className="px-4 py-3 whitespace-nowrap text-sm">
          {contact.proxima_llamada_fecha ? (
            <div className={`flex items-center gap-1 ${new Date(contact.proxima_llamada_fecha).getTime() < new Date().getTime() ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
              <CalendarIcon className="w-4 h-4" />
              <span>{formatDate(contact.proxima_llamada_fecha)}</span>
            </div>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </td>
      );
    default:
      return null;
  }
};

// Componente memoizado - solo se re-renderiza si cambian las props
export const ContactTableRow = memo<ContactTableRowProps>(({
  contact,
  visibleColumns,
  onNavigate,
  showSelection,
  isSelected,
  selectionDisabled,
  onToggleSelected,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onNavigate) {
      onNavigate(contact.id);
    } else {
      navigate(`/crm/contacts/${contact.id}`);
    }
  };

  const handleGoToDetail = () => {
    if (onNavigate) {
      onNavigate(contact.id);
    } else {
      navigate(`/crm/contacts/${contact.id}`);
    }
  };

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer"
      onClick={handleClick}
    >
      {showSelection && (
        <td
          className="px-3 py-3 whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            checked={Boolean(isSelected)}
            disabled={Boolean(selectionDisabled)}
            onChange={(e) => onToggleSelected?.(e.target.checked)}
            aria-label={isSelected ? 'Quitar de selección' : 'Seleccionar contacto'}
          />
        </td>
      )}
      {visibleColumns.map(columnKey => {
        if (columnKey === 'acciones') {
          return (
            <td key={columnKey} className="px-4 py-3 whitespace-nowrap text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGoToDetail();
                }}
              >
                Ver
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Button>
            </td>
          );
        }
        return renderCell(contact, columnKey);
      })}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Comparación optimizada: solo re-renderizar si cambian datos relevantes
  if (prevProps.contact.id !== nextProps.contact.id) return false;
  if (prevProps.visibleColumns.length !== nextProps.visibleColumns.length) return false;
  if (prevProps.visibleColumns.join(',') !== nextProps.visibleColumns.join(',')) return false;
  if (Boolean(prevProps.showSelection) !== Boolean(nextProps.showSelection)) return false;
  if (Boolean(prevProps.isSelected) !== Boolean(nextProps.isSelected)) return false;
  if (Boolean(prevProps.selectionDisabled) !== Boolean(nextProps.selectionDisabled)) return false;
  // IMPORTANT: si cambian callbacks del padre (closures), debemos re-renderizar
  // para no quedarnos con referencias stale (selección/navegación incorrecta).
  if (prevProps.onNavigate !== nextProps.onNavigate) return false;
  if (Boolean(nextProps.showSelection) && prevProps.onToggleSelected !== nextProps.onToggleSelected) return false;
  
  // Comparar solo campos visibles (mapeando keys de columna -> campos reales del contacto)
  // Nota: algunas columnas renderizan valores basados en nombres distintos (p. ej. 'ultima_llamada' usa 'ultima_llamada_fecha').
  const columnToContactFields: Record<string, Array<keyof Contact>> = {
    name: ['name', 'first_name', 'last_name'],
    email: ['email'],
    phone: ['phone'],
    nacionalidad: ['nacionalidad'],
    grading_llamada: ['grading_llamada'],
    grading_situacion: ['grading_situacion'],
    created_at: ['created_at'],
    updated_at: ['updated_at'],
    ultima_llamada: ['ultima_llamada_fecha'],
    proxima_llamada: ['proxima_llamada_fecha'],
    // defensivo: si en algún punto se usan keys ya alineadas a fields
    ultima_llamada_fecha: ['ultima_llamada_fecha'],
    proxima_llamada_fecha: ['proxima_llamada_fecha'],
  };

  const fieldsToCompare = new Set<keyof Contact>();
  for (const col of nextProps.visibleColumns) {
    if (col === 'acciones') continue;
    const fields = columnToContactFields[col];
    if (!fields) continue;
    for (const field of fields) fieldsToCompare.add(field);
  }

  for (const field of fieldsToCompare) {
    const prevValue = prevProps.contact[field];
    const nextValue = nextProps.contact[field];
    if (prevValue !== nextValue) return false;
  }
  
  return true; // No re-renderizar
});

ContactTableRow.displayName = 'ContactTableRow';

