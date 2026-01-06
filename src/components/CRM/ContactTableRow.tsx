// ContactTableRow - Componente memoizado para filas de tabla de contactos
// Optimizado para evitar re-renders innecesarios en tablas grandes

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Contact } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Flag, Calendar, Star } from 'lucide-react';

interface ContactTableRowProps {
  contact: Contact;
  visibleColumns: string[];
  onNavigate?: (id: string) => void;
}

// Función helper para obtener variante de badge
const getGradingVariant = (grading?: 'A' | 'B+' | 'B-' | 'C'): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (grading) {
    case 'A':
      return 'default';
    case 'B+':
      return 'secondary';
    case 'B-':
      return 'outline';
    case 'C':
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
              <Mail className="w-4 h-4" />
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
              <Phone className="w-4 h-4" />
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
              <Flag className="w-4 h-4" />
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
              <Star className="w-3 h-3 mr-1" />
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
              <Star className="w-3 h-3 mr-1" />
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
            <Calendar className="w-4 h-4" />
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
              <Phone className="w-4 h-4" />
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
              <Calendar className="w-4 h-4" />
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
export const ContactTableRow = memo<ContactTableRowProps>(({ contact, visibleColumns, onNavigate }) => {
  const navigate = useNavigate();

  const handleClick = () => {
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
      {visibleColumns.map(columnKey => renderCell(contact, columnKey))}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Comparación optimizada: solo re-renderizar si cambian datos relevantes
  if (prevProps.contact.id !== nextProps.contact.id) return false;
  if (prevProps.visibleColumns.length !== nextProps.visibleColumns.length) return false;
  if (prevProps.visibleColumns.join(',') !== nextProps.visibleColumns.join(',')) return false;
  
  // Comparar solo campos visibles
  const relevantFields = ['name', 'email', 'phone', 'nacionalidad', 'grading_llamada', 'grading_situacion', 'created_at', 'updated_at', 'ultima_llamada_fecha', 'proxima_llamada_fecha'];
  const visibleFields = nextProps.visibleColumns.filter(col => relevantFields.includes(col));
  
  for (const field of visibleFields) {
    const prevValue = (prevProps.contact as any)[field];
    const nextValue = (nextProps.contact as any)[field];
    if (prevValue !== nextValue) return false;
  }
  
  return true; // No re-renderizar
});

ContactTableRow.displayName = 'ContactTableRow';

