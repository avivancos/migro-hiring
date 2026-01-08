// Hook para obtener y combinar campos personalizados con sus valores

import { useState, useEffect } from 'react';
import { crmService } from '@/services/crmService';
import type { CustomField, CustomFieldValue } from '@/types/crm';

export interface ContactCustomField {
  field: CustomField;
  value: CustomFieldValue | null;
  displayValue: string;
}

interface UseContactCustomFieldsResult {
  fields: ContactCustomField[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function formatCustomFieldValue(field: CustomField, value: any): string {
  if (!value) return '';

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return value.text || '';

    case 'number':
      return value.number?.toString() || '';

    case 'date':
      return value.date || '';

    case 'select':
      return value.text || '';

    case 'multiselect':
      return Array.isArray(value.texts) ? value.texts.join(', ') : '';

    case 'checkbox':
      return value.boolean ? 'Sí' : 'No';

    default:
      return JSON.stringify(value);
  }
}

function combineFieldsAndValues(
  fields: CustomField[],
  values: CustomFieldValue[]
): ContactCustomField[] {
  // Crear mapa de valores por custom_field_id
  const valuesMap = new Map<string, CustomFieldValue>();
  values.forEach(v => {
    valuesMap.set(v.custom_field_id, v);
  });

  // Combinar campos con valores y ordenar por sort
  return fields
    .sort((a, b) => a.sort - b.sort) // Ordenar por sort
    .map(field => {
      const value = valuesMap.get(field.id) || null;
      return {
        field,
        value,
        displayValue: formatCustomFieldValue(field, value?.value),
      };
    });
}

export function useContactCustomFields(
  contactId: string | undefined
): UseContactCustomFieldsResult {
  const [fields, setFields] = useState<ContactCustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFields = async () => {
    if (!contactId) {
      setFields([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Obtener campos visibles para contactos
      const fieldsData = await crmService.getCustomFields({
        entity_type: 'contacts',
        is_visible: true,
      });

      // 2. Obtener valores del contacto
      const valuesData = await crmService.getCustomFieldValues({
        entity_id: contactId,
        entity_type: 'contacts',
      });

      // 3. Combinar y ordenar
      const combined = combineFieldsAndValues(fieldsData, valuesData);
      setFields(combined);
    } catch (err) {
      console.error('Error cargando campos personalizados:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setFields([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  return {
    fields,
    loading,
    error,
    refresh: loadFields,
  };
}

