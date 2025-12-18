// Admin Call Types - Gestión de tipos de llamadas
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminService } from '@/services/adminService';
import {
  Phone,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface CallType {
  id: string;
  name: string;
  code: string; // 'primera_llamada', 'seguimiento', 'venta', etc.
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function AdminCallTypes() {
  const [loading, setLoading] = useState(true);
  const [callTypes, setCallTypes] = useState<CallType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    loadCallTypes();
  }, []);

  const loadCallTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getCallTypes();
      setCallTypes(data);
    } catch (err: any) {
      console.error('Error loading call types:', err);
      setError(err?.response?.data?.detail || 'Error al cargar tipos de llamadas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true,
      sort_order: callTypes.length > 0 ? Math.max(...callTypes.map(ct => ct.sort_order)) + 1 : 0,
    });
    setError(null);
    setSuccess(null);
  };

  const handleEdit = (callType: CallType) => {
    setEditingId(callType.id);
    setIsCreating(false);
    setFormData({
      name: callType.name,
      code: callType.code,
      description: callType.description || '',
      is_active: callType.is_active,
      sort_order: callType.sort_order,
    });
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true,
      sort_order: 0,
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    // Validación
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!formData.code.trim()) {
      setError('El código es requerido');
      return;
    }

    // Validar formato del código (solo letras, números y guiones bajos)
    if (!/^[a-z0-9_]+$/.test(formData.code)) {
      setError('El código solo puede contener letras minúsculas, números y guiones bajos');
      return;
    }

    try {
      if (isCreating) {
        await adminService.createCallType(formData);
        setSuccess('Tipo de llamada creado exitosamente');
      } else if (editingId) {
        await adminService.updateCallType(editingId, formData);
        setSuccess('Tipo de llamada actualizado exitosamente');
      }
      
      await loadCallTypes();
      handleCancel();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving call type:', err);
      setError(err?.response?.data?.detail || 'Error al guardar tipo de llamada');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este tipo de llamada?')) {
      return;
    }

    setError(null);
    try {
      await adminService.deleteCallType(id);
      setSuccess('Tipo de llamada eliminado exitosamente');
      await loadCallTypes();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting call type:', err);
      setError(err?.response?.data?.detail || 'Error al eliminar tipo de llamada');
    }
  };

  const handleToggleActive = async (callType: CallType) => {
    try {
      await adminService.updateCallType(callType.id, {
        is_active: !callType.is_active,
      });
      await loadCallTypes();
    } catch (err: any) {
      console.error('Error toggling active status:', err);
      setError(err?.response?.data?.detail || 'Error al actualizar estado');
    }
  };

  // Ordenar por sort_order
  const sortedCallTypes = [...callTypes].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="text-green-600" size={32} />
            Tipos de Llamadas
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona los tipos de llamadas disponibles en el sistema
          </p>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-800">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-800">
            <AlertCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Botón Crear */}
        <div className="flex justify-end">
          <Button
            onClick={handleCreate}
            className="bg-green-600 hover:bg-green-700"
            disabled={isCreating || editingId !== null}
          >
            <Plus size={18} className="mr-2" />
            Nuevo Tipo de Llamada
          </Button>
        </div>

        {/* Formulario de Crear/Editar */}
        {(isCreating || editingId) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isCreating ? 'Crear Tipo de Llamada' : 'Editar Tipo de Llamada'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Primera Llamada"
                    />
                  </div>

                  <div>
                    <Label htmlFor="code">
                      Código <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toLowerCase() }))}
                      placeholder="Ej: primera_llamada"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Solo letras minúsculas, números y guiones bajos
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción opcional del tipo de llamada"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sort_order">Orden</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Orden de visualización (menor = primero)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                      Activo
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                  >
                    <X size={18} className="mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save size={18} className="mr-2" />
                    Guardar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Tipos de Llamadas */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Llamadas Configurados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Cargando tipos de llamadas...</p>
              </div>
            ) : sortedCallTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Phone size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No hay tipos de llamadas configurados</p>
                <p className="text-sm mt-2">Crea el primer tipo de llamada usando el botón "Nuevo Tipo de Llamada"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedCallTypes.map((callType) => (
                  <div
                    key={callType.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{callType.name}</h3>
                        <Badge variant={callType.is_active ? 'default' : 'secondary'}>
                          {callType.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <span className="text-sm text-gray-500">({callType.code})</span>
                      </div>
                      {callType.description && (
                        <p className="text-sm text-gray-600">{callType.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Orden: {callType.sort_order}</span>
                        <span>
                          Creado: {new Date(callType.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(callType)}
                        title={callType.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {callType.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(callType)}
                        disabled={editingId === callType.id || isCreating}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(callType.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




