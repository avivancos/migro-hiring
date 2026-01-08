// Panel de validación de acciones de pipeline
// Mobile-first con formulario de validación completo

import { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { PipelineActionRead } from '@/types/pipeline';

interface PipelineValidationPanelProps {
  action: PipelineActionRead;
  onValidate: (status: 'validated' | 'rejected', notes?: string) => Promise<void>;
  onCancel?: () => void;
}

export function PipelineValidationPanel({
  action,
  onValidate,
  onCancel,
}: PipelineValidationPanelProps) {
  const { canValidateAction } = usePermissions();
  const [status, setStatus] = useState<'validated' | 'rejected' | null>(null);
  const [notes, setNotes] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canValidate = canValidateAction(action);

  if (!canValidate) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No tienes permisos para validar esta acción</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (!status) {
      setError('Debes seleccionar una acción (Validar o Rechazar)');
      return;
    }

    if (status === 'rejected' && !notes.trim()) {
      setError('Debes proporcionar un motivo para rechazar la acción');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      await onValidate(status, notes.trim() || undefined);
      // Reset form
      setStatus(null);
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al validar la acción');
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validar Acción</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información de la acción */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-xs text-gray-500">Tipo de Acción</Label>
            <p className="font-medium text-gray-900">{action.action_name || action.action_type}</p>
          </div>
          {action.description && (
            <div>
              <Label className="text-xs text-gray-500">Descripción</Label>
              <p className="text-sm text-gray-700">{action.description}</p>
            </div>
          )}
          <div>
            <Label className="text-xs text-gray-500">Creada</Label>
            <p className="text-sm text-gray-700">
              {format(new Date(action.created_at), 'dd MMMM yyyy HH:mm', { locale: es })}
            </p>
          </div>
          {action.action_data && Object.keys(action.action_data).length > 0 && (
            <div>
              <Label className="text-xs text-gray-500">Datos Adicionales</Label>
              <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-auto">
                {JSON.stringify(action.action_data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Selección de acción */}
        <div className="space-y-3">
          <Label>Acción a realizar</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setStatus('validated');
                setError(null);
              }}
              className={cn(
                'p-4 border-2 rounded-lg text-left transition-all',
                status === 'validated'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              )}
            >
              <div className="flex items-center gap-3">
                <CheckCircleIcon className={cn(
                  'h-6 w-6',
                  status === 'validated' ? 'text-green-600' : 'text-gray-400'
                )} />
                <div>
                  <p className="font-semibold text-gray-900">Validar</p>
                  <p className="text-sm text-gray-600">Aprobar esta acción</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatus('rejected');
                setError(null);
              }}
              className={cn(
                'p-4 border-2 rounded-lg text-left transition-all',
                status === 'rejected'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              )}
            >
              <div className="flex items-center gap-3">
                <XCircleIcon className={cn(
                  'h-6 w-6',
                  status === 'rejected' ? 'text-red-600' : 'text-gray-400'
                )} />
                <div>
                  <p className="font-semibold text-gray-900">Rechazar</p>
                  <p className="text-sm text-gray-600">Rechazar esta acción</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Notas (obligatorio para rechazo) */}
        <div className="space-y-2">
          <Label htmlFor="notes">
            Notas {status === 'rejected' && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              status === 'rejected'
                ? 'Explica el motivo del rechazo...'
                : 'Notas adicionales (opcional)...'
            }
            rows={4}
            required={status === 'rejected'}
            className={status === 'rejected' && !notes.trim() ? 'border-red-500' : ''}
          />
          {status === 'rejected' && (
            <p className="text-xs text-gray-500">
              Las notas son obligatorias al rechazar una acción
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col-reverse md:flex-row gap-3">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={validating}
              className="w-full md:w-auto"
            >
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={validating || !status}
            className={cn(
              'w-full md:w-auto',
              status === 'validated' && 'bg-green-600 hover:bg-green-700',
              status === 'rejected' && 'bg-red-600 hover:bg-red-700'
            )}
          >
            {validating
              ? 'Validando...'
              : status === 'validated'
              ? 'Validar Acción'
              : status === 'rejected'
              ? 'Rechazar Acción'
              : 'Selecciona una acción'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

