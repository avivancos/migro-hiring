// Contract Annexes - Componente para gestionar anexos al contrato
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/common/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DocumentTextIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { ContractAnnex, ContractAnnexCreateRequest, ContractAnnexUpdateRequest } from '@/types/contracts';
import { contractsService } from '@/services/contractsService';
import { formatDate } from '@/utils/formatters';

interface ContractAnnexesProps {
  hiringCode: string;
}

export function ContractAnnexes({ hiringCode }: ContractAnnexesProps) {
  const [annexes, setAnnexes] = useState<ContractAnnex[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAnnex, setSelectedAnnex] = useState<ContractAnnex | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    loadAnnexes();
  }, [hiringCode]);

  const loadAnnexes = async () => {
    setLoading(true);
    try {
      const data = await contractsService.getAnnexes(hiringCode);
      setAnnexes(data);
    } catch (error) {
      console.error('Error cargando anexos:', error);
      setAnnexes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({ title: '', content: '' });
    setSelectedAnnex(null);
    setShowCreateModal(true);
  };

  const handleEdit = (annex: ContractAnnex) => {
    setSelectedAnnex(annex);
    setFormData({
      title: annex.title,
      content: annex.content,
    });
    setShowEditModal(true);
  };

  const handleDelete = (annex: ContractAnnex) => {
    setSelectedAnnex(annex);
    setShowDeleteModal(true);
  };

  const handleSaveCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    setSaving(true);
    try {
      const request: ContractAnnexCreateRequest = {
        hiring_code: hiringCode,
        title: formData.title.trim(),
        content: formData.content.trim(),
      };
      await contractsService.createAnnex(request);
      setShowCreateModal(false);
      setFormData({ title: '', content: '' });
      await loadAnnexes();
    } catch (error: any) {
      console.error('Error creando anexo:', error);
      alert(error.message || 'Error al crear el anexo');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedAnnex || !formData.title.trim() || !formData.content.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    setSaving(true);
    try {
      const request: ContractAnnexUpdateRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
      };
      await contractsService.updateAnnex(selectedAnnex.id!, request);
      setShowEditModal(false);
      setSelectedAnnex(null);
      setFormData({ title: '', content: '' });
      await loadAnnexes();
    } catch (error: any) {
      console.error('Error actualizando anexo:', error);
      alert(error.message || 'Error al actualizar el anexo');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedAnnex || !selectedAnnex.id) return;

    setSaving(true);
    try {
      await contractsService.deleteAnnex(selectedAnnex.id);
      setShowDeleteModal(false);
      setSelectedAnnex(null);
      await loadAnnexes();
    } catch (error: any) {
      console.error('Error eliminando anexo:', error);
      alert(error.message || 'Error al eliminar el anexo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DocumentTextIcon width={20} height={20} />
            Anexos al Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DocumentTextIcon width={20} height={20} />
              Anexos al Contrato
            </CardTitle>
            <Button
              onClick={handleCreate}
              size="sm"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <PlusIcon width={16} height={16} />
              Nuevo Anexo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {annexes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No hay anexos registrados</p>
              <p className="text-sm mt-1">Crea un anexo para agregar información adicional al contrato</p>
            </div>
          ) : (
            <div className="space-y-4">
              {annexes.map((annex) => (
                <div
                  key={annex.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{annex.title}</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{annex.content}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => handleEdit(annex)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <PencilIcon width={14} height={14} />
                      </Button>
                      <Button
                        onClick={() => handleDelete(annex)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <TrashIcon width={14} height={14} />
                      </Button>
                    </div>
                  </div>
                  {annex.created_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      Creado: {formatDate(annex.created_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear Anexo */}
      <Modal
        visible={showCreateModal}
        onClose={() => !saving && setShowCreateModal(false)}
        title="Crear Nuevo Anexo"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="annex-title">Título del Anexo *</Label>
            <Input
              id="annex-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Anexo I - Condiciones Especiales"
              disabled={saving}
            />
          </div>
          <div>
            <Label htmlFor="annex-content">Contenido del Anexo *</Label>
            <Textarea
              id="annex-content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Escribe el contenido del anexo aquí..."
              rows={10}
              disabled={saving}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Puedes escribir el contenido completo del anexo. Se guardará como texto plano.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => setShowCreateModal(false)}
              variant="outline"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCreate}
              disabled={saving || !formData.title.trim() || !formData.content.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? 'Guardando...' : 'Guardar Anexo'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Editar Anexo */}
      <Modal
        visible={showEditModal}
        onClose={() => !saving && setShowEditModal(false)}
        title="Editar Anexo"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-annex-title">Título del Anexo *</Label>
            <Input
              id="edit-annex-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Anexo I - Condiciones Especiales"
              disabled={saving}
            />
          </div>
          <div>
            <Label htmlFor="edit-annex-content">Contenido del Anexo *</Label>
            <Textarea
              id="edit-annex-content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Escribe el contenido del anexo aquí..."
              rows={10}
              disabled={saving}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => setShowEditModal(false)}
              variant="outline"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !formData.title.trim() || !formData.content.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        visible={showDeleteModal}
        onClose={() => !saving && setShowDeleteModal(false)}
        title="Confirmar Eliminación"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar el anexo <strong>"{selectedAnnex?.title}"</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outline"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
