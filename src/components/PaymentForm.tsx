// Step 4: Payment Form Component with Stripe Elements

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { STRIPE_PUBLISHABLE_KEY, APP_URL } from '@/config/constants';
import { formatCurrency } from '@/utils/formatters';
import { hiringService } from '@/services/hiringService';
import { generateContractPDF } from '@/utils/contractPdfGenerator';
import type { HiringDetails } from '@/types/hiring';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface PaymentFormProps {
  hiringCode: string;
  amount: number;
  currency: string;
  serviceName: string;
  hiringDetails?: HiringDetails;
  onSuccess: () => void;
  onBack: () => void;
}

// Componente interno que usa los hooks de Stripe
function CheckoutForm({ 
  hiringCode, 
  amount, 
  currency, 
  serviceName, 
  onSuccess, 
  onBack,
  paymentIntentId,
  hiringDetails,
}: PaymentFormProps & { paymentIntentId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const generateAndSendFinalContract = async (paymentData?: {
    paymentIntentId?: string;
    stripeTransactionId?: string;
    paymentDate?: string;
    paymentMethod?: string;
  }) => {
    if (!hiringDetails) {
      console.warn('⚠️ No hay detalles de contratación para generar contrato definitivo');
      return;
    }

    try {
      console.log('📄 Generando contrato definitivo con información de pago...');
      
      // Generar PDF definitivo con datos del pago
      const contractBlob = generateContractPDF(hiringDetails, paymentData);
      
      // Crear FormData para enviar al backend
      const formData = new FormData();
      formData.append('contract', contractBlob, `contrato_definitivo_${hiringCode}.pdf`);
      formData.append('hiring_code', hiringCode);
      formData.append('client_email', hiringDetails.user_email || '');
      formData.append('client_name', hiringDetails.user_name || '');
      formData.append('contract_type', 'final');
      
      // Agregar información del pago
      if (paymentData) {
        formData.append('payment_intent_id', paymentData.paymentIntentId || '');
        formData.append('stripe_transaction_id', paymentData.stripeTransactionId || '');
        formData.append('payment_date', paymentData.paymentDate || new Date().toISOString());
        formData.append('payment_method', paymentData.paymentMethod || 'Tarjeta bancaria');
      }
      
      // Enviar contrato definitivo al backend
      await hiringService.uploadFinalContract(formData);
      
      console.log('✅ Contrato definitivo generado y enviado por email');
      
    } catch (error) {
      console.error('❌ Error al generar/enviar contrato definitivo:', error);
      // No bloquear el flujo si falla el envío
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Para códigos TEST, simular pago exitoso sin llamar a Stripe
      if (hiringCode.startsWith('TEST')) {
        console.log('🧪 Modo TEST: Simulando pago exitoso');
        setMessage('¡Pago simulado exitosamente! (Modo TEST)');
        
        // Simular confirmación en el backend
        try {
          await hiringService.confirmPayment(hiringCode, paymentIntentId);
          console.log('✅ Backend confirmó pago TEST exitosamente');
        } catch (backendError) {
          console.warn('⚠️ Backend no pudo confirmar pago TEST, continuando de todas formas');
          console.warn('Error:', backendError);
        }
        
        setTimeout(() => onSuccess(), 1500);
        return;
      }

      // Para códigos reales, procesar con Stripe normalmente
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // Confirmar con Stripe primero
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${APP_URL}/contratacion/success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Confirmar pago en el backend
      await hiringService.confirmPayment(hiringCode, paymentIntentId);

      // Generar y enviar contrato definitivo con datos reales de Stripe
      if (hiringDetails) {
        await generateAndSendFinalContract({
          paymentIntentId: paymentIntentId,
          stripeTransactionId: paymentIntentId,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'Tarjeta bancaria (Stripe)'
        });
      }

      // Pago exitoso
      setMessage('¡Pago procesado correctamente!');
      setTimeout(() => onSuccess(), 1500);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-xl mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Total a pagar</p>
          <p className="text-4xl font-bold text-primary">
            {formatCurrency(amount, currency)}
          </p>
          <p className="text-sm text-gray-500 mt-2">{serviceName}</p>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <PaymentElement />
      </div>

      {/* Información de seguridad */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-600" />
          <span className="font-semibold">Pago 100% seguro</span>
        </div>
        <p className="mt-2 text-xs">
          Procesado por Stripe. Tus datos de pago están cifrados y nunca se almacenan en nuestros servidores.
        </p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={20} />
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-4">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="flex-1"
          disabled={loading}
        >
          Volver
        </Button>
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-primary hover:bg-primary-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={18} />
              Procesando...
            </>
          ) : (
            `Pagar ${formatCurrency(amount, currency)}`
          )}
        </Button>
      </div>
    </form>
  );
}

// Componente principal que envuelve con Elements provider
export function PaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateAndSendFinalContract = async (paymentData?: {
    paymentIntentId?: string;
    stripeTransactionId?: string;
    paymentDate?: string;
    paymentMethod?: string;
  }) => {
    if (!props.hiringDetails) {
      console.warn('⚠️ No hay detalles de contratación para generar contrato definitivo');
      return;
    }

    try {
      console.log('📄 Generando contrato definitivo con información de pago...');
      
      // Generar PDF definitivo con datos del pago
      const contractBlob = generateContractPDF(props.hiringDetails, paymentData);
      
      // Crear FormData para enviar al backend
      const formData = new FormData();
      formData.append('contract', contractBlob, `contrato_definitivo_${props.hiringCode}.pdf`);
      formData.append('hiring_code', props.hiringCode);
      formData.append('client_email', props.hiringDetails.user_email || '');
      formData.append('client_name', props.hiringDetails.user_name || '');
      formData.append('contract_type', 'final');
      
      // Agregar información del pago
      if (paymentData) {
        formData.append('payment_intent_id', paymentData.paymentIntentId || '');
        formData.append('stripe_transaction_id', paymentData.stripeTransactionId || '');
        formData.append('payment_date', paymentData.paymentDate || new Date().toISOString());
        formData.append('payment_method', paymentData.paymentMethod || 'Tarjeta bancaria');
      }
      
      // Enviar contrato definitivo al backend
      await hiringService.uploadFinalContract(formData);
      
      console.log('✅ Contrato definitivo generado y enviado por email');
      
    } catch (error) {
      console.error('❌ Error al generar/enviar contrato definitivo:', error);
      // No bloquear el flujo si falla el envío
    }
  };

  const handleTestPayment = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🧪 Simulando pago exitoso para código TEST');
      
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Intentar confirmar con el backend (puede fallar, pero no bloquea)
      try {
        await hiringService.confirmPayment(props.hiringCode, 'pi_test_simulated');
        console.log('✅ Pago simulado confirmado en backend');
      } catch (backendError) {
        console.warn('⚠️ Backend no pudo confirmar pago simulado:', backendError);
        // No lanzar error, continuar con el flujo
      }
      
      // Generar y enviar contrato definitivo con datos del pago simulado
      await generateAndSendFinalContract({
        paymentIntentId: 'pi_test_simulated',
        stripeTransactionId: `test_${Date.now()}`,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'Simulación TEST'
      });
      
      props.onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al simular el pago');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Crear Payment Intent
    const createPayment = async () => {
      try {
        const response = await hiringService.createPayment(props.hiringCode);
        
        // Detectar códigos TEST
        const isTestCode = props.hiringCode.startsWith('TEST');
        
        if (isTestCode) {
          console.log('🧪 Modo TEST activado - usando formulario simulado');
          setClientSecret(null); // No usar Stripe Elements
          setPaymentIntentId(response.payment_intent_id);
        } else {
          setClientSecret(response.client_secret);
          setPaymentIntentId(response.payment_intent_id);
        }
      } catch (err: any) {
        setError(err.message || 'Error al inicializar el pago');
      } finally {
        setLoading(false);
      }
    };

    createPayment();
  }, [props.hiringCode]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 animate-spin text-primary" size={48} />
            <p className="text-gray-600">Preparando formulario de pago...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardContent className="py-12">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={props.onBack} variant="outline" className="mt-4 w-full">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si no hay clientSecret, mostrar formulario simulado para códigos TEST
  if (!clientSecret && props.hiringCode.startsWith('TEST')) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardTitle className="text-2xl text-emphasis-900 flex items-center gap-2">
              <CreditCard className="text-primary" size={28} />
              Pago Simulado (Modo TEST)
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Indicador de modo TEST */}
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-sm font-medium">
                  Modo de Prueba: Este pago será simulado, no se cobrará dinero real.
                </p>
              </div>
            </div>

            {/* Formulario simulado */}
            <form onSubmit={handleTestPayment} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Tarjeta
                  </label>
                  <input
                    type="text"
                    value="4242 4242 4242 4242"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Expiración
                    </label>
                    <input
                      type="text"
                      value="12/25"
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVC
                    </label>
                    <input
                      type="text"
                      value="123"
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Titular
                  </label>
                  <input
                    type="text"
                    value="Juan Pérez"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={props.onBack}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={18} />
                      Procesando...
                    </>
                  ) : (
                    'Simular Pago'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardContent className="py-12">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <p className="text-sm">Error al cargar el formulario de pago</p>
            </div>
            <Button onClick={props.onBack} variant="outline" className="mt-4 w-full">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#16a34a',
        colorBackground: '#ffffff',
        colorText: '#111827',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardTitle className="text-2xl text-emphasis-900 flex items-center gap-2">
            <CreditCard className="text-primary" size={28} />
            Pago Seguro
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Indicador de modo TEST */}
          {props.hiringCode.startsWith('TEST') && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-sm font-medium">
                  Modo de Prueba: Este pago será simulado, no se cobrará dinero real.
                </p>
              </div>
            </div>
          )}
          
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm {...props} paymentIntentId={paymentIntentId} hiringDetails={props.hiringDetails} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}

