// Step 4: Payment Form Component with Stripe Checkout

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { hiringService } from '@/services/hiringService';
// Dynamic import para PDF generator (pesado, cargar bajo demanda)
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
  const [checkoutInfo, setCheckoutInfo] = useState<{ payment_type?: 'first' | 'subscription'; installments?: number; amount?: number; total_amount?: number } | null>(null);
  
  // Si el código viene con manual_payment_confirmed del backend, activar modo manual automáticamente
  const adminManualPayment = props.hiringDetails?.manual_payment_confirmed || false;
  const adminManualNote = props.hiringDetails?.manual_payment_note || '';
  
  console.log('💰 PaymentForm - hiringDetails recibidos:', props.hiringDetails);
  console.log('💰 PaymentForm - payment_type en hiringDetails:', props.hiringDetails?.payment_type);
  console.log('💰 PaymentForm - amount en hiringDetails:', props.hiringDetails?.amount);
  console.log('💰 PaymentForm - grade en hiringDetails:', props.hiringDetails?.grade);
  console.log('💰 PaymentForm - manual_payment_confirmed:', adminManualPayment);
  console.log('💰 PaymentForm - manual_payment_note:', adminManualNote);
  
  // Estado para pago manual solo si el admin lo confirmó (solo para renderizado, no editable)
  const manualPaymentMode = adminManualPayment;

  // Obtener el monto del primer pago del backend (en centavos) o calcularlo como fallback
  const getFirstPaymentAmount = (): number => {
    const paymentType = getPaymentType();
    const totalAmount = checkoutInfo?.total_amount || props.hiringDetails?.amount || 0;
    
    // Si es suscripción, el primer pago es el 10% del total (pago mensual)
    if (paymentType === 'subscription' && totalAmount > 0) {
      // Prioridad 1: Usar amount del checkout response (que debería ser el pago mensual)
      if (checkoutInfo?.amount !== undefined && checkoutInfo.amount > 0) {
        return checkoutInfo.amount;
      }
      // Prioridad 2: Usar first_payment_amount del backend si es válido
      if (props.hiringDetails?.first_payment_amount !== undefined && props.hiringDetails.first_payment_amount > 0) {
        return props.hiringDetails.first_payment_amount;
      }
      // Fallback: Calcular como 10% del total (10 pagos mensuales)
      return Math.round(totalAmount / 10);
    }
    
    // Para pago único (one_time), usar 50% del total
    // Prioridad 1: Usar first_payment_amount del backend
    if (props.hiringDetails?.first_payment_amount !== undefined) {
      return props.hiringDetails.first_payment_amount;
    }
    // Prioridad 2: Usar amount del checkout response
    if (checkoutInfo?.amount !== undefined) {
      return checkoutInfo.amount;
    }
    // Fallback: Calcular según el grado (solo si no hay datos del backend)
    const grade = props.hiringDetails?.grade;
    if (grade === 'T') {
      return 50; // 0.50 EUR en centavos
    } else if (grade === 'C') {
      return 30000; // 300 EUR en centavos
    } else {
      // Grados A y B
      return 20000; // 200 EUR en centavos
    }
  };

  // Obtener el tipo de pago del backend
  const getPaymentType = (): 'one_time' | 'subscription' => {
    const totalAmount = checkoutInfo?.total_amount || props.hiringDetails?.amount || 0;
    const firstPaymentAmount = props.hiringDetails?.first_payment_amount;
    const hiringPaymentType = props.hiringDetails?.payment_type;
    const checkoutPaymentType = checkoutInfo?.payment_type;
    
    console.log('🔍 PaymentForm - Detecting payment type:', {
      hiringPaymentType,
      checkoutPaymentType,
      totalAmount,
      firstPaymentAmount
    });
    
    // Prioridad 1: Detectar automáticamente basándose en montos (más confiable)
    // Si el total es 48000 (480€) o 68000 (680€), DEBE ser suscripción
    // porque los pagos únicos son 400€ (40000) o 600€ (60000)
    if (totalAmount === 48000 || totalAmount === 68000) {
      console.log('✅ PaymentForm - Detectado como subscription: total = 480€ o 680€');
      return 'subscription';
    }
    
    // Si el primer pago es exactamente el 10% del total (con tolerancia de 100 centavos), es suscripción
    if (totalAmount > 0 && firstPaymentAmount && Math.abs(firstPaymentAmount - (totalAmount / 10)) < 100) {
      console.log('✅ PaymentForm - Detectado como subscription: primer pago = 10% del total');
      return 'subscription';
    }
    
    // Prioridad 2: Usar payment_type de hiringDetails (solo si no contradice los montos)
    if (hiringPaymentType === 'subscription') {
      console.log('✅ PaymentForm - Usando payment_type de hiringDetails: subscription');
      return 'subscription';
    }
    if (hiringPaymentType === 'one_time') {
      console.log('✅ PaymentForm - Usando payment_type de hiringDetails: one_time');
      return 'one_time';
    }
    
    // Prioridad 3: Inferir del checkout response
    if (checkoutPaymentType === 'subscription') {
      console.log('✅ PaymentForm - Usando payment_type de checkoutInfo: subscription');
      return 'subscription';
    }
    
    // 'first' significa pago único
    if (checkoutPaymentType === 'first') {
      console.log('✅ PaymentForm - Usando payment_type de checkoutInfo: one_time (first)');
      return 'one_time';
    }
    
    // Default: pago único
    console.log('⚠️ PaymentForm - No se detectó payment_type, usando default: one_time');
    return 'one_time';
  };

  // Helper para formatear el monto en euros
  const formatAmount = (amountInCents: number): string => {
    return (amountInCents / 100).toFixed(2);
  };

  // Helper para renderizar información de pago según el tipo
  const renderPaymentInfo = () => {
    const paymentType = getPaymentType();
    const totalAmount = checkoutInfo?.total_amount || props.hiringDetails?.amount || 0;
    const installments = checkoutInfo?.installments || (paymentType === 'subscription' ? 10 : 2);
    const isSubscription = paymentType === 'subscription';
    
    console.log('🎨 renderPaymentInfo - paymentType:', paymentType);
    console.log('🎨 renderPaymentInfo - isSubscription:', isSubscription);
    console.log('🎨 renderPaymentInfo - totalAmount:', totalAmount);
    console.log('🎨 renderPaymentInfo - installments:', installments);

    if (isSubscription) {
      // Para suscripción: 10 pagos del 10% cada uno
      const monthlyPayment = checkoutInfo?.amount || (totalAmount > 0 ? Math.round(totalAmount / 10) : 0);
      return (
        <>
          <p><strong>Servicio:</strong> {props.serviceName}</p>
          <p><strong>Tipo:</strong> <span className="font-semibold text-primary">📅 Suscripción Mensual - 10 Pagos</span></p>
          <p><strong>Primer pago (10%):</strong> €{formatAmount(monthlyPayment)}</p>
          <p><strong>Pagos mensuales:</strong> 10 cuotas de €{formatAmount(monthlyPayment)} cada una</p>
          <p><strong>Total del servicio:</strong> €{formatAmount(totalAmount)}</p>
          <p className="text-xs text-gray-600 mt-2 italic">
            El primer pago (10%) se cobrará ahora. Los siguientes 9 pagos del 10% cada uno se cobrarán automáticamente cada mes hasta completar los 10 pagos.
          </p>
        </>
      );
    } else {
      // Para pago único: 2 pagos (50% + 50%)
      const firstPayment = getFirstPaymentAmount();
      return (
        <>
          <p><strong>Servicio:</strong> {props.serviceName} - Primer Pago</p>
          <p><strong>Tipo:</strong> <span className="font-semibold text-primary">💳 Pago Único</span></p>
          <p><strong>Primer pago (50%):</strong> €{formatAmount(firstPayment)}</p>
          <p><strong>Total del servicio:</strong> €{formatAmount(totalAmount)}</p>
          <p className="text-xs text-gray-600 mt-2 italic">
            El segundo pago (50%) se realizará después de la comunicación favorable.
          </p>
        </>
      );
    }
  };

  useEffect(() => {
    // Si el pago ya fue confirmado por el admin O si está en modo manual, no crear checkout
    if (manualPaymentMode || adminManualPayment) {
      setLoading(false);
      return;
    }
    const createCheckoutSession = async () => {
      try {
        console.log('🛒 Creando sesión de Stripe Checkout...');
        console.log('📋 hiringDetails antes de crear checkout:', props.hiringDetails);
        console.log('📋 payment_type esperado:', props.hiringDetails?.payment_type);
        
        const response = await hiringService.createCheckoutSession(props.hiringCode);
        
        console.log('✅ Checkout session creada:', response);
        console.log('📋 payment_type en response:', response.payment_type);
        console.log('📋 installments en response:', response.installments);
        console.log('📋 amount en response:', response.amount);
        console.log('📋 total_amount en response:', response.total_amount);
        
        setCheckoutUrl(response.checkout_url);
        // Guardar información del checkout para mostrar en la UI
        setCheckoutInfo({
          payment_type: response.payment_type,
          installments: response.installments,
          amount: response.amount,
          total_amount: response.total_amount,
        });
        
      } catch (err: any) {
        // Mostrar el mensaje de error del backend si está disponible
        const backendMessage = err.response?.data?.detail || err.response?.data?.message;
        
        if (backendMessage) {
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
  }, [props.hiringCode, manualPaymentMode, adminManualPayment]);

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
        
        // Dynamic import para PDF generator
        const { generateContractPDF } = await import('@/utils/contractPdfGenerator');
        const contractBlob = generateContractPDF(props.hiringDetails, {
          paymentIntentId: 'pi_test_simulated',
          stripeTransactionId: `test_${Date.now()}`,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'Simulación TEST',
          clientSignature: clientSignature || undefined
        }, false); // isDraft = false (contrato definitivo SIN marca de agua)

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


  const handleManualPaymentContinue = async () => {
    if (!props.hiringDetails) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Generando y subiendo contrato definitivo con pago manual...');
      
      // Obtener firma del cliente
      const clientSignature = localStorage.getItem(`client_signature_${props.hiringCode}`);
      
      // Dynamic import para PDF generator
      const { generateContractPDF } = await import('@/utils/contractPdfGenerator');
      // Generar PDF definitivo CON firma (isDraft = false)
      const contractBlob = generateContractPDF(props.hiringDetails, {
        paymentIntentId: 'manual_payment',
        stripeTransactionId: `manual_${Date.now()}`,
        paymentDate: new Date().toISOString(),
        paymentMethod: props.hiringDetails.manual_payment_method || 'Pago manual',
        paymentNote: props.hiringDetails.manual_payment_note,
        clientSignature: clientSignature || undefined
      }, false); // isDraft = false (contrato final SIN marca de agua)
      
      console.log('📄 Contrato definitivo generado con firma, tamaño:', contractBlob.size);
      
      // Preparar FormData para subir al backend
      const formData = new FormData();
      formData.append('contract', contractBlob, `contrato_definitivo_${props.hiringCode}.pdf`);
      formData.append('hiring_code', props.hiringCode);
      formData.append('client_email', props.hiringDetails.client_email || '');
      formData.append('client_name', props.hiringDetails.client_name || '');
      formData.append('contract_type', 'final');
      formData.append('payment_intent_id', 'manual_payment');
      formData.append('stripe_transaction_id', `manual_${Date.now()}`);
      formData.append('payment_date', new Date().toISOString());
      formData.append('payment_method', props.hiringDetails.manual_payment_method || 'Pago manual');
      if (props.hiringDetails.manual_payment_note) {
        formData.append('payment_note', props.hiringDetails.manual_payment_note);
      }
      
      // Subir contrato definitivo al backend
      await hiringService.uploadFinalContract(formData);
      console.log('✅ Contrato definitivo con pago manual subido exitosamente');
      
      // Marcar como subido
      localStorage.setItem(`contract_uploaded_${props.hiringCode}`, 'true');
      
      // Continuar al siguiente paso
      props.onSuccess();
      
    } catch (err: any) {
      console.error('❌ Error subiendo contrato definitivo:', err);
      setError('Error al procesar el contrato. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderManualCard = () => {
    // Si el pago manual fue confirmado por el admin, mostrarlo en modo lectura CON botón para continuar
    if (adminManualPayment) {
      return (
        <Card className="shadow-lg border-2 border-green-300 bg-green-50">
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-green-600 mt-1 flex-shrink-0" size={28} />
              <div className="flex-1">
                <p className="text-xl font-semibold text-green-900 mb-2">Pago ya registrado</p>
                <p className="text-sm text-green-700">
                  El administrador confirmó que el pago ya se realizó. Puedes continuar directamente con la firma del contrato.
                </p>
                {adminManualNote && (
                  <div className="mt-4 bg-white border border-green-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Forma de pago registrada:</p>
                    <p className="text-sm text-gray-900 font-medium">{adminManualNote}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <p className="text-sm text-green-900 mb-1">
                <strong>✓ No necesitas realizar ningún pago adicional</strong>
              </p>
              <p className="text-xs text-green-700">
                El pago ya fue procesado. Haz clic en el botón de abajo para continuar con la firma del contrato.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} />
                <p className="text-sm">{error}</p>
              </div>
            )}

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
                onClick={handleManualPaymentContinue}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={18} />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2" size={18} />
                    Continuar con la firma
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Si no hay pago confirmado por admin, NO mostrar ninguna tarjeta editable
    // El cliente NUNCA debe tener la opción de marcar pago manual
    return null;
  };

  const manualCard = renderManualCard();

  let mainContent: ReactNode;

  if (loading) {
    mainContent = (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="ml-3 text-lg">Inicializando pago seguro...</span>
          </div>
        </CardContent>
      </Card>
    );
  } else if (error) {
    mainContent = (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
          
          {props.hiringCode.startsWith('LIVE') && error.includes('mantenimiento') && (
            <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg">
              <p className="text-sm mb-3">
                <strong>Alternativa temporal:</strong> Puedes simular el pago para continuar con el proceso de contratación.
              </p>
              <Button 
                onClick={async () => {
                  try {
                    await hiringService.confirmPayment(props.hiringCode, 'pi_live_simulated');
                    
                    if (props.hiringDetails) {
                      const clientSignature = localStorage.getItem(`client_signature_${props.hiringCode}`);
                      
                      // Dynamic import para PDF generator
                      const { generateContractPDF } = await import('@/utils/contractPdfGenerator');
                      const contractBlob = generateContractPDF(props.hiringDetails, {
                        paymentIntentId: 'pi_live_simulated',
                        stripeTransactionId: `live_sim_${Date.now()}`,
                        paymentDate: new Date().toISOString(),
                        paymentMethod: 'Simulación LIVE (Mantenimiento)',
                        clientSignature: clientSignature || undefined
                      }, false);

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
    );
  } else if (props.hiringCode.startsWith('TEST')) {
    mainContent = (
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
                {renderPaymentInfo()}
                <p className="mt-3 pt-3 border-t border-blue-300"><strong>Código:</strong> {props.hiringCode}</p>
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
    );
  } else {
    mainContent = (
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
                {renderPaymentInfo()}
                <p className="mt-3 pt-3 border-t border-green-300"><strong>Código:</strong> {props.hiringCode}</p>
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
    );
  }

  // Si el pago fue confirmado por el admin, mostrar SOLO la info y botón para continuar
  if (adminManualPayment) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        {manualCard}
      </div>
    );
  }

  // Si no, mostrar el flujo normal (checkbox opcional + Stripe o pago manual del cliente)
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {manualCard}
      {mainContent}
    </div>
  );
}