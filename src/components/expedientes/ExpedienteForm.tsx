// Formulario completo para crear/editar expediente
// Mobile-first con validación en tiempo real

import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useExpedienteDetail } from '@/hooks/useExpedienteDetail';
import { usePermissions } from '@/hooks/usePermissions';
import { expedienteApi } from '@/services/expedienteApi';
import type { ExpedienteCreate, ExpedienteUpdate, ExpedienteStatus, ExpedienteSource } from '@/types/expediente';

interface ExpedienteFormProps {
  expedienteId?: string | null;
  onSave?: (expediente: any) => void;
  onCancel?: () => void;
  initialData?: Partial<ExpedienteCreate>;
}

export function ExpedienteForm({
  expedienteId,
  onSave,
  onCancel,
  initialData,
}: ExpedienteFormProps) {
  const isEditing = !!expedienteId;
  const { expediente, loading, updateExpediente } = useExpedienteDetail(expedienteId || null);
  const { canEditExpediente } = usePermissions();

  const [formData, setFormData] = useState<ExpedienteCreate>({
    title: '',
    status: 'new',
    source: 'manual',
    summary: '',
    legal_situation: '',
    income_source: '',
    contact_method: '',
    referred_by: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Cargar datos del expediente si está editando
  useEffect(() => {
    if (expediente && isEditing) {
      setFormData({
        title: expediente.title,
        status: expediente.status,
        source: expediente.source,
        summary: expediente.summary || '',
        legal_situation: expediente.legal_situation || '',
        income_source: expediente.income_source || '',
        contact_method: expediente.contact_method || '',
        referred_by: expediente.referred_by || '',
      });
    }
  }, [expediente, isEditing]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length < 10) {
      newErrors.title = 'El título debe tener al menos 10 caracteres';
    }

    if (formData.summary && formData.summary.length > 5000) {
      newErrors.summary = 'El resumen no puede exceder 5000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      if (isEditing && expedienteId) {
        const updateData: ExpedienteUpdate = {
          title: formData.title,
          summary: formData.summary,
          legal_situation: formData.legal_situation,
        };
        const updated = await updateExpediente(updateData);
        onSave?.(updated);
      } else {
        const created = await expedienteApi.create(formData);
        onSave?.(created);
      }
    } catch (error) {
      console.error('Error saving expediente:', error);
      setErrors({ submit: 'Error al guardar el expediente. Por favor, intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ExpedienteCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al cambiar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (loading && isEditing) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Editar Expediente' : 'Nuevo Expediente'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Título (requerido) */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ej: Expediente de residencia para Juan Pérez"
              className={errors.title ? 'border-red-500' : ''}
              required
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500">
              {formData.title.length}/255 caracteres
            </p>
          </div>

          {/* Estado y Origen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as ExpedienteStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isEditing && !canEditExpediente(expediente!)}
              >
                <option value="new">Nuevo</option>
                <option value="in_progress">En Proceso</option>
                <option value="pending_info">Pendiente Info</option>
                <option value="completed">Completado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Origen</Label>
              <select
                id="source"
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value as ExpedienteSource)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="app">App</option>
                <option value="email">Email</option>
                <option value="phone">Teléfono</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>

          {/* Resumen */}
          <div className="space-y-2">
            <Label htmlFor="summary">Resumen</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => handleChange('summary', e.target.value)}
              placeholder="Descripción breve del expediente..."
              rows={4}
              className={errors.summary ? 'border-red-500' : ''}
            />
            {errors.summary && (
              <p className="text-sm text-red-600">{errors.summary}</p>
            )}
            <p className="text-xs text-gray-500">
              {formData.summary?.length || 0}/5000 caracteres
            </p>
          </div>

          {/* Información Adicional (Colapsable) */}
          <details className="space-y-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Más información (opcional)
            </summary>
            <div className="pt-4 space-y-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="legal_situation">Situación Legal</Label>
                <Input
                  id="legal_situation"
                  value={formData.legal_situation || ''}
                  onChange={(e) => handleChange('legal_situation', e.target.value)}
                  placeholder="Ej: Residencia temporal, Nacionalidad..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="income_source">Fuente de Ingresos</Label>
                <Input
                  id="income_source"
                  value={formData.income_source || ''}
                  onChange={(e) => handleChange('income_source', e.target.value)}
                  placeholder="Ej: Trabajo por cuenta ajena, Autónomo..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_method">Método de Contacto</Label>
                <Input
                  id="contact_method"
                  value={formData.contact_method || ''}
                  onChange={(e) => handleChange('contact_method', e.target.value)}
                  placeholder="Ej: Email, Teléfono, Presencial..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referred_by">Referido por</Label>
                <Input
                  id="referred_by"
                  value={formData.referred_by || ''}
                  onChange={(e) => handleChange('referred_by', e.target.value)}
                  placeholder="Nombre de la persona que refirió al cliente"
                />
              </div>
            </div>
          </details>

          {/* Error general */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex flex-col-reverse md:flex-row gap-3 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="w-full md:w-auto"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={saving}
          className="w-full md:w-auto"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Expediente'}
        </Button>
      </div>
    </form>
  );
}

