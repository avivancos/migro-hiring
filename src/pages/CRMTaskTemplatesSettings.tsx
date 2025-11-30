// CRMTaskTemplatesSettings - Configuración de plantillas de tareas (solo admin)

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import type { TaskTemplate } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { CRMHeader } from '@/components/CRM/CRMHeader';

export function CRMTaskTemplatesSettings() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [editing, setEditing] = useState<TaskTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await crmService.getTaskTemplates({ is_active: true });
      setTemplates(response.items || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await crmService.createTaskTemplate(data);
      await loadTemplates();
      setShowForm(false);
    } catch (err) {
      console.error('Error creating template:', err);
      alert('Error al crear la plantilla');
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    try {
      await crmService.updateTaskTemplate(id, data);
      await loadTemplates();
      setEditing(null);
    } catch (err) {
      console.error('Error updating template:', err);
      alert('Error al actualizar la plantilla');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;
    try {
      await crmService.deleteTaskTemplate(id);
      await loadTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Error al eliminar la plantilla');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">Cargando plantillas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plantillas de Tareas</h1>
              <p className="text-gray-600 mt-1">Gestiona las plantillas de tareas del sistema</p>
            </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus size={20} className="mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {showForm && (
        <TaskTemplateForm
          template={editing}
          onSubmit={editing ? (data) => handleUpdate(editing.id, data) : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Plantillas Activas</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length > 0 ? (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <GripVertical className="text-gray-400 cursor-move" />
                      <h3 className="font-semibold">{template.name}</h3>
                      <span className="text-xs text-gray-500">
                        (Orden: {template.sort_order})
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Tipo: {template.task_type}</span>
                      <span>Duración: {template.default_duration_days} días</span>
                      {template.is_required && (
                        <span className="text-red-600 font-semibold">Requerida</span>
                      )}
                      {template.applies_to_contacts && (
                        <span className="text-blue-600">Contactos</span>
                      )}
                      {template.applies_to_leads && (
                        <span className="text-green-600">Leads</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(template);
                        setShowForm(true);
                      }}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No hay plantillas configuradas
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}

// Componente de formulario para crear/editar plantillas
function TaskTemplateForm({
  template,
  onSubmit,
  onCancel,
}: {
  template: TaskTemplate | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    task_type: template?.task_type || 'call',
    default_text: template?.default_text || '',
    default_duration_days: template?.default_duration_days || 1,
    sort_order: template?.sort_order || 1,
    is_active: template?.is_active ?? true,
    is_required: template?.is_required ?? false,
    applies_to_contacts: template?.applies_to_contacts ?? true,
    applies_to_leads: template?.applies_to_leads ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{template ? 'Editar Plantilla' : 'Nueva Plantilla'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task_type">Tipo de Tarea</Label>
              <select
                id="task_type"
                value={formData.task_type}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="call">Llamada</option>
                <option value="meeting">Reunión</option>
                <option value="email">Email</option>
                <option value="reminder">Recordatorio</option>
              </select>
            </div>

            <div>
              <Label htmlFor="default_duration_days">Duración por Defecto (días)</Label>
              <Input
                id="default_duration_days"
                type="number"
                value={formData.default_duration_days}
                onChange={(e) => setFormData({ ...formData, default_duration_days: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="sort_order">Orden</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="default_text">Texto por Defecto</Label>
            <Textarea
              id="default_text"
              value={formData.default_text}
              onChange={(e) => setFormData({ ...formData, default_text: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span>Activa</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
              />
              <span>Requerida (se crea automáticamente)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.applies_to_contacts}
                onChange={(e) => setFormData({ ...formData, applies_to_contacts: e.target.checked })}
              />
              <span>Aplicable a Contactos</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.applies_to_leads}
                onChange={(e) => setFormData({ ...formData, applies_to_leads: e.target.checked })}
              />
              <span>Aplicable a Leads</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? 'Guardando...' : template ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


