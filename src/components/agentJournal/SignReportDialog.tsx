// SignReportDialog - Diálogo para firmar y enviar reporte diario

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useSignAndSendReport } from '@/hooks/useAgentJournal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExclamationCircleIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

interface SignReportDialogProps {
  targetDate?: Date;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SignReportDialog({
  targetDate,
  isOpen,
  onClose,
  onSuccess,
}: SignReportDialogProps) {
  const { user } = useAuth();
  const signAndSend = useSignAndSendReport();
  const [signature, setSignature] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Normalizar nombres para comparación
  const normalizeText = (text: string): string => {
    return text
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  };

  const userName = user?.full_name || user?.email || '';

  const handleSignatureChange = (value: string) => {
    setSignature(value);
    setError(null);

    const normalizedInput = normalizeText(value);
    const normalizedUserName = normalizeText(userName);

    if (normalizedInput.length > 0 && normalizedInput === normalizedUserName) {
      setIsValid(true);
      setError(null);
    } else if (normalizedInput.length > 0) {
      setIsValid(false);
      setError('El nombre ingresado no coincide con tu nombre registrado');
    } else {
      setIsValid(false);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setError('Debe ingresar su nombre completo exactamente como aparece en su perfil');
      return;
    }

    try {
      await signAndSend.mutateAsync({
        targetDate,
        agentSignature: signature.trim(),
      });

      // Limpiar formulario
      setSignature('');
      setIsValid(false);
      setError(null);

      // Cerrar y ejecutar callback
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error firmando reporte:', err);
      setError(err?.response?.data?.detail || 'Error al firmar y enviar el reporte');
    }
  };

  const handleClose = () => {
    if (!signAndSend.isPending) {
      setSignature('');
      setIsValid(false);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <PencilIcon className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Firmar Reporte Diario</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={signAndSend.isPending}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              📋 Declaración de Aceptación
            </h3>
            <p className="text-sm text-blue-800">
              Al firmar este reporte, declara que la información proporcionada es veraz y refleja
              su trabajo realizado durante el día.
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="signature" className="text-base font-semibold text-gray-900">
              Para firmar, escriba su nombre completo:
            </Label>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">
                <strong>Nombre registrado:</strong>
              </p>
              <p className="text-sm font-semibold text-gray-900">{userName}</p>
            </div>

            <div className="relative">
              <Input
                id="signature"
                type="text"
                value={signature}
                onChange={(e) => handleSignatureChange(e.target.value)}
                placeholder="Escriba su nombre completo aquí"
                disabled={signAndSend.isPending}
                className={cn(
                  'w-full',
                  isValid && 'border-green-500 focus:ring-green-500',
                  error && 'border-red-500 focus:ring-red-500'
                )}
                autoFocus
              />
              {isValid && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isValid && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
                <span>Nombre válido. Puede continuar con la firma.</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={signAndSend.isPending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || signAndSend.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {signAndSend.isPending ? 'Enviando...' : 'Firmar y Enviar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

