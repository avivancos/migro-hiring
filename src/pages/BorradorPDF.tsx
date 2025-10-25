// Borrador PDF - Página para mostrar un PDF de ejemplo
import { useEffect, useState } from 'react';
import { generateContractPDF } from '@/utils/contractPdfGenerator';
import type { HiringDetails } from '@/types/hiring';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BorradorPDF() {
  const navigate = useNavigate();
  const [contractBlob, setContractBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Generar PDF de ejemplo con marca de agua (borrador)
        const blob = generateContractPDF(exampleDetails, {
          paymentIntentId: 'pi_ejemplo_borrador',
          stripeTransactionId: 'ejemplo_borrador_12345',
          paymentDate: new Date().toISOString(),
          paymentMethod: 'Ejemplo de borrador',
          clientSignature: 'Juan Pérez García'
        }, true); // isDraft = true (con marca de agua)

        setContractBlob(blob);
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

  const handleView = () => {
    if (contractBlob) {
      const url = window.URL.createObjectURL(contractBlob);
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Generando PDF de ejemplo...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Borrador de Contrato</h1>
                <p className="text-sm text-gray-600">Autorización de residencia inicial en España</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                PDF de Ejemplo - Borrador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información del servicio */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Información del Servicio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Servicio:</span>
                    <p className="text-blue-700">Autorización de residencia inicial en España</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Coste total:</span>
                    <p className="text-blue-700">400€ (dos pagos de 200€)</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Código de ejemplo:</span>
                    <p className="text-blue-700 font-mono">EJEMPLO</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Cliente de ejemplo:</span>
                    <p className="text-blue-700">Juan Pérez García</p>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
                <p className="text-gray-600">
                  Este es un PDF de ejemplo que muestra cómo se verá el contrato real. 
                  Incluye la marca de agua "BORRADOR" y contiene datos ficticios para 
                  fines de demostración. El contrato real se generará con los datos 
                  específicos de cada cliente.
                </p>
              </div>

              {/* Características del PDF */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Características del PDF</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Marca de agua "BORRADOR" en diagonal</li>
                  <li>Datos de ejemplo del cliente</li>
                  <li>Información del servicio de residencia</li>
                  <li>Condiciones de pago (dos pagos de 200€)</li>
                  <li>Cláusulas legales completas</li>
                  <li>Firma del cliente (ejemplo)</li>
                  <li>Datos de Migro Servicios y Remesas SL</li>
                </ul>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                <Button
                  onClick={handleView}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Eye className="w-4 h-4" />
                  Ver PDF en nueva ventana
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF de ejemplo
                </Button>
              </div>

              {/* Nota importante */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-1">Nota importante</h4>
                <p className="text-yellow-700 text-sm">
                  Este es un documento de ejemplo. Los contratos reales se generan 
                  automáticamente con los datos específicos de cada cliente después 
                  de completar el proceso de contratación.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
