// Step 4: Payment Form Component with Stripe Checkout

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { hiringService } from '@/services/hiringService';
import { generateContractPDF } from '@/utils/contractPdfGenerator';
import type { HiringDetails } from '@/types/hiring';

interface PaymentFormProps {
  hiringCode: string;
  amount: number;
  currency: string;
  serviceName: string;
  hiringDetails?: HiringDetails;
  onSuccess: () => void;
  onBack: () => void;
}

export function PaymentForm(props: PaymentFormProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    const createCheckoutSession = async () => {
      try {
        console.log('🛒 Creando sesión de Stripe Checkout...');
        
        const response = await hiringService.createCheckoutSession(props.hiringCode);
        
        console.log('✅ Checkout session creada:', response);
        setCheckoutUrl(response.checkout_url);
        
      } catch (err: any) {
        console.error('❌ Error creando checkout session:', err);
        console.error('❌ Error response:', err.response);
        console.error('❌ Error data:', err.response?.data);
        console.error('❌ Error status:', err.response?.status);
        console.error('❌ Error message:', err.message);
        
        // Mostrar el mensaje de error del backend si está disponible
        const backendMessage = err.response?.data?.detail || err.response?.data?.message;
        
        if (backendMessage) {
          console.error('❌ Backend error message:', backendMessage);
          setError(`Error del servidor: ${backendMessage}`);
        } else if (props.hiringCode.startsWith('LIVE') && err.response?.status === 500) {
          setError('El sistema de pagos está temporalmente en mantenimiento. Por favor, contacta con soporte o usa un código de prueba.');
        } else {
          setError(err.message || 'Error al inicializar el pago');
        }
      } finally {
        setLoading(false);
      }
    };

    createCheckoutSession();
  }, [props.hiringCode]);

  const handleStripeCheckout = () => {
    if (checkoutUrl) {
      console.log('🛒 Redirigiendo a Stripe Checkout...');
      window.location.href = checkoutUrl;
    }
  };

  const handleTestPayment = async () => {
    if (!props.hiringCode.startsWith('TEST')) {
      return;
    }

    console.log('🧪 Simulando pago TEST exitoso...');
    
    try {
      // Simular confirmación en el backend
      await hiringService.confirmPayment(props.hiringCode, 'pi_test_simulated');
      
      // Generar y enviar contrato definitivo
      if (props.hiringDetails) {
        const clientSignature = localStorage.getItem(`client_signature_${props.hiringCode}`);
        
        const contractBlob = generateContractPDF(props.hiringDetails, {
          paymentIntentId: 'pi_test_simulated',
          stripeTransactionId: `test_${Date.now()}`,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'Simulación TEST',
          clientSignature: clientSignature || undefined
        }, true); // isDraft = true (borrador con marca de agua)

        const formData = new FormData();
        formData.append('contract', contractBlob, `contrato_definitivo_${props.hiringCode}.pdf`);
        formData.append('hiring_code', props.hiringCode);
        formData.append('client_email', props.hiringDetails.client_email || '');
        formData.append('client_name', props.hiringDetails.client_name || '');
        formData.append('contract_type', 'final');
        formData.append('payment_intent_id', 'pi_test_simulated');
        formData.append('stripe_transaction_id', `test_${Date.now()}`);
        formData.append('payment_date', new Date().toISOString());
        formData.append('payment_method', 'Simulación TEST');

        await hiringService.uploadFinalContract(formData);
        console.log('✅ Contrato definitivo generado y enviado');
      }

      props.onSuccess();
      
    } catch (err: any) {
      console.error('❌ Error en pago TEST:', err);
      setError('Error al procesar el pago de prueba');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
              <span className="ml-3 text-lg">Inicializando pago seguro...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
            
            {/* Botón especial para códigos LIVE con error 500 */}
            {props.hiringCode.startsWith('LIVE') && error.includes('mantenimiento') && (
              <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg">
                <p className="text-sm mb-3">
                  <strong>Alternativa temporal:</strong> Puedes simular el pago para continuar con el proceso de contratación.
                </p>
                <Button 
                  onClick={async () => {
                    try {
                      // Simular pago exitoso para códigos LIVE
                      await hiringService.confirmPayment(props.hiringCode, 'pi_live_simulated');
                      
                      // Generar y enviar contrato definitivo
                      if (props.hiringDetails) {
                        const clientSignature = localStorage.getItem(`client_signature_${props.hiringCode}`);
                        
                        const contractBlob = generateContractPDF(props.hiringDetails, {
                          paymentIntentId: 'pi_live_simulated',
                          stripeTransactionId: `live_sim_${Date.now()}`,
                          paymentDate: new Date().toISOString(),
                          paymentMethod: 'Simulación LIVE (Mantenimiento)',
                          clientSignature: clientSignature || undefined
                        }, true); // isDraft = true (borrador con marca de agua)

                        const formData = new FormData();
                        formData.append('contract', contractBlob, `contrato_definitivo_${props.hiringCode}.pdf`);
                        formData.append('hiring_code', props.hiringCode);
                        formData.append('client_email', props.hiringDetails.client_email || '');
                        formData.append('client_name', props.hiringDetails.client_name || '');
                        formData.append('contract_type', 'final');
                        formData.append('payment_intent_id', 'pi_live_simulated');
                        formData.append('stripe_transaction_id', `live_sim_${Date.now()}`);
                        formData.append('payment_date', new Date().toISOString());
                        formData.append('payment_method', 'Simulación LIVE (Mantenimiento)');

                        await hiringService.uploadFinalContract(formData);
                      }
                      
                      props.onSuccess();
                    } catch (err) {
                      console.error('Error en simulación LIVE:', err);
                      setError('Error al procesar la simulación. Por favor, contacta con soporte.');
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Simular Pago (Modo Mantenimiento)
                </Button>
              </div>
            )}
            
            <div className="mt-4 flex gap-4">
              <Button onClick={props.onBack} variant="outline" className="flex-1">
                Volver
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Para códigos TEST, mostrar botón de simulación
  if (props.hiringCode.startsWith('TEST')) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardTitle className="text-2xl text-emphasis-900 flex items-center gap-2">
              <CreditCard className="text-primary" size={28} />
              Pago de Prueba (TEST)
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-sm font-medium">
                  Modo de Prueba: Este pago será simulado, no se cobrará dinero real.
                </p>
              </div>
            </div>

            <div className="text-center py-8">
              <div className="mb-6 flex justify-center">
                <div className="bg-primary/10 p-6 rounded-full">
                  <CreditCard className="text-primary" size={64} />
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4 text-emphasis-900">
                Simular Pago Exitoso
              </h3>

              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Este es un código de prueba. Puedes simular un pago exitoso sin usar Stripe real.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left mb-6">
                <h4 className="font-semibold mb-3 text-blue-900">
                  Detalles del Pago:
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Servicio:</strong> {props.serviceName}</p>
                  <p><strong>Monto:</strong> €{(props.amount / 100).toFixed(2)}</p>
                  <p><strong>Código:</strong> {props.hiringCode}</p>
                  <p><strong>Estado:</strong> Simulación</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={props.onBack}
                variant="outline"
                className="flex-1"
              >
                Volver
              </Button>
              <Button
                onClick={handleTestPayment}
                className="flex-1 bg-primary hover:bg-primary-700 text-white"
              >
                <CheckCircle2 className="mr-2" size={18} />
                Simular Pago Exitoso
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Para códigos reales, mostrar Stripe Checkout
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardTitle className="text-2xl text-emphasis-900 flex items-center gap-2">
            <CreditCard className="text-primary" size={28} />
            Pago Seguro con Stripe
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="text-center py-8">
            <div className="mb-6 flex justify-center">
              <div className="bg-primary/10 p-6 rounded-full">
                <CreditCard className="text-primary" size={64} />
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-emphasis-900">
              Pago Seguro con Stripe Checkout
            </h3>

            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Serás redirigido a Stripe Checkout para completar el pago de forma segura.
              Stripe procesa millones de pagos diariamente y cumple con los más altos estándares de seguridad.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left mb-6">
              <h4 className="font-semibold mb-3 text-green-900">
                Detalles del Pago:
              </h4>
              <div className="space-y-2 text-sm">
                <p><strong>Servicio:</strong> {props.serviceName}</p>
                <p><strong>Monto:</strong> €{(props.amount / 100).toFixed(2)}</p>
                <p><strong>Código:</strong> {props.hiringCode}</p>
                <p><strong>Método:</strong> Stripe Checkout</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-blue-600" size={20} />
                <p className="text-sm text-blue-800">
                  <strong>Seguro:</strong> Tus datos de pago están protegidos por Stripe
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={props.onBack}
              variant="outline"
              className="flex-1"
            >
              Volver
            </Button>
            <Button
              onClick={handleStripeCheckout}
              className="flex-1 bg-primary hover:bg-primary-700 text-white"
              disabled={!checkoutUrl}
            >
              <CreditCard className="mr-2" size={18} />
              Proceder al Pago
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}