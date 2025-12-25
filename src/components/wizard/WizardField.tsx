// WizardField - Campo individual del wizard

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { WizardField as WizardFieldType } from '@/types/wizard';

interface WizardFieldProps {
  field: WizardFieldType;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function WizardField({
  field,
  value,
  onChange,
  error,
}: WizardFieldProps) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (field.type === 'boolean') {
      onChange((e.target as HTMLInputElement).checked);
    } else {
      onChange(e.target.value);
    }
  };

  const inputId = `wizard-field-${field.name}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="text-base font-medium">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {field.help_text && (
        <p className="text-sm text-gray-600">{field.help_text}</p>
      )}

      {field.type === 'textarea' ? (
        <Textarea
          id={inputId}
          value={value || ''}
          onChange={handleChange}
          placeholder={field.placeholder}
          required={field.required}
          className={`min-h-[120px] ${error ? 'border-red-500' : ''}`}
        />
      ) : field.type === 'select' ? (
        <select
          id={inputId}
          value={value || ''}
          onChange={handleChange}
          required={field.required}
          className={`w-full h-12 px-3 rounded-md border ${
            error ? 'border-red-500' : 'border-input'
          } bg-background`}
        >
          <option value="">Selecciona una opción</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.type === 'boolean' ? (
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            type="checkbox"
            checked={value || false}
            onChange={handleChange}
            className="h-5 w-5 rounded border-gray-300"
          />
          <Label htmlFor={inputId} className="text-sm text-gray-600">
            {field.label}
          </Label>
        </div>
      ) : (
        <Input
          id={inputId}
          type={
            field.type === 'email'
              ? 'email'
              : field.type === 'tel'
              ? 'tel'
              : 'text'
          }
          value={value || ''}
          onChange={handleChange}
          placeholder={field.placeholder}
          required={field.required}
          className={`h-12 ${error ? 'border-red-500' : ''}`}
        />
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}



