// Componente de subida de archivos
// Mobile-first con soporte para cámara y galería

import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // en bytes
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onUpload,
  accept = '*/*',
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB por defecto
  disabled = false,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const fileArray = Array.from(selectedFiles);
      const validFiles: File[] = [];
      const errors: string[] = [];

      fileArray.forEach((file) => {
        if (file.size > maxSize) {
          errors.push(`${file.name} excede el tamaño máximo de ${Math.round(maxSize / 1024 / 1024)}MB`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        setError(errors.join(', '));
      } else {
        setError(null);
      }

      if (multiple) {
        setFiles((prev) => [...prev, ...validFiles]);
      } else {
        setFiles(validFiles);
      }
    },
    [maxSize, multiple]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      handleFileSelect(e.dataTransfer.files);
    },
    [disabled, handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      await onUpload(files);
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivos');
    } finally {
      setUploading(false);
    }
  }, [files, onUpload]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Zona de drop */}
      <Card
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          'border-2 border-dashed p-6 text-center transition-colors',
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-green-500 hover:bg-green-50 cursor-pointer'
        )}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm font-medium text-gray-700 mb-1">
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <p className="text-xs text-gray-500">
          Máximo {Math.round(maxSize / 1024 / 1024)}MB por archivo
        </p>
      </Card>

      {/* Lista de archivos seleccionados */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={uploading}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Botón de subida */}
      {files.length > 0 && (
        <Button
          onClick={handleUpload}
          disabled={uploading || disabled}
          className="w-full"
        >
          {uploading ? 'Subiendo...' : `Subir ${files.length} archivo${files.length > 1 ? 's' : ''}`}
        </Button>
      )}
    </div>
  );
}











