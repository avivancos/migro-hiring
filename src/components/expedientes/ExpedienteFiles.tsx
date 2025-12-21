// Componente para gestión de archivos del expediente
// Mobile-first con galería y subida optimizada

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Eye, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/shared/FileUpload';
import { useExpedienteFiles } from '@/hooks/useExpedienteFiles';
import { useExpedienteDetail } from '@/hooks/useExpedienteDetail';
import { cn } from '@/lib/utils';
import type { ExpedienteArchivoRead } from '@/types/expediente';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExpedienteFilesProps {
  expedienteId: string;
  files: ExpedienteArchivoRead[];
  onUpload?: (files: File[]) => Promise<void>;
  onStatusChange?: (fileId: string, status: 'pendiente' | 'aprobado' | 'rechazado', notes?: string) => void;
  editable?: boolean;
}

export function ExpedienteFiles({
  expedienteId,
  files: initialFiles,
  onUpload,
  onStatusChange,
  editable = false,
}: ExpedienteFilesProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ExpedienteArchivoRead | null>(null);
  const { expediente } = useExpedienteDetail(expedienteId);
  const { uploading, uploadFile } = useExpedienteFiles(expedienteId);

  const files = expediente?.archivos || initialFiles;

  const handleUpload = async (uploadedFiles: File[]) => {
    if (onUpload) {
      await onUpload(uploadedFiles);
    } else {
      for (const file of uploadedFiles) {
        await uploadFile(file);
      }
    }
    setShowUpload(false);
    if (expediente) {
      // El hook se actualizará automáticamente
    }
  };

  const handleStatusChange = async (
    fileId: string,
    status: 'pendiente' | 'aprobado' | 'rechazado',
    notes?: string
  ) => {
    if (onStatusChange) {
      await onStatusChange(fileId, status, notes);
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'rechazado':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return <Badge variant="success">Aprobado</Badge>;
      case 'rechazado':
        return <Badge variant="error">Rechazado</Badge>;
      default:
        return <Badge variant="warning">Pendiente</Badge>;
    }
  };

  const filteredFiles = {
    pendiente: files.filter((f) => f.estado === 'pendiente'),
    aprobado: files.filter((f) => f.estado === 'aprobado'),
    rechazado: files.filter((f) => f.estado === 'rechazado'),
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de subida */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Archivos</h3>
          <p className="text-sm text-gray-600">
            {files.length} archivo{files.length !== 1 ? 's' : ''} total
          </p>
        </div>
        {editable && (
          <Button
            onClick={() => setShowUpload(!showUpload)}
            size="sm"
            variant="outline"
          >
            {showUpload ? 'Cancelar' : 'Subir Archivo'}
          </Button>
        )}
      </div>

      {/* Formulario de subida */}
      {showUpload && editable && (
        <Card>
          <CardContent className="pt-6">
            <FileUpload
              onUpload={handleUpload}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple={true}
              maxSize={10 * 1024 * 1024}
              disabled={uploading}
            />
          </CardContent>
        </Card>
      )}

      {/* Filtros por estado */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedFile(null)}
          className={!selectedFile ? 'bg-green-50 border-green-500' : ''}
        >
          Todos ({files.length})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedFile(null)}
          className={selectedFile?.estado === 'pendiente' ? 'bg-yellow-50 border-yellow-500' : ''}
        >
          Pendientes ({filteredFiles.pendiente.length})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedFile(null)}
          className={selectedFile?.estado === 'aprobado' ? 'bg-green-50 border-green-500' : ''}
        >
          Aprobados ({filteredFiles.aprobado.length})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedFile(null)}
          className={selectedFile?.estado === 'rechazado' ? 'bg-red-50 border-red-500' : ''}
        >
          Rechazados ({filteredFiles.rechazado.length})
        </Button>
      </div>

      {/* Lista de archivos */}
      {files.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No hay archivos subidos</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card
              key={file.id}
              className={cn(
                'hover:shadow-md transition-shadow',
                selectedFile?.id === file.id && 'ring-2 ring-green-500'
              )}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header del archivo */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {getStatusIcon(file.estado)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {file.nombre}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {format(new Date(file.uploaded_at), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(file.estado)}
                  </div>

                  {/* Información adicional */}
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Tipo: {file.tipo}</div>
                    <div>Tamaño: {(file.tamaño / 1024).toFixed(1)} KB</div>
                    {file.uploaded_by_id && (
                      <div>Subido por: {file.uploaded_by_id}</div>
                    )}
                  </div>

                  {/* Notas de validación */}
                  {file.validation_notes && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      {file.validation_notes}
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    {editable && file.estado === 'pendiente' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(file.id, 'aprobado')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(file.id, 'rechazado')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

