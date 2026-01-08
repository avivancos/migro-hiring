// CustomFieldModal - Modal para crear/editar campos personalizados

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { CustomField, CustomFieldType, EntityType, FieldSettings } from '@/types/crm';
import { crmService } from '@/services/crmService';

interface CustomFieldModalProps {
  field?: CustomField;
  onClose: () => void;
  onSave: () => void;
}

export function CustomFieldModal({ field, onClose, onSave }: CustomFieldModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: field?.name || '',
    code: field?.code || '',
    type: (field?.type || 'text') as CustomFieldType,
    entity_type: (field?.entity_type || 'contacts') as EntityType,
    sort: field?.sort || 0,
    is_required: field?.is_required || false,
    is_visible: field?.is_visible ?? true,
    settings: field?.settings || {} as FieldSettings,
  });

  const [options, setOptions] = useState<string[]>(
    formData.settings?.options || []
  );

  const [settings, setSettings] = useState<FieldSettings>({
    placeholder: formData.settings?.placeholder || '',
    help_text: formData.settings?.help_text || '',
    min: formData.settings?.min,
    max: formData.settings?.max,
    min_length: formData.settings?.min_length,
    max_length: formData.settings?.max_length,
    ...formData.settings,
  });

  useEffect(() => {
    // Si cambia el tipo, resetear opciones si no es select/multiselect
    if (formData.type !== 'select' && formData.type !== 'multiselect') {
      setOptions([]);
    }
  }, [formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name.trim(),
        type: formData.type,
        entity_type: formData.entity_type,
        sort: formData.sort,
        is_required: formData.is_required,
        is_visible: formData.is_visible,
      };

      // Agregar código si existe
      if (formData.code.trim()) {
        payload.code = formData.code.trim();
      }

      // Configurar settings según el tipo
      const finalSettings: FieldSettings = { ...settings };

      if (formData.type === 'select' || formData.type === 'multiselect') {
        if (options.length === 0) {
          alert('Los campos select deben tener al menos una opción');
          setLoading(false);
          return;
        }
        finalSettings.options = options.filter(opt => opt.trim() !== '');
      } else {
        // Limpiar opciones si no es select
        delete finalSettings.options;
      }

      // Solo incluir settings si tiene contenido
      if (Object.keys(finalSettings).length > 0 && 
          (finalSettings.placeholder || finalSettings.help_text || finalSettings.options?.length || 
           finalSettings.min !== undefined || finalSettings.max !== undefined ||
           finalSettings.min_length !== undefined || finalSettings.max_length !== undefined)) {
        payload.settings = finalSettings;
      }

      if (field) {
        // Actualizar
        await crmService.updateCustomField(field.id, payload);
      } else {
        // Crear
        await crmService.createCustomField(payload);
      }

      onSave();
    } catch (err: any) {
      console.error('Error guardando campo:', err);
      const errorDetail = err?.response?.data?.detail || '';
      alert(errorDetail || 'Error al guardar el campo personalizado');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const fieldTypes: { value: CustomFieldType; label: string }[] = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'date', label: 'Fecha' },
    { value: 'select', label: 'Select' },
    { value: 'multiselect', label: 'Select múltiple' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'phone', label: 'Teléfono' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' },
  ];

  const entityTypes: { value: EntityType; label: string }[] = [
    { value: 'contacts', label: 'Contactos' },
    { value: 'leads', label: 'Leads' },
    { value: 'companies', label: 'Empresas' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">
              {field ? 'Editar Campo Personalizado' : 'Crear Campo Personalizado'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <XMarkIcon width={20} height={20} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <Label htmlFor="name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Teléfono móvil"
                required
              />
            </div>

            {/* Código */}
            <div>
              <Label htmlFor="code">Código (opcional)</Label>
              <Input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="mobile_phone"
                pattern="^[a-z0-9_]+$"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usado para identificarlo en la API. Solo letras minúsculas, números y guiones bajos.
              </p>
            </div>

            {/* Tipo */}
            <div>
              <Label htmlFor="type">
                Tipo de Campo <span className="text-red-500">*</span>
              </Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CustomFieldType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                {fieldTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Entidad */}
            <div>
              <Label htmlFor="entity_type">
                Entidad <span className="text-red-500">*</span>
              </Label>
              <select
                id="entity_type"
                value={formData.entity_type}
                onChange={(e) => setFormData({ ...formData, entity_type: e.target.value as EntityType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                disabled={!!field} // No permitir cambiar entidad en edición
              >
                {entityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {field && (
                <p className="text-xs text-gray-500 mt-1">
                  No se puede cambiar el tipo de entidad de un campo existente
                </p>
              )}
            </div>

            {/* Opciones para select/multiselect */}
            {(formData.type === 'select' || formData.type === 'multiselect') && (
              <div>
                <Label>
                  Opciones <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Opción ${idx + 1}`}
                        required={options.length > 0}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveOption(idx)}
                        disabled={options.length === 1}
                      >
                        <TrashIcon width={16} height={16} />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddOption}
                    className="w-full"
                  >
                    <PlusIcon width={16} height={16} className="mr-2" />
                    Añadir Opción
                  </Button>
                </div>
              </div>
            )}

            {/* Placeholder */}
            {(formData.type === 'text' || formData.type === 'phone' || formData.type === 'email' || formData.type === 'url') && (
              <div>
                <Label htmlFor="placeholder">Placeholder</Label>
                <Input
                  id="placeholder"
                  type="text"
                  value={settings.placeholder || ''}
                  onChange={(e) => setSettings({ ...settings, placeholder: e.target.value })}
                  placeholder="Ej: +34 XXX XXX XXX"
                />
              </div>
            )}

            {/* Texto de ayuda */}
            <div>
              <Label htmlFor="help_text">Texto de Ayuda</Label>
              <Textarea
                id="help_text"
                value={settings.help_text || ''}
                onChange={(e) => setSettings({ ...settings, help_text: e.target.value })}
                placeholder="Texto que aparecerá debajo del campo para guiar al usuario"
                rows={2}
              />
            </div>

            {/* Validaciones para números */}
            {formData.type === 'number' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min">Valor Mínimo</Label>
                  <Input
                    id="min"
                    type="number"
                    value={settings.min ?? ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      min: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="max">Valor Máximo</Label>
                  <Input
                    id="max"
                    type="number"
                    value={settings.max ?? ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      max: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>
            )}

            {/* Validaciones para texto */}
            {(formData.type === 'text' || formData.type === 'email' || formData.type === 'phone' || formData.type === 'url') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_length">Longitud Mínima</Label>
                  <Input
                    id="min_length"
                    type="number"
                    value={settings.min_length ?? ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      min_length: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="max_length">Longitud Máxima</Label>
                  <Input
                    id="max_length"
                    type="number"
                    value={settings.max_length ?? ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      max_length: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    min="1"
                  />
                </div>
              </div>
            )}

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Campo obligatorio</span>
              </label>

              {(!field || field.is_deletable) && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_visible}
                    onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span>Campo visible</span>
                </label>
              )}
            </div>

            {/* Orden */}
            <div>
              <Label htmlFor="sort">Orden</Label>
              <Input
                id="sort"
                type="number"
                value={formData.sort}
                onChange={(e) => setFormData({ ...formData, sort: parseInt(e.target.value) || 0 })}
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Los campos se mostrarán ordenados por este número (menor a mayor)
              </p>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? 'Guardando...' : (field ? 'Actualizar' : 'Crear Campo')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

