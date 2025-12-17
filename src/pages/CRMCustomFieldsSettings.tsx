// CRMCustomFieldsSettings - Configuración de campos personalizados

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, EyeOff, Lock } from 'lucide-react';
import type { CustomField, EntityType } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { CustomFieldModal } from '@/components/CRM/CustomFieldModal';

export function CRMCustomFieldsSettings() {
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | 'all'>('all');
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadFields();
  }, [selectedEntityType]);

  const loadFields = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedEntityType !== 'all') {
        params.entity_type = selectedEntityType;
      }

      const data = await crmService.getCustomFields(params);
      // Ordenar por sort
      data.sort((a, b) => a.sort - b.sort);
      setFields(data);
    } catch (err: any) {
      console.error('Error cargando campos:', err);
      alert(err?.response?.data?.detail || 'Error al cargar los campos personalizados');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (field: CustomField) => {
    if (!field.is_deletable) {
      alert('Este campo no se puede eliminar');
      return;
    }

    if (!confirm(`¿Eliminar campo "${field.name}"?`)) {
      return;
    }

    try {
      await crmService.deleteCustomField(field.id);
      await loadFields();
    } catch (err: any) {
      console.error('Error eliminando campo:', err);
      const errorDetail = err?.response?.data?.detail || '';
      if (errorDetail.includes('valores asociados') || errorDetail.includes('has values')) {
        alert('No se puede eliminar este campo porque tiene valores asociados. Considera ocultarlo en su lugar.');
      } else {
        alert(errorDetail || 'Error al eliminar el campo');
      }
    }
  };

  const handleToggleVisibility = async (field: CustomField) => {
    try {
      await crmService.updateCustomField(field.id, {
        is_visible: !field.is_visible,
      });
      await loadFields();
    } catch (err: any) {
      console.error('Error actualizando visibilidad:', err);
      alert(err?.response?.data?.detail || 'Error al actualizar la visibilidad');
    }
  };

  const handleSave = async () => {
    setShowCreateModal(false);
    setEditingField(null);
    await loadFields();
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      text: 'Texto',
      number: 'Número',
      date: 'Fecha',
      select: 'Select',
      multiselect: 'Select múltiple',
      checkbox: 'Checkbox',
      phone: 'Teléfono',
      email: 'Email',
      url: 'URL',
    };
    return labels[type] || type;
  };

  const getEntityTypeLabel = (type: EntityType): string => {
    const labels: Record<EntityType, string> = {
      contacts: 'Contactos',
      leads: 'Leads',
      companies: 'Empresas',
    };
    return labels[type];
  };

  // Agrupar campos por tipo de entidad
  const groupedFields = fields.reduce((acc, field) => {
    if (!acc[field.entity_type]) {
      acc[field.entity_type] = [];
    }
    acc[field.entity_type].push(field);
    return acc;
  }, {} as Record<EntityType, CustomField[]>);

  const filteredFields = selectedEntityType === 'all' 
    ? fields 
    : groupedFields[selectedEntityType] || [];

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">Cargando campos personalizados...</div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campos Personalizados</h1>
              <p className="text-gray-600 mt-1">Gestiona los campos personalizados para Contactos, Leads y Empresas</p>
            </div>
            <Button
              onClick={() => {
                setEditingField(null);
                setShowCreateModal(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus size={20} className="mr-2" />
              Crear Campo
            </Button>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Filtrar por entidad:
                </label>
                <select
                  value={selectedEntityType}
                  onChange={(e) => setSelectedEntityType(e.target.value as EntityType | 'all')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Todas las entidades</option>
                  <option value="contacts">Contactos</option>
                  <option value="leads">Leads</option>
                  <option value="companies">Empresas</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de campos */}
          <Card>
            <CardHeader>
              <CardTitle>Campos Personalizados ({filteredFields.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFields.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No hay campos personalizados. Crea uno nuevo para comenzar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Entidad</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Requerido</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Visible</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Orden</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFields.map((field) => (
                        <tr key={field.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {!field.is_deletable && (
                                <span title="Campo del sistema">
                                  <Lock size={16} className="text-gray-400" />
                                </span>
                              )}
                              <span className="font-medium">{field.name}</span>
                              {field.code && (
                                <span className="text-xs text-gray-500">({field.code})</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {getTypeLabel(field.type)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-700">{getEntityTypeLabel(field.entity_type)}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {field.is_required ? (
                              <span className="text-green-600 font-semibold">✓</span>
                            ) : (
                              <span className="text-gray-400">✗</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {field.is_visible ? (
                              <Eye size={18} className="text-green-600 mx-auto" />
                            ) : (
                              <EyeOff size={18} className="text-gray-400 mx-auto" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-gray-700">{field.sort}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingField(field);
                                  setShowCreateModal(true);
                                }}
                              >
                                <Edit size={16} className="mr-1" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleVisibility(field)}
                                title={field.is_visible ? 'Ocultar campo' : 'Mostrar campo'}
                              >
                                {field.is_visible ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </Button>
                              {field.is_deletable && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(field)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Modal de creación/edición */}
      {showCreateModal && (
        <CustomFieldModal
          field={editingField || undefined}
          onClose={() => {
            setShowCreateModal(false);
            setEditingField(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}


















