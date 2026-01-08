// Step 1: Service Details Component

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { HiringDetails } from '@/types/hiring';
import { ClockIcon, CurrencyEuroIcon, DocumentTextIcon, EnvelopeIcon, UserIcon } from '@heroicons/react/24/outline';

interface ServiceDetailsProps {
  details: HiringDetails;
  onNext: () => void;
  loading?: boolean;
}

export function ServiceDetails({ details, onNext, loading = false }: ServiceDetailsProps) {
  // Detectar si es suscripción
  const isSubscription = (): boolean => {
    const totalAmount = details.amount || 0;
    const firstPaymentAmount = details.first_payment_amount || 0;
    
    console.log('🔍 ServiceDetails - Detecting subscription:', {
      payment_type: details.payment_type,
      amount: totalAmount,
      first_payment_amount: firstPaymentAmount,
      grade: details.grade
    });

    // Prioridad 1: Detectar automáticamente basándose en montos (más confiable que el backend)
    // Si el total es 48000 (480€) o 68000 (680€), DEBE ser suscripción
    // porque los pagos únicos son 400€ o 600€ (40000 o 60000 centavos)
    if (totalAmount === 48000 || totalAmount === 68000) {
      console.log('✅ ServiceDetails - Detectado como suscripción (total = 480€ o 680€) - IGNORANDO payment_type del backend');
      return true;
    }
    
    if (totalAmount > 0 && firstPaymentAmount > 0) {
      // Si el primer pago es exactamente el 10% del total (con tolerancia de 100 centavos), es suscripción
      const expectedFirstPayment = totalAmount / 10;
      if (Math.abs(firstPaymentAmount - expectedFirstPayment) < 100) {
        console.log('✅ ServiceDetails - Detectado como suscripción (primer pago = 10% del total)');
        return true;
      }
    }
    
    // Prioridad 2: Usar payment_type de details (solo si no contradice los montos)
    if (details.payment_type === 'subscription') {
      console.log('✅ ServiceDetails - Es suscripción (payment_type === subscription)');
      return true;
    }
    if (details.payment_type === 'one_time') {
      console.log('❌ ServiceDetails - Es pago único (payment_type === one_time)');
      return false;
    }
    
    console.log('❌ ServiceDetails - No es suscripción (default)');
    return false;
  };

  const subscription = isSubscription();
  const totalAmount = details.amount || 0;
  const firstPaymentAmount = details.first_payment_amount || 0;
  
  // Calcular el pago mensual para suscripciones
  // Si es suscripción, siempre calcular como 10% del total (aunque el backend envíe otro valor)
  const monthlyPayment = subscription && totalAmount > 0 
    ? Math.round(totalAmount / 10)  // Siempre 10% para suscripciones
    : 0;

  console.log('💰 ServiceDetails - Payment info:', {
    subscription,
    totalAmount,
    firstPaymentAmount,
    monthlyPayment
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardTitle className="text-3xl text-emphasis-900">
            {details.service_name}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* Descripción del servicio */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DocumentTextIcon className="text-primary" width={20} height={20} />
              <h3 className="font-semibold text-lg text-emphasis-900">
                Descripción del Servicio
              </h3>
            </div>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
              {details.service_description}
            </p>
          </div>

          {/* Nota/Calificación del Estudio */}
          {details.grade && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{details.grade}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Calificación del Estudio Migro</p>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Nota {details.grade} - {details.grade === 'A' ? 'Excelente' : details.grade === 'B' ? 'Buena' : 'Aceptable'}
              </p>
              <p className="text-sm text-gray-600">
                {details.grade === 'A' 
                  ? 'Tu perfil tiene una alta probabilidad de éxito en el proceso administrativo.'
                  : details.grade === 'B'
                  ? 'Tu perfil tiene buenas posibilidades de éxito con algunos requisitos adicionales.'
                  : 'Tu perfil es aceptable pero puede requerir documentación adicional o tiempo extra.'
                }
              </p>
            </div>
          )}

          {/* Precio */}
          <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CurrencyEuroIcon className="text-primary" width={20} height={20} />
              <p className="text-sm text-gray-600 font-medium">Precio total del servicio</p>
            </div>
            <p className="text-4xl font-bold text-primary">
              {formatCurrency(details.amount, details.currency)}
            </p>
            {subscription && monthlyPayment > 0 ? (
              <div className="mt-3 space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-bold">📅 Suscripción Mensual - 10 Pagos</span>
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-bold">{formatCurrency(monthlyPayment, details.currency)} ahora</span> y 9 pagos mensuales de {formatCurrency(monthlyPayment, details.currency)} cada uno
                </p>
                <p className="text-xs text-gray-500 mt-1 italic">
                  El primer pago (10%) se cobrará ahora. Los siguientes 9 pagos del 10% cada uno se cobrarán automáticamente cada mes hasta completar los 10 pagos.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mt-2">
                {details.first_payment_amount ? (
                  <>
                    <span className="font-bold">{formatCurrency(details.first_payment_amount, details.currency)} ahora</span> y {formatCurrency(details.amount - details.first_payment_amount, details.currency)} con la comunicación favorable del expediente
                  </>
                ) : details.grade === 'T' ? (
                  <><span className="font-bold">0,50€ ahora</span> y 0,50€ con la comunicación favorable del expediente</>
                ) : (
                  <><span className="font-bold">200€ ahora</span> y 200€ con la comunicación favorable del expediente</>
                )}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              IVA incluido
            </p>
          </div>

          {/* Datos del usuario */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4 text-emphasis-900">
              Tus Datos
            </h3>
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <UserIcon className="text-gray-500" width={18} height={18} />
                <div>
                  <p className="text-xs text-gray-500">Nombre completo</p>
                  <p className="font-medium text-gray-900">{details.client_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="text-gray-500" width={18} height={18} />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{details.client_email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de expiración */}
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <ClockIcon width={16} height={16} className="text-yellow-600" />
            <p>
              Código válido hasta:{' '}
              <span className="font-semibold text-yellow-700">
                {formatDate(details.expires_at)}
              </span>
            </p>
          </div>

          {/* Botón de acción */}
          <Button
            onClick={onNext}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-semibold"
            size="lg"
          >
            {loading ? 'Cargando...' : 'Comenzar Proceso de Contratación'}
          </Button>

          {/* Nota informativa */}
          <p className="text-xs text-center text-gray-500 mt-4">
            Al continuar, comenzarás el proceso de contratación que incluye
            verificación de identidad y pago seguro.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

