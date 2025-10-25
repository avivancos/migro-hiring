// Borrador PDF - Página profesional para compartir con clientes
import { useEffect, useState } from 'react';
import { generateContractPDF } from '@/utils/contractPdfGenerator';
import type { HiringDetails } from '@/types/hiring';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function BorradorPDF() {
  const [contractBlob, setContractBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Datos de ejemplo para el borrador
  const exampleDetails: HiringDetails = {
    id: 999999, // ID de ejemplo
    hiring_code: 'EJEMPLO',
    user_name: 'Juan Pérez García',
    user_email: 'juan.perez@ejemplo.com',
    user_passport: 'X1234567Z',
    user_nie: 'X1234567Z',
    user_address: 'Calle Mayor 123, 1º A',
    user_city: 'Madrid',
    service_name: 'Autorización de residencia inicial en España',
    service_description: 'Tramitación de expediente para obtención de autorización de residencia inicial en España',
    amount: 40000, // 400€ en centavos
    currency: 'eur',
    status: 'pending',
    kyc_status: null,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    short_url: 'https://contratacion.migro.es/EJEMPLO',
    grade: 'B' as const,
  };

  useEffect(() => {
    const generateExampleContract = async () => {
      try {
        setLoading(true);
        setError(null);

        // Generar PDF de ejemplo sin marca de agua (para compartir con clientes)
        const blob = generateContractPDF(exampleDetails, {
          paymentIntentId: 'pi_ejemplo_borrador',
          stripeTransactionId: 'ejemplo_borrador_12345',
          paymentDate: new Date().toISOString(),
          paymentMethod: 'Ejemplo de borrador',
          clientSignature: 'Juan Pérez García'
        }, false); // isDraft = false (sin marca de agua para compartir)

        setContractBlob(blob);
        
        // Crear URL para el visor de PDF
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error('Error generando PDF de ejemplo:', err);
        setError('Error al generar el PDF de ejemplo');
      } finally {
        setLoading(false);
      }
    };

    generateExampleContract();
  }, []);

  const handleDownload = () => {
    if (contractBlob) {
      const url = window.URL.createObjectURL(contractBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'borrador_contrato_autorizacion_residencia.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Borrador de Contrato</h1>
              <p className="text-sm text-gray-600">Autorización de residencia inicial en España</p>
            </div>
            <Button
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Visor de PDF */}
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          {pdfUrl && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <iframe
                src={pdfUrl}
                className="w-full h-screen min-h-[800px] border-0"
                title="Borrador de Contrato"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
