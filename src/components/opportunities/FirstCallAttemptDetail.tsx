// FirstCallAttemptDetail - Drawer para ver/editar detalles de un intento

import React, { useState, useEffect } from 'react';
import { Drawer } from '@/components/common/Drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FirstCallAttemptBadge } from './FirstCallAttemptBadge';
import { AlertTriangle, X, Check, Calendar, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FirstCallAttempt, FirstCallAttemptRequest } from '@/types/opportunity';
import type { FirstCallAttemptStatus } from './FirstCallAttemptBadge';

export interface FirstCallAttemptDetailProps {
  attemptNumber: number;
  attemptData: FirstCallAttempt | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (request: FirstCallAttemptRequest) => Promise<void>;
  isLoading?: boolean;
  opportunityId: string;
}

const statusOptions: Array<{
  value: 'orange' | 'red' | 'green';
  label: string;
  description: string;
  icon: React.ReactNode;
  colorClasses: string;
}> = [
  {
    value: 'orange',
    label: 'Sin contacto / Llamada fallida',
    description: 'No hubo comunicación o la llamada falló',
    icon: <AlertTriangle className="h-5 w-5" />,
    colorClasses: 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100',
  },
  {
    value: 'red',
    label: 'Cliente descartó interés',
    description: 'El cliente indicó que no tiene interés en contratar',
    icon: <X className="h-5 w-5" />,
    colorClasses: 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100',
  },
  {
    value: 'green',
    label: 'Llamada exitosa',
    description: 'Primera llamada exitosa, información completa obtenida',
    icon: <Check className="h-5 w-5" />,
    colorClasses: 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100',
  },
];

export function FirstCallAttemptDetail({
  attemptNumber,
  attemptData,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: FirstCallAttemptDetailProps) {
  const [selectedStatus, setSelectedStatus] = useState<'orange' | 'red' | 'green'>(
    (attemptData?.status === 'green' || attemptData?.status === 'red' || attemptData?.status === 'orange'
      ? attemptData.status
      : 'orange')
  );
  const [notes, setNotes] = useState(attemptData?.notes || '');
  const [error, setError] = useState<string | null>(null);

  // Resetear estado cuando cambia el attemptNumber o attemptData
  useEffect(() => {
    if (attemptData) {
      if (attemptData.status === 'green' || attemptData.status === 'red' || attemptData.status === 'orange') {
        setSelectedStatus(attemptData.status);
      }
      setNotes(attemptData.notes || '');
    } else {
      setSelectedStatus('orange');
      setNotes('');
    }
    setError(null);
  }, [attemptNumber, attemptData]);

  const handleSave = async () => {
    if (!selectedStatus) {
      setError('Por favor selecciona un estado');
      return;
    }

    // Confirmación especial para RED
    if (selectedStatus === 'red') {
      const confirmed = window.confirm(
        '⚠️ ¿Estás seguro?\n\nMarcar como "cliente descartó interés" cambia el estado de la oportunidad.'
      );
      if (!confirmed) return;
    }

    setError(null);
    try {
      const request: FirstCallAttemptRequest = {
        attempt_number: attemptNumber,
        status: selectedStatus,
        notes: notes.trim() || undefined,
      };

      await onSave(request);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el intento');
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No registrada';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Ahora';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;

      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  // Determinar el status actual - si existe attemptData pero no tiene status válido, usar 'pending'
  const currentStatus: FirstCallAttemptStatus = (attemptData?.status && 
    (attemptData.status === 'orange' || attemptData.status === 'red' || attemptData.status === 'green'))
    ? attemptData.status 
    : 'pending';

  return (
    <Drawer open={isOpen} onClose={onClose} title="Detalle de Intento" size="md">
      <div className="space-y-6">
        {/* Badge del intento actual */}
        <div className="flex flex-col items-center justify-center py-4 border-b">
          <FirstCallAttemptBadge
            attemptNumber={attemptNumber}
            status={currentStatus}
            size="lg"
          />
          <p className="mt-3 text-sm font-medium text-gray-700">
            Intento #{attemptNumber} de Primera Llamada
          </p>
        </div>

        {/* Información existente si hay datos */}
        {attemptData && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
            {attemptData.status && attemptData.status !== 'pending' && (
              <div>
                <Label className="text-xs text-gray-500 uppercase tracking-wide">Estado Actual</Label>
                <p className="mt-1 text-sm font-medium text-gray-900 capitalize">
                  {attemptData.status === 'orange' && 'Sin contacto / Fallido'}
                  {attemptData.status === 'red' && 'Cliente descartó interés'}
                  {attemptData.status === 'green' && 'Llamada exitosa'}
                </p>
              </div>
            )}

            {attemptData.attempted_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Fecha</Label>
                  <p className="mt-0.5 text-sm text-gray-700">{formatDate(attemptData.attempted_at)}</p>
                </div>
              </div>
            )}

            {attemptData.notes && (
              <div>
                <Label className="text-xs text-gray-500 uppercase tracking-wide">Notas</Label>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{attemptData.notes}</p>
              </div>
            )}

            {attemptData.call_id && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">ID de Llamada</Label>
                  <p className="mt-0.5 text-sm text-gray-600 font-mono">{attemptData.call_id}</p>
                </div>
              </div>
            )}

            {(!attemptData.status || attemptData.status === 'pending') && 
             !attemptData.attempted_at && 
             !attemptData.notes && 
             !attemptData.call_id && (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500 italic">
                  Este intento aún no tiene información registrada. Completa el formulario abajo para registrarlo.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Formulario para actualizar/registrar */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-900 mb-3 block">
              {attemptData ? 'Actualizar Estado' : 'Registrar Intento'}
            </Label>

            {/* Opciones de estado */}
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedStatus(option.value)}
                  disabled={isLoading}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-2 transition-all',
                    'flex items-start gap-3',
                    selectedStatus === option.value
                      ? `${option.colorClasses} border-current`
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300',
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className={cn(
                    'mt-0.5',
                    selectedStatus === option.value ? option.colorClasses.split(' ')[2] : 'text-gray-400'
                  )}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs mt-0.5 opacity-75">{option.description}</p>
                  </div>
                  {selectedStatus === option.value && (
                    <Check className="h-5 w-5 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Campo de notas */}
          <div>
            <Label htmlFor="notes" className="text-sm font-semibold text-gray-900 mb-2 block">
              Notas (opcional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agrega notas sobre el intento de llamada..."
              rows={4}
              disabled={isLoading}
              className="resize-none"
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Mensaje de éxito cuando se marca como green */}
          {selectedStatus === 'green' && attemptData?.status !== 'green' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                ✅ Al marcar como exitoso, se completará la primera llamada de esta oportunidad.
              </p>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !selectedStatus}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Guardando...' : attemptData ? 'Actualizar' : 'Registrar'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
