// Step 5: Contract Success Component

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Mail, Home, Loader2 } from 'lucide-react';
import { hiringService } from '@/services/hiringService';

interface ContractSuccessProps {
  hiringCode: string;
  serviceName: string;
  userEmail: string;
}

export function ContractSuccess({ hiringCode, serviceName, userEmail }: ContractSuccessProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isBrowser = typeof window !== 'undefined';
  const manualPaymentNote = isBrowser ? localStorage.getItem(`manual_payment_note_${hiringCode}`) : null;
  const manualPaymentDate = isBrowser ? localStorage.getItem(`manual_payment_date_${hiringCode}`) : null;

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      // Intentar descargar desde el backend
      const blob = await hiringService.downloadContract(hiringCode);
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato-${serviceName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.warn('⚠️ No se pudo descargar desde el backend, generando localmente:', err);
      console.log('🔧 Iniciando generación local de contrato...');
      
      // Si falla la descarga del backend, generar localmente
      try {
        await generateLocalContract();
        console.log('✅ Contrato generado localmente exitosamente');
      } catch (localErr) {
        console.error('❌ Error generando contrato local:', localErr);
        setError('No se pudo generar el contrato. Por favor, contacta con soporte.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const generateLocalContract = async () => {
    console.log('🔧 Iniciando generateLocalContract...');
    
    // Importar dinámicamente para evitar problemas de bundle
    const { generateContractPDF } = await import('@/utils/contractPdfGenerator');
    console.log('✅ generateContractPDF importado correctamente');
    
    // Obtener datos del localStorage
    const hiringDetails = localStorage.getItem(`hiring_details_${hiringCode}`);
    const clientSignature = localStorage.getItem(`client_signature_${hiringCode}`);
    
    console.log('📋 Datos del localStorage:', {
      hiringDetails: hiringDetails ? 'Encontrado' : 'No encontrado',
      clientSignature: clientSignature ? 'Encontrado' : 'No encontrado'
    });
    
    if (!hiringDetails) {
      throw new Error('No se encontraron los detalles de contratación');
    }
    
    const details = JSON.parse(hiringDetails);
    console.log('📄 Detalles parseados:', details);
    
    const manualPaymentNote = localStorage.getItem(`manual_payment_note_${hiringCode}`);
    const manualPaymentDate = localStorage.getItem(`manual_payment_date_${hiringCode}`);
    const manualPaymentMethod = localStorage.getItem(`manual_payment_method_${hiringCode}`);

    // Generar PDF localmente
    console.log('🔄 Generando PDF localmente...');
    const contractBlob = generateContractPDF(details, {
      paymentIntentId: manualPaymentNote ? 'manual_payment' : 'pi_local_generated',
      stripeTransactionId: manualPaymentNote ? `manual_${Date.now()}` : `local_${Date.now()}`,
      paymentDate: manualPaymentDate || new Date().toISOString(),
      paymentMethod: manualPaymentMethod || 'Generado localmente',
      paymentNote: manualPaymentNote || undefined,
      clientSignature: clientSignature || undefined
    }, false); // isDraft = false (contrato final sin marca de agua)
    console.log('✅ PDF generado, tamaño:', contractBlob.size, 'bytes');
    
    // Descargar el PDF generado
    console.log('⬇️ Iniciando descarga...');
    const url = window.URL.createObjectURL(contractBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrato-${serviceName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    console.log('✅ Descarga completada');
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="shadow-lg border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-primary/10">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-green-100 p-6 rounded-full">
                <CheckCircle2 className="text-green-600" size={64} />
              </div>
            </div>
            <CardTitle className="text-3xl text-emphasis-900">
              ¡Contratación Completada!
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-8 space-y-8">
          {/* Mensaje de éxito */}
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-2">
              Has completado exitosamente el proceso de contratación para:
            </p>
            <p className="text-2xl font-bold text-primary mb-6">
              {serviceName}
            </p>
          </div>

          {/* Pasos completados */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4 text-emphasis-900">
              Pasos Completados
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
                <span className="text-gray-700">Datos personales confirmados</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
                <span className="text-gray-700">Contrato firmado digitalmente</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
                <span className="text-gray-700">Pago procesado correctamente</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
                <span className="text-gray-700">Contrato generado y firmado digitalmente</span>
              </div>
            </div>
          </div>

          {/* Información del contrato */}
          <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <Mail className="text-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-emphasis-900 mb-1">
                  Contrato Enviado por Email
                </h3>
                <p className="text-sm text-gray-600">
                  Hemos enviado una copia del contrato firmado a{' '}
                  <span className="font-semibold text-gray-900">{userEmail}</span>
                </p>
              </div>
            </div>
          </div>

          {manualPaymentNote && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900 space-y-1">
              <p>
                <strong>Pago registrado manualmente:</strong> {manualPaymentNote}
              </p>
              {manualPaymentDate && (
                <p className="text-xs text-yellow-800">
                  Fecha registrada: {new Date(manualPaymentDate).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
          )}

          {/* Botón de descarga */}
          <div className="text-center">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-primary hover:bg-primary-700 text-white px-8"
              size="lg"
            >
              {downloading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={20} />
                  Descargando...
                </>
              ) : (
                <>
                  <Download className="mr-2" size={20} />
                  Descargar Contrato PDF
                </>
              )}
            </Button>
            
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-2 text-red-600">
                  El contrato ya fue enviado por email. Si necesitas una copia adicional, contacta con soporte.
                </p>
              </div>
            )}
          </div>

          {/* Próximos pasos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">
              📋 Próximos Pasos
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Revisa el contrato y guárdalo en un lugar seguro</li>
              <li>• Nuestro equipo se pondrá en contacto contigo en las próximas 24-48 horas</li>
              <li>• Recibirás actualizaciones sobre el servicio por email</li>
              <li>• Si tienes alguna duda, puedes contactarnos en soporte@migro.es</li>
            </ul>
          </div>

          {/* Botón volver al inicio */}
          <div className="text-center pt-4">
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              size="lg"
            >
              <Home className="mr-2" size={18} />
              Volver al Inicio
            </Button>
          </div>

          {/* Mensaje de agradecimiento */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Gracias por confiar en Migro para tus servicios legales 🙏
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

