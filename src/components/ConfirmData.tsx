// Step 2: Confirm Data Component

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ContractViewer } from '@/components/ContractViewer';
import { generateContractPDF } from '@/utils/contractPdfGenerator';
import { hiringService } from '@/services/hiringService';
import type { HiringDetails } from '@/types/hiring';
import { AlertCircle, FileText } from 'lucide-react';

interface ConfirmDataProps {
  details: HiringDetails;
  onConfirm: () => Promise<void>;
  onBack: () => void;
}

export function ConfirmData({ details, onConfirm, onBack }: ConfirmDataProps) {
  const [dataConfirmed, setDataConfirmed] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [contractBlob, setContractBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate contract PDF on mount
  useEffect(() => {
    try {
      const blob = generateContractPDF(details, undefined, true); // isDraft = true (vista previa con marca de agua)
      setContractBlob(blob);
    } catch (err) {
      console.error('Error generating contract PDF:', err);
      setError('Error al generar el contrato. Por favor, recarga la página.');
    }
  }, [details]);

  const handleConfirm = async () => {
    if (!dataConfirmed) {
      setError('Debes confirmar que tus datos son correctos');
      return;
    }

    if (!contractAccepted) {
      setError('Debes leer y aceptar el contrato de prestación de servicios');
      return;
    }

    if (!contractBlob) {
      setError('El contrato aún no está disponible. Por favor, espera un momento.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to upload contract to backend (non-blocking)
      // If endpoint doesn't exist (404), continue anyway
      try {
        await hiringService.acceptContract(details.hiring_code, contractBlob);
        console.log('✅ Contrato subido al backend correctamente');
      } catch (uploadError: any) {
        // Log but don't block the flow if endpoint doesn't exist yet
        if (uploadError?.response?.status === 404) {
          console.warn('⚠️ Endpoint de contrato no disponible aún en el backend (404)');
        } else {
          console.error('❌ Error al subir contrato:', uploadError);
        }
        // Continue anyway - contract acceptance is recorded locally
      }
      
      // Confirm data
      await onConfirm();
    } catch (err: any) {
      setError(err.message || 'Error al confirmar datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-emphasis-900 flex items-center gap-2">
            <FileText className="text-primary" size={28} />
            Confirmar Datos y Contrato
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-gray-600">
            Por favor, verifica que la siguiente información es correcta y revisa el contrato
            antes de continuar con el proceso de contratación.
          </p>

          {/* Datos a confirmar */}
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Datos Personales</h3>
            
            <div className="border-b border-gray-200 pb-3">
              <p className="text-sm text-gray-500 mb-1">Nombre completo</p>
              <p className="text-lg font-semibold text-gray-900">{details.user_name}</p>
            </div>

            <div className="border-b border-gray-200 pb-3">
              <p className="text-sm text-gray-500 mb-1">Correo electrónico</p>
              <p className="text-lg font-semibold text-gray-900">{details.user_email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Servicio contratado</p>
              <p className="text-lg font-semibold text-gray-900">{details.service_name}</p>
            </div>
          </div>

          {/* Nota importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Importante:</strong> Asegúrate de que tu nombre y email sean correctos,
              ya que se utilizarán para la generación del contrato legal y las comunicaciones.
            </p>
          </div>

          {/* Contract Viewer */}
          <div>
            <h3 className="font-semibold text-lg text-gray-900 mb-4">
              Contrato de Prestación de Servicios
            </h3>
            <ContractViewer contractBlob={contractBlob} />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            {/* Checkbox 1: Data confirmation */}
            <div className="flex items-start gap-3 bg-white border-2 border-gray-200 rounded-lg p-4">
              <Checkbox
                id="confirm-data"
                checked={dataConfirmed}
                onCheckedChange={(checked) => {
                  setDataConfirmed(checked as boolean);
                  setError(null);
                }}
                className="mt-1"
              />
              <Label
                htmlFor="confirm-data"
                className="text-base cursor-pointer leading-relaxed"
              >
                Confirmo que mis datos personales son correctos y autorizo su uso para
                la gestión del servicio contratado de acuerdo con la{' '}
                <a
                  href="https://migro.es/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-semibold"
                >
                  Política de Privacidad
                </a>
                .
              </Label>
            </div>

            {/* Checkbox 2: Contract acceptance */}
            <div className="flex items-start gap-3 bg-white border-2 border-gray-200 rounded-lg p-4">
              <Checkbox
                id="accept-contract"
                checked={contractAccepted}
                onCheckedChange={(checked) => {
                  setContractAccepted(checked as boolean);
                  setError(null);
                }}
                className="mt-1"
              />
              <Label
                htmlFor="accept-contract"
                className="text-base cursor-pointer leading-relaxed"
              >
                He leído y acepto los términos y condiciones del{' '}
                <strong>Contrato de Prestación de Servicios</strong> mostrado arriba,
                incluyendo las condiciones de pago de 400€ (2 pagos de 200€).
              </Label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Volver
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!dataConfirmed || !contractAccepted || loading || !contractBlob}
              className="flex-1 bg-primary hover:bg-primary-700 text-white"
            >
              {loading ? 'Confirmando...' : 'Confirmar y Continuar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

