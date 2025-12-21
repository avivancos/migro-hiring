// Vista detallada de un expediente
// Mobile-first con tabs y gestión completa

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ExpedienteStatusBadge } from '@/components/expedientes/ExpedienteStatusBadge';
import { ExpedienteFiles } from '@/components/expedientes/ExpedienteFiles';
import { Timeline } from '@/components/shared/Timeline';
import { useExpedienteDetail } from '@/hooks/useExpedienteDetail';
import { usePermissions } from '@/hooks/usePermissions';
import { expedienteApi } from '@/services/expedienteApi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function CRMExpedienteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resumen');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    summary: '',
    legal_situation: '',
  });

  const { expediente, loading, updating, updateExpediente, refresh } =
    useExpedienteDetail(id || null);
  const { canEditExpediente } = usePermissions();

  const canEdit = expediente ? canEditExpediente(expediente) : false;

  // Cargar historial
  const [historial, setHistorial] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const loadHistorial = async () => {
    if (!id) return;
    setLoadingHistorial(true);
    try {
      const response = await expedienteApi.getHistorial(id);
      setHistorial(
        response.items.map((item) => ({
          id: item.id,
          title: item.accion,
          description: item.comentario || `${item.campo_modificado}: ${JSON.stringify(item.valor_anterior)} → ${JSON.stringify(item.valor_nuevo)}`,
          timestamp: item.created_at,
          user: item.usuario_nombre,
          variant: item.accion.includes('creado') ? 'success' : 'info',
        }))
      );
    } catch (err) {
      console.error('Error loading historial:', err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Cargar checklist
  const [checklist, setChecklist] = useState<any>(null);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  const loadChecklist = async () => {
    if (!id) return;
    setLoadingChecklist(true);
    try {
      const data = await expedienteApi.getChecklist(id);
      setChecklist(data);
    } catch (err) {
      console.error('Error loading checklist:', err);
    } finally {
      setLoadingChecklist(false);
    }
  };

  // Cargar completitud
  const [completitud, setCompletitud] = useState<any>(null);
  const [, setLoadingCompletitud] = useState(false);

  const loadCompletitud = async () => {
    if (!id) return;
    setLoadingCompletitud(true);
    try {
      const data = await expedienteApi.getCompletitud(id);
      setCompletitud(data);
    } catch (err) {
      console.error('Error loading completitud:', err);
    } finally {
      setLoadingCompletitud(false);
    }
  };

  // Cargar datos cuando cambia el tab
  useEffect(() => {
    if (activeTab === 'historial' && historial.length === 0) {
      loadHistorial();
    } else if (activeTab === 'checklist' && !checklist) {
      loadChecklist();
      loadCompletitud();
    }
  }, [activeTab]);

  const handleEdit = () => {
    if (expediente) {
      setEditForm({
        title: expediente.title,
        summary: expediente.summary || '',
        legal_situation: expediente.legal_situation || '',
      });
      setEditing(true);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateExpediente(editForm);
      setEditing(false);
      refresh();
    } catch (err) {
      console.error('Error updating expediente:', err);
    }
  };

  const handleCancel = () => {
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!expediente) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-600">Expediente no encontrado</p>
              <Button onClick={() => navigate('/crm/expedientes')} className="mt-4">
                Volver a la lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/crm/expedientes')}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver
        </Button>
      </div>

      {/* Información principal */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {editing ? (
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="text-2xl font-bold w-full border-b-2 border-green-500 focus:outline-none"
                />
              ) : (
                <CardTitle className="text-2xl">{expediente.title}</CardTitle>
              )}
              <div className="flex items-center gap-3 mt-2">
                <ExpedienteStatusBadge status={expediente.status} />
                <span className="text-sm text-gray-500">
                  Actualizado: {format(new Date(expediente.updated_at), 'dd MMM yyyy HH:mm', { locale: es })}
                </span>
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button size="sm" onClick={handleSave} disabled={updating}>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <textarea
              value={editForm.summary}
              onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
              className="w-full min-h-[100px] border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Resumen del expediente..."
            />
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">
              {expediente.summary || 'Sin resumen'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-5">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="archivos">Archivos</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="estadisticas" className="hidden md:flex">
            Estadísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <div className="mt-1">
                  <ExpedienteStatusBadge status={expediente.status} />
                </div>
              </div>
              {expediente.numero_expediente_oficial && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Número de Expediente Oficial
                  </label>
                  <p className="mt-1 text-gray-900">{expediente.numero_expediente_oficial}</p>
                </div>
              )}
              {expediente.fecha_presentacion && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Fecha de Presentación</label>
                  <p className="mt-1 text-gray-900">
                    {format(new Date(expediente.fecha_presentacion), 'dd MMMM yyyy', { locale: es })}
                  </p>
                </div>
              )}
              {expediente.fecha_resolucion && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Fecha de Resolución</label>
                  <p className="mt-1 text-gray-900">
                    {format(new Date(expediente.fecha_resolucion), 'dd MMMM yyyy', { locale: es })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archivos">
          <ExpedienteFiles
            expedienteId={expediente.id}
            files={expediente.archivos}
            editable={canEdit}
          />
        </TabsContent>

        <TabsContent value="checklist">
          {loadingChecklist ? (
            <LoadingSpinner />
          ) : checklist ? (
            <Card>
              <CardHeader>
                <CardTitle>Checklist de Documentos</CardTitle>
                {completitud && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Progreso: {completitud.porcentaje}%</span>
                      <span>
                        {completitud.requisitos.obligatorios.filter((r: any) => r.presentado).length}/
                        {completitud.requisitos.obligatorios.length} obligatorios
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${completitud.porcentaje}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {checklist.documentos_requeridos.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={doc.presentado}
                          disabled={!canEdit}
                          className="h-5 w-5"
                        />
                        <div>
                          <p className="font-medium">{doc.nombre}</p>
                          {doc.descripcion && (
                            <p className="text-sm text-gray-500">{doc.descripcion}</p>
                          )}
                        </div>
                      </div>
                      {doc.obligatorio && (
                        <span className="text-xs text-red-600 font-medium">Obligatorio</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600 text-center py-8">
                  No hay checklist disponible. Asigna un formulario oficial para generar el checklist.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historial">
          {loadingHistorial ? (
            <LoadingSpinner />
          ) : (
            <Timeline items={historial} />
          )}
        </TabsContent>

        <TabsContent value="estadisticas">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600 text-center py-8">
                Estadísticas del expediente (próximamente)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

