// Componente para mostrar campos personalizados de un contacto

import { useContactCustomFields } from '@/hooks/useContactCustomFields';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';

interface ContactCustomFieldsProps {
  contactId: string | undefined;
}

function renderCustomFieldValue(
  field: any,
  value: any,
  displayValue: string
): React.ReactNode {
  // Si no hay valor, mostrar placeholder
  if (!value) {
    return <span className="text-gray-400 italic">—</span>;
  }

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return (
        <span className="text-gray-900">{displayValue}</span>
      );

    case 'number':
      return (
        <span className="text-gray-900 font-medium">{displayValue}</span>
      );

    case 'date':
      try {
        const dateValue = new Date(displayValue);
        return (
          <span className="text-gray-900">
            {dateValue.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        );
      } catch {
        return <span className="text-gray-900">{displayValue}</span>;
      }

    case 'select':
      return (
        <Badge variant="outline" className="text-sm">
          {displayValue}
        </Badge>
      );

    case 'multiselect':
      const tags = displayValue.split(', ').filter(Boolean);
      if (tags.length === 0) {
        return <span className="text-gray-400 italic">—</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {tag.trim()}
            </Badge>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <span className="flex items-center gap-1">
          {value.boolean ? (
            <>
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <span className="text-gray-900">Sí</span>
            </>
          ) : (
            <>
              <XMarkIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">No</span>
            </>
          )}
        </span>
      );

    default:
      return (
        <span className="text-gray-900">
          {displayValue || JSON.stringify(value)}
        </span>
      );
  }
}

export function ContactCustomFields({ contactId }: ContactCustomFieldsProps) {
  const { fields, loading, error } = useContactCustomFields(contactId);

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        Cargando campos personalizados...
      </div>
    );
  }

  if (error) {
    console.error('Error cargando campos personalizados:', error);
    // No mostrar error al usuario, simplemente no mostrar la sección
    return null;
  }

  if (fields.length === 0) {
    return null; // No mostrar sección si no hay campos
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Información Adicional</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(({ field, value, displayValue }) => (
          <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-white">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              {field.name}
              {field.is_required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <div className="text-gray-900">
              {renderCustomFieldValue(field, value?.value, displayValue)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

